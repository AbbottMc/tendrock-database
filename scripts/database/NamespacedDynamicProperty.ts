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

  public getFromEntity(entity: Entity, identifier: string) {
    return entity.getDynamicProperty(this.getDataIdentifier(identifier));
  }

  public getFromItem(item: ItemStack, identifier: string) {
    return item.getDynamicProperty(this.getDataIdentifier(identifier));
  }

  public deleteFromWorld(identifier: string) {
    world.setDynamicProperty(this.getDataIdentifier(identifier), undefined);
  }

  public deleteFromItem(item: ItemStack, identifier: string) {
    item.setDynamicProperty(this.getDataIdentifier(identifier), undefined);
  }

  public deleteFromBlock(block: Block, identifier: string) {
    world.setDynamicProperty(this.getBlockDataIdentifier(block, identifier), undefined);
  }

  public deleteFromEntity(entity: Entity, identifier: string) {
    entity.setDynamicProperty(this.getDataIdentifier(identifier), undefined);
  }

  public clearFromBlock(block: Block) {
    this.forEachIdFromBlock(block, (identifier, dataIdentifier) => {
      world.setDynamicProperty(dataIdentifier, undefined);
    });
  }

  public clearFromItem(item: ItemStack) {
    this.forEachIdFromItem(item, (identifier, dataIdentifier) => {
      item.setDynamicProperty(dataIdentifier, undefined);
    });
  }

  public clearFromEntity(entity: Entity) {
    this.forEachIdFromEntity(entity, (identifier, dataIdentifier) => {
      entity.setDynamicProperty(dataIdentifier, undefined);
    });
  }

  public clearFromWorld() {
    this.forEachIdFromWorld((identifier, dataIdentifier) => {
      world.setDynamicProperty(dataIdentifier, undefined);
    });
  }

  public forEachIdFromBlock(blockOrLid: Block | string, callback: (identifier: string, dataIdentifier: string) => void) {
    world.getDynamicPropertyIds().forEach((identifier) => {
      if (this.validateBlockDataIdentifier(identifier)) {
        callback(this.extractBlockDataIdentifier(blockOrLid, identifier), identifier);
      }
    });
  }

  public forEachFromBlock(blockOrLid: Block | string, callback: (identifier: string, value: TendrockDynamicPropertyValue) => void) {
    world.getDynamicPropertyIds().forEach((identifier) => {
      if (this.validateBlockDataIdentifier(identifier)) {
        callback(this.extractBlockDataIdentifier(blockOrLid, identifier), Utils.deserializeData(world.getDynamicProperty(identifier)));
      }
    });
  }

  public forEachIdFromWorld(callback: (identifier: string, dataIdentifier: string) => void) {
    world.getDynamicPropertyIds().forEach((identifier) => {
      if (this.validateDataIdentifier(identifier) && !Utils.isBlockDataIdentifier(identifier)) {
        callback(this.extractDataIdentifier(identifier), identifier);
      }
    });
  }

  public forEachFromWorld(callback: (identifier: string, value: TendrockDynamicPropertyValue) => void) {
    world.getDynamicPropertyIds().forEach((identifier) => {
      if (this.validateDataIdentifier(identifier) && !Utils.isBlockDataIdentifier(identifier)) {
        callback(this.extractDataIdentifier(identifier), Utils.deserializeData(world.getDynamicProperty(identifier)));
      }
    });
  }

  public forEachIdFromEntity(entity: Entity, callback: (identifier: string, dataIdentifier: string) => void) {
    entity.getDynamicPropertyIds().forEach((identifier) => {
      if (this.validateDataIdentifier(identifier)) {
        callback(this.extractDataIdentifier(identifier), identifier);
      }
    });
  }

  public forEachFromEntity(entity: Entity, callback: (identifier: string, value: TendrockDynamicPropertyValue) => void) {
    entity.getDynamicPropertyIds().forEach((identifier) => {
      if (this.validateDataIdentifier(identifier)) {
        callback(this.extractDataIdentifier(identifier), Utils.deserializeData(entity.getDynamicProperty(identifier)));
      }
    });
  }

  public forEachIdFromItem(item: ItemStack, callback: (identifier: string, dataIdentifier: string) => void) {
    item.getDynamicPropertyIds().forEach((identifier) => {
      if (this.validateDataIdentifier(identifier)) {
        callback(this.extractDataIdentifier(identifier), identifier);
      }
    });
  }

  public forEachFromItem(item: ItemStack, callback: (identifier: string, value: TendrockDynamicPropertyValue) => void) {
    item.getDynamicPropertyIds().forEach((identifier) => {
      if (this.validateDataIdentifier(identifier)) {
        callback(this.extractDataIdentifier(identifier), Utils.deserializeData(item.getDynamicProperty(identifier)));
      }
    });
  }
}