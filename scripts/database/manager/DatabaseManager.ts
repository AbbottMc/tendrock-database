import {Block, Entity, ItemStack, system, world} from "@minecraft/server";
import {WorldDatabase} from "../impl/WorldDatabase";
import {GameObjectDatabase} from "../GameObjectDatabase";
import {DatabaseTypeBy, NamespacedDatabaseManager} from "./NamespacedDatabaseManager";
import {UniqueIdUtils} from "../helper/UniqueIdUtils";
import {Utils} from "../helper/Utils";


export class DatabaseManager {
  private _databaseManagerMap = new Map<string, NamespacedDatabaseManager>();
  private _isLoadingWorldDynamicProperties = false;
  private _isInitialized = false;

  constructor() {
    this._startFlushWhenPlayerLeaveTask();
    this._loadWorldDynamicPropertiesWhenWorldLoaded();
  }

  private* _loadAndParseWorldDynamicPropertiesGenerator(): Generator<void, void, void> {
    for (const id of world.getDynamicPropertyIds()) {
      const {namespace, dataIdentifier, lid} = Utils.parseIdentifier(id);
      if (!namespace) continue;
      const manager = this._getOrCreateNamespacedManager(namespace);
      if (lid) {
        manager._addBlockDataId(UniqueIdUtils.RuntimeId, lid, dataIdentifier);
      } else {
        manager._addWorldDataId(UniqueIdUtils.RuntimeId, dataIdentifier);
      }
      yield;
    }
    this._isLoadingWorldDynamicProperties = false;
  }

  private async _loadWorldDynamicProperties() {
    this._isLoadingWorldDynamicProperties = true;
    await Utils.runJob(this._loadAndParseWorldDynamicPropertiesGenerator());
    this._isInitialized = true;
    this._startAutoFlushTask();
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

  public getOrCreate(namespace: string): WorldDatabase;
  public getOrCreate<T extends Block | Entity | ItemStack>(namespace: string, gameObject: T): DatabaseTypeBy<T>;
  public getOrCreate<T extends Block | Entity | ItemStack>(namespace: string, gameObject?: T): DatabaseTypeBy<T> {
    const databaseManager = this._getOrCreateNamespacedManager(namespace);
    return databaseManager.getOrCreate(gameObject);
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
      database.saveData(identifier, value);
      yield;
    }
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
      database.saveData(identifier, value);
    }
    database._endFlush(UniqueIdUtils.RuntimeId);
  }

  protected* flushAllDataGenerator(): Generator<void, void, void> {
    const managerValues = this._databaseManagerMap.values();
    for (const manager of managerValues) {
      const databaseValues = manager.getAllDatabaseValues();
      if (databaseValues.length > 0) {
        for (const database of databaseValues) {
          yield* this.flushDatabase(database);
        }
      }
    }
  }

  public flushSync() {
    const managerValues = this._databaseManagerMap.values();
    for (const manager of managerValues) {
      const databaseValues = manager.getAllDatabaseValues();
      if (databaseValues.length <= 0) {
        continue;
      }
      for (const database of databaseValues) {
        this.flushDatabaseSync(database);
      }
    }
  }

  public flush() {
    system.runJob(this.flushAllDataGenerator());
  }

  protected _startFlushWhenPlayerLeaveTask() {
    world.beforeEvents.playerLeave.subscribe(({player}) => {
      console.log(world.getAllPlayers().length);
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
    system.runInterval(() => {
      this.flush();
    }, 3 * 60 * 20);
  }
}


export const databaseManager = new DatabaseManager();