import {ItemStack, world} from "@minecraft/server";

export class ItemUniqueIdentifyHelper {
  private _uniqueNumber = 0;
  private _uniqueNumPropertyName = 'tendrock:item_unique_number';
  private _uniqueIdPropertyName = 'tendrock:item_unique_id';
  protected _isWorldLoaded = false;

  constructor() {
    this.initUniqueNumberWhenWorldLoad();
  }

  protected _assertWorldLoaded() {
    if (!this._isWorldLoaded) {
      throw new Error('World is not loaded');
    }
  }

  protected initUniqueNumberWhenWorldLoad() {
    world.afterEvents.worldLoad.subscribe(() => {
      this._uniqueNumber = world.getDynamicProperty(this._uniqueNumPropertyName) as number ?? 0;
    });
  }

  getUniqueIdentifier(itemStack: ItemStack) {
    this._assertWorldLoaded();
    const ret = `${itemStack.typeId}@${this._uniqueNumber}`;
    this._uniqueNumber++;
    world.setDynamicProperty(this._uniqueNumPropertyName, this._uniqueNumber);
    return ret;
  }

  getItemUniqueIdOrCreate(itemStack: ItemStack) {
    this._assertWorldLoaded();
    const uniqueId = itemStack.getDynamicProperty(this._uniqueIdPropertyName) as string;
    if (uniqueId) {
      return uniqueId;
    }
    const newUniqueId = this.getUniqueIdentifier(itemStack);
    itemStack.setDynamicProperty(this._uniqueNumPropertyName, newUniqueId);
    return newUniqueId;
  }
}