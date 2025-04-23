import { GameObjectDatabase } from "../GameObjectDatabase";
import { Utils } from "../helper/Utils";
export class WorldDatabase extends GameObjectDatabase {
    constructor(manager, world, initialIdList) {
        super(manager);
        this.world = world;
        this._uid = 'world@0';
        if (initialIdList) {
            initialIdList.forEach(([propertyId, dataId]) => {
                const value = this._dynamicProperty.deserializePropertyValueToData(world.getDynamicProperty(propertyId));
                this._dataMap.set(dataId, this._dynamicProperty.deserializeDataToInstance(this._uid, value, dataId, this));
            });
        }
    }
    static create(manager, gameObject, initialIdList) {
        return new WorldDatabase(manager, gameObject, initialIdList);
    }
    getGameObject() {
        return this.world;
    }
    _saveData(runtimeId, identifier, value) {
        Utils.assertInvokedByTendrock(runtimeId);
        this._dynamicProperty.putToWorld(identifier, value);
    }
}
