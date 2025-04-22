import {Constructor} from "../manager";

export class ConstructorRegistry {
  constructor(protected _registryImpl: ConstructorRegistryImpl) {
  }

  public register<T>(objectConstructor: Constructor<T>) {
    this._registryImpl.register(objectConstructor);
  }
}

export class ConstructorRegistryImpl {
  public static Instance = new ConstructorRegistryImpl();
  protected _registry: ConstructorRegistry;
  protected _constructorMap: Map<string, Constructor<any>> = new Map();

  protected constructor() {
    this._registry = new ConstructorRegistry(this);
  }

  public register<T>(objectConstructor: Constructor<T>) {
    if (objectConstructor.prototype.toJSON === undefined) {
      throw new Error("Register constructor failed! The constructor must have 'toJSON' method.");
    }
    this._constructorMap.set(objectConstructor.prototype.constructor.name, objectConstructor);
  }

  public get<T>(constructorName: string): Constructor<T> | undefined {
    return this._constructorMap.get(constructorName) as Constructor<T>;
  }

  public getRegistry() {
    return this._registry;
  }
}

