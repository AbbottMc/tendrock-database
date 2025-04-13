import { Block, Entity, ItemStack, world, World } from "@minecraft/server";
import { BlockDatabase, EntityDatabase, ItemStackDatabase, WorldDatabase } from "../impl";
import { UniqueIdUtils } from "../helper/UniqueIdUtils";
export class NamespacedDatabaseManager {
    constructor(namespace) {
        this.namespace = namespace;
        this._blockDatabaseMap = new Map();
        this._itemDatabaseMap = new Map();
        this._entityDatabaseMap = new Map();
        this._blockInitialIdListMap = new Map();
        this._worldInitialIdList = [];
        this._isFlushing = false;
        this._dirtyDatabaseList = [];
        this._dirtyDatabaseBuffer = [];
    }
    static create(namespace) {
        return new NamespacedDatabaseManager(namespace);
    }
    _assertInvokedByTendrock(runtimeId) {
        if (runtimeId !== UniqueIdUtils.RuntimeId) {
            throw new Error("This method can not be invoked manually!");
        }
    }
    _markDirty(runtimeId, dataBase) {
        this._assertInvokedByTendrock(runtimeId);
        const dirtyDatabases = this._isFlushing ? this._dirtyDatabaseBuffer : this._dirtyDatabaseList;
        if (!dirtyDatabases.includes(dataBase)) {
            dirtyDatabases.push(dataBase);
        }
    }
    _addBlockDataId(runtimeId, lid, propertyId, dataId) {
        var _a;
        this._assertInvokedByTendrock(runtimeId);
        const dataIdList = (_a = this._blockInitialIdListMap.get(lid)) !== null && _a !== void 0 ? _a : [];
        dataIdList.push([propertyId, dataId]);
        this._blockInitialIdListMap.set(lid, dataIdList);
    }
    _addWorldDataId(runtimeId, propertyId, dataId) {
        this._assertInvokedByTendrock(runtimeId);
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
            const initialIdList = this._blockInitialIdListMap.get(uniqueId);
            this._blockInitialIdListMap.delete(uniqueId);
            return { uniqueId, databaseMap, databaseType, initialIdList };
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
            const initialIdList = this._worldInitialIdList;
            this._worldInitialIdList = undefined;
            return { uniqueId: undefined, databaseMap: undefined, databaseType, initialIdList };
        }
        else {
            throw new Error(`Invalid game object type.`);
        }
    }
    getOrCreate(gameObject) {
        const { uniqueId, databaseMap, databaseType, initialIdList } = this._prepare(gameObject);
        if (!uniqueId || !databaseMap) {
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
        return database;
    }
    remove(gameObject, clearData = false) {
        const { uniqueId, databaseMap } = this._prepare(gameObject);
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
    _beginFlush(runtimeId) {
        this._assertInvokedByTendrock(runtimeId);
        this._isFlushing = true;
    }
    _endFlush(runtimeId) {
        this._assertInvokedByTendrock(runtimeId);
        this._dirtyDatabaseList = this._dirtyDatabaseBuffer;
        this._isFlushing = false;
        this._dirtyDatabaseBuffer = [];
    }
    getDirtyDatabaseList() {
        return this._dirtyDatabaseList;
    }
}
