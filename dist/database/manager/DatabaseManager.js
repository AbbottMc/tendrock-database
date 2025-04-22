var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Block, Entity, EntityInitializationCause, ItemStack, system, world } from "@minecraft/server";
import { NamespacedDatabaseManager } from "./NamespacedDatabaseManager";
import { UniqueIdUtils } from "../helper/UniqueIdUtils";
import { Utils } from "../helper/Utils";
import { SetMap } from "@tenolib/map";
import { ConstructorRegistryImpl } from "../instance/ConstructorRegistry";
export class DatabaseManager {
    constructor() {
        this._databaseManagerMap = new Map();
        this._eventCallbackMap = new SetMap();
        this._blockToDatabaseMap = new SetMap();
        this._itemToDatabaseMap = new SetMap();
        this._entityToDatabaseMap = new SetMap();
        this._changingEntityDatabaseBuffer = new Map();
        this._isInitialized = false;
        this._flushInterval = 3 * 6 * 20;
        this._autoUpdateSourceEntity = false;
        this._autoFlush = true;
        this._triggerStartupEventWhenSystemStartup();
        this._loadWorldDynamicPropertiesWhenWorldLoad();
        this._flushDataWhenPlayerLeave();
    }
    _triggerStartupEventWhenSystemStartup() {
        const callback = system.beforeEvents.startup.subscribe(() => {
            this._doStartup();
            system.beforeEvents.startup.unsubscribe(callback);
        });
    }
    *_loadAndParseWorldDynamicPropertiesGenerator() {
        for (const id of world.getDynamicPropertyIds()) {
            const { namespace, lid, dataIdentifier } = Utils.parseIdentifier(id);
            if (!namespace)
                continue;
            const manager = this._createNamespacedManagerIfAbsent(namespace);
            if (lid) {
                manager._addBlockDataId(UniqueIdUtils.RuntimeId, lid, id, dataIdentifier);
            }
            else {
                manager._addWorldDataId(UniqueIdUtils.RuntimeId, id, dataIdentifier);
            }
            yield;
        }
    }
    *_initWorldBlockDataGenerator() {
        for (const [namespace, manager] of this._databaseManagerMap) {
            yield* manager._initWorldBlockDataGenerator(UniqueIdUtils.RuntimeId);
        }
    }
    _loadWorldDynamicProperties() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Utils.runJob(this._loadAndParseWorldDynamicPropertiesGenerator());
            yield Utils.runJob(this._initWorldBlockDataGenerator());
            this._isInitialized = true;
            this._startAutoFlushTask();
            this._doReady();
        });
    }
    _loadWorldDynamicPropertiesWhenWorldLoad() {
        const callback = world.afterEvents.worldLoad.subscribe(() => {
            this._loadWorldDynamicProperties().then(() => world.afterEvents.worldLoad.unsubscribe(callback));
        });
    }
    _createNamespacedManagerIfAbsent(namespace) {
        let databaseManager = this._databaseManagerMap.get(namespace);
        if (databaseManager) {
            return databaseManager;
        }
        databaseManager = NamespacedDatabaseManager._create(UniqueIdUtils.RuntimeId, namespace, this);
        this._databaseManagerMap.set(namespace, databaseManager);
        return databaseManager;
    }
    _getNamespacedManager(namespace) {
        return this._databaseManagerMap.get(namespace);
    }
    _doStartup() {
        var _a;
        if (this._isInitialized) {
            throw new Error('DatabaseManager is already startup');
        }
        const event = { constructorRegistry: ConstructorRegistryImpl.Instance.getRegistry() };
        (_a = this._eventCallbackMap.get('whenStartup')) === null || _a === void 0 ? void 0 : _a.forEach(callback => callback(event));
        this._eventCallbackMap.delete('whenStartup');
    }
    whenStartup(callback) {
        if (this._isInitialized) {
            throw new Error('DatabaseManager is already startup');
        }
        this._eventCallbackMap.addValue('whenStartup', callback);
        return () => {
            this._eventCallbackMap.deleteValue('whenStartup', callback);
        };
    }
    _doReady() {
        var _a;
        (_a = this._eventCallbackMap.get('whenReady')) === null || _a === void 0 ? void 0 : _a.forEach(callback => callback());
        this._eventCallbackMap.delete('whenReady');
    }
    whenReady(callback) {
        if (this._isInitialized) {
            callback();
            return undefined;
        }
        this._eventCallbackMap.addValue('whenReady', callback);
        return () => {
            this._eventCallbackMap.deleteValue('whenReady', callback);
        };
    }
    isReady() {
        return this._isInitialized;
    }
    createIfAbsent(namespace, gameObject) {
        const databaseManager = this._createNamespacedManagerIfAbsent(namespace);
        return databaseManager.createIfAbsent(gameObject);
    }
    get(namespace, gameObject) {
        const databaseManager = this._getNamespacedManager(namespace);
        if (!databaseManager) {
            return undefined;
        }
        return databaseManager.get(gameObject);
    }
    setData(namespace, gameObject, identifier, value) {
        const database = this.createIfAbsent(namespace, gameObject);
        database.set(identifier, value);
    }
    getData(namespace, gameObject, identifier) {
        const database = this.get(namespace, gameObject);
        return database === null || database === void 0 ? void 0 : database.get(identifier);
    }
    buildDataInstanceIfPresent(namespace, gameObject, identifier, objectConstructor, options) {
        const database = this.get(namespace, gameObject);
        return database === null || database === void 0 ? void 0 : database.buildInstanceIfPresent(identifier, objectConstructor, options);
    }
    getDataBuiltInstance(namespace, gameObject, identifier) {
        const database = this.get(namespace, gameObject);
        return database === null || database === void 0 ? void 0 : database.getBuiltInstance(identifier);
    }
    createDataInstanceIfAbsent(namespace, gameObject, identifier, objectConstructor, options) {
        const database = this.createIfAbsent(namespace, gameObject);
        return database.createInstanceIfAbsent(identifier, objectConstructor, options);
    }
    remove(namespace, gameObject, clearData = false) {
        const databaseManager = this._getNamespacedManager(namespace);
        databaseManager === null || databaseManager === void 0 ? void 0 : databaseManager.remove(gameObject, clearData);
    }
    _prepare(gameObject) {
        if (gameObject instanceof Block) {
            return {
                uniqueId: UniqueIdUtils.getBlockUniqueId(gameObject),
                gameObjectToDatabaseMap: this._blockToDatabaseMap,
            };
        }
        else if (gameObject instanceof Entity) {
            return {
                uniqueId: UniqueIdUtils.getEntityUniqueId(gameObject),
                gameObjectToDatabaseMap: this._entityToDatabaseMap,
            };
        }
        else if (gameObject instanceof ItemStack) {
            return {
                uniqueId: UniqueIdUtils.getItemUniqueId(gameObject),
                gameObjectToDatabaseMap: this._itemToDatabaseMap,
            };
        }
        else {
            return {
                uniqueId: 'world@0',
            };
        }
    }
    getDatabaseListByGameObject(gameObject) {
        var _a;
        const { uniqueId, gameObjectToDatabaseMap } = this._prepare(gameObject);
        if (!gameObjectToDatabaseMap || !uniqueId) {
            return [];
        }
        return ((_a = gameObjectToDatabaseMap.get(uniqueId)) !== null && _a !== void 0 ? _a : []);
    }
    getDatabaseList(namespace, type) {
        const manager = this._getNamespacedManager(namespace);
        if (!manager) {
            return [];
        }
        return manager.getDatabaseList(type);
    }
    setFlushInterval(interval, flush = true) {
        this._flushInterval = interval;
        if (flush) {
            this.flush();
        }
        this._startAutoFlushTask();
    }
    getFlushInterval() {
        return this._flushInterval;
    }
    setAutoFlush(value = true) {
        this._autoFlush = value;
        if (value) {
            this._clearFlushJobIfPresent();
        }
        else {
            this._startAutoFlushTask();
        }
    }
    autoFlush() {
        return this._autoFlush;
    }
    setAutoUpdateSourceEntity(value = true) {
        this._autoUpdateSourceEntity = value;
    }
    autoUpdateSourceEntity() {
        return this._autoUpdateSourceEntity;
    }
    *flushDatabase(database) {
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
    flushDatabaseSync(database) {
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
    *flushAllDataGenerator() {
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
    flushSync() {
        if (!this.isReady())
            return;
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
    flush() {
        if (!this.isReady())
            return;
        system.runJob(this.flushAllDataGenerator());
    }
    _flushDataWhenPlayerLeave() {
        world.beforeEvents.playerLeave.subscribe(({ player }) => {
            if (world.getAllPlayers().length === 1) {
                this.flushSync();
            }
            else {
                for (const manager of this._databaseManagerMap.values()) {
                    this.flushDatabase(manager.createIfAbsent(player));
                }
            }
        });
    }
    _clearFlushJobIfPresent() {
        if (this._autoFlushTaskId !== undefined) {
            system.clearJob(this._autoFlushTaskId);
        }
    }
    _startAutoFlushTask() {
        this._clearFlushJobIfPresent();
        if (!this._autoFlush)
            return;
        this._autoFlushTaskId = system.runInterval(() => {
            this.flush();
        }, this._flushInterval);
    }
    _getBlockToDatabaseMap(runtimeId) {
        Utils.assertInvokedByTendrock(runtimeId);
        return this._blockToDatabaseMap;
    }
    _getEntityToDatabaseMap(runtimeId) {
        Utils.assertInvokedByTendrock(runtimeId);
        return this._entityToDatabaseMap;
    }
    _getItemToDatabaseMap(runtimeId) {
        Utils.assertInvokedByTendrock(runtimeId);
        return this._itemToDatabaseMap;
    }
    _setChangingEntityDatabaseBuffer(runtimeId, locationId, entityDatabase) {
        Utils.assertInvokedByTendrock(runtimeId);
        // console.log(`set changing entity database buffer: ${locationId}`)
        this._changingEntityDatabaseBuffer.set(locationId, entityDatabase);
    }
    _getChangingEntityDatabaseBuffer(runtimeId, locationId) {
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
world.beforeEvents.entityRemove.subscribe(({ removedEntity }) => {
    if (!databaseManager.autoUpdateSourceEntity())
        return;
    const removedEntityDatabaseList = databaseManager
        .getDatabaseListByGameObject(removedEntity)
        .filter((e) => e.getUid() === removedEntity.id);
    if (removedEntityDatabaseList.length <= 0)
        return;
    const removedEntityDatabase = removedEntityDatabaseList[0];
    const locationId = Utils.getLocationId(Object.assign(Object.assign({}, removedEntity.location), { dimension: removedEntity.dimension }), true);
    databaseManager._setChangingEntityDatabaseBuffer(UniqueIdUtils.RuntimeId, locationId, removedEntityDatabase);
    system.runTimeout(() => {
        databaseManager._getChangingEntityDatabaseBuffer(UniqueIdUtils.RuntimeId, locationId).cleanBuffer();
    }, 3);
});
world.afterEvents.entitySpawn.subscribe(({ entity, cause }) => {
    if (!databaseManager.autoUpdateSourceEntity())
        return;
    if (cause !== EntityInitializationCause.Event && cause !== EntityInitializationCause.Transformed)
        return;
    const locationId = Utils.getLocationId(Object.assign(Object.assign({}, entity.location), { dimension: entity.dimension }), true);
    // console.log('entity spawned: ', locationId)
    const { cleanBuffer, entityDatabase } = databaseManager._getChangingEntityDatabaseBuffer(UniqueIdUtils.RuntimeId, locationId);
    if (entityDatabase) {
        entityDatabase._setEntity(UniqueIdUtils.RuntimeId, entity);
        cleanBuffer();
    }
});
