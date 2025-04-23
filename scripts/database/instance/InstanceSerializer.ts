import {TendrockDynamicPropertyValue} from "../DynamicPropertySerializer";

export class InstanceSerializer {
  private _map: Map<string, TendrockDynamicPropertyValue> = new Map<string, TendrockDynamicPropertyValue>();

  public put(identifier: string, value: TendrockDynamicPropertyValue) {
    this._map.set(identifier, value);
    return this;
  }

  public delete(identifier: string) {
    this._map.delete(identifier);
    return this;
  }

  public get(identifier: string) {
    return this._map.get(identifier);
  }

  public toJSON() {
    return Object.fromEntries(this._map.entries());
  }
}