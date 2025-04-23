import { Vector3 } from "@minecraft/server";
import { DynamicPropertyValue, TendrockDynamicPropertyValue } from "../DynamicPropertySerializer";
import { GameObjectDatabase } from "../GameObjectDatabase";
export interface IdentifierParseResult {
    dataIdentifier: string;
    lid?: string;
}
export declare class Utils {
    static assertInvokedByTendrock(runtimeId: string): void;
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
