import { Utils } from "../helper/Utils";
export class InstanceData {
    constructor(dataJson, options) {
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
