import {NamespacedDynamicProperty, TendrockDynamicPropertyValue} from "./NamespacedDynamicProperty";
import {DimensionLocation, Entity, ItemStack, World} from "@minecraft/server";
import {UniqueIdUtils} from "./helper/UniqueIdUtils";

export abstract class GameObjectDatabase<GO extends (DimensionLocation | ItemStack | Entity | World)> {
  protected _dynamicProperty: NamespacedDynamicProperty;
  protected _dataMap: Map<string, TendrockDynamicPropertyValue> = new Map<string, TendrockDynamicPropertyValue>();
  protected _dirtyDataIdList: string[] = [];
  protected _dirtyDataIdBuffer: string[] = [];
  protected _isFlushing = false;

  protected constructor(public readonly namespace: string) {
    this._dynamicProperty = NamespacedDynamicProperty.create(namespace);
  }

  public abstract getGameObject(): GO;

  public _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue): void {
    this._assertInvokedByTendrock(runtimeId);
  }

  protected _markDirty(identifier: string) {
    const dirtyIdList = this.isFlushing() ? this._dirtyDataIdBuffer : this._dirtyDataIdList;
    if (!dirtyIdList.includes(identifier)) {
      dirtyIdList.push(identifier);
    }
  }

  public set(identifier: string, value: TendrockDynamicPropertyValue) {
    this._dataMap.set(identifier, value);
    this._markDirty(identifier);
  }

  public get(identifier: string): TendrockDynamicPropertyValue {
    return this._dataMap.get(identifier);
  }

  public delete(identifier: string) {
    this._dataMap.delete(identifier);
    this._markDirty(identifier);
  }

  public forEach(callback: (identifier: string, value: TendrockDynamicPropertyValue) => void) {
    this._dataMap.forEach(callback);
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
    if (this.isFlushing()) {
      this._dirtyDataIdBuffer = Array.from(this._dataMap.keys());
      this._dirtyDataIdList = [];
    } else {
      this._dirtyDataIdList = Array.from(this._dataMap.keys());
      this._dirtyDataIdBuffer = [];
    }
    this._dataMap.clear();
  }

  protected _assertInvokedByTendrock(runtimeId: string) {
    if (runtimeId !== UniqueIdUtils.RuntimeId) {
      throw new Error("This method can not be invoked manually!");
    }
  }

  public _beginFlush(runtimeId: string) {
    this._assertInvokedByTendrock(runtimeId);
    this._isFlushing = true;
  }

  public _endFlush(runtimeId: string) {
    this._assertInvokedByTendrock(runtimeId);
    this._dirtyDataIdList = this._dirtyDataIdBuffer;
    this._isFlushing = false;
    this._dirtyDataIdBuffer = [];
  }

  public _getDirtyDataIdList(runtimeId: string) {
    this._assertInvokedByTendrock(runtimeId);
    return this._dirtyDataIdList;
  }
}