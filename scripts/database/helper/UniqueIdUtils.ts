import {ItemUniqueIdentifyHelper} from "./ItemUniqueIdentifyHelper";
import {DimensionLocation, Entity, ItemStack} from "@minecraft/server";
import {LocationUtils} from "@tendrock/location-id";

export class UniqueIdUtils {
  private static _itemUniqueIdHelper = new ItemUniqueIdentifyHelper();
  public static RuntimeId = new Array(16).fill('0').map(() => Math.random().toString(16).slice(2, 4)).join('');

  public static getItemUniqueId(itemStack: ItemStack) {
    return this._itemUniqueIdHelper.getItemUniqueIdOrCreate(itemStack);
  }

  public static getBlockUniqueId(locationOrLid: DimensionLocation | string) {
    if (typeof locationOrLid === 'string') {
      if (!LocationUtils.isLocationId(locationOrLid)) throw new Error(`Invalid block location id: "${locationOrLid}"`);
      return locationOrLid;
    }
    return LocationUtils.getLocationId(locationOrLid);
  }

  public static getEntityUniqueId(entity: Entity) {
    return entity.id;
  }
}