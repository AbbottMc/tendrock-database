import { InstanceSerializer } from "./InstanceSerializer";
export class InstanceData {
    constructor(dataJson, instanceDataOptions, options) {
        this.database = instanceDataOptions.database;
        this.identifier = instanceDataOptions.identifier;
        this.uniqueId = instanceDataOptions.uniqueId;
    }
    toJSON() {
        const serializer = new InstanceSerializer();
        this.serialize(serializer);
        return serializer.toJSON();
    }
    serialize(serializer) {
        serializer.put('constructorName', this.constructor.name);
    }
    markDirty() {
        this.database.set(this.identifier, this);
    }
}
