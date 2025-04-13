import { ItemUniqueIdentifyHelper } from "./ItemUniqueIdentifyHelper";
import { Utils } from "./Utils";
export class UniqueIdUtils {
    static getItemUniqueId(itemStack) {
        return this._itemUniqueIdHelper.getItemUniqueIdOrCreate(itemStack);
    }
    static getBlockUniqueId(block) {
        return Utils.getLocationId(block);
    }
    static getEntityUniqueId(entity) {
        return entity.id;
    }
}
UniqueIdUtils._itemUniqueIdHelper = new ItemUniqueIdentifyHelper();
UniqueIdUtils.RuntimeId = new Array(16).fill('0').map(() => Math.random().toString(16).slice(2, 4)).join('');
