import { TendrockDynamicPropertyValue } from "../DynamicPropertySerializer";
export declare class InstanceSerializer {
    private _map;
    put(identifier: string, value: TendrockDynamicPropertyValue): this;
    delete(identifier: string): this;
    get(identifier: string): TendrockDynamicPropertyValue;
    toJSON(): {
        [k: string]: TendrockDynamicPropertyValue;
    };
}
