import { Vector3 } from "@minecraft/server";
export interface IdentifierParseResult {
    dataIdentifier: string;
    lid?: string;
}
export declare class Utils {
    static assertInvokedByTendrock(runtimeId: string): void;
    static isVector3(value: any): value is Vector3;
    static runJob(generator: Generator<void, void, void>): Promise<unknown>;
}
