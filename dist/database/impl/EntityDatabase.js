import { GameObjectDatabase } from "../GameObjectDatabase";
import { Utils } from "../helper/Utils";
import { UniqueIdUtils } from "../helper/UniqueIdUtils";
export class EntityDatabase extends GameObjectDatabase {
    constructor(namespace, manager, entity) {
        super(namespace, manager);
        this.entity = entity;
        this._uid = UniqueIdUtils.getEntityUniqueId(entity);
        this.entity.getDynamicPropertyIds().forEach((propertyId) => {
            if (!this._dynamicProperty.validateDataIdentifier(propertyId))
                return;
            const id = this._dynamicProperty.extractDataIdentifier(propertyId);
            const value = Utils.deserializeData(this.entity.getDynamicProperty(propertyId));
            this._dataMap.set(id, value);
        });
    }
    static create(namespace, manager, gameObject) {
        return new EntityDatabase(namespace, manager, gameObject);
    }
    getGameObject() {
        return this.entity;
    }
    _saveData(runtimeId, identifier, value) {
        Utils.assertInvokedByTendrock(runtimeId);
        this._dynamicProperty.putToEntity(this.entity, identifier, value);
    }
}
