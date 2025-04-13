import { NamespacedDynamicProperty } from "./NamespacedDynamicProperty";
import { UniqueIdUtils } from "./helper/UniqueIdUtils";
export class GameObjectDatabase {
    constructor(namespace, manager) {
        this.namespace = namespace;
        this.manager = manager;
        this._dataMap = new Map();
        this._dirtyDataIdList = [];
        this._dirtyDataIdBuffer = [];
        this._isFlushing = false;
        this._uid = '';
        this._dynamicProperty = NamespacedDynamicProperty.create(namespace);
    }
    _markDirty(identifier) {
        const dirtyIdList = this.isFlushing() ? this._dirtyDataIdBuffer : this._dirtyDataIdList;
        if (!dirtyIdList.includes(identifier)) {
            dirtyIdList.push(identifier);
        }
        this.manager._markDirty(UniqueIdUtils.RuntimeId, this);
    }
    getUid() {
        return this._uid;
    }
    set(identifier, value) {
        this._dataMap.set(identifier, value);
        this._markDirty(identifier);
    }
    get(identifier) {
        return this._dataMap.get(identifier);
    }
    delete(identifier) {
        this._dataMap.delete(identifier);
        this._markDirty(identifier);
    }
    forEach(callback) {
        this._dataMap.forEach((value, key) => callback(key, value));
    }
    size() {
        return this._dataMap.size;
    }
    entries() {
        return this._dataMap.entries();
    }
    keys() {
        return this._dataMap.keys();
    }
    values() {
        return this._dataMap.values();
    }
    isFlushing() {
        return this._isFlushing;
    }
    clear() {
        const dataIdList = Array.from(this._dataMap.keys());
        this._dataMap.clear();
        this._dirtyDataIdList = [];
        this._dirtyDataIdBuffer = [];
        dataIdList.forEach((identifier) => {
            this._saveData(UniqueIdUtils.RuntimeId, identifier, undefined);
        });
    }
    _assertInvokedByTendrock(runtimeId) {
        if (runtimeId !== UniqueIdUtils.RuntimeId) {
            throw new Error("This method can not be invoked manually!");
        }
    }
    _beginFlush(runtimeId) {
        this._assertInvokedByTendrock(runtimeId);
        this._isFlushing = true;
    }
    _endFlush(runtimeId) {
        this._assertInvokedByTendrock(runtimeId);
        this._dirtyDataIdList = this._dirtyDataIdBuffer;
        this._isFlushing = false;
        this._dirtyDataIdBuffer = [];
    }
    _getDirtyDataIdList(runtimeId) {
        this._assertInvokedByTendrock(runtimeId);
        return this._dirtyDataIdList;
    }
}
