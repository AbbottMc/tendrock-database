import { GameObjectDatabase } from "../GameObjectDatabase";
import { ItemStack } from "@minecraft/server";
import { TendrockDynamicPropertyValue } from "../DynamicPropertySerializer";
import { DatabaseManager } from "../manager";
export declare class ItemStackDatabase extends GameObjectDatabase<ItemStack> {
    protected readonly itemStack: ItemStack;
    constructor(manager: DatabaseManager, itemStack: ItemStack);
    static create(manager: DatabaseManager, gameObject: ItemStack): ItemStackDatabase;
    getGameObject(): ItemStack;
    _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue): void;
}
