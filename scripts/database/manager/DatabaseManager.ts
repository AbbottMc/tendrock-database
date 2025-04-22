import {Block, Entity, EntityInitializationCause, ItemStack, system, World, world} from "@minecraft/server";
import {GameObjectDatabase} from "../GameObjectDatabase";
import {DatabaseTypeBy, DatabaseTypeMap, NamespacedDatabaseManager} from "./NamespacedDatabaseManager";
import {UniqueIdUtils} from "../helper/UniqueIdUtils";
import {Utils} from "../helper/Utils";
import {TendrockDynamicPropertyValue} from "../NamespacedDynamicProperty";
import {SetMap} from "@tenolib/map";
import {BlockDatabase, EntityDatabase, ItemStackDatabase} from "../impl";
import {DatabaseTypes} from "../DatabaseTypes";
import {ConstructorRegistry} from "../instance";
import {ConstructorRegistryImpl} from "../instance/ConstructorRegistry";

export type Constructor<T> = new (...args: any[]) => T;
export type GameObjectType = Block | Entity | ItemStack | World | string;

export class DatabaseManager {
  private readonly _databaseManagerMap = new Map<string, NamespacedDatabaseManager>();
  private readonly _eventCallbackMap = new SetMap<string, (...args: any[]) => void>();

  private readonly _blockToDatabaseMap = new SetMap<string, BlockDatabase>();
  private readonly _itemToDatabaseMap = new SetMap<string, ItemStackDatabase>();
  private readonly _entityToDatabaseMap = new SetMap<string, EntityDatabase>();

  private readonly _changingEntityDatabaseBuffer = new Map<string, EntityDatabase>();

  private _isInitialized = false;
  private _autoFlushTaskId: number | undefined;
  private _flushInterval = 3 * 6 * 20;
  private _autoUpdateSourceEntity = false;
  private _autoFlush = true;

  constructor() {
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
      const {namespace, lid, dataIdentifier} = Utils.parseIdentifier(id);
      if (!namespace) continue;
      const manager = this._createNamespacedManagerIfAbsent(namespace);
      if (lid) {
        manager._addBlockDataId(UniqueIdUtils.RuntimeId, lid, id, dataIdentifier);
      } else {
        manager._addWorldDataId(UniqueIdUtils.RuntimeId, id, dataIdentifier);
      }
      yield;
    }
  }

  private* _initWorldBlockDataGenerator(): Generator<void, void, void> {
    for (const [namespace, manager] of this._databaseManagerMap) {
      yield* manager._initWorldBlockDataGenerator(UniqueIdUtils.RuntimeId);
    }
  }

  private async _loadWorldDynamicProperties() {
    await Utils.runJob(this._loadAndParseWorldDynamicPropertiesGenerator());
    await Utils.runJob(this._initWorldBlockDataGenerator());
    this._isInitialized = true;
    this._startAutoFlushTask();
    this._doReady();
  }

  private _loadWorldDynamicPropertiesWhenWorldLoad() {
    const callback = world.afterEvents.worldLoad.subscribe(() => {
      this._loadWorldDynamicProperties().then(() => world.afterEvents.worldLoad.unsubscribe(callback));
    });
  }

  private _createNamespacedManagerIfAbsent(namespace: string) {
    let databaseManager = this._databaseManagerMap.get(namespace);
    if (databaseManager) {
      return databaseManager;
    }
    databaseManager = NamespacedDatabaseManager._create(UniqueIdUtils.RuntimeId, namespace, this);
    this._databaseManagerMap.set(namespace, databaseManager);
    return databaseManager;
  }

  protected _getNamespacedManager(namespace: string) {
    return this._databaseManagerMap.get(namespace);
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

  public createIfAbsent<T extends Block | Entity | ItemStack | World | string>(namespace: string, gameObject: T): DatabaseTypeBy<T> {
    const databaseManager = this._createNamespacedManagerIfAbsent(namespace);
    return databaseManager.createIfAbsent(gameObject);
  }

  public get<T extends Block | Entity | ItemStack | World | string>(namespace: string, gameObject: T): DatabaseTypeBy<T> | undefined {
    const databaseManager = this._getNamespacedManager(namespace);
    if (!databaseManager) {
      return undefined;
    }
    return databaseManager.get(gameObject);
  }

  public setData(namespace: string, gameObject: GameObjectType, identifier: string, value: TendrockDynamicPropertyValue) {
    const database = this.createIfAbsent(namespace, gameObject);
    database.set(identifier, value);
  }

  public getData<T extends TendrockDynamicPropertyValue>(namespace: string, gameObject: GameObjectType, identifier: string): T {
    const database = this.get(namespace, gameObject);
    return database?.get(identifier) as T;
  }

  public buildDataInstanceIfPresent<T>(namespace: string, gameObject: GameObjectType, identifier: string, objectConstructor: Constructor<T>, options?: unknown): T | undefined {
    const database = this.get(namespace, gameObject);
    return database?.buildInstanceIfPresent(identifier, objectConstructor, options);
  }

  public getDataBuiltInstance<T>(namespace: string, gameObject: GameObjectType, identifier: string): T | undefined {
    const database = this.get(namespace, gameObject);
    return database?.getBuiltInstance(identifier);
  }

  public createDataInstanceIfAbsent<T>(namespace: string, gameObject: GameObjectType, identifier: string, objectConstructor: Constructor<T>, options?: unknown): T {
    const database = this.createIfAbsent(namespace, gameObject);
    return database.createInstanceIfAbsent(identifier, objectConstructor, options);
  }

  public remove(namespace: string, gameObject: GameObjectType, clearData = false): void {
    const databaseManager = this._getNamespacedManager(namespace);
    databaseManager?.remove(gameObject, clearData);
  }

  private _prepare(gameObject: GameObjectType): {
    uniqueId: string | undefined,
    gameObjectToDatabaseMap?: SetMap<string, GameObjectDatabase<any>>
  } {
    if (gameObject instanceof Block) {
      return {
        uniqueId: UniqueIdUtils.getBlockUniqueId(gameObject),
        gameObjectToDatabaseMap: this._blockToDatabaseMap,
      };
    } else if (gameObject instanceof Entity) {
      return {
        uniqueId: UniqueIdUtils.getEntityUniqueId(gameObject),
        gameObjectToDatabaseMap: this._entityToDatabaseMap,
      };
    } else if (gameObject instanceof ItemStack) {
      return {
        uniqueId: UniqueIdUtils.getItemUniqueId(gameObject),
        gameObjectToDatabaseMap: this._itemToDatabaseMap,
      }
    } else {
      return {
        uniqueId: 'world@0',
      }
    }
  }

  public getDatabaseListByGameObject<T extends Block | Entity | ItemStack | World>(gameObject: T): DatabaseTypeBy<T>[] {
    const {uniqueId, gameObjectToDatabaseMap} = this._prepare(gameObject);
    if (!gameObjectToDatabaseMap || !uniqueId) {
      return [] as DatabaseTypeBy<T>[];
    }
    return (gameObjectToDatabaseMap.get(uniqueId) ?? []) as DatabaseTypeBy<T>[];
  }

  public getDatabaseList<T extends DatabaseTypes>(namespace: string, type: T): DatabaseTypeMap[T][] {
    const manager = this._getNamespacedManager(namespace);
    if (!manager) {
      return [] as DatabaseTypeMap[T][];
    }
    return manager.getDatabaseList(type);
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

  protected* flushDatabase(database: GameObjectDatabase<any>): Generator<void, void, void> {
    database._beginFlush(UniqueIdUtils.RuntimeId);
    const dirtyIdList = database._getDirtyDataIdList(UniqueIdUtils.RuntimeId);
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

  protected flushDatabaseSync(database: GameObjectDatabase<any>) {
    database._beginFlush(UniqueIdUtils.RuntimeId);
    const dirtyIdList = database._getDirtyDataIdList(UniqueIdUtils.RuntimeId);
    for (const identifier of dirtyIdList) {
      if (database.size() <= 0 && dirtyIdList.length <= 0) {
        break;
      }
      const value = database.get(identifier);
      // console.log(`flush ${identifier}`, JSON.stringify(value));
      database._saveData(UniqueIdUtils.RuntimeId, identifier, value);
    }
    database._endFlush(UniqueIdUtils.RuntimeId);
  }

  protected* flushAllDataGenerator(): Generator<void, void, void> {
    const managerValues = this._databaseManagerMap.values();
    for (const manager of managerValues) {
      manager._beginFlush(UniqueIdUtils.RuntimeId);
      const databaseValues = manager.getDirtyDatabaseList();
      if (databaseValues.length > 0) {
        for (const database of databaseValues) {
          yield* this.flushDatabase(database);
        }
      }
      manager._endFlush(UniqueIdUtils.RuntimeId);
    }
  }

  public flushSync() {
    if (!this.isReady()) return;
    const managerValues = this._databaseManagerMap.values();
    for (const manager of managerValues) {
      manager._beginFlush(UniqueIdUtils.RuntimeId);
      const databaseValues = manager.getDirtyDatabaseList();
      if (databaseValues.length <= 0) {
        continue;
      }
      for (const database of databaseValues) {
        this.flushDatabaseSync(database);
      }
      manager._endFlush(UniqueIdUtils.RuntimeId);
    }
  }

  public flush() {
    if (!this.isReady()) return;
    system.runJob(this.flushAllDataGenerator());
  }

  protected _flushDataWhenPlayerLeave() {
    world.beforeEvents.playerLeave.subscribe(({player}) => {
      if (world.getAllPlayers().length === 1) {
        this.flushSync();
      } else {
        for (const manager of this._databaseManagerMap.values()) {
          this.flushDatabase(manager.createIfAbsent(player));
        }
      }
    });
  }

  protected _clearFlushJobIfPresent() {
    if (this._autoFlushTaskId !== undefined) {
      system.clearJob(this._autoFlushTaskId);
    }
  }

  protected _startAutoFlushTask() {
    this._clearFlushJobIfPresent();
    if (!this._autoFlush) return;
    this._autoFlushTaskId = system.runInterval(() => {
      this.flush();
    }, this._flushInterval);
  }

  public _getBlockToDatabaseMap(runtimeId: string) {
    Utils.assertInvokedByTendrock(runtimeId);
    return this._blockToDatabaseMap;
  }

  public _getEntityToDatabaseMap(runtimeId: string) {
    Utils.assertInvokedByTendrock(runtimeId);
    return this._entityToDatabaseMap;
  }

  public _getItemToDatabaseMap(runtimeId: string) {
    Utils.assertInvokedByTendrock(runtimeId);
    return this._itemToDatabaseMap;
  }

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

export const databaseManager = new DatabaseManager();

world.beforeEvents.entityRemove.subscribe(({removedEntity}) => {
  if (!databaseManager.autoUpdateSourceEntity()) return;
  const removedEntityDatabaseList = databaseManager
    .getDatabaseListByGameObject(removedEntity)
    .filter((e) => e.getUid() === removedEntity.id);
  if (removedEntityDatabaseList.length <= 0) return;
  const removedEntityDatabase = removedEntityDatabaseList[0];
  const locationId = Utils.getLocationId({
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
  const locationId = Utils.getLocationId({
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
