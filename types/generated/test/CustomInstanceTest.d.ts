import { InstanceData, InstanceDataJson, InstanceDataOptions, InstanceSerializer } from "../database";
import { Block } from "@minecraft/server";
interface CustomConstructorDataJson extends InstanceDataJson {
    customData: string;
    extraParamLength: number;
    extraParam: string;
}
interface CustomConstructorOptions {
    initialCustomData: string;
    extraParam: string;
}
export declare class CustomConstructor extends InstanceData<Block> {
    private _customData;
    private _extraParamLength;
    private _extraParam?;
    onDeserialize(dataJson: CustomConstructorDataJson, instanceDataOptions: InstanceDataOptions, options: CustomConstructorOptions | undefined): void;
    onConstruct(options: CustomConstructorOptions, instanceDataOptions: InstanceDataOptions): void;
    onInitWithNoData(instanceDataOptions: InstanceDataOptions): void;
    serialize(serializer: InstanceSerializer): void;
    getCustomData(): string;
    getExtraParam(): string | undefined;
    getComputedCustomData(): string;
}
export {};
