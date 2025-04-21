import { Block, Entity, ItemStack, World } from "@minecraft/server";
import { GameObjectDatabase } from "../GameObjectDatabase";
import { DatabaseTypeBy, DatabaseTypeMap, NamespacedDatabaseManager } from "./NamespacedDatabaseManager";
import { TendrockDynamicPropertyValue } from "../NamespacedDynamicProperty";
import { SetMap } from "@tenolib/map";
import { BlockDatabase, EntityDatabase, ItemStackDatabase } from "../impl";
import { DatabaseTypes } from "../DatabaseTypes";
export type Constructor<T> = new (...args: any[]) => T;
export type GameObjectType = Block | Entity | ItemStack | World | string;
export declare class DatabaseManager {
    private _databaseManagerMap;
    private _isInitialized;
    private _whenReadyCallbackList;
    private _autoFlushTaskId;
    private _blockToDatabaseMap;
    private _itemToDatabaseMap;
    private _entityToDatabaseMap;
    private _changingEntityDatabaseBuffer;
    private _flushInterval;
    private _autoUpdateSourceEntity;
    private _autoFlush;
    constructor();
    private _loadAndParseWorldDynamicPropertiesGenerator;
    private _initWorldBlockDataGenerator;
    private _loadWorldDynamicProperties;
    private _loadWorldDynamicPropertiesWhenWorldLoaded;
    private _createNamespacedManagerIfAbsent;
    protected _getNamespacedManager(namespace: string): NamespacedDatabaseManager | undefined;
    private _doReady;
    whenReady(callback: () => void): (() => void) | undefined;
    isReady(): boolean;
    /**
     * @deprecated use {@link createIfAbsent} instead}
     * @param namespace
     * @param gameObject
     */
    getOrCreate<T extends Block | Entity | ItemStack | World | string>(namespace: string, gameObject: T): DatabaseTypeBy<T>;
    createIfAbsent<T extends Block | Entity | ItemStack | World | string>(namespace: string, gameObject: T): DatabaseTypeBy<T>;
    get<T extends Block | Entity | ItemStack | World | string>(namespace: string, gameObject: T): DatabaseTypeBy<T> | undefined;
    setData(namespace: string, gameObject: GameObjectType, identifier: string, value: TendrockDynamicPropertyValue): void;
    getData<T extends TendrockDynamicPropertyValue>(namespace: string, gameObject: GameObjectType, identifier: string): T;
    /**
     * @deprecated use {@link buildDataInstanceIfPresent} instead
     * @param namespace
     * @param gameObject
     * @param identifier
     * @param objectConstructor
     * @param options
     */
    getDataInstance<T>(namespace: string, gameObject: GameObjectType, identifier: string, objectConstructor: Constructor<T>, options?: unknown): T | undefined;
    buildDataInstanceIfPresent<T>(namespace: string, gameObject: GameObjectType, identifier: string, objectConstructor: Constructor<T>, options?: unknown): T | undefined;
    /**
     * @deprecated use {@link getDataBuiltInstance} instead
     * @param namespace
     * @param gameObject
     * @param identifier
     */
    getDataInstanceIfPresent<T>(namespace: string, gameObject: GameObjectType, identifier: string): T | undefined;
    getDataBuiltInstance<T>(namespace: string, gameObject: GameObjectType, identifier: string): T | undefined;
    /**
     * @deprecated use {@link createDataInstanceIfAbsent} instead
     * @param namespace
     * @param gameObject
     * @param identifier
     * @param objectConstructor
     * @param options
     */
    getDatDaInstanceOrCreate<T>(namespace: string, gameObject: GameObjectType, identifier: string, objectConstructor: Constructor<T>, options?: unknown): T;
    createDataInstanceIfAbsent<T>(namespace: string, gameObject: GameObjectType, identifier: string, objectConstructor: Constructor<T>, options?: unknown): T;
    remove(namespace: string, gameObject: GameObjectType, clearData?: boolean): void;
    private _prepare;
    getDatabaseListByGameObject<T extends Block | Entity | ItemStack | World>(gameObject: T): DatabaseTypeBy<T>[];
    getDatabaseList<T extends DatabaseTypes>(namespace: string, type: T): DatabaseTypeMap[T][];
    setFlushInterval(interval: number, flush?: boolean): void;
    getFlushInterval(): number;
    setAutoFlush(value?: boolean): void;
    autoFlush(): boolean;
    setAutoUpdateSourceEntity(value?: boolean): void;
    autoUpdateSourceEntity(): boolean;
    protected flushDatabase(database: GameObjectDatabase<any>): Generator<void, void, void>;
    protected flushDatabaseSync(database: GameObjectDatabase<any>): void;
    protected flushAllDataGenerator(): Generator<void, void, void>;
    flushSync(): void;
    flush(): void;
    protected _startFlushWhenPlayerLeaveTask(): void;
    protected _clearFlushJobIfPresent(): void;
    protected _startAutoFlushTask(): void;
    _getBlockToDatabaseMap(runtimeId: string): SetMap<string, BlockDatabase>;
    _getEntityToDatabaseMap(runtimeId: string): SetMap<string, EntityDatabase>;
    _getItemToDatabaseMap(runtimeId: string): SetMap<string, ItemStackDatabase>;
    _setChangingEntityDatabaseBuffer(runtimeId: string, locationId: string, entityDatabase: EntityDatabase): void;
    _getChangingEntityDatabaseBuffer(runtimeId: string, locationId: string): {
        entityDatabase: EntityDatabase | undefined;
        cleanBuffer: () => void;
    };
}
export declare const databaseManager: DatabaseManager;
