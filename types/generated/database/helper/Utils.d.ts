import { Dimension, DimensionLocation, Vector3 } from "@minecraft/server";
import { DynamicPropertyValue, TendrockDynamicPropertyValue } from "../NamespacedDynamicProperty";
import { GameObjectDatabase } from "../GameObjectDatabase";
export interface IdentifierParseResult {
    namespace: string;
    dataIdentifier: string;
    lid?: string;
}
export declare class Utils {
    static assertInvokedByTendrock(runtimeId: string): void;
    static getDimensionShortName(dimension: Dimension): "o" | "n" | "e" | undefined;
    static toFixed(num: number, precision?: number, isFixed?: boolean): string | number;
    static getLocationId(dimensionLocation: DimensionLocation, fixed?: boolean): string;
    static isLocationId(str: string): boolean;
    static lidToVec(lid: string): Vector3;
    static lidToDimension(lid: string): Dimension;
    static lidToDimensionLocation(lid: string): DimensionLocation;
    static getDimensionLocation(locationOrLid: string | DimensionLocation): DimensionLocation;
    static isVector3(value: any): value is Vector3;
    static serializeData(value: TendrockDynamicPropertyValue): DynamicPropertyValue;
    static deserializeData(value: DynamicPropertyValue): TendrockDynamicPropertyValue;
    static deserializeInstance(uniqueId: string, value: TendrockDynamicPropertyValue, identifier: string, database: GameObjectDatabase<any>): unknown;
    private static _getTendrockPropertyId;
    private static parseDataIdentifier;
    private static parseBlockDataIdentifier;
    static parseIdentifier(identifier: string): IdentifierParseResult;
    static runJob(generator: Generator<void, void, void>): Promise<unknown>;
}
