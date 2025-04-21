import { Block, Entity, ItemStack, World } from "@minecraft/server";
import { BlockDatabase, EntityDatabase, ItemStackDatabase, WorldDatabase } from "../impl";
import { GameObjectDatabase } from "../GameObjectDatabase";
import { BetterSet } from "@tenolib/map";
import { DatabaseManager } from "./DatabaseManager";
import { DatabaseTypes } from "../DatabaseTypes";
export type DatabaseTypeBy<T> = T extends (string | Block) ? BlockDatabase : T extends Entity ? EntityDatabase : T extends ItemStack ? ItemStackDatabase : WorldDatabase;
export type DatabaseFactory<T extends Block | Entity | ItemStack | World | string> = {
    create(namespace: string, manager: NamespacedDatabaseManager, gameObject: T, initialIdList?: [string, string][]): InstanceType<DatabaseFactory<T>>;
} & (new (...args: any[]) => any);
export type DatabaseTypeMap = {
    [DatabaseTypes.Entity]: EntityDatabase;
    [DatabaseTypes.Block]: BlockDatabase;
    [DatabaseTypes.Item]: ItemStackDatabase;
    [DatabaseTypes.World]: WorldDatabase;
};
export declare class NamespacedDatabaseManager {
    protected readonly namespace: string;
    private readonly _parentManager;
    private _blockDatabaseMap;
    private _itemDatabaseMap;
    private _entityDatabaseMap;
    private _worldDatabase;
    private _blockInitialIdListMap;
    private _worldInitialIdList;
    private _isFlushing;
    private _dirtyDatabaseList;
    private _dirtyDatabaseBuffer;
    protected constructor(namespace: string, _parentManager: DatabaseManager);
    static _create(runtimeId: string, namespace: string, parentManager: DatabaseManager): NamespacedDatabaseManager;
    _markDirty(runtimeId: string, dataBase: GameObjectDatabase<any>): void;
    _addBlockDataId(runtimeId: string, lid: string, propertyId: string, dataId: string): void;
    _addWorldDataId(runtimeId: string, propertyId: string, dataId: string): void;
    protected _initWorldDataGenerator(): Generator<void, void, void>;
    protected _initBlockDataGenerator(): Generator<void, void, void>;
    _initWorldBlockDataGenerator(runtimeId: string): Generator<void, void, void>;
    private _prepare;
    /**
     * @deprecated Use {@link createIfAbsent} instead.
     * @param gameObject
     */
    getOrCreate<T extends Block | Entity | ItemStack | World | string>(gameObject: T): DatabaseTypeBy<T>;
    createIfAbsent<T extends Block | Entity | ItemStack | World | string>(gameObject: T): DatabaseTypeBy<T>;
    get<T extends Block | Entity | ItemStack | World | string>(gameObject: T): DatabaseTypeBy<T> | undefined;
    getDatabaseList<T extends DatabaseTypes>(type: T): DatabaseTypeMap[T][];
    getWorldDatabase(): DatabaseTypeBy<World> | undefined;
    remove<T extends Block | Entity | ItemStack | World | string>(gameObject: T, clearData?: boolean): void;
    _addDatabase<T extends Block | Entity | ItemStack | World | string>(runtimeId: string, database: DatabaseTypeBy<T>): void;
    _beginFlush(runtimeId: string): void;
    _endFlush(runtimeId: string): void;
    getDirtyDatabaseList(): BetterSet<GameObjectDatabase<any>>;
}
