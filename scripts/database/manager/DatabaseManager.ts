import {Block, Entity, EntityInitializationCause, ItemStack, system, world, World} from "@minecraft/server";
import {BlockDatabase, EntityDatabase, ItemStackDatabase, WorldDatabase} from "../impl";
import {UniqueIdUtils} from "../helper/UniqueIdUtils";
import {GameObjectDatabase} from "../GameObjectDatabase";
import {BetterSet, SetMap} from "@tenolib/map";
import {Utils} from "../helper/Utils";
import {DatabaseTypes} from "../DatabaseTypes";
import {ConstructorRegistry, ConstructorRegistryImpl} from "../instance/ConstructorRegistry";
import {LocationUtils} from "@tendrock/location-id";
import {DynamicPropertySerializer, TendrockDynamicPropertyValue} from "../DynamicPropertySerializer";

export type Constructor<T> = new (...args: any[]) => T;
export type GameObjectType = Block | Entity | ItemStack | World | string;

export type DatabaseTypeBy<T> = T extends (string | Block) ? BlockDatabase : T extends Entity ? EntityDatabase : T extends ItemStack ? ItemStackDatabase : WorldDatabase;
export type DatabaseFactory<T extends Block | Entity | ItemStack | World | string> = {
  create(manager: DatabaseManager, gameObject: T, initialIdList?: [string, string][]): InstanceType<DatabaseFactory<T>>;
} & (new (...args: any[]) => any);

export type DatabaseTypeMap = {
  [DatabaseTypes.Entity]: EntityDatabase;
  [DatabaseTypes.Block]: BlockDatabase;
  [DatabaseTypes.Item]: ItemStackDatabase;
  [DatabaseTypes.World]: WorldDatabase;
}

export class DatabaseManager {
  public static Instance = new DatabaseManager();

  private readonly _databaseManagerMap = new Map<string, DatabaseManager>();
  private readonly _eventCallbackMap = new SetMap<string, (...args: any[]) => void>();

  private readonly _changingEntityDatabaseBuffer = new Map<string, EntityDatabase>();

  private _isInitialized = false;
  private _autoFlushTaskId: number | undefined;
  private _flushInterval = 3 * 60 * 20;
  private _autoUpdateSourceEntity = true;
  private _autoFlush = true;

  private _blockDatabaseMap = new Map<string, BlockDatabase>();
  private _itemDatabaseMap = new Map<string, ItemStackDatabase>();
  private _entityDatabaseMap = new Map<string, EntityDatabase>();
  private _worldDatabase!: WorldDatabase;

  private _blockInitialIdListMap = new SetMap<string, [string, string]>();
  private _worldInitialIdList: [string, string][] | undefined = [];

  private _isFlushing = false;
  private _dirtyDatabaseList = new BetterSet<GameObjectDatabase<any>>();
  private _dirtyDatabaseBuffer = new BetterSet<GameObjectDatabase<any>>();

  protected constructor() {
    this._triggerStartupEventWhenSystemStartup();
    this._loadWorldDynamicPropertiesWhenWorldLoad();
    this._flushDataWhenPlayerLeave();
  }

  private _triggerStartupEventWhenSystemStartup() {
    const callback = system.beforeEvents.startup.subscribe(() => {
      this._doStartup();
      system.beforeEvents.startup.unsubscribe(callback);
    });
  }

  private* _loadAndParseWorldDynamicPropertiesGenerator(): Generator<void, void, void> {
    for (const id of world.getDynamicPropertyIds()) {
      const {lid, dataIdentifier} = DynamicPropertySerializer.Instance.deserializePropertyId(id);
      if (lid) {
        this._addBlockDataId(lid, id, dataIdentifier);
      } else {
        this._addWorldDataId(id, dataIdentifier);
      }
      yield;
    }
  }

  private async _loadWorldDynamicProperties() {
    await Utils.runJob(this._loadAndParseWorldDynamicPropertiesGenerator());
    await Utils.runJob(this._initWorldBlockDataGenerator());
    this._startAutoFlushTask();
    this._isInitialized = true;
    this._doReady();
  }

  private _loadWorldDynamicPropertiesWhenWorldLoad() {
    const callback = world.afterEvents.worldLoad.subscribe(() => {
      this._loadWorldDynamicProperties().then(() => world.afterEvents.worldLoad.unsubscribe(callback));
    });
  }

  private _addBlockDataId(lid: string, propertyId: string, dataId: string) {
    this._blockInitialIdListMap.addValue(lid, [propertyId, dataId]);
  }

  private _addWorldDataId(propertyId: string, dataId: string) {
    if (!this._worldInitialIdList) {
      throw new Error("World data id list is used and frozen.");
    }
    this._worldInitialIdList.push([propertyId, dataId]);
  }

  protected* _initWorldDataGenerator(): Generator<void, void, void> {
    if (this._worldInitialIdList) {
      this._worldDatabase = WorldDatabase.create(this, world, this._worldInitialIdList);
      this._worldInitialIdList = undefined;
      yield;
    }
  }

  protected* _initBlockDataGenerator(): Generator<void, void, void> {
    if (this._blockInitialIdListMap.size > 0) {
      for (const [lid, set] of this._blockInitialIdListMap) {
        const blockDatabase = BlockDatabase.create(this, lid, set);
        this._blockDatabaseMap.set(lid, blockDatabase);
        yield;
      }
      this._blockInitialIdListMap.clear();
    }
  }

  private* _initWorldBlockDataGenerator(): Generator<void, void, void> {
    yield* this._initWorldDataGenerator();
    yield* this._initBlockDataGenerator();
  }

  private _doStartup() {
    if (this._isInitialized) {
      throw new Error('DatabaseManager is already startup');
    }
    const event = {constructorRegistry: ConstructorRegistryImpl.Instance.getRegistry()};
    this._eventCallbackMap.get('whenStartup')?.forEach(callback => callback(event));
    this._eventCallbackMap.delete('whenStartup');
  }

  public whenStartup(callback: (event: { constructorRegistry: ConstructorRegistry }) => void) {
    if (this._isInitialized) {
      throw new Error('DatabaseManager is already startup');
    }
    this._eventCallbackMap.addValue('whenStartup', callback);
    return () => {
      this._eventCallbackMap.deleteValue('whenStartup', callback);
    };
  }

  private _doReady() {
    this._eventCallbackMap.get('whenReady')?.forEach(callback => callback());
    this._eventCallbackMap.delete('whenReady');
  }

  public whenReady(callback: () => void): (() => void) | undefined {
    if (this._isInitialized) {
      callback();
      return undefined;
    }
    this._eventCallbackMap.addValue('whenReady', callback);
    return () => {
      this._eventCallbackMap.deleteValue('whenReady', callback);
    };
  }

  public isReady() {
    return this._isInitialized;
  }

  public _markDirty(runtimeId: string, dataBase: GameObjectDatabase<any>) {
    Utils.assertInvokedByTendrock(runtimeId);
    const dirtyDatabases = this._isFlushing ? this._dirtyDatabaseBuffer : this._dirtyDatabaseList;
    // console.log('dirty database list before mark dirty: ', JSON.stringify(dirtyDatabases.map(db => db.getUid())));
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

  public setFlushInterval(interval: number, flush = true) {
    this._flushInterval = interval;
    if (flush) {
      this.flush();
    }
    this._startAutoFlushTask();
  }

  public getFlushInterval() {
    return this._flushInterval;
  }

  public setAutoFlush(value = true) {
    this._autoFlush = value;
    if (value) {
      this._clearFlushJobIfPresent();
    } else {
      this._startAutoFlushTask();
    }
  }

  public autoFlush() {
    return this._autoFlush;
  }

  public setAutoUpdateSourceEntity(value = true) {
    this._autoUpdateSourceEntity = value;
  }

  public autoUpdateSourceEntity() {
    return this._autoUpdateSourceEntity;
  }

  private* _flushDatabase(database: GameObjectDatabase<any> | undefined): Generator<void, void, void> {
    if (!database) {
      return;
    }
    database._beginFlush(UniqueIdUtils.RuntimeId);
    const dirtyIdList = database._getDirtyDataIdList(UniqueIdUtils.RuntimeId);
    // console.log(`flush database "${database.getUid()}: " `, JSON.stringify(dirtyIdList))
    for (const identifier of dirtyIdList) {
      if (database.size() <= 0 && dirtyIdList.length <= 0) {
        yield;
        break;
      }
      const value = database.get(identifier);
      // console.log(`flush ${identifier}`, JSON.stringify(value));
      database._saveData(UniqueIdUtils.RuntimeId, identifier, value);
      yield;
    }
    // console.log(`flush ${database._getDirtyDataIdList(UniqueIdUtils.RuntimeId).length} data`);
    database._endFlush(UniqueIdUtils.RuntimeId);
  }

  private* _flushDataGenerator(): Generator<void, void, void> {
    this._beginFlush();
    // console.log('start flush')
    const databaseValues = this.getDirtyDatabaseList();
    if (databaseValues.length > 0) {
      for (const database of databaseValues) {
        yield* this._flushDatabase(database);
      }
    }
    this._endFlush();
    // console.log('flush end')
  }

  private _flushDatabaseSync(database: GameObjectDatabase<any>, flushAllDirtyData: boolean) {
    database._beginFlush(UniqueIdUtils.RuntimeId);
    const dirtyIdList = flushAllDirtyData ? database._getAllDirtyDataIdList(UniqueIdUtils.RuntimeId) : database._getDirtyDataIdList(UniqueIdUtils.RuntimeId);
    // console.log(`flush ${dirtyIdList.length} data`)
    for (const identifier of dirtyIdList) {
      if (database.size() <= 0 && dirtyIdList.length <= 0) {
        break;
      }
      const value = database.get(identifier);
      // console.log(`flush ${identifier}`, JSON.stringify(value));
      database._saveData(UniqueIdUtils.RuntimeId, identifier, value);
    }
    database._endFlush(UniqueIdUtils.RuntimeId);
    // console.log(`database "${database.getUid()}" flushed`);
  }

  private _flushSyncImpl(includeBuffer = false) {
    if (!this.isReady()) return;
    this._beginFlush();
    const databaseValues = includeBuffer ? this.getAllDirtyDatabaseList() : this.getDirtyDatabaseList();
    // console.log('flush database when shutdown, dirty database count: ', databaseValues.length)
    if (databaseValues.length <= 0) {
      return;
    }
    for (const database of databaseValues) {
      this._flushDatabaseSync(database, includeBuffer);
    }
    this._endFlush(includeBuffer);
    // console.log('databases flushed');
  }

  public flushSync() {
    this._flushSyncImpl(false);
  }

  private _flushWhenShutdown() {
    this._flushSyncImpl(true);
  }

  public flush() {
    if (!this.isReady()) return;
    system.runJob(this._flushDataGenerator());
  }

  private _flushDataWhenPlayerLeave() {
    world.beforeEvents.playerLeave.subscribe(({player}) => {
      if (world.getAllPlayers().length === 1) {
        this._flushWhenShutdown();
      } else {
        this._flushDatabase(this.get(player));
      }
    });
  }

  private _clearFlushJobIfPresent() {
    if (this._autoFlushTaskId !== undefined) {
      system.clearJob(this._autoFlushTaskId);
    }
  }

  private _startAutoFlushTask() {
    this._clearFlushJobIfPresent();
    if (!this._autoFlush) return;
    this._autoFlushTaskId = system.runInterval(() => {
      this.flush();
    }, this._flushInterval);
  }

  private _beginFlush() {
    this._isFlushing = true;
  }

  private _endFlush(allDirtyDataFlushed = false) {
    if (allDirtyDataFlushed) {
      this._dirtyDatabaseList = new BetterSet();
      this._dirtyDatabaseBuffer = new BetterSet();
      this._isFlushing = false;
    } else {
      this._dirtyDatabaseList = this._dirtyDatabaseBuffer;
      this._isFlushing = false;
      this._dirtyDatabaseBuffer = new BetterSet();
    }
  }

  // ---------------------------------------------------------

  private _prepare<T extends Block | Entity | ItemStack | World | string>(gameObject: T): {
    uniqueId: string | undefined,
    databaseMap: Map<string, DatabaseTypeBy<T>> | undefined,
    databaseType: DatabaseFactory<T>,
    initialIdList?: [string, string][]
  } {
    if (typeof gameObject === 'string' || gameObject instanceof Block) {
      const uniqueId = UniqueIdUtils.getBlockUniqueId(gameObject);
      const databaseMap = this._blockDatabaseMap as Map<string, DatabaseTypeBy<T>>;
      const databaseType = BlockDatabase as DatabaseFactory<T>;
      return {uniqueId, databaseMap, databaseType};
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
      return {uniqueId: undefined, databaseMap: undefined, databaseType};
    } else {
      throw new Error(`Invalid game object type.`);
    }
  }

  public createIfAbsent<T extends Block | Entity | ItemStack | World | string>(gameObject: T): DatabaseTypeBy<T> {
    const {uniqueId, databaseMap, databaseType} = this._prepare(gameObject);
    // Is world database
    if (!uniqueId || !databaseMap) {
      if (this._worldDatabase) {
        return this._worldDatabase as DatabaseTypeBy<T>;
      }
      this._worldDatabase = WorldDatabase.create(this, world);
      this._worldInitialIdList = undefined;
      return this._worldDatabase as DatabaseTypeBy<T>;
    }
    let database = databaseMap.get(uniqueId)!;
    if (database) {
      return database;
    }
    database = databaseType.create(this, gameObject);
    databaseMap.set(uniqueId, database);
    return database;
  }

  public get<T extends Block | Entity | ItemStack | World | string>(gameObject: T): DatabaseTypeBy<T> | undefined {
    const {uniqueId, databaseMap} = this._prepare(gameObject);
    if (!uniqueId || !databaseMap) {
      return undefined;
    }
    return databaseMap.get(uniqueId);
  }

  public remove<T extends Block | Entity | ItemStack | World | string>(gameObject: T, clearProperty = false) {
    const {uniqueId, databaseMap} = this._prepare(gameObject);
    if (!uniqueId || !databaseMap) {
      return;
    }
    const database = databaseMap.get(uniqueId);
    if (!database) {
      return;
    }
    if (clearProperty) {
      database.clear();
      this._dirtyDatabaseList.delete(database);
      this._dirtyDatabaseBuffer.delete(database);
    }
    databaseMap.delete(uniqueId);
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

  public _addDatabase<T extends Block | Entity | ItemStack | World | string>(runtimeId: string, database: DatabaseTypeBy<T>) {
    Utils.assertInvokedByTendrock(runtimeId);
    const {uniqueId, databaseMap} = this._prepare(database.getGameObject());
    if (!databaseMap || !uniqueId) {
      return;
    }
    if (databaseMap.has(uniqueId)) {
      return;
    }
    databaseMap.set(uniqueId, database);
  }

  public setData(gameObject: GameObjectType, identifier: string, value: TendrockDynamicPropertyValue) {
    this.createIfAbsent(gameObject).set(identifier, value);
  }

  public getData<T extends TendrockDynamicPropertyValue>(gameObject: GameObjectType, identifier: string): T {
    return this.get(gameObject)?.get(identifier) as T;
  }

  public deleteData(gameObject: GameObjectType, identifier: string): boolean {
    const database = this.get(gameObject);
    if (!database) return false;
    return database.delete(identifier);
  }

  public buildDataInstanceIfPresent<T>(gameObject: GameObjectType, identifier: string, objectConstructor: Constructor<T>, options?: unknown): T | undefined {
    const database = this.get(gameObject);
    return database?.buildInstanceIfPresent(identifier, objectConstructor, options);
  }

  public getDataBuiltInstance<T>(gameObject: GameObjectType, identifier: string): T | undefined {
    const database = this.get(gameObject);
    return database?.getBuiltInstance(identifier);
  }

  public createDataInstanceIfAbsent<T>(gameObject: GameObjectType, identifier: string, objectConstructor: Constructor<T>, options?: unknown): T {
    const database = this.createIfAbsent(gameObject);
    return database.createInstanceIfAbsent(identifier, objectConstructor, options);
  }

  public getDirtyDatabaseList(): Array<GameObjectDatabase<any>> {
    return this._dirtyDatabaseList;
  }

  public getAllDirtyDatabaseList(): Array<GameObjectDatabase<any>> {
    return this._dirtyDatabaseList.concat(this._dirtyDatabaseBuffer);
  }

  // --------------------------------------------------------

  public _setChangingEntityDatabaseBuffer(runtimeId: string, locationId: string, entityDatabase: EntityDatabase) {
    Utils.assertInvokedByTendrock(runtimeId);
    // console.log(`set changing entity database buffer: ${locationId}`)
    this._changingEntityDatabaseBuffer.set(locationId, entityDatabase);
  }

  public _getChangingEntityDatabaseBuffer(runtimeId: string, locationId: string) {
    Utils.assertInvokedByTendrock(runtimeId);
    return {
      entityDatabase: this._changingEntityDatabaseBuffer.get(locationId),
      cleanBuffer: () => {
        this._changingEntityDatabaseBuffer.delete(locationId);
      }
    };
  }
}

export const databaseManager = DatabaseManager.Instance;

world.beforeEvents.entityRemove.subscribe(({removedEntity}) => {
  if (!databaseManager.autoUpdateSourceEntity()) return;
  const removedEntityDatabase = databaseManager.get(removedEntity);
  if (!removedEntityDatabase) return;
  const locationId = LocationUtils.getLocationId({
    ...removedEntity.location, dimension: removedEntity.dimension
  }, true);
  databaseManager._setChangingEntityDatabaseBuffer(
    UniqueIdUtils.RuntimeId, locationId, removedEntityDatabase
  );
  system.runTimeout(() => {
    databaseManager._getChangingEntityDatabaseBuffer(UniqueIdUtils.RuntimeId, locationId).cleanBuffer();
  }, 3);
});

world.afterEvents.entitySpawn.subscribe(({entity, cause}) => {
  if (!databaseManager.autoUpdateSourceEntity()) return;
  if (cause !== EntityInitializationCause.Event && cause !== EntityInitializationCause.Transformed) return;
  const locationId = LocationUtils.getLocationId({
    ...entity.location, dimension: entity.dimension
  }, true);
  // console.log('entity spawned: ', locationId)
  const {
    cleanBuffer, entityDatabase
  } = databaseManager._getChangingEntityDatabaseBuffer(UniqueIdUtils.RuntimeId, locationId);
  if (entityDatabase) {
    entityDatabase._setEntity(UniqueIdUtils.RuntimeId, entity);
    cleanBuffer();
  }
});
