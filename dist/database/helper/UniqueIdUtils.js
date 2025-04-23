import { ItemUniqueIdentifyHelper } from "./ItemUniqueIdentifyHelper";
import { LocationUtils } from "@tendrock/location-id";
export class UniqueIdUtils {
    static getItemUniqueId(itemStack) {
        return this._itemUniqueIdHelper.getItemUniqueIdOrCreate(itemStack);
    }
    static getBlockUniqueId(locationOrLid) {
        if (typeof locationOrLid === 'string') {
            if (!LocationUtils.isLocationId(locationOrLid))
                throw new Error(`Invalid block location id: "${locationOrLid}"`);
            return locationOrLid;
        }
        return LocationUtils.getLocationId(locationOrLid);
    }
    static getEntityUniqueId(entity) {
        return entity.id;
    }
}
UniqueIdUtils._itemUniqueIdHelper = new ItemUniqueIdentifyHelper();
UniqueIdUtils.RuntimeId = new Array(16).fill('0').map(() => Math.random().toString(16).slice(2, 4)).join('');
