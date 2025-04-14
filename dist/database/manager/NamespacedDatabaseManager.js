import { Block, Entity, ItemStack, world, World } from "@minecraft/server";
import { BlockDatabase, EntityDatabase, ItemStackDatabase, WorldDatabase } from "../impl";
import { UniqueIdUtils } from "../helper/UniqueIdUtils";
import { BetterSet, SetMap } from "@tenolib/map";
import { Utils } from "../helper/Utils";
import { DatabaseTypes } from "../DatabaseTypes";
export class NamespacedDatabaseManager {
    constructor(namespace, _parentManager) {
        this.namespace = namespace;
        this._parentManager = _parentManager;
        this._blockDatabaseMap = new Map();
        this._itemDatabaseMap = new Map();
        this._entityDatabaseMap = new Map();
        this._blockInitialIdListMap = new SetMap();
        this._worldInitialIdList = [];
        this._isFlushing = false;
        this._dirtyDatabaseList = new BetterSet();
        this._dirtyDatabaseBuffer = new BetterSet();
    }
    static _create(runtimeId, namespace, parentManager) {
        Utils.assertInvokedByTendrock(runtimeId);
        return new NamespacedDatabaseManager(namespace, parentManager);
    }
    _markDirty(runtimeId, dataBase) {
        Utils.assertInvokedByTendrock(runtimeId);
        const dirtyDatabases = this._isFlushing ? this._dirtyDatabaseBuffer : this._dirtyDatabaseList;
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
    _addBlockDataId(runtimeId, lid, propertyId, dataId) {
        Utils.assertInvokedByTendrock(runtimeId);
        this._blockInitialIdListMap.addValue(lid, [propertyId, dataId]);
    }
    _addWorldDataId(runtimeId, propertyId, dataId) {
        Utils.assertInvokedByTendrock(runtimeId);
        if (!this._worldInitialIdList) {
            throw new Error("World data id list is used and frozen.");
        }
        this._worldInitialIdList.push([propertyId, dataId]);
    }
    _prepare(gameObject) {
        if (gameObject instanceof Block) {
            const uniqueId = UniqueIdUtils.getBlockUniqueId(gameObject);
            const databaseMap = this._blockDatabaseMap;
            const databaseType = BlockDatabase;
            const gameObjectToDatabaseMap = this._parentManager._getBlockToDatabaseMap(UniqueIdUtils.RuntimeId);
            const initialIdList = this._blockInitialIdListMap.get(uniqueId);
            this._blockInitialIdListMap.delete(uniqueId);
            return { uniqueId, databaseMap, databaseType, gameObjectToDatabaseMap, initialIdList };
        }
        else if (gameObject instanceof Entity) {
            const uniqueId = UniqueIdUtils.getEntityUniqueId(gameObject);
            const databaseMap = this._entityDatabaseMap;
            const databaseType = EntityDatabase;
            const gameObjectToDatabaseMap = this._parentManager._getEntityToDatabaseMap(UniqueIdUtils.RuntimeId);
            return { uniqueId, databaseMap, gameObjectToDatabaseMap, databaseType };
        }
        else if (gameObject instanceof ItemStack) {
            const uniqueId = UniqueIdUtils.getItemUniqueId(gameObject);
            const databaseMap = this._itemDatabaseMap;
            const databaseType = ItemStackDatabase;
            const gameObjectToDatabaseMap = this._parentManager._getItemToDatabaseMap(UniqueIdUtils.RuntimeId);
            return { uniqueId, databaseMap, gameObjectToDatabaseMap, databaseType };
        }
        else if (gameObject instanceof World) {
            const databaseType = WorldDatabase;
            const initialIdList = this._worldInitialIdList;
            this._worldInitialIdList = undefined;
            return { uniqueId: undefined, databaseMap: undefined, databaseType, initialIdList };
        }
        else {
            throw new Error(`Invalid game object type.`);
        }
    }
    getOrCreate(gameObject) {
        const { uniqueId, databaseMap, databaseType, gameObjectToDatabaseMap, initialIdList } = this._prepare(gameObject);
        // Is world database
        if (!uniqueId || !databaseMap || !gameObjectToDatabaseMap) {
            if (this._worldDatabase) {
                return this._worldDatabase;
            }
            this._worldDatabase = WorldDatabase.create(this.namespace, this, world, initialIdList);
            return this._worldDatabase;
        }
        let database = databaseMap.get(uniqueId);
        if (database) {
            return database;
        }
        database = databaseType.create(this.namespace, this, gameObject, initialIdList);
        databaseMap.set(uniqueId, database);
        gameObjectToDatabaseMap.addValue(uniqueId, database);
        return database;
    }
    get(gameObject) {
        const { uniqueId, databaseMap } = this._prepare(gameObject);
        if (!uniqueId || !databaseMap) {
            return undefined;
        }
        return databaseMap.get(uniqueId);
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
    remove(gameObject, clearData = false) {
        const { uniqueId, databaseMap, gameObjectToDatabaseMap } = this._prepare(gameObject);
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
    _addDatabase(runtimeId, database) {
        Utils.assertInvokedByTendrock(runtimeId);
        const { uniqueId, databaseMap, gameObjectToDatabaseMap } = this._prepare(database.getGameObject());
        if (!databaseMap || !gameObjectToDatabaseMap || !uniqueId) {
            return;
        }
        if (databaseMap.has(uniqueId)) {
            return;
        }
        databaseMap.set(uniqueId, database);
        gameObjectToDatabaseMap.addValue(uniqueId, database);
    }
    _beginFlush(runtimeId) {
        Utils.assertInvokedByTendrock(runtimeId);
        this._isFlushing = true;
    }
    _endFlush(runtimeId) {
        Utils.assertInvokedByTendrock(runtimeId);
        this._dirtyDatabaseList = this._dirtyDatabaseBuffer;
        this._isFlushing = false;
        this._dirtyDatabaseBuffer = new BetterSet();
    }
    getDirtyDatabaseList() {
        return this._dirtyDatabaseList;
    }
}
