var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Block, Entity, ItemStack, system, World, world } from "@minecraft/server";
import { NamespacedDatabaseManager } from "./NamespacedDatabaseManager";
import { UniqueIdUtils } from "../helper/UniqueIdUtils";
import { Utils } from "../helper/Utils";
import { SetMap } from "@tenolib/map";
export class DatabaseManager {
    constructor() {
        this._databaseManagerMap = new Map();
        this._isInitialized = false;
        this._whenReadyCallbackList = new Array();
        this._flushInterval = 3 * 6 * 20;
        this._blockToDatabaseMap = new SetMap();
        this._itemToDatabaseMap = new SetMap();
        this._entityToDatabaseMap = new SetMap();
        this._startFlushWhenPlayerLeaveTask();
        this._loadWorldDynamicPropertiesWhenWorldLoaded();
    }
    *_loadAndParseWorldDynamicPropertiesGenerator() {
        for (const id of world.getDynamicPropertyIds()) {
            const { namespace, lid, dataIdentifier } = Utils.parseIdentifier(id);
            if (!namespace)
                continue;
            const manager = this._getOrCreateNamespacedManager(namespace);
            if (lid) {
                manager._addBlockDataId(UniqueIdUtils.RuntimeId, lid, id, dataIdentifier);
            }
            else {
                manager._addWorldDataId(UniqueIdUtils.RuntimeId, id, dataIdentifier);
            }
            yield;
        }
    }
    _loadWorldDynamicProperties() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Utils.runJob(this._loadAndParseWorldDynamicPropertiesGenerator());
            this._isInitialized = true;
            this._startAutoFlushTask();
            this._doReady();
        });
    }
    _loadWorldDynamicPropertiesWhenWorldLoaded() {
        world.afterEvents.worldLoad.subscribe(() => {
            this._loadWorldDynamicProperties();
        });
    }
    _getOrCreateNamespacedManager(namespace) {
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
    _doReady() {
        this._whenReadyCallbackList.forEach(callback => callback());
        this._whenReadyCallbackList = [];
    }
    whenReady(callback) {
        if (this._isInitialized) {
            callback();
            return undefined;
        }
        this._whenReadyCallbackList.push(callback);
        return () => {
            this._whenReadyCallbackList.splice(this._whenReadyCallbackList.indexOf(callback), 1);
        };
    }
    isReady() {
        return this._isInitialized;
    }
    getOrCreate(namespace, gameObject) {
        const databaseManager = this._getOrCreateNamespacedManager(namespace);
        return databaseManager.getOrCreate(gameObject);
    }
    get(namespace, gameObject) {
        const databaseManager = this._getNamespacedManager(namespace);
        if (!databaseManager) {
            return undefined;
        }
        return databaseManager.get(gameObject);
    }
    setData(namespace, gameObject, identifier, value) {
        const database = this.getOrCreate(namespace, gameObject);
        database.set(identifier, value);
    }
    getData(namespace, gameObject, identifier) {
        const database = this.get(namespace, gameObject);
        return database === null || database === void 0 ? void 0 : database.get(identifier);
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
        else if (gameObject instanceof World) {
            return {
                uniqueId: 'world@0',
            };
        }
        else {
            throw new Error(`Invalid game object type.`);
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
    *flushDatabase(database) {
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
        // console.log(`flush ${database._getDirtyDataIdList(UniqueIdUtils.RuntimeId).length} data`);
        database._endFlush(UniqueIdUtils.RuntimeId);
    }
    flushDatabaseSync(database) {
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
        system.runJob(this.flushAllDataGenerator());
    }
    _startFlushWhenPlayerLeaveTask() {
        world.beforeEvents.playerLeave.subscribe(({ player }) => {
            if (world.getAllPlayers().length === 1) {
                this.flushSync();
            }
            else {
                for (const manager of this._databaseManagerMap.values()) {
                    this.flushDatabase(manager.getOrCreate(player));
                }
            }
        });
    }
    _startAutoFlushTask() {
        if (this._autoFlushTaskId) {
            system.clearRun(this._autoFlushTaskId);
        }
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
}
export const databaseManager = new DatabaseManager();
