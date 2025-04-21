import {Block, Entity, ItemStack, world, World} from "@minecraft/server";
import {BlockDatabase, EntityDatabase, ItemStackDatabase, WorldDatabase} from "../impl";
import {UniqueIdUtils} from "../helper/UniqueIdUtils";
import {GameObjectDatabase} from "../GameObjectDatabase";
import {BetterSet, SetMap} from "@tenolib/map";
import {DatabaseManager} from "./DatabaseManager";
import {Utils} from "../helper/Utils";
import {DatabaseTypes} from "../DatabaseTypes";

export type DatabaseTypeBy<T> = T extends (string | Block) ? BlockDatabase : T extends Entity ? EntityDatabase : T extends ItemStack ? ItemStackDatabase : WorldDatabase;
export type DatabaseFactory<T extends Block | Entity | ItemStack | World | string> = {
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
  private _dirtyDatabaseList = new BetterSet<GameObjectDatabase<any>>();
  private _dirtyDatabaseBuffer = new BetterSet<GameObjectDatabase<any>>();

  protected constructor(protected readonly namespace: string, private readonly _parentManager: DatabaseManager) {
  }

  public static _create(runtimeId: string, namespace: string, parentManager: DatabaseManager) {
    Utils.assertInvokedByTendrock(runtimeId);
    return new NamespacedDatabaseManager(namespace, parentManager);
  }

  public _markDirty(runtimeId: string, dataBase: GameObjectDatabase<any>) {
    Utils.assertInvokedByTendrock(runtimeId);
    const dirtyDatabases = this._isFlushing ? this._dirtyDatabaseBuffer : this._dirtyDatabaseList;
    if (dirtyDatabases.includes(dataBase)) {
      return;
    }
    const uniqueId = dataBase.getUid();
    // If database is removed or not exist, skip.
    if (
      !this._blockDatabaseMap.has(uniqueId) && !this._entityDatabaseMap.has(uniqueId) &&
      !this._itemDatabaseMap.has(uniqueId) && this._worldDatabase !== dataBase
    ) {
      return;
    }
    dirtyDatabases.push(dataBase);
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

  protected* _initWorldDataGenerator(): Generator<void, void, void> {
    if (this._worldInitialIdList) {
      this._worldDatabase = WorldDatabase.create(this.namespace, this, world, this._worldInitialIdList);
      this._worldInitialIdList = undefined;
      yield;
    }
  }

  protected* _initBlockDataGenerator(): Generator<void, void, void> {
    if (this._blockInitialIdListMap.size <= 0) {
      const gameObjectToDatabaseMap = this._parentManager._getBlockToDatabaseMap(UniqueIdUtils.RuntimeId);
      for (const [lid, set] of this._blockInitialIdListMap) {
        const blockDatabase = BlockDatabase.create(this.namespace, this, lid, set);
        this._blockDatabaseMap.set(lid, blockDatabase);
        gameObjectToDatabaseMap.addValue(lid, blockDatabase);
        yield;
      }
      this._blockInitialIdListMap.clear();
    }
  }

  public* _initWorldBlockDataGenerator(runtimeId: string): Generator<void, void, void> {
    Utils.assertInvokedByTendrock(runtimeId);
    yield* this._initWorldDataGenerator();
    yield* this._initBlockDataGenerator();
  }

  private _prepare<T extends Block | Entity | ItemStack | World | string>(gameObject: T): {
    uniqueId: string | undefined,
    databaseMap: Map<string, DatabaseTypeBy<T>> | undefined,
    databaseType: DatabaseFactory<T>,
    gameObjectToDatabaseMap?: SetMap<string, GameObjectDatabase<any>>,
    initialIdList?: [string, string][]
  } {
    if (typeof gameObject === 'string' || gameObject instanceof Block) {
      const uniqueId = UniqueIdUtils.getBlockUniqueId(gameObject);
      const databaseMap = this._blockDatabaseMap as Map<string, DatabaseTypeBy<T>>;
      const databaseType = BlockDatabase as DatabaseFactory<T>;
      const gameObjectToDatabaseMap = this._parentManager._getBlockToDatabaseMap(UniqueIdUtils.RuntimeId);
      // const initialIdList = this._blockInitialIdListMap.get(uniqueId);
      return {uniqueId, databaseMap, databaseType, gameObjectToDatabaseMap};
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
      // const initialIdList = this._worldInitialIdList;
      return {uniqueId: undefined, databaseMap: undefined, databaseType};
    } else {
      throw new Error(`Invalid game object type.`);
    }
  }

  /**
   * @deprecated Use {@link createIfAbsent} instead.
   * @param gameObject
   */
  public getOrCreate<T extends Block | Entity | ItemStack | World | string>(gameObject: T): DatabaseTypeBy<T> {
    return this.createIfAbsent(gameObject);
  }

  public createIfAbsent<T extends Block | Entity | ItemStack | World | string>(gameObject: T): DatabaseTypeBy<T> {
    const {uniqueId, databaseMap, databaseType, gameObjectToDatabaseMap} = this._prepare(gameObject);
    // Is world database
    if (!uniqueId || !databaseMap || !gameObjectToDatabaseMap) {
      if (this._worldDatabase) {
        return this._worldDatabase as DatabaseTypeBy<T>;
      }
      this._worldDatabase = WorldDatabase.create(this.namespace, this, world);
      this._worldInitialIdList = undefined;
      return this._worldDatabase as DatabaseTypeBy<T>;
    }
    let database = databaseMap.get(uniqueId)!;
    if (database) {
      return database;
    }
    database = databaseType.create(this.namespace, this, gameObject);
    databaseMap.set(uniqueId, database);
    gameObjectToDatabaseMap.addValue(uniqueId, database);
    // this._blockInitialIdListMap.delete(uniqueId);
    return database;
  }

  public get<T extends Block | Entity | ItemStack | World | string>(gameObject: T): DatabaseTypeBy<T> | undefined {
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

  public remove<T extends Block | Entity | ItemStack | World | string>(gameObject: T, clearData = false) {
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
      this._dirtyDatabaseList.delete(database);
      this._dirtyDatabaseBuffer.delete(database);
    }
    databaseMap.delete(uniqueId);
    gameObjectToDatabaseMap.deleteValue(uniqueId, database);
  }

  public _addDatabase<T extends Block | Entity | ItemStack | World | string>(runtimeId: string, database: DatabaseTypeBy<T>) {
    Utils.assertInvokedByTendrock(runtimeId);
    const {uniqueId, databaseMap, gameObjectToDatabaseMap} = this._prepare(database.getGameObject());
    if (!databaseMap || !gameObjectToDatabaseMap || !uniqueId) {
      return;
    }
    if (databaseMap.has(uniqueId)) {
      return;
    }
    databaseMap.set(uniqueId, database);
    gameObjectToDatabaseMap.addValue(uniqueId, database);
  }

  public _beginFlush(runtimeId: string) {
    Utils.assertInvokedByTendrock(runtimeId);
    this._isFlushing = true;
  }

  public _endFlush(runtimeId: string) {
    Utils.assertInvokedByTendrock(runtimeId);
    this._dirtyDatabaseList = this._dirtyDatabaseBuffer;
    this._isFlushing = false;
    this._dirtyDatabaseBuffer = new BetterSet();
  }

  public getDirtyDatabaseList() {
    return this._dirtyDatabaseList;
  }
}