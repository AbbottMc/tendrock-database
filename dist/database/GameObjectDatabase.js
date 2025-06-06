import { DynamicPropertySerializer } from "./DynamicPropertySerializer";
import { UniqueIdUtils } from "./helper/UniqueIdUtils";
import { Utils } from "./helper/Utils";
export class GameObjectDatabase {
    constructor(parentManager) {
        this.parentManager = parentManager;
        this._dataMap = new Map();
        this._dirtyDataIdList = [];
        this._dirtyDataIdBuffer = [];
        this._isFlushing = false;
        this._uid = '';
        this._dynamicProperty = DynamicPropertySerializer.Instance;
    }
    _markDirty(identifier) {
        const dirtyIdList = this.isFlushing() ? this._dirtyDataIdBuffer : this._dirtyDataIdList;
        if (!dirtyIdList.includes(identifier)) {
            dirtyIdList.push(identifier);
        }
        this.parentManager._markDirty(UniqueIdUtils.RuntimeId, this);
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
    _canSetAsInstance(obj) {
        return obj.toJSON !== undefined;
    }
    getInstanceImpl(identifier, objectConstructor, createIfAbsent, options) {
        const retObj = this.get(identifier);
        if (!createIfAbsent && !retObj)
            return undefined;
        if (retObj instanceof objectConstructor) {
            return retObj;
        }
        const ret = new objectConstructor(retObj, { database: this, identifier, uniqueId: this.getUid() }, options);
        // console.log(JSON.stringify(retObj));
        // console.log(JSON.stringify(ret));
        if (!this._canSetAsInstance(ret)) {
            throw new Error(`Cannot set instance of ${objectConstructor.name} into ${this.constructor.name} because it doesnt have "toJSON" method.`);
        }
        this.set(identifier, ret);
        return ret;
    }
    createInstanceIfAbsent(identifier, objectConstructor, options) {
        return this.getInstanceImpl(identifier, objectConstructor, true, options);
    }
    buildInstanceIfPresent(identifier, objectConstructor, options) {
        return this.getInstanceImpl(identifier, objectConstructor, false, options);
    }
    getBuiltInstance(identifier) {
        const retObj = this.get(identifier);
        if (!retObj || typeof retObj !== 'object')
            return undefined;
        if (retObj.constructor.name === 'Object') {
            return undefined;
        }
        return retObj;
    }
    delete(identifier) {
        const existAndDeleted = this._dataMap.delete(identifier);
        this._markDirty(identifier);
        return existAndDeleted;
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
        this.clearDynamicProperties(dataIdList);
    }
    clearDynamicProperties(dataIdList) {
        (dataIdList !== null && dataIdList !== void 0 ? dataIdList : Array.from(this._dataMap.keys())).forEach((identifier) => {
            this._saveData(UniqueIdUtils.RuntimeId, identifier, undefined);
        });
    }
    _onFlushFinished() {
    }
    _beginFlush(runtimeId) {
        Utils.assertInvokedByTendrock(runtimeId);
        this._isFlushing = true;
    }
    _endFlush(runtimeId) {
        Utils.assertInvokedByTendrock(runtimeId);
        this._dirtyDataIdList = this._dirtyDataIdBuffer;
        this._isFlushing = false;
        this._dirtyDataIdBuffer = [];
        this._onFlushFinished();
    }
    _getDirtyDataIdList(runtimeId) {
        Utils.assertInvokedByTendrock(runtimeId);
        return this._dirtyDataIdList;
    }
    _getAllDirtyDataIdList(runtimeId) {
        Utils.assertInvokedByTendrock(runtimeId);
        return this._dirtyDataIdList.concat(this._dirtyDataIdBuffer);
    }
}
