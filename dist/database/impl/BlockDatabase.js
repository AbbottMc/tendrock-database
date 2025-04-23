import { GameObjectDatabase } from "../GameObjectDatabase";
import { world } from "@minecraft/server";
import { Utils } from "../helper/Utils";
import { UniqueIdUtils } from "../helper/UniqueIdUtils";
import { tryCatch } from "@tendrock/lib";
import { LocationUtils } from "@tendrock/location-id";
export class BlockDatabase extends GameObjectDatabase {
    constructor(manager, locationOrLid, initialIdList) {
        super(manager);
        this._uid = UniqueIdUtils.getBlockUniqueId(locationOrLid);
        this.location = LocationUtils.getDimensionLocation(locationOrLid);
        this.initBlock();
        if (initialIdList) {
            initialIdList.forEach(([propertyId, dataId]) => {
                const value = this._dynamicProperty.deserializePropertyValueToData(world.getDynamicProperty(propertyId));
                this._dataMap.set(dataId, this._dynamicProperty.deserializeDataToInstance(this._uid, value, dataId, this));
            });
        }
    }
    initBlock() {
        this.block = tryCatch(() => this.location.dimension.getBlock(this.location)).data;
    }
    static create(manager, gameObject, initialIdList) {
        return new BlockDatabase(manager, gameObject, initialIdList);
    }
    getGameObject() {
        if (!this.block) {
            this.initBlock();
        }
        return this.block;
    }
    _saveData(runtimeId, identifier, value) {
        Utils.assertInvokedByTendrock(runtimeId);
        this._dynamicProperty.putToBlock(this._uid, identifier, value);
    }
}
