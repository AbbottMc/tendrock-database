import { Constructor } from "../manager";
export declare class ConstructorRegistryImpl {
    static Instance: ConstructorRegistryImpl;
    protected _registry: ConstructorRegistry;
    protected _constructorMap: Map<string, Constructor<any>>;
    protected constructor();
    register<T>(objectConstructor: Constructor<T>): void;
    get<T>(constructorName: string): Constructor<T> | undefined;
    getRegistry(): ConstructorRegistry;
}
export declare class ConstructorRegistry {
    protected _registryImpl: ConstructorRegistryImpl;
    constructor(_registryImpl: ConstructorRegistryImpl);
    register<T>(objectConstructor: Constructor<T>): void;
}
