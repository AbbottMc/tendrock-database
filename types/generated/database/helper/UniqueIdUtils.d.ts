import { Block, Entity, ItemStack } from "@minecraft/server";
export declare class UniqueIdUtils {
    private static _itemUniqueIdHelper;
    static RuntimeId: string;
    static getItemUniqueId(itemStack: ItemStack): string;
    static getBlockUniqueId(block: Block): string;
    static getEntityUniqueId(entity: Entity): string;
}
