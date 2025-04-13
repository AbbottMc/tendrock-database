import {GameObjectDatabase} from "../GameObjectDatabase";
import {ItemStack} from "@minecraft/server";
import {TendrockDynamicPropertyValue} from "../NamespacedDynamicProperty";
import {Utils} from "../helper/Utils";
import {UniqueIdUtils} from "../helper/UniqueIdUtils";
import {NamespacedDatabaseManager} from "../manager/NamespacedDatabaseManager";

export class ItemStackDatabase extends GameObjectDatabase<ItemStack> {
  constructor(namespace: string, manager: NamespacedDatabaseManager, protected readonly itemStack: ItemStack) {
    super(namespace, manager);
    this._uid = UniqueIdUtils.getItemUniqueId(itemStack);
    this.itemStack.getDynamicPropertyIds().forEach((identifier) => {
      const id = this._dynamicProperty.extractDataIdentifier(identifier);
      const value = Utils.deserializeData(this.itemStack.getDynamicProperty(id));
      this._dataMap.set(id, value);
    });
  }

  public static create(namespace: string, manager: NamespacedDatabaseManager, gameObject: ItemStack) {
    return new ItemStackDatabase(namespace, manager, gameObject);
  }

  public getGameObject(): ItemStack {
    return this.itemStack;
  }

  public _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue) {
    this._assertInvokedByTendrock(runtimeId);
    this._dynamicProperty.putToItem(this.itemStack, identifier, value);
  }
}