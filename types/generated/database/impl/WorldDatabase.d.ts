import { GameObjectDatabase } from "../GameObjectDatabase";
import { World } from "@minecraft/server";
import { TendrockDynamicPropertyValue } from "../DynamicPropertySerializer";
import { DatabaseManager } from "../manager";
export declare class WorldDatabase extends GameObjectDatabase<World> {
    protected readonly world: World;
    constructor(manager: DatabaseManager, world: World, initialIdList?: [string, string][]);
    static create(manager: DatabaseManager, gameObject: World, initialIdList?: [string, string][]): WorldDatabase;
    getGameObject(): World;
    _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue): void;
}
