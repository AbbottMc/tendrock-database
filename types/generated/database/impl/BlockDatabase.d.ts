import { GameObjectDatabase } from "../GameObjectDatabase";
import { Block, DimensionLocation } from "@minecraft/server";
import { TendrockDynamicPropertyValue } from "../DynamicPropertySerializer";
import { DatabaseManager } from "../manager";
export declare class BlockDatabase extends GameObjectDatabase<Block> {
    protected block: Block | undefined;
    protected location: DimensionLocation;
    constructor(manager: DatabaseManager, locationOrLid: DimensionLocation | string, initialIdList?: [string, string][]);
    protected initBlock(): void;
    static create(manager: DatabaseManager, gameObject: DimensionLocation | string, initialIdList: [string, string][]): BlockDatabase;
    getGameObject(): Block;
    _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue): void;
}
