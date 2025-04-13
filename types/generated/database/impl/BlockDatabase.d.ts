import { GameObjectDatabase } from "../GameObjectDatabase";
import { Block } from "@minecraft/server";
import { TendrockDynamicPropertyValue } from "../NamespacedDynamicProperty";
import { NamespacedDatabaseManager } from "../manager/NamespacedDatabaseManager";
export declare class BlockDatabase extends GameObjectDatabase<Block> {
    protected readonly block: Block;
    constructor(namespace: string, manager: NamespacedDatabaseManager, block: Block, initialIdList?: [string, string][]);
    static create(namespace: string, manager: NamespacedDatabaseManager, gameObject: Block, initialIdList: [string, string][]): BlockDatabase;
    getGameObject(): Block;
    _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue): void;
}
