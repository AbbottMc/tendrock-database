import {DynamicPropertySerializer, TendrockDynamicPropertyValue} from "./DynamicPropertySerializer";
import {Block, Entity, ItemStack, World} from "@minecraft/server";
import {UniqueIdUtils} from "./helper/UniqueIdUtils";
import {Constructor, DatabaseManager} from "./manager";
import {Utils} from "./helper/Utils";
import {InstanceData} from "./instance";

export abstract class GameObjectDatabase<GO extends (Block | ItemStack | Entity | World)> {
  protected _dynamicProperty: DynamicPropertySerializer;
  protected _dataMap: Map<string, TendrockDynamicPropertyValue> = new Map<string, TendrockDynamicPropertyValue>();
  protected _dirtyDataIdList: string[] = [];
  protected _dirtyDataIdBuffer: string[] = [];
  protected _isFlushing = false;
  protected _uid: string = '';

  protected constructor(public readonly parentManager: DatabaseManager) {
    this._dynamicProperty = DynamicPropertySerializer.Instance;
  }

  public abstract getGameObject(): GO;

  public abstract _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue): void;

  protected _markDirty(identifier: string) {
    const dirtyIdList = this.isFlushing() ? this._dirtyDataIdBuffer : this._dirtyDataIdList;
    if (!dirtyIdList.includes(identifier)) {
      dirtyIdList.push(identifier);
    }
    this.parentManager._markDirty(UniqueIdUtils.RuntimeId, this);
  }

  public getUid() {
    return this._uid;
  }

  public set(identifier: string, value: TendrockDynamicPropertyValue) {
    this._dataMap.set(identifier, value);
    this._markDirty(identifier);
  }

  public get(identifier: string): TendrockDynamicPropertyValue {
    return this._dataMap.get(identifier);
  }

  protected _canSetAsInstance(obj: any): obj is TendrockDynamicPropertyValue {
    return obj.toJSON !== undefined;
  }

  protected getInstanceImpl<T extends InstanceData<any>>(identifier: string, objectConstructor: Constructor<T>, createIfAbsent: boolean, options?: (Parameters<T['onConstruct']>[0])): T | undefined {
    const retObj = this.get(identifier);
    if (!createIfAbsent && !retObj) return undefined;
    if (retObj instanceof objectConstructor) {
      return retObj;
    }
    const ret = new objectConstructor(retObj, {database: this, identifier, uniqueId: this.getUid()}, options);
    // console.log(JSON.stringify(retObj));
    // console.log(JSON.stringify(ret));
    if (!this._canSetAsInstance(ret)) {
      throw new Error(`Cannot set instance of ${objectConstructor.name} into ${this.constructor.name} because it doesnt have "toJSON" method.`);
    }
    this.set(identifier, ret);
    return ret;
  }

  public createInstanceIfAbsent<T extends InstanceData<any>>(identifier: string, objectConstructor: Constructor<T>, options?: (Parameters<T['onConstruct']>[0])): T {
    return this.getInstanceImpl(identifier, objectConstructor, true, options)!;
  }

  public buildInstanceIfPresent<T extends InstanceData<any>>(identifier: string, objectConstructor: Constructor<T>, options?: (Parameters<T['onConstruct']>[0])): T | undefined {
    return this.getInstanceImpl(identifier, objectConstructor, false, options);
  }

  public getBuiltInstance<T>(identifier: string): T | undefined {
    const retObj = this.get(identifier);
    if (!retObj || typeof retObj !== 'object') return undefined;
    if (retObj.constructor.name === 'Object') {
      return undefined;
    }
    return retObj as T;
  }

  public delete(identifier: string) {
    const existAndDeleted = this._dataMap.delete(identifier);
    this._markDirty(identifier);
    return existAndDeleted;
  }

  public forEach(callback: (identifier: string, value: TendrockDynamicPropertyValue) => void) {
    this._dataMap.forEach((value, key) => callback(key, value));
  }

  public size() {
    return this._dataMap.size;
  }

  public entries(): IterableIterator<[string, TendrockDynamicPropertyValue]> {
    return this._dataMap.entries();
  }

  public keys(): IterableIterator<string> {
    return this._dataMap.keys();
  }

  public values(): IterableIterator<TendrockDynamicPropertyValue> {
    return this._dataMap.values();
  }

  public isFlushing() {
    return this._isFlushing;
  }

  public clear() {
    const dataIdList = Array.from(this._dataMap.keys());
    this._dataMap.clear();
    this._dirtyDataIdList = [];
    this._dirtyDataIdBuffer = [];
    this.clearDynamicProperties(dataIdList);
  }

  public clearDynamicProperties(dataIdList?: string[]) {
    (dataIdList ?? Array.from(this._dataMap.keys())).forEach((identifier) => {
      this._saveData(UniqueIdUtils.RuntimeId, identifier, undefined);
    });
  }

  protected _onFlushFinished() {
  }

  public _beginFlush(runtimeId: string) {
    Utils.assertInvokedByTendrock(runtimeId);
    this._isFlushing = true;
  }

  public _endFlush(runtimeId: string) {
    Utils.assertInvokedByTendrock(runtimeId);
    this._dirtyDataIdList = this._dirtyDataIdBuffer;
    this._isFlushing = false;
    this._dirtyDataIdBuffer = [];
    this._onFlushFinished();
  }

  public _getDirtyDataIdList(runtimeId: string) {
    Utils.assertInvokedByTendrock(runtimeId);
    return this._dirtyDataIdList;
  }

  public _getAllDirtyDataIdList(runtimeId: string) {
    Utils.assertInvokedByTendrock(runtimeId);
    return this._dirtyDataIdList.concat(this._dirtyDataIdBuffer);
  }
}