import { Block, DimensionLocation, Entity, ItemStack, Vector3 } from "@minecraft/server";
export type DynamicPropertyValue = boolean | number | string | Vector3 | undefined;
export type DynamicPropertyObjectValue = {
    [key: string]: DynamicPropertyValue | DynamicPropertyObjectValue;
};
export type TendrockDynamicPropertyValue = DynamicPropertyValue | DynamicPropertyObjectValue;
export declare class DynamicPropertySerializer {
    static TendrockPropertyIdPrefix: string;
    static Instance: DynamicPropertySerializer;
    protected constructor();
    getDataIdentifier(identifier: string): string;
    getBlockDataIdentifier(locationOrLid: DimensionLocation | string, identifier: string): string;
    extractDataIdentifier(dataIdentifier: string): string;
    extractBlockDataIdentifier(block: Block | string, dataIdentifier: string): string;
    validateDataIdentifier(identifier: string): boolean;
    validateBlockDataIdentifier(identifier: string): boolean;
    putToWorld(identifier: string, value: TendrockDynamicPropertyValue): void;
    putToBlock(blockOrLid: DimensionLocation | string, identifier: string, value: TendrockDynamicPropertyValue): void;
    putToEntity(entity: Entity, identifier: string, value: TendrockDynamicPropertyValue): void;
    putToItem(item: ItemStack, identifier: string, value: TendrockDynamicPropertyValue): void;
    getFromWorld(identifier: string): string | number | boolean | Vector3 | undefined;
    getFromBlock(blockOrLid: Block | string, identifier: string): string | number | boolean | Vector3 | undefined;
}
