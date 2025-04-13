import { GameObjectDatabase } from "../GameObjectDatabase";
import { Utils } from "../helper/Utils";
import { UniqueIdUtils } from "../helper/UniqueIdUtils";
export class ItemStackDatabase extends GameObjectDatabase {
    constructor(namespace, manager, itemStack) {
        super(namespace, manager);
        this.itemStack = itemStack;
        this._uid = UniqueIdUtils.getItemUniqueId(itemStack);
        this.itemStack.getDynamicPropertyIds().forEach((propertyId) => {
            if (!this._dynamicProperty.validateDataIdentifier(propertyId))
                return;
            const id = this._dynamicProperty.extractDataIdentifier(propertyId);
            const value = Utils.deserializeData(this.itemStack.getDynamicProperty(propertyId));
            this._dataMap.set(id, value);
        });
    }
    static create(namespace, manager, gameObject) {
        return new ItemStackDatabase(namespace, manager, gameObject);
    }
    getGameObject() {
        return this.itemStack;
    }
    _saveData(runtimeId, identifier, value) {
        this._assertInvokedByTendrock(runtimeId);
        this._dynamicProperty.putToItem(this.itemStack, identifier, value);
    }
}
