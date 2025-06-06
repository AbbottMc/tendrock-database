import { GameObjectDatabase } from "../GameObjectDatabase";
import { Utils } from "../helper/Utils";
import { UniqueIdUtils } from "../helper/UniqueIdUtils";
export class ItemStackDatabase extends GameObjectDatabase {
    constructor(manager, itemStack) {
        super(manager);
        this.itemStack = itemStack;
        if (!itemStack) {
            throw new Error('ItemStack is null');
        }
        if (itemStack.isStackable) {
            throw new Error('Cannot create database on stackable items.');
        }
        this._uid = UniqueIdUtils.getItemUniqueId(itemStack);
        this.itemStack.getDynamicPropertyIds().forEach((propertyId) => {
            if (!this._dynamicProperty.validatePropertyId(propertyId))
                return;
            const id = this._dynamicProperty.getNonBlockDataId(propertyId);
            const value = this._dynamicProperty.deserializePropertyValueToData(this.itemStack.getDynamicProperty(propertyId));
            this._dataMap.set(id, value);
        });
    }
    static create(manager, gameObject) {
        return new ItemStackDatabase(manager, gameObject);
    }
    getGameObject() {
        return this.itemStack;
    }
    _saveData(runtimeId, identifier, value) {
        Utils.assertInvokedByTendrock(runtimeId);
        this._dynamicProperty.putToItem(this.itemStack, identifier, value);
    }
}
