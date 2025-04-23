import { Block, DimensionLocation, Entity, ItemStack, Vector3 } from "@minecraft/server";
import { IdentifierParseResult } from "./helper/Utils";
import { GameObjectDatabase } from "./GameObjectDatabase";
export type DynamicPropertyValue = boolean | number | string | Vector3 | undefined;
export type DynamicPropertyObjectValue = {
    [key: string]: DynamicPropertyValue | DynamicPropertyObjectValue;
};
export type TendrockDynamicPropertyValue = DynamicPropertyValue | DynamicPropertyObjectValue;
export declare class DynamicPropertySerializer {
    static TendrockPropertyIdPrefix: string;
    static Instance: DynamicPropertySerializer;
    protected constructor();
    serializeNonBlockDataIdToPropertyId(identifier: string): string;
    serializeBlockIdToPropertyId(locationOrLid: DimensionLocation | string, identifier: string): string;
    validatePropertyId(propertyId: string): boolean;
    validateBlockPropertyId(propertyId: string): boolean;
    getNonBlockDataId(propertyId: string): string;
    getBlockDataId(block: Block | string, propertyId: string): string;
    serializeDataToPropertyValue(value: TendrockDynamicPropertyValue): DynamicPropertyValue;
    deserializePropertyValueToData(value: DynamicPropertyValue): TendrockDynamicPropertyValue;
    deserializeDataToInstance(uniqueId: string, value: TendrockDynamicPropertyValue, identifier: string, database: GameObjectDatabase<any>): unknown;
    deserializePropertyId(propertyId: string): IdentifierParseResult;
    putToWorld(identifier: string, value: TendrockDynamicPropertyValue): void;
    putToBlock(blockOrLid: DimensionLocation | string, identifier: string, value: TendrockDynamicPropertyValue): void;
    putToEntity(entity: Entity, identifier: string, value: TendrockDynamicPropertyValue): void;
    putToItem(item: ItemStack, identifier: string, value: TendrockDynamicPropertyValue): void;
    getFromWorld(identifier: string): string | number | boolean | Vector3 | undefined;
    getFromBlock(blockOrLid: Block | string, identifier: string): string | number | boolean | Vector3 | undefined;
}
