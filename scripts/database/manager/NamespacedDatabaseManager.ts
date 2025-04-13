import {Block, Entity, ItemStack, world, World} from "@minecraft/server";
import {BlockDatabase} from "../impl/BlockDatabase";
import {EntityDatabase} from "../impl/EntityDatabase";
import {ItemStackDatabase} from "../impl/ItemStackDatabase";
import {WorldDatabase} from "../impl/WorldDatabase";
import {UniqueIdUtils} from "../helper/UniqueIdUtils";
import {GameObjectDatabase} from "../GameObjectDatabase";

export type DatabaseTypeBy<T> = T extends Block ? BlockDatabase : T extends Entity ? EntityDatabase : T extends ItemStack ? ItemStackDatabase : WorldDatabase;
export type DatabaseFactory<T extends Block | Entity | ItemStack | World> = {
  create(namespace: string, manager: NamespacedDatabaseManager, gameObject: T, initialIdList?: [string, string][]): InstanceType<DatabaseFactory<T>>;
} & (new (...args: any[]) => any);

export class NamespacedDatabaseManager {
  private _blockDatabaseMap = new Map<string, BlockDatabase>();
  private _itemDatabaseMap = new Map<string, ItemStackDatabase>()
  private _entityDatabaseMap = new Map<string, EntityDatabase>()
  private _worldDatabase!: WorldDatabase;

  private _blockInitialIdListMap = new Map<string, [string, string][]>();
  private _worldInitialIdList: [string, string][] | undefined = [];

  private _isFlushing = false;
  private _dirtyDatabaseList = [] as GameObjectDatabase<any>[];
  private _dirtyDatabaseBuffer = [] as GameObjectDatabase<any>[];

  constructor(protected readonly namespace: string) {
  }

  public static create(namespace: string) {
    return new NamespacedDatabaseManager(namespace);
  }

  protected _assertInvokedByTendrock(runtimeId: string) {
    if (runtimeId !== UniqueIdUtils.RuntimeId) {
      throw new Error("This method can not be invoked manually!");
    }
  }

  public _markDirty(runtimeId: string, dataBase: GameObjectDatabase<any>) {
    this._assertInvokedByTendrock(runtimeId);
    const dirtyDatabases = this._isFlushing ? this._dirtyDatabaseBuffer : this._dirtyDatabaseList;
    if (!dirtyDatabases.includes(dataBase)) {
      dirtyDatabases.push(dataBase);
    }
  }

  public _addBlockDataId(runtimeId: string, lid: string, propertyId: string, dataId: string) {
    this._assertInvokedByTendrock(runtimeId);
    const dataIdList = this._blockInitialIdListMap.get(lid) ?? [];
    dataIdList.push([propertyId, dataId]);
    this._blockInitialIdListMap.set(lid, dataIdList);
  }

  public _addWorldDataId(runtimeId: string, propertyId: string, dataId: string) {
    this._assertInvokedByTendrock(runtimeId);
    if (!this._worldInitialIdList) {
      throw new Error("World data id list is used and frozen.");
    }
    this._worldInitialIdList.push([propertyId, dataId]);
  }

  private _prepare<T extends Block | Entity | ItemStack | World>(gameObject: T): {
    uniqueId: string | undefined,
    databaseMap: Map<string, DatabaseTypeBy<T>> | undefined,
    databaseType: DatabaseFactory<T>,
    initialIdList?: [string, string][]
  } {
    if (gameObject instanceof Block) {
      const uniqueId = UniqueIdUtils.getBlockUniqueId(gameObject);
      const databaseMap = this._blockDatabaseMap as Map<string, DatabaseTypeBy<T>>;
      const databaseType = BlockDatabase as DatabaseFactory<T>;
      const initialIdList = this._blockInitialIdListMap.get(uniqueId);
      this._blockInitialIdListMap.delete(uniqueId);
      return {uniqueId, databaseMap, databaseType, initialIdList};
    } else if (gameObject instanceof Entity) {
      const uniqueId = UniqueIdUtils.getEntityUniqueId(gameObject);
      const databaseMap = this._entityDatabaseMap as Map<string, DatabaseTypeBy<T>>;
      const databaseType = EntityDatabase as DatabaseFactory<T>;
      return {uniqueId, databaseMap, databaseType};
    } else if (gameObject instanceof ItemStack) {
      const uniqueId = UniqueIdUtils.getItemUniqueId(gameObject);
      const databaseMap = this._itemDatabaseMap as Map<string, DatabaseTypeBy<T>>;
      const databaseType = ItemStackDatabase as DatabaseFactory<T>;
      return {uniqueId, databaseMap, databaseType};
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
    const {uniqueId, databaseMap, databaseType, initialIdList} = this._prepare(gameObject);
    if (!uniqueId || !databaseMap) {
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
    return database;
  }

  public remove<T extends Block | Entity | ItemStack | World>(gameObject: T, clearData = false) {
    const {uniqueId, databaseMap} = this._prepare(gameObject);
    if (!uniqueId || !databaseMap) {
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
  }

  public _beginFlush(runtimeId: string) {
    this._assertInvokedByTendrock(runtimeId);
    this._isFlushing = true;
  }

  public _endFlush(runtimeId: string) {
    this._assertInvokedByTendrock(runtimeId);
    this._dirtyDatabaseList = this._dirtyDatabaseBuffer;
    this._isFlushing = false;
    this._dirtyDatabaseBuffer = [];
  }

  public getDirtyDatabaseList() {
    return this._dirtyDatabaseList;
  }
}