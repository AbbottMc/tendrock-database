import { Block, Entity, ItemStack, World } from "@minecraft/server";
import { BlockDatabase, EntityDatabase, ItemStackDatabase, WorldDatabase } from "../impl";
import { GameObjectDatabase } from "../GameObjectDatabase";
export type DatabaseTypeBy<T> = T extends Block ? BlockDatabase : T extends Entity ? EntityDatabase : T extends ItemStack ? ItemStackDatabase : WorldDatabase;
export type DatabaseFactory<T extends Block | Entity | ItemStack | World> = {
    create(namespace: string, manager: NamespacedDatabaseManager, gameObject: T, initialIdList?: [string, string][]): InstanceType<DatabaseFactory<T>>;
} & (new (...args: any[]) => any);
export declare class NamespacedDatabaseManager {
    protected readonly namespace: string;
    private _blockDatabaseMap;
    private _itemDatabaseMap;
    private _entityDatabaseMap;
    private _worldDatabase;
    private _blockInitialIdListMap;
    private _worldInitialIdList;
    private _isFlushing;
    private _dirtyDatabaseList;
    private _dirtyDatabaseBuffer;
    constructor(namespace: string);
    static create(namespace: string): NamespacedDatabaseManager;
    protected _assertInvokedByTendrock(runtimeId: string): void;
    _markDirty(runtimeId: string, dataBase: GameObjectDatabase<any>): void;
    _addBlockDataId(runtimeId: string, lid: string, propertyId: string, dataId: string): void;
    _addWorldDataId(runtimeId: string, propertyId: string, dataId: string): void;
    private _prepare;
    getOrCreate<T extends Block | Entity | ItemStack | World>(gameObject: T): DatabaseTypeBy<T>;
    remove<T extends Block | Entity | ItemStack | World>(gameObject: T, clearData?: boolean): void;
    _beginFlush(runtimeId: string): void;
    _endFlush(runtimeId: string): void;
    getDirtyDatabaseList(): GameObjectDatabase<any>[];
}
