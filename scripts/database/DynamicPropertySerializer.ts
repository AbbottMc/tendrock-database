import {Block, DimensionLocation, Entity, ItemStack, Vector3, world} from "@minecraft/server";
import {Utils} from "./helper/Utils";
import {LocationUtils} from "@tendrock/location-id";

export type DynamicPropertyValue = boolean | number | string | Vector3 | undefined;
export type DynamicPropertyObjectValue = { [key: string]: DynamicPropertyValue | DynamicPropertyObjectValue }
export type TendrockDynamicPropertyValue = DynamicPropertyValue | DynamicPropertyObjectValue;

export class DynamicPropertySerializer {
  public static TendrockPropertyIdPrefix = '[tendrock]';
  public static Instance = new DynamicPropertySerializer();

  protected constructor() {
  }

  public getDataIdentifier(identifier: string) {
    if (identifier.includes('-')) {
      throw new Error(`Invalid identifier: "${identifier}"`);
    }
    return `${DynamicPropertySerializer.TendrockPropertyIdPrefix}${identifier}`;
  }

  public getBlockDataIdentifier(locationOrLid: DimensionLocation | string, identifier: string) {
    if (identifier.includes('-')) {
      throw new Error(`Invalid identifier: "${identifier}"`);
    }
    return `${DynamicPropertySerializer.TendrockPropertyIdPrefix}${typeof locationOrLid === 'string' ? locationOrLid : LocationUtils.getLocationId(locationOrLid)}-${identifier}`;
  }

  public extractDataIdentifier(dataIdentifier: string) {
    return dataIdentifier.split('-')[1];
  }

  public extractBlockDataIdentifier(block: Block | string, dataIdentifier: string) {
    if (!dataIdentifier.includes('-')) {
      return dataIdentifier;
    }
    if (!this.validateBlockDataIdentifier(dataIdentifier)) {
      return dataIdentifier;
    }
    const lid = typeof block === 'string' ? block : LocationUtils.getLocationId(block);
    const blockDataIdentifier = this.extractDataIdentifier(dataIdentifier);
    return blockDataIdentifier.startsWith(lid) ? blockDataIdentifier.substring(lid.length + 2) : blockDataIdentifier;
  }

  public validateDataIdentifier(identifier: string) {
    return identifier.startsWith(`${DynamicPropertySerializer.TendrockPropertyIdPrefix}-`);
  }

  public validateBlockDataIdentifier(identifier: string) {
    return identifier.startsWith(`${DynamicPropertySerializer.TendrockPropertyIdPrefix}-`) && identifier.split('-').length === 3;
  }

  public putToWorld(identifier: string, value: TendrockDynamicPropertyValue) {
    world.setDynamicProperty(this.getDataIdentifier(identifier), Utils.serializeData(value));
  }

  public putToBlock(blockOrLid: DimensionLocation | string, identifier: string, value: TendrockDynamicPropertyValue) {
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