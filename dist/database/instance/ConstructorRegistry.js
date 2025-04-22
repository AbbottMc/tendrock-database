export class ConstructorRegistryImpl {
    constructor() {
        this._constructorMap = new Map();
        this._registry = new ConstructorRegistry(this);
    }
    register(objectConstructor) {
        if (objectConstructor.prototype.toJSON === undefined) {
            throw new Error("Register constructor failed! The constructor must have 'toJSON' method.");
        }
        this._constructorMap.set(objectConstructor.prototype.constructor.name, objectConstructor);
    }
    get(constructorName) {
        return this._constructorMap.get(constructorName);
    }
    getRegistry() {
        return this._registry;
    }
}
ConstructorRegistryImpl.Instance = new ConstructorRegistryImpl();
export class ConstructorRegistry {
    constructor(_registryImpl) {
        this._registryImpl = _registryImpl;
    }
    register(objectConstructor) {
        this._registryImpl.register(objectConstructor);
    }
}
