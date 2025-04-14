import { GameObjectDatabase } from "../GameObjectDatabase";
import { ItemStack } from "@minecraft/server";
import { TendrockDynamicPropertyValue } from "../NamespacedDynamicProperty";
import { NamespacedDatabaseManager } from "../manager";
export declare class ItemStackDatabase extends GameObjectDatabase<ItemStack> {
    protected readonly itemStack: ItemStack;
    constructor(namespace: string, manager: NamespacedDatabaseManager, itemStack: ItemStack);
    static create(namespace: string, manager: NamespacedDatabaseManager, gameObject: ItemStack): ItemStackDatabase;
    getGameObject(): ItemStack;
    _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue): void;
}
