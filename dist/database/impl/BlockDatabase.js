import { GameObjectDatabase } from "../GameObjectDatabase";
import { world } from "@minecraft/server";
import { Utils } from "../helper/Utils";
import { UniqueIdUtils } from "../helper/UniqueIdUtils";
import { tryCatch } from "@tendrock/lib";
export class BlockDatabase extends GameObjectDatabase {
    constructor(namespace, manager, locationOrLid, initialIdList) {
        super(namespace, manager);
        this._uid = UniqueIdUtils.getBlockUniqueId(locationOrLid);
        this.location = Utils.getDimensionLocation(locationOrLid);
        this.initBlock();
        if (initialIdList) {
            initialIdList.forEach(([propertyId, dataId]) => {
                const value = Utils.deserializeData(world.getDynamicProperty(propertyId));
                this._dataMap.set(dataId, value);
            });
        }
    }
    initBlock() {
        this.block = tryCatch(() => this.location.dimension.getBlock(this.location)).data;
    }
    static create(namespace, manager, gameObject, initialIdList) {
        return new BlockDatabase(namespace, manager, gameObject, initialIdList);
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
