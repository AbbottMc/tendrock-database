import {Block, Entity, ItemStack, Vector3, world} from "@minecraft/server";
import {Utils} from "./helper/Utils";

export type DynamicPropertyValue = boolean | number | string | Vector3;
export type DynamicPropertyObjectValue = { [key: string]: DynamicPropertyValue | DynamicPropertyObjectValue }
export type TendrockDynamicPropertyValue = DynamicPropertyValue | DynamicPropertyObjectValue;

export class NamespacedDynamicProperty {
  constructor(readonly namespace: string) {
    if (namespace.includes('-')) {
      throw new Error(`Invalid namespace: ${namespace}`);
    }
  }

  protected static _dbMap: Map<string, NamespacedDynamicProperty> = new Map<string, NamespacedDynamicProperty>();

  public static create(namespace: string) {
    const db = this._dbMap.get(namespace) ?? new NamespacedDynamicProperty(namespace);
    this._dbMap.set(namespace, db);
    return db;
  }

  public getDataIdentifier(identifier: string) {
    if (identifier.includes('-')) {
      throw new Error(`Invalid identifier: "${identifier}"`);
    }
    return `${this.namespace}-${identifier}`;
  }

  public getBlockDataIdentifier(block: Block | string, identifier: string) {
    if (identifier.includes('-')) {
      throw new Error(`Invalid identifier: "${identifier}"`);
    }
    return `${this.namespace}-${typeof block === 'string' ? block : Utils.getLocationId(block)}-${identifier}`;
  }

  public extractDataIdentifier(dataIdentifier: string) {
    return dataIdentifier.split('-')[1];
  }

  public extractBlockDataIdentifier(block: Block | string, dataIdentifier: string) {
    if (!dataIdentifier.includes('-')) {
      return dataIdentifier;
    }
    if (!dataIdentifier.startsWith(this.namespace)) {
      return dataIdentifier;
    }
    const lid = typeof block === 'string' ? block : Utils.getLocationId(block);
    const blockDataIdentifier = this.extractDataIdentifier(dataIdentifier);
    return blockDataIdentifier.startsWith(lid) ? blockDataIdentifier.substring(lid.length + 2) : blockDataIdentifier;
  }

  public validateDataIdentifier(identifier: string) {
    return identifier.startsWith(this.namespace + '-');
  }

  public validateBlockDataIdentifier(identifier: string) {
    return identifier.startsWith(this.namespace + '-') && identifier.split('-').length === 3;
  }

  public putToWorld(identifier: string, value: TendrockDynamicPropertyValue) {
    world.setDynamicProperty(this.getDataIdentifier(identifier), Utils.serializeData(value));
  }

  public putToBlock(blockOrLid: Block | string, identifier: string, value: TendrockDynamicPropertyValue) {
    world.setDynamicProperty(this.getBlockDataIdentifier(blockOrLid, identifier), Utils.serializeData(value));
  }

  public putToEntity(entity: Entity, identifier: string, value: TendrockDynamicPropertyValue) {
    entity.setDynamicProperty(this.getDataIdentifier(identifier), Utils.serializeData(value));
  }

  public putToItem(item: ItemStack, identifier: string, value: TendrockDynamicPropertyValue) {
    item.setDynamicProperty(this.getDataIdentifier(identifier), Utils.serializeData(value));
  }

  public getFromWorld(identifier: string) {
    return world.getDynamicProperty(this.getDataIdentifier(identifier));
  }

  public getFromBlock(blockOrLid: Block | string, identifier: string) {
    return world.getDynamicProperty(this.getBlockDataIdentifier(blockOrLid, identifier));
  }
}