import { Dimension, DimensionLocation, Vector3 } from "@minecraft/server";
import { DynamicPropertyValue, TendrockDynamicPropertyValue } from "../NamespacedDynamicProperty";
export interface IdentifierParseResult {
    namespace: string;
    dataIdentifier: string;
    lid?: string;
}
export declare class Utils {
    static assertInvokedByTendrock(runtimeId: string): void;
    static getDimensionShortName(dimension: Dimension): "o" | "n" | "e" | undefined;
    static getLocationId(dimensionLocation: DimensionLocation): string;
    static isVector3(value: any): value is Vector3;
    static serializeData(value: TendrockDynamicPropertyValue): DynamicPropertyValue;
    static deserializeData(value: DynamicPropertyValue): TendrockDynamicPropertyValue;
    private static _getTendrockPropertyId;
    private static parseDataIdentifier;
    private static parseBlockDataIdentifier;
    static parseIdentifier(identifier: string): IdentifierParseResult;
    static runJob(generator: Generator<void, void, void>): Promise<unknown>;
}
