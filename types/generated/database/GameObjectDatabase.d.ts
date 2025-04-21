import { NamespacedDynamicProperty, TendrockDynamicPropertyValue } from "./NamespacedDynamicProperty";
import { Block, Entity, ItemStack, World } from "@minecraft/server";
import { Constructor, NamespacedDatabaseManager } from "./manager";
export declare abstract class GameObjectDatabase<GO extends (Block | ItemStack | Entity | World)> {
    readonly namespace: string;
    readonly parentManager: NamespacedDatabaseManager;
    protected _dynamicProperty: NamespacedDynamicProperty;
    protected _dataMap: Map<string, TendrockDynamicPropertyValue>;
    protected _dirtyDataIdList: string[];
    protected _dirtyDataIdBuffer: string[];
    protected _isFlushing: boolean;
    protected _uid: string;
    protected constructor(namespace: string, parentManager: NamespacedDatabaseManager);
    abstract getGameObject(): GO;
    abstract _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue): void;
    protected _markDirty(identifier: string): void;
    getUid(): string;
    set(identifier: string, value: TendrockDynamicPropertyValue): void;
    get(identifier: string): TendrockDynamicPropertyValue;
    protected _canSetAsInstance(obj: any): obj is TendrockDynamicPropertyValue;
    protected getInstanceImpl<T>(identifier: string, objectConstructor: Constructor<T>, createIfAbsent: boolean, options?: unknown): T | undefined;
    /**
     * @deprecated use {@link createInstanceIfAbsent} instead
     * @param identifier
     * @param objectConstructor
     * @param options
     */
    getInstanceOrCreate<T>(identifier: string, objectConstructor: Constructor<T>, options?: unknown): T;
    createInstanceIfAbsent<T>(identifier: string, objectConstructor: Constructor<T>, options?: unknown): T;
    /**
     * @deprecated use {@link buildInstanceIfPresent} instead
     * @param identifier
     * @param objectConstructor
     * @param options
     */
    getInstance<T>(identifier: string, objectConstructor: Constructor<T>, options?: unknown): T | undefined;
    buildInstanceIfPresent<T>(identifier: string, objectConstructor: Constructor<T>, options?: unknown): T | undefined;
    /**
     * @deprecated use {@link getBuiltInstance} instead
     * @param identifier
     */
    getInstanceIfPresent<T>(identifier: string): T | undefined;
    getBuiltInstance<T>(identifier: string): T | undefined;
    delete(identifier: string): void;
    forEach(callback: (identifier: string, value: TendrockDynamicPropertyValue) => void): void;
    size(): number;
    entries(): IterableIterator<[string, TendrockDynamicPropertyValue]>;
    keys(): IterableIterator<string>;
    values(): IterableIterator<TendrockDynamicPropertyValue>;
    isFlushing(): boolean;
    clear(): void;
    clearDynamicProperties(dataIdList?: string[]): void;
    protected _onFlushFinished(): void;
    _beginFlush(runtimeId: string): void;
    _endFlush(runtimeId: string): void;
    _getDirtyDataIdList(runtimeId: string): string[];
}
