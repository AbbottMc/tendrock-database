import { GameObjectDatabase } from "../GameObjectDatabase";
import { World } from "@minecraft/server";
import { TendrockDynamicPropertyValue } from "../NamespacedDynamicProperty";
import { NamespacedDatabaseManager } from "../manager/NamespacedDatabaseManager";
export declare class WorldDatabase extends GameObjectDatabase<World> {
    protected readonly world: World;
    constructor(namespace: string, manager: NamespacedDatabaseManager, world: World, initialIdList?: [string, string][]);
    static create(namespace: string, manager: NamespacedDatabaseManager, gameObject: World, initialIdList?: [string, string][]): WorldDatabase;
    getGameObject(): World;
    _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue): void;
}
