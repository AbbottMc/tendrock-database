import { Utils } from "../helper/Utils";
import { InstanceSerializer } from "./InstanceSerializer";
export class InstanceData {
    constructor(dataJson, options) {
    }
    toJSON() {
        const serializer = new InstanceSerializer();
        this.serialize(serializer);
        return serializer.toJSON();
    }
    serialize(serializer) {
        serializer.put('constructorName', this.constructor.name);
    }
    _initInstanceOptions(runtimeId, options) {
        Utils.assertInvokedByTendrock(runtimeId);
        this._tendrockInstanceOptions = options;
        return this;
    }
    markDirty() {
        this._tendrockInstanceOptions.database.set(this._tendrockInstanceOptions.identifier, this);
    }
}
