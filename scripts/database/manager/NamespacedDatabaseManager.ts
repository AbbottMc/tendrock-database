import {Block, Entity, ItemStack, world, World} from "@minecraft/server";
import {BlockDatabase, EntityDatabase, ItemStackDatabase, WorldDatabase} from "../impl";
import {UniqueIdUtils} from "../helper/UniqueIdUtils";
import {GameObjectDatabase} from "../GameObjectDatabase";
import {SetMap} from "@tenolib/map";
import {DatabaseManager} from "./DatabaseManager";
import {Utils} from "../helper/Utils";
import {DatabaseTypes} from "../DatabaseTypes";

export type DatabaseTypeBy<T> = T extends Block ? BlockDatabase : T extends Entity ? EntityDatabase : T extends ItemStack ? ItemStackDatabase : WorldDatabase;
export type DatabaseFactory<T extends Block | Entity | ItemStack | World> = {
  create(namespace: string, manager: NamespacedDatabaseManager, gameObject: T, initialIdList?: [string, string][]): InstanceType<DatabaseFactory<T>>;
} & (new (...args: any[]) => any);

export type DatabaseTypeMap = {
  [DatabaseTypes.Entity]: EntityDatabase;
  [DatabaseTypes.Block]: BlockDatabase;
  [DatabaseTypes.Item]: ItemStackDatabase;
  [DatabaseTypes.World]: WorldDatabase;
}

export class NamespacedDatabaseManager {
  private _blockDatabaseMap = new Map<string, BlockDatabase>();
  private _itemDatabaseMap = new Map<string, ItemStackDatabase>();
  private _entityDatabaseMap = new Map<string, EntityDatabase>();
  private _worldDatabase!: WorldDatabase;

  private _blockInitialIdListMap = new SetMap<string, [string, string]>();
  private _worldInitialIdList: [string, string][] | undefined = [];

  private _isFlushing = false;
  private _dirtyDatabaseList = [] as GameObjectDatabase<any>[];
  private _dirtyDatabaseBuffer = [] as GameObjectDatabase<any>[];

  protected constructor(protected readonly namespace: string, private readonly _parentManager: DatabaseManager) {
  }

  public static _create(runtimeId: string, namespace: string, parentManager: DatabaseManager) {
    Utils.assertInvokedByTendrock(runtimeId);
    return new NamespacedDatabaseManager(namespace, parentManager);
  }

  public _markDirty(runtimeId: string, dataBase: GameObjectDatabase<any>) {
    Utils.assertInvokedByTendrock(runtimeId);
    const dirtyDatabases = this._isFlushing ? this._dirtyDatabaseBuffer : this._dirtyDatabaseList;
    if (!dirtyDatabases.includes(dataBase)) {
      dirtyDatabases.push(dataBase);
    }
  }

  public _addBlockDataId(runtimeId: string, lid: string, propertyId: string, dataId: string) {
    Utils.assertInvokedByTendrock(runtimeId);
    this._blockInitialIdListMap.addValue(lid, [propertyId, dataId]);
  }

  public _addWorldDataId(runtimeId: string, propertyId: string, dataId: string) {
    Utils.assertInvokedByTendrock(runtimeId);
    if (!this._worldInitialIdList) {
      throw new Error("World data id list is used and frozen.");
    }
    this._worldInitialIdList.push([propertyId, dataId]);
  }

  private _prepare<T extends Block | Entity | ItemStack | World>(gameObject: T): {
    uniqueId: string | undefined,
    databaseMap: Map<string, DatabaseTypeBy<T>> | undefined,
    databaseType: DatabaseFactory<T>,
    gameObjectToDatabaseMap?: SetMap<string, GameObjectDatabase<any>>,
    initialIdList?: [string, string][]
  } {
    if (gameObject instanceof Block) {
      const uniqueId = UniqueIdUtils.getBlockUniqueId(gameObject);
      const databaseMap = this._blockDatabaseMap as Map<string, DatabaseTypeBy<T>>;
      const databaseType = BlockDatabase as DatabaseFactory<T>;
      const gameObjectToDatabaseMap = this._parentManager._getBlockToDatabaseMap(UniqueIdUtils.RuntimeId);
      const initialIdList = this._blockInitialIdListMap.get(uniqueId);
      this._blockInitialIdListMap.delete(uniqueId);
      return {uniqueId, databaseMap, databaseType, gameObjectToDatabaseMap, initialIdList};
    } else if (gameObject instanceof Entity) {
      const uniqueId = UniqueIdUtils.getEntityUniqueId(gameObject);
      const databaseMap = this._entityDatabaseMap as Map<string, DatabaseTypeBy<T>>;
      const databaseType = EntityDatabase as DatabaseFactory<T>;
      const gameObjectToDatabaseMap = this._parentManager._getEntityToDatabaseMap(UniqueIdUtils.RuntimeId);
      return {uniqueId, databaseMap, gameObjectToDatabaseMap, databaseType};
    } else if (gameObject instanceof ItemStack) {
      const uniqueId = UniqueIdUtils.getItemUniqueId(gameObject);
      const databaseMap = this._itemDatabaseMap as Map<string, DatabaseTypeBy<T>>;
      const databaseType = ItemStackDatabase as DatabaseFactory<T>;
      const gameObjectToDatabaseMap = this._parentManager._getItemToDatabaseMap(UniqueIdUtils.RuntimeId);
      return {uniqueId, databaseMap, gameObjectToDatabaseMap, databaseType};
    } else if (gameObject instanceof World) {
      const databaseType = WorldDatabase as DatabaseFactory<T>;
      const initialIdList = this._worldInitialIdList;
      this._worldInitialIdList = undefined;
      return {uniqueId: undefined, databaseMap: undefined, databaseType, initialIdList};
    } else {
      throw new Error(`Invalid game object type.`);
    }
  }

  public getOrCreate<T extends Block | Entity | ItemStack | World>(gameObject: T): DatabaseTypeBy<T> {
    const {uniqueId, databaseMap, databaseType, gameObjectToDatabaseMap, initialIdList} = this._prepare(gameObject);
    // Is world database
    if (!uniqueId || !databaseMap || !gameObjectToDatabaseMap) {
      if (this._worldDatabase) {
        return this._worldDatabase as DatabaseTypeBy<T>;
      }
      this._worldDatabase = WorldDatabase.create(this.namespace, this, world, initialIdList);
      return this._worldDatabase as DatabaseTypeBy<T>;
    }
    let database = databaseMap.get(uniqueId)!;
    if (database) {
      return database;
    }
    database = databaseType.create(this.namespace, this, gameObject, initialIdList);
    databaseMap.set(uniqueId, database);
    gameObjectToDatabaseMap.addValue(uniqueId, database);
    return database;
  }

  public get<T extends Block | Entity | ItemStack | World>(gameObject: T): DatabaseTypeBy<T> | undefined {
    const {uniqueId, databaseMap} = this._prepare(gameObject);
    if (!uniqueId || !databaseMap) {
      return undefined;
    }
    return databaseMap.get(uniqueId);
  }

  public getDatabaseList<T extends DatabaseTypes>(type: T): DatabaseTypeMap[T][] {
    if (type === DatabaseTypes.World) {
      return [this._worldDatabase] as DatabaseTypeMap[T][];
    } else if (type === DatabaseTypes.Block) {
      return Array.from(this._blockDatabaseMap.values()) as DatabaseTypeMap[T][];
    } else if (type === DatabaseTypes.Item) {
      return Array.from(this._itemDatabaseMap.values()) as DatabaseTypeMap[T][];
    } else if (type === DatabaseTypes.Entity) {
      return Array.from(this._entityDatabaseMap.values()) as DatabaseTypeMap[T][];
    } else {
      throw new Error(`Invalid database type.`);
    }
  }

  public getWorldDatabase(): DatabaseTypeBy<World> | undefined {
    return this._worldDatabase;
  }

  public remove<T extends Block | Entity | ItemStack | World>(gameObject: T, clearData = false) {
    const {uniqueId, databaseMap, gameObjectToDatabaseMap} = this._prepare(gameObject);
    if (!uniqueId || !databaseMap || !gameObjectToDatabaseMap) {
      return;
    }
    const database = databaseMap.get(uniqueId);
    if (!database) {
      return;
    }
    if (clearData) {
      database.clear();
    }
    databaseMap.delete(uniqueId);
    gameObjectToDatabaseMap.deleteValue(uniqueId, database);
  }

  public _beginFlush(runtimeId: string) {
    Utils.assertInvokedByTendrock(runtimeId);
    this._isFlushing = true;
  }

  public _endFlush(runtimeId: string) {
    Utils.assertInvokedByTendrock(runtimeId);
    this._dirtyDatabaseList = this._dirtyDatabaseBuffer;
    this._isFlushing = false;
    this._dirtyDatabaseBuffer = [];
  }

  public getDirtyDatabaseList() {
    return this._dirtyDatabaseList;
  }
}