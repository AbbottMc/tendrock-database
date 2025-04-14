import { GameObjectDatabase } from "../GameObjectDatabase";
import { Entity } from "@minecraft/server";
import { TendrockDynamicPropertyValue } from "../NamespacedDynamicProperty";
import { NamespacedDatabaseManager } from "../manager";
export declare class EntityDatabase extends GameObjectDatabase<Entity> {
    protected _entity: Entity;
    private _newEntityBuffer;
    constructor(namespace: string, manager: NamespacedDatabaseManager, _entity: Entity);
    static create(namespace: string, manager: NamespacedDatabaseManager, gameObject: Entity): EntityDatabase;
    getGameObject(): Entity;
    _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue): void;
    protected _onFlushFinished(): void;
    protected _markDirtyWhenEntityChange(entity: Entity): void;
    _setEntity(runtimeId: string, entity: Entity): void;
}
