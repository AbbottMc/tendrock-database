import { GameObjectDatabase } from "../GameObjectDatabase";
import { Entity } from "@minecraft/server";
import { TendrockDynamicPropertyValue } from "../NamespacedDynamicProperty";
import { NamespacedDatabaseManager } from "../manager/NamespacedDatabaseManager";
export declare class EntityDatabase extends GameObjectDatabase<Entity> {
    protected readonly entity: Entity;
    constructor(namespace: string, manager: NamespacedDatabaseManager, entity: Entity);
    static create(namespace: string, manager: NamespacedDatabaseManager, gameObject: Entity): EntityDatabase;
    getGameObject(): Entity;
    _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue): void;
}
