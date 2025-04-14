import { GameObjectDatabase } from "../GameObjectDatabase";
import { Utils } from "../helper/Utils";
export class WorldDatabase extends GameObjectDatabase {
    constructor(namespace, manager, world, initialIdList) {
        super(namespace, manager);
        this.world = world;
        this._uid = 'world@0';
        if (initialIdList) {
            initialIdList.forEach(([propertyId, dataId]) => {
                const value = Utils.deserializeData(world.getDynamicProperty(propertyId));
                this._dataMap.set(dataId, value);
            });
        }
    }
    static create(namespace, manager, gameObject, initialIdList) {
        return new WorldDatabase(namespace, manager, gameObject, initialIdList);
    }
    getGameObject() {
        return this.world;
    }
    _saveData(runtimeId, identifier, value) {
        Utils.assertInvokedByTendrock(runtimeId);
        this._dynamicProperty.putToWorld(identifier, value);
    }
}
