import {NamespacedDynamicProperty, TendrockDynamicPropertyValue} from "./NamespacedDynamicProperty";
import {Block, Entity, ItemStack, World} from "@minecraft/server";
import {UniqueIdUtils} from "./helper/UniqueIdUtils";
import {Constructor, NamespacedDatabaseManager} from "./manager";
import {Utils} from "./helper/Utils";

export abstract class GameObjectDatabase<GO extends (Block | ItemStack | Entity | World)> {
  protected _dynamicProperty: NamespacedDynamicProperty;
  protected _dataMap: Map<string, TendrockDynamicPropertyValue> = new Map<string, TendrockDynamicPropertyValue>();
  protected _dirtyDataIdList: string[] = [];
  protected _dirtyDataIdBuffer: string[] = [];
  protected _isFlushing = false;
  protected _uid: string = '';

  protected constructor(public readonly namespace: string, public readonly parentManager: NamespacedDatabaseManager) {
    this._dynamicProperty = NamespacedDynamicProperty.create(namespace);
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


  protected getInstanceImpl<T>(identifier: string, objectConstructor: Constructor<T>, createIfAbsent: boolean, options?: unknown): T | undefined {
    const retObj = this.get(identifier);
    if (!createIfAbsent && !retObj) return undefined;
    if (retObj instanceof objectConstructor) {
      return retObj;
    }
    const ret = new objectConstructor(retObj, options);
    if (!this._canSetAsInstance(ret)) {
      throw new Error(`Cannot set instance of ${objectConstructor.name} into ${this.constructor.name} because it doesnt have "toJSON" method.`);
    }
    this.set(identifier, ret);
    return ret;
  }

  public getInstanceOrCreate<T>(identifier: string, objectConstructor: Constructor<T>, options?: unknown): T {
    return this.getInstanceImpl(identifier, objectConstructor, true, options)!;
  }

  public getInstance<T>(identifier: string, objectConstructor: Constructor<T>, options?: unknown): T | undefined {
    return this.getInstanceImpl(identifier, objectConstructor, false, options);
  }

  public delete(identifier: string) {
    this._dataMap.delete(identifier);
    this._markDirty(identifier);
  }

  public forEach(callback: (identifier: string, value: TendrockDynamicPropertyValue) => void) {
    this._dataMap.forEach((value, key) => callback(key, value));
  }

  public size() {
    return this._dataMap.size;
  }

  public entries() {
    return this._dataMap.entries();
  }

  public keys() {
    return this._dataMap.keys();
  }

  public values() {
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
}