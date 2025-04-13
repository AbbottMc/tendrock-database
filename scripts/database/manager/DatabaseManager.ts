import {Block, Entity, ItemStack, system, World, world} from "@minecraft/server";
import {GameObjectDatabase} from "../GameObjectDatabase";
import {DatabaseTypeBy, NamespacedDatabaseManager} from "./NamespacedDatabaseManager";
import {UniqueIdUtils} from "../helper/UniqueIdUtils";
import {Utils} from "../helper/Utils";
import {TendrockDynamicPropertyValue} from "../NamespacedDynamicProperty";


export class DatabaseManager {
  private _databaseManagerMap = new Map<string, NamespacedDatabaseManager>();
  private _isInitialized = false;
  private _whenReadyCallbackList = new Array<() => void>();
  private _flushInterval = 3 * 6 * 20;
  private _autoFlushTaskId: number | undefined;

  constructor() {
    this._startFlushWhenPlayerLeaveTask();
    this._loadWorldDynamicPropertiesWhenWorldLoaded();
  }

  private* _loadAndParseWorldDynamicPropertiesGenerator(): Generator<void, void, void> {
    for (const id of world.getDynamicPropertyIds()) {
      const {namespace, lid, dataIdentifier} = Utils.parseIdentifier(id);
      if (!namespace) continue;
      const manager = this._getOrCreateNamespacedManager(namespace);
      if (lid) {
        manager._addBlockDataId(UniqueIdUtils.RuntimeId, lid, id, dataIdentifier);
      } else {
        manager._addWorldDataId(UniqueIdUtils.RuntimeId, id, dataIdentifier);
      }
      yield;
    }
  }

  private async _loadWorldDynamicProperties() {
    await Utils.runJob(this._loadAndParseWorldDynamicPropertiesGenerator());
    this._isInitialized = true;
    this._startAutoFlushTask();
    this._doReady();
  }

  private _loadWorldDynamicPropertiesWhenWorldLoaded() {
    world.afterEvents.worldLoad.subscribe(() => {
      this._loadWorldDynamicProperties();
    });
  }

  private _getOrCreateNamespacedManager(namespace: string) {
    let databaseManager = this._databaseManagerMap.get(namespace);
    if (databaseManager) {
      return databaseManager;
    }
    databaseManager = NamespacedDatabaseManager.create(namespace);
    this._databaseManagerMap.set(namespace, databaseManager);
    return databaseManager;
  }

  private _doReady() {
    this._whenReadyCallbackList.forEach(callback => callback());
    this._whenReadyCallbackList = [];
  }

  public whenReady(callback: () => void): (() => void) | undefined {
    if (this._isInitialized) {
      callback();
      return undefined;
    }
    this._whenReadyCallbackList.push(callback);
    return () => {
      this._whenReadyCallbackList.splice(this._whenReadyCallbackList.indexOf(callback), 1);
    };
  }

  public isReady() {
    return this._isInitialized;
  }

  public getOrCreate<T extends Block | Entity | ItemStack | World>(namespace: string, gameObject: T): DatabaseTypeBy<T> {
    const databaseManager = this._getOrCreateNamespacedManager(namespace);
    return databaseManager.getOrCreate(gameObject);
  }

  public setData<T extends Block | Entity | ItemStack | World>(namespace: string, gameObject: T, identifier: string, value: TendrockDynamicPropertyValue) {
    const database = this.getOrCreate(namespace, gameObject);
    database.set(identifier, value);
  }

  public getData<T extends Block | Entity | ItemStack | World>(namespace: string, gameObject: T, identifier: string): TendrockDynamicPropertyValue {
    const database = this.getOrCreate(namespace, gameObject);
    return database.get(identifier);
  }

  public remove<T extends Block | Entity | ItemStack | World>(namespace: string, gameObject: T, clearData = false): void {
    const databaseManager = this._getOrCreateNamespacedManager(namespace);
    databaseManager.remove(gameObject, clearData);
  }

  public setFlushInterval(interval: number, flush = true) {
    this._flushInterval = interval;
    if (flush) {
      this.flush();
    }
    this._startAutoFlushTask();
  }

  protected* flushDatabase(database: GameObjectDatabase<any>): Generator<void, void, void> {
    database._beginFlush(UniqueIdUtils.RuntimeId);
    const dirtyIdList = database._getDirtyDataIdList(UniqueIdUtils.RuntimeId);
    for (const identifier of dirtyIdList) {
      if (database.size() <= 0) {
        yield;
        break;
      }
      const value = database.get(identifier);
      database._saveData(UniqueIdUtils.RuntimeId, identifier, value);
      yield;
    }
    console.log(`flush ${database._getDirtyDataIdList(UniqueIdUtils.RuntimeId).length} data`);
    database._endFlush(UniqueIdUtils.RuntimeId);
  }

  protected flushDatabaseSync(database: GameObjectDatabase<any>) {
    database._beginFlush(UniqueIdUtils.RuntimeId);
    const dirtyIdList = database._getDirtyDataIdList(UniqueIdUtils.RuntimeId);
    for (const identifier of dirtyIdList) {
      if (database.size() <= 0) {
        break;
      }
      const value = database.get(identifier);
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
    system.runJob(this.flushAllDataGenerator());
  }

  protected _startFlushWhenPlayerLeaveTask() {
    world.beforeEvents.playerLeave.subscribe(({player}) => {
      if (world.getAllPlayers().length === 1) {
        this.flushSync();
      } else {
        for (const manager of this._databaseManagerMap.values()) {
          this.flushDatabase(manager.getOrCreate(player));
        }
      }
    });
  }

  protected _startAutoFlushTask() {
    if (this._autoFlushTaskId) {
      system.clearRun(this._autoFlushTaskId);
    }
    this._autoFlushTaskId = system.runInterval(() => {
      this.flush();
    }, this._flushInterval);
  }
}


export const databaseManager = new DatabaseManager();