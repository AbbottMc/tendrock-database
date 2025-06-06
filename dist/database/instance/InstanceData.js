import { InstanceSerializer } from "./InstanceSerializer";
export class InstanceData {
    constructor(dataJson, instanceDataOptions, options) {
        this._serializer = new InstanceSerializer();
        this.database = instanceDataOptions.database;
        this.identifier = instanceDataOptions.identifier;
        this.uniqueId = instanceDataOptions.uniqueId;
        this.beforeConstructorHook(dataJson, instanceDataOptions, options);
        if (dataJson) {
            this.onDeserialize(dataJson, instanceDataOptions, options);
        }
        else if (options) {
            this.onConstruct(options, instanceDataOptions);
        }
        else {
            this.onInitWithNoData(instanceDataOptions);
        }
        this.afterConstructorHook(dataJson, instanceDataOptions, options);
    }
    beforeConstructorHook(dataJson, instanceDataOptions, options) {
    }
    afterConstructorHook(dataJson, instanceDataOptions, options) {
    }
    toJSON() {
        this._serializer.clear();
        this.serialize(this._serializer);
        return this._serializer.toJSON();
    }
    serialize(serializer) {
        serializer.put('constructorName', this.constructor.name);
    }
    markDirty() {
        this.database.set(this.identifier, this);
    }
}
