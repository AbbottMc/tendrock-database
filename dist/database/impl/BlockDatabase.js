import { GameObjectDatabase } from "../GameObjectDatabase";
import { world } from "@minecraft/server";
import { Utils } from "../helper/Utils";
import { UniqueIdUtils } from "../helper/UniqueIdUtils";
export class BlockDatabase extends GameObjectDatabase {
    constructor(namespace, manager, block, initialIdList) {
        super(namespace, manager);
        this.block = block;
        this._uid = UniqueIdUtils.getBlockUniqueId(block);
        if (initialIdList) {
            initialIdList.forEach(([propertyId, dataId]) => {
                const value = Utils.deserializeData(world.getDynamicProperty(propertyId));
                this._dataMap.set(dataId, value);
            });
        }
    }
    static create(namespace, manager, gameObject, initialIdList) {
        return new BlockDatabase(namespace, manager, gameObject, initialIdList);
    }
    getGameObject() {
        return this.block;
    }
    _saveData(runtimeId, identifier, value) {
        this._assertInvokedByTendrock(runtimeId);
        this._dynamicProperty.putToBlock(this._uid, identifier, value);
    }
}
