import {GameObjectDatabase} from "../GameObjectDatabase";
import {ItemStack} from "@minecraft/server";
import {TendrockDynamicPropertyValue} from "../DynamicPropertySerializer";
import {Utils} from "../helper/Utils";
import {UniqueIdUtils} from "../helper/UniqueIdUtils";
import {DatabaseManager} from "../manager";

export class ItemStackDatabase extends GameObjectDatabase<ItemStack> {
  constructor(manager: DatabaseManager, protected readonly itemStack: ItemStack) {
    super(manager);
    if (!itemStack) {
      throw new Error('ItemStack is null');
    }
    if (itemStack.isStackable) {
      throw new Error('Cannot create database on stackable items.');
    }
    this._uid = UniqueIdUtils.getItemUniqueId(itemStack);
    this.itemStack.getDynamicPropertyIds().forEach((propertyId) => {
      if (!this._dynamicProperty.validateDataIdentifier(propertyId)) return;
      const id = this._dynamicProperty.extractDataIdentifier(propertyId);
      const value = Utils.deserializeData(this.itemStack.getDynamicProperty(propertyId));
      this._dataMap.set(id, value);
    });
  }

  public static create(manager: DatabaseManager, gameObject: ItemStack) {
    return new ItemStackDatabase(manager, gameObject);
  }

  public getGameObject(): ItemStack {
    return this.itemStack;
  }

  public _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue) {
    Utils.assertInvokedByTendrock(runtimeId);
    this._dynamicProperty.putToItem(this.itemStack, identifier, value);
  }
}