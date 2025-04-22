export class InstanceSerializer {
    constructor() {
        this._map = new Map();
    }
    put(identifier, value) {
        this._map.set(identifier, value);
        return this;
    }
    delete(identifier) {
        this._map.delete(identifier);
        return this;
    }
    get(identifier) {
        return this._map.get(identifier);
    }
    toJSON() {
        return Object.fromEntries(this._map.entries());
    }
}
