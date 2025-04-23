var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Block, Entity, EntityInitializationCause, ItemStack, system, world, World } from "@minecraft/server";
import { BlockDatabase, EntityDatabase, ItemStackDatabase, WorldDatabase } from "../impl";
import { UniqueIdUtils } from "../helper/UniqueIdUtils";
import { BetterSet, SetMap } from "@tenolib/map";
import { Utils } from "../helper/Utils";
import { DatabaseTypes } from "../DatabaseTypes";
import { ConstructorRegistryImpl } from "../instance/ConstructorRegistry";
import { LocationUtils } from "@tendrock/location-id";
import { DynamicPropertySerializer } from "../DynamicPropertySerializer";
export class DatabaseManager {
    constructor() {
        this._databaseManagerMap = new Map();
        this._eventCallbackMap = new SetMap();
        this._changingEntityDatabaseBuffer = new Map();
        this._isInitialized = false;
        this._flushInterval = 3 * 60 * 20;
        this._autoUpdateSourceEntity = true;
        this._autoFlush = true;
        this._blockDatabaseMap = new Map();
        this._itemDatabaseMap = new Map();
        this._entityDatabaseMap = new Map();
        this._blockInitialIdListMap = new SetMap();
        this._worldInitialIdList = [];
        this._isFlushing = false;
        this._dirtyDatabaseList = new BetterSet();
        this._dirtyDatabaseBuffer = new BetterSet();
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
            const { lid, dataIdentifier } = DynamicPropertySerializer.Instance.deserializePropertyId(id);
            if (lid) {
                this._addBlockDataId(lid, id, dataIdentifier);
            }
            else {
                this._addWorldDataId(id, dataIdentifier);
            }
            yield;
        }
    }
    _loadWorldDynamicProperties() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Utils.runJob(this._loadAndParseWorldDynamicPropertiesGenerator());
            yield Utils.runJob(this._initWorldBlockDataGenerator());
            this._startAutoFlushTask();
            this._isInitialized = true;
            this._doReady();
        });
    }
    _loadWorldDynamicPropertiesWhenWorldLoad() {
        const callback = world.afterEvents.worldLoad.subscribe(() => {
            this._loadWorldDynamicProperties().then(() => world.afterEvents.worldLoad.unsubscribe(callback));
        });
    }
    _addBlockDataId(lid, propertyId, dataId) {
        this._blockInitialIdListMap.addValue(lid, [propertyId, dataId]);
    }
    _addWorldDataId(propertyId, dataId) {
        if (!this._worldInitialIdList) {
            throw new Error("World data id list is used and frozen.");
        }
        this._worldInitialIdList.push([propertyId, dataId]);
    }
    *_initWorldDataGenerator() {
        if (this._worldInitialIdList) {
            this._worldDatabase = WorldDatabase.create(this, world, this._worldInitialIdList);
            this._worldInitialIdList = undefined;
            yield;
        }
    }
    *_initBlockDataGenerator() {
        if (this._blockInitialIdListMap.size > 0) {
            for (const [lid, set] of this._blockInitialIdListMap) {
                const blockDatabase = BlockDatabase.create(this, lid, set);
                this._blockDatabaseMap.set(lid, blockDatabase);
                yield;
            }
            this._blockInitialIdListMap.clear();
        }
    }
    *_initWorldBlockDataGenerator() {
        yield* this._initWorldDataGenerator();
        yield* this._initBlockDataGenerator();
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
    _markDirty(runtimeId, dataBase) {
        Utils.assertInvokedByTendrock(runtimeId);
        const dirtyDatabases = this._isFlushing ? this._dirtyDatabaseBuffer : this._dirtyDatabaseList;
        // console.log('dirty database list before mark dirty: ', JSON.stringify(dirtyDatabases.map(db => db.getUid())));
        if (dirtyDatabases.includes(dataBase)) {
            return;
        }
        const uniqueId = dataBase.getUid();
        // If database is removed or not exist, skip.
        if (!this._blockDatabaseMap.has(uniqueId) && !this._entityDatabaseMap.has(uniqueId) &&
            !this._itemDatabaseMap.has(uniqueId) && this._worldDatabase !== dataBase) {
            return;
        }
        dirtyDatabases.push(dataBase);
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
    *_flushDatabase(database) {
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
    *_flushDataGenerator() {
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
    _flushDatabaseSync(database, flushAllDirtyData) {
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
    _flushSyncImpl(includeBuffer = false) {
        if (!this.isReady())
            return;
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
    flushSync() {
        this._flushSyncImpl(false);
    }
    _flushWhenShutdown() {
        this._flushSyncImpl(true);
    }
    flush() {
        if (!this.isReady())
            return;
        system.runJob(this._flushDataGenerator());
    }
    _flushDataWhenPlayerLeave() {
        world.beforeEvents.playerLeave.subscribe(({ player }) => {
            if (world.getAllPlayers().length === 1) {
                this._flushWhenShutdown();
            }
            else {
                this._flushDatabase(this.get(player));
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
    _beginFlush() {
        this._isFlushing = true;
    }
    _endFlush(allDirtyDataFlushed = false) {
        if (allDirtyDataFlushed) {
            this._dirtyDatabaseList = new BetterSet();
            this._dirtyDatabaseBuffer = new BetterSet();
            this._isFlushing = false;
        }
        else {
            this._dirtyDatabaseList = this._dirtyDatabaseBuffer;
            this._isFlushing = false;
            this._dirtyDatabaseBuffer = new BetterSet();
        }
    }
    // ---------------------------------------------------------
    _prepare(gameObject) {
        if (typeof gameObject === 'string' || gameObject instanceof Block) {
            const uniqueId = UniqueIdUtils.getBlockUniqueId(gameObject);
            const databaseMap = this._blockDatabaseMap;
            const databaseType = BlockDatabase;
            return { uniqueId, databaseMap, databaseType };
        }
        else if (gameObject instanceof Entity) {
            const uniqueId = UniqueIdUtils.getEntityUniqueId(gameObject);
            const databaseMap = this._entityDatabaseMap;
            const databaseType = EntityDatabase;
            return { uniqueId, databaseMap, databaseType };
        }
        else if (gameObject instanceof ItemStack) {
            const uniqueId = UniqueIdUtils.getItemUniqueId(gameObject);
            const databaseMap = this._itemDatabaseMap;
            const databaseType = ItemStackDatabase;
            return { uniqueId, databaseMap, databaseType };
        }
        else if (gameObject instanceof World) {
            const databaseType = WorldDatabase;
            return { uniqueId: undefined, databaseMap: undefined, databaseType };
        }
        else {
            throw new Error(`Invalid game object type.`);
        }
    }
    createIfAbsent(gameObject) {
        const { uniqueId, databaseMap, databaseType } = this._prepare(gameObject);
        // Is world database
        if (!uniqueId || !databaseMap) {
            if (this._worldDatabase) {
                return this._worldDatabase;
            }
            this._worldDatabase = WorldDatabase.create(this, world);
            this._worldInitialIdList = undefined;
            return this._worldDatabase;
        }
        let database = databaseMap.get(uniqueId);
        if (database) {
            return database;
        }
        database = databaseType.create(this, gameObject);
        databaseMap.set(uniqueId, database);
        return database;
    }
    get(gameObject) {
        const { uniqueId, databaseMap } = this._prepare(gameObject);
        if (!uniqueId || !databaseMap) {
            return undefined;
        }
        return databaseMap.get(uniqueId);
    }
    remove(gameObject, clearProperty = false) {
        const { uniqueId, databaseMap } = this._prepare(gameObject);
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
    getDatabaseList(type) {
        if (type === DatabaseTypes.World) {
            return [this._worldDatabase];
        }
        else if (type === DatabaseTypes.Block) {
            return Array.from(this._blockDatabaseMap.values());
        }
        else if (type === DatabaseTypes.Item) {
            return Array.from(this._itemDatabaseMap.values());
        }
        else if (type === DatabaseTypes.Entity) {
            return Array.from(this._entityDatabaseMap.values());
        }
        else {
            throw new Error(`Invalid database type.`);
        }
    }
    getWorldDatabase() {
        return this._worldDatabase;
    }
    _addDatabase(runtimeId, database) {
        Utils.assertInvokedByTendrock(runtimeId);
        const { uniqueId, databaseMap } = this._prepare(database.getGameObject());
        if (!databaseMap || !uniqueId) {
            return;
        }
        if (databaseMap.has(uniqueId)) {
            return;
        }
        databaseMap.set(uniqueId, database);
    }
    setData(gameObject, identifier, value) {
        this.createIfAbsent(gameObject).set(identifier, value);
    }
    getData(gameObject, identifier) {
        var _a;
        return (_a = this.get(gameObject)) === null || _a === void 0 ? void 0 : _a.get(identifier);
    }
    deleteData(gameObject, identifier) {
        const database = this.get(gameObject);
        if (!database)
            return false;
        return database.delete(identifier);
    }
    buildDataInstanceIfPresent(gameObject, identifier, objectConstructor, options) {
        const database = this.get(gameObject);
        return database === null || database === void 0 ? void 0 : database.buildInstanceIfPresent(identifier, objectConstructor, options);
    }
    getBuiltDataInstance(gameObject, identifier) {
        const database = this.get(gameObject);
        return database === null || database === void 0 ? void 0 : database.getBuiltInstance(identifier);
    }
    createDataInstanceIfAbsent(gameObject, identifier, objectConstructor, options) {
        const database = this.createIfAbsent(gameObject);
        return database.createInstanceIfAbsent(identifier, objectConstructor, options);
    }
    getDirtyDatabaseList() {
        return this._dirtyDatabaseList;
    }
    getAllDirtyDatabaseList() {
        return this._dirtyDatabaseList.concat(this._dirtyDatabaseBuffer);
    }
    // --------------------------------------------------------
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
DatabaseManager.Instance = new DatabaseManager();
export const databaseManager = DatabaseManager.Instance;
world.beforeEvents.entityRemove.subscribe(({ removedEntity }) => {
    if (!databaseManager.autoUpdateSourceEntity())
        return;
    const removedEntityDatabase = databaseManager.get(removedEntity);
    if (!removedEntityDatabase)
        return;
    const locationId = LocationUtils.getLocationId(Object.assign(Object.assign({}, removedEntity.location), { dimension: removedEntity.dimension }), true);
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
    const locationId = LocationUtils.getLocationId(Object.assign(Object.assign({}, entity.location), { dimension: entity.dimension }), true);
    // console.log('entity spawned: ', locationId)
    const { cleanBuffer, entityDatabase } = databaseManager._getChangingEntityDatabaseBuffer(UniqueIdUtils.RuntimeId, locationId);
    if (entityDatabase) {
        entityDatabase._setEntity(UniqueIdUtils.RuntimeId, entity);
        cleanBuffer();
    }
});
