import {Block, Entity, ItemStack, World} from "@minecraft/server";
import {BlockDatabase} from "../impl/BlockDatabase";
import {EntityDatabase} from "../impl/EntityDatabase";
import {ItemStackDatabase} from "../impl/ItemStackDatabase";
import {WorldDatabase} from "../impl/WorldDatabase";
import {UniqueIdUtils} from "../helper/UniqueIdUtils";
import {DatabaseTypes} from "../DatabaseTypes";

export type DatabaseTypeBy<T> = T extends Block ? BlockDatabase : T extends Entity ? EntityDatabase : T extends ItemStack ? ItemStackDatabase : WorldDatabase;
export type DatabaseFactory<T extends Block | Entity | ItemStack | World> = {
  // create(namespace: string, initialIdList?: string[]): InstanceType<DatabaseFactory<T>>;
  create(namespace: string, options: { gameObject?: T, initialIdList?: string[] }): InstanceType<DatabaseFactory<T>>;
} & (new (...args: any[]) => any);

type DatabaseTypeMap = {
  [DatabaseTypes.Block]: BlockDatabase;
  [DatabaseTypes.Entity]: EntityDatabase;
  [DatabaseTypes.Item]: ItemStackDatabase;
  [DatabaseTypes.World]: WorldDatabase;
}

export class NamespacedDatabaseManager {
  private _blockDatabaseMap = new Map<string, BlockDatabase>();
  private _itemDatabaseMap = new Map<string, ItemStackDatabase>()
  private _entityDatabaseMap = new Map<string, EntityDatabase>()
  private readonly _worldDatabase: WorldDatabase;

  private _blockInitialIdListMap = new Map<string, string[]>();
  private _worldInitialIdList = [] as string[];

  constructor(protected readonly namespace: string) {
    this._worldDatabase = WorldDatabase.create(namespace);
  }

  public static create(namespace: string) {
    return new NamespacedDatabaseManager(namespace);
  }

  protected _assertInvokedByTendrock(runtimeId: string) {
    if (runtimeId !== UniqueIdUtils.RuntimeId) {
      throw new Error("This method can not be invoked manually!");
    }
  }

  public _addBlockDataId(runtimeId: string, lid: string, dataId: string) {
    this._assertInvokedByTendrock(runtimeId);
    const dataIdList = this._blockInitialIdListMap.get(lid) ?? [];
    dataIdList.push(dataId);
    this._blockInitialIdListMap.set(lid, dataIdList);
  }

  public _addWorldDataId(runtimeId: string, dataId: string) {
    this._assertInvokedByTendrock(runtimeId);
    this._worldInitialIdList.push(dataId);
  }

  private _prepare<T extends Block | Entity | ItemStack>(gameObject?: T): {
    uniqueId: string,
    databaseMap: Map<string, DatabaseTypeBy<T>>,
    databaseType: DatabaseFactory<T>,
    initialIdList?: string[]
  } {
    if (gameObject) {
      if (gameObject instanceof Block) {
        const uniqueId = UniqueIdUtils.getBlockUniqueId(gameObject);
        const databaseMap = this._blockDatabaseMap as Map<string, DatabaseTypeBy<T>>;
        const databaseType = BlockDatabase as DatabaseFactory<T>;
        return {uniqueId, databaseMap, databaseType, initialIdList: this._blockInitialIdListMap.get(uniqueId)};
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
      } else {
        throw new Error(`Invalid gameObject type: ${typeof gameObject}`);
      }
    } else {
      const databaseType = WorldDatabase as DatabaseFactory<T>;
      return {uniqueId: undefined, databaseMap: undefined, databaseType, initialIdList: this._worldInitialIdList};
    }
  }

  public getOrCreate(): WorldDatabase;
  public getOrCreate<T extends Block | Entity | ItemStack>(gameObject: T): DatabaseTypeBy<T>
  public getOrCreate<T extends Block | Entity | ItemStack>(gameObject?: T): DatabaseTypeBy<T> | WorldDatabase {
    const {uniqueId, databaseMap, databaseType, initialIdList} = this._prepare(gameObject);
    if (!uniqueId) {
      return this._worldDatabase;
    }
    let database = databaseMap.get(uniqueId);
    if (database) {
      return database;
    }
    database = databaseType.create(this.namespace, {gameObject, initialIdList});
    databaseMap.set(uniqueId, database);
    return database;
  }

  public delete<T extends Block | Entity | ItemStack>(gameObject: T) {
    const {uniqueId, databaseMap} = this._prepare(gameObject);
    if (!uniqueId) {
      return;
    }
    const database = databaseMap.get(uniqueId);
    if (!database) {
      return;
    }
    database.clear();
    databaseMap.delete(uniqueId);
  }

  public blockDatabaseValues() {
    return this._blockDatabaseMap.values();
  }

  public itemDatabaseValues() {
    return this._itemDatabaseMap.values();
  }

  public entityDatabaseValues() {
    return this._entityDatabaseMap.values();
  }

  public getAllDatabaseValues() {
    return [...this.blockDatabaseValues(), ...this.entityDatabaseValues(), ...this.itemDatabaseValues(), this._worldDatabase];
  }

  public getWorldDatabase() {
    return this._worldDatabase;
  }
}