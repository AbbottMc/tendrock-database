import { GameObjectDatabase } from "../GameObjectDatabase";
import { Utils } from "../helper/Utils";
import { UniqueIdUtils } from "../helper/UniqueIdUtils";
export class EntityDatabase extends GameObjectDatabase {
    constructor(manager, _entity) {
        super(manager);
        this._entity = _entity;
        this._uid = UniqueIdUtils.getEntityUniqueId(_entity);
        this._entity.getDynamicPropertyIds().forEach((propertyId) => {
            if (!this._dynamicProperty.validatePropertyId(propertyId))
                return;
            const id = this._dynamicProperty.getNonBlockDataId(propertyId);
            const value = this._dynamicProperty.deserializePropertyValueToData(this._entity.getDynamicProperty(propertyId));
            this._dataMap.set(id, value);
        });
    }
    static create(manager, gameObject) {
        return new EntityDatabase(manager, gameObject);
    }
    getGameObject() {
        return this._entity;
    }
    _saveData(runtimeId, identifier, value) {
        Utils.assertInvokedByTendrock(runtimeId);
        this._dynamicProperty.putToEntity(this._entity, identifier, value);
    }
    _onFlushFinished() {
        super._onFlushFinished();
        if (this._newEntityBuffer) {
            this._markDirtyWhenEntityChange(this._newEntityBuffer);
            this._newEntityBuffer = undefined;
        }
    }
    _markDirtyWhenEntityChange(entity) {
        // this.clearDynamicProperties();
        this._dirtyDataIdList = Array.from(this._dataMap.keys());
        this.parentManager._markDirty(UniqueIdUtils.RuntimeId, this);
    }
    _setEntity(runtimeId, entity) {
        Utils.assertInvokedByTendrock(runtimeId);
        this._uid = UniqueIdUtils.getEntityUniqueId(entity);
        this.parentManager.remove(this._entity);
        this._entity = entity;
        this.parentManager._addDatabase(UniqueIdUtils.RuntimeId, this);
        if (this.isFlushing()) {
            this._newEntityBuffer = entity;
        }
        else {
            this._markDirtyWhenEntityChange(entity);
        }
    }
}
