import { GameObjectDatabase } from "../GameObjectDatabase";
import { InstanceSerializer } from "./InstanceSerializer";
import { DatabaseTypeBy, GameObjectType } from "../manager";
export interface InstanceDataOptions {
    database: GameObjectDatabase<any>;
    identifier: string;
    uniqueId: string;
}
export interface InstanceDataJson {
    constructorName: string;
}
export declare abstract class InstanceData<GOT extends Exclude<GameObjectType, string>> {
    readonly database: DatabaseTypeBy<GOT>;
    readonly identifier: string;
    readonly uniqueId: string;
    constructor(dataJson: InstanceDataJson | undefined, instanceDataOptions: InstanceDataOptions, options: any | undefined);
    toJSON(): {
        [k: string]: import("..").TendrockDynamicPropertyValue;
    };
    serialize(serializer: InstanceSerializer): void;
    markDirty(): void;
}
