import { GameObjectDatabase } from "../GameObjectDatabase";
interface InstanceDataOptions {
    database: GameObjectDatabase<any>;
    identifier: string;
}
export declare class InstanceData {
    private _tendrockInstanceOptions;
    constructor(dataJson: any | undefined, options: any | undefined);
    _initInstanceOptions(runtimeId: string, options: InstanceDataOptions): this;
    markDirty(): void;
}
export {};
