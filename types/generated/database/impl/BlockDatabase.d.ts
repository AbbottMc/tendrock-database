import { GameObjectDatabase } from "../GameObjectDatabase";
import { Block, DimensionLocation } from "@minecraft/server";
import { TendrockDynamicPropertyValue } from "../NamespacedDynamicProperty";
import { NamespacedDatabaseManager } from "../manager";
export declare class BlockDatabase extends GameObjectDatabase<Block> {
    protected block: Block | undefined;
    protected location: DimensionLocation;
    constructor(namespace: string, manager: NamespacedDatabaseManager, locationOrLid: DimensionLocation | string, initialIdList?: [string, string][]);
    protected initBlock(): void;
    static create(namespace: string, manager: NamespacedDatabaseManager, gameObject: DimensionLocation | string, initialIdList: [string, string][]): BlockDatabase;
    getGameObject(): Block;
    _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue): void;
}
