import { GameObjectDatabase } from "../GameObjectDatabase";
import { InstanceSerializer } from "./InstanceSerializer";
interface InstanceDataOptions {
    database: GameObjectDatabase<any>;
    identifier: string;
}
export declare class InstanceData {
    private _tendrockInstanceOptions;
    constructor(dataJson: any | undefined, options: any | undefined);
    toJSON(): {
        [k: string]: import("..").TendrockDynamicPropertyValue;
    };
    serialize(serializer: InstanceSerializer): void;
    _initInstanceOptions(runtimeId: string, options: InstanceDataOptions): this;
    markDirty(): void;
}
export {};
