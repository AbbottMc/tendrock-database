import { world } from "@minecraft/server";
export class ItemUniqueIdentifyHelper {
    constructor() {
        this._uniqueNumber = 0;
        this._uniqueNumPropertyName = 'tendrock:item_unique_number';
        this._uniqueIdPropertyName = 'tendrock:item_unique_id';
        this._isWorldLoaded = false;
        this.initUniqueNumberWhenWorldLoad();
    }
    _assertWorldLoaded() {
        if (!this._isWorldLoaded) {
            throw new Error('World is not loaded');
        }
    }
    initUniqueNumberWhenWorldLoad() {
        world.afterEvents.worldLoad.subscribe(() => {
            var _a;
            this._uniqueNumber = (_a = world.getDynamicProperty(this._uniqueNumPropertyName)) !== null && _a !== void 0 ? _a : 0;
            this._isWorldLoaded = true;
        });
    }
    getUniqueIdentifier(itemStack) {
        this._assertWorldLoaded();
        const ret = `${itemStack.typeId}@${this._uniqueNumber}`;
        this._uniqueNumber++;
        world.setDynamicProperty(this._uniqueNumPropertyName, this._uniqueNumber);
        return ret;
    }
    getItemUniqueIdOrCreate(itemStack) {
        this._assertWorldLoaded();
        const uniqueId = itemStack.getDynamicProperty(this._uniqueIdPropertyName);
        if (uniqueId) {
            return uniqueId;
        }
        const newUniqueId = this.getUniqueIdentifier(itemStack);
        itemStack.setDynamicProperty(this._uniqueNumPropertyName, newUniqueId);
        return newUniqueId;
    }
}
