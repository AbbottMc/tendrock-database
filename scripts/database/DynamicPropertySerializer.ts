import {Block, DimensionLocation, Entity, ItemStack, Vector3, world} from "@minecraft/server";
import {IdentifierParseResult, Utils} from "./helper/Utils";
import {LocationUtils} from "@tendrock/location-id";
import {GameObjectDatabase} from "./GameObjectDatabase";
import {ConstructorRegistryImpl} from "./instance/ConstructorRegistry";

export type DynamicPropertyValue = boolean | number | string | Vector3 | undefined;
export type DynamicPropertyObjectValue = { [key: string]: DynamicPropertyValue | DynamicPropertyObjectValue }
export type TendrockDynamicPropertyValue = DynamicPropertyValue | DynamicPropertyObjectValue;

export class DynamicPropertySerializer {
  public static TendrockPropertyIdPrefix = '[tendrock]';
  public static Instance = new DynamicPropertySerializer();

  protected constructor() {
  }

  public serializeNonBlockDataIdToPropertyId(identifier: string) {
    return `${DynamicPropertySerializer.TendrockPropertyIdPrefix}${identifier}`;
  }

  public serializeBlockIdToPropertyId(locationOrLid: DimensionLocation | string, identifier: string) {
    if (identifier.includes('-')) {
      throw new Error(`Invalid identifier: "${identifier}"`);
    }
    return `${DynamicPropertySerializer.TendrockPropertyIdPrefix}${typeof locationOrLid === 'string' ? locationOrLid : LocationUtils.getLocationId(locationOrLid)}-${identifier}`;
  }

  public validatePropertyId(propertyId: string) {
    return propertyId.startsWith(`${DynamicPropertySerializer.TendrockPropertyIdPrefix}`);
  }

  public validateBlockPropertyId(propertyId: string) {
    return propertyId.startsWith(`${DynamicPropertySerializer.TendrockPropertyIdPrefix}`) && propertyId.split('-').length === 2;
  }

  public getNonBlockDataId(propertyId: string) {
    if (!this.validatePropertyId(propertyId)) {
      return propertyId;
    }
    return propertyId.replace(DynamicPropertySerializer.TendrockPropertyIdPrefix, '');
  }

  public getBlockDataId(block: Block | string, propertyId: string) {
    if (!this.validateBlockPropertyId(propertyId)) {
      return propertyId;
    }
    const lid = typeof block === 'string' ? block : LocationUtils.getLocationId(block);
    const blockDataIdentifier = this.getNonBlockDataId(propertyId);
    return blockDataIdentifier.startsWith(lid) ? blockDataIdentifier.substring(lid.length + 2) : blockDataIdentifier;
  }

  public serializeDataToPropertyValue(value: TendrockDynamicPropertyValue): DynamicPropertyValue {
    if (value === undefined) return undefined;
    if (Utils.isVector3(value)) {
      return value;
    }
    const valueType = typeof value;
    if (valueType === 'object') {
      return '[tendrock object]' + JSON.stringify(value);
    } else if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
      return value as DynamicPropertyValue;
    } else {
      throw new Error(`Invalid data type: ${valueType}`);
    }
  }

  public deserializePropertyValueToData(value: DynamicPropertyValue): TendrockDynamicPropertyValue {
    if (typeof value === 'string' && value.startsWith('[tendrock object]')) {
      return JSON.parse(value.substring(17)) as TendrockDynamicPropertyValue;
    } else {
      return value as TendrockDynamicPropertyValue;
    }
  }

  public deserializeDataToInstance(uniqueId: string, value: TendrockDynamicPropertyValue, identifier: string, database: GameObjectDatabase<any>) {
    if (typeof value !== 'object' || Utils.isVector3(value)) {
      return value;
    }
    const {constructorName} = value;
    if (typeof constructorName !== 'string') return value;
    const constructor = ConstructorRegistryImpl.Instance.get(constructorName);
    if (!constructor) return value;
    return new constructor(value, {uniqueId, identifier, database}, undefined);
  }

  public deserializePropertyId(propertyId: string): IdentifierParseResult {
    if (!this.validatePropertyId(propertyId)) {
      return {} as IdentifierParseResult;
    }
    const dataIdentifier = this.getNonBlockDataId(propertyId);
    const dataIdSplit = dataIdentifier.split('-');
    if (dataIdSplit.length === 2) {
      return {lid: dataIdSplit[0], dataIdentifier: dataIdSplit[1]}
    } else {
      return {dataIdentifier};
    }
  }

  public putToWorld(identifier: string, value: TendrockDynamicPropertyValue) {
    world.setDynamicProperty(this.serializeNonBlockDataIdToPropertyId(identifier), this.serializeDataToPropertyValue(value));
  }

  public putToBlock(blockOrLid: DimensionLocation | string, identifier: string, value: TendrockDynamicPropertyValue) {
    world.setDynamicProperty(this.serializeBlockIdToPropertyId(blockOrLid, identifier), this.serializeDataToPropertyValue(value));
  }

  public putToEntity(entity: Entity, identifier: string, value: TendrockDynamicPropertyValue) {
    entity.setDynamicProperty(this.serializeNonBlockDataIdToPropertyId(identifier), this.serializeDataToPropertyValue(value));
  }

  public putToItem(item: ItemStack, identifier: string, value: TendrockDynamicPropertyValue) {
    item.setDynamicProperty(this.serializeNonBlockDataIdToPropertyId(identifier), this.serializeDataToPropertyValue(value));
  }

  public getFromWorld(identifier: string) {
    return world.getDynamicProperty(this.serializeNonBlockDataIdToPropertyId(identifier));
  }

  public getFromBlock(blockOrLid: Block | string, identifier: string) {
    return world.getDynamicProperty(this.serializeBlockIdToPropertyId(blockOrLid, identifier));
  }
}