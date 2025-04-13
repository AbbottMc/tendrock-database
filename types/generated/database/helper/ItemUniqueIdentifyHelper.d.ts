import { ItemStack } from "@minecraft/server";
export declare class ItemUniqueIdentifyHelper {
    private _uniqueNumber;
    private _uniqueNumPropertyName;
    private _uniqueIdPropertyName;
    protected _isWorldLoaded: boolean;
    constructor();
    protected _assertWorldLoaded(): void;
    protected initUniqueNumberWhenWorldLoad(): void;
    getUniqueIdentifier(itemStack: ItemStack): string;
    getItemUniqueIdOrCreate(itemStack: ItemStack): string;
}
