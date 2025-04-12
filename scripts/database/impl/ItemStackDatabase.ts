import {GameObjectDatabase} from "../GameObjectDatabase";
import {ItemStack} from "@minecraft/server";
import {TendrockDynamicPropertyValue} from "../NamespacedDynamicProperty";
import {Utils} from "../helper/Utils";

export class ItemStackDatabase extends GameObjectDatabase<ItemStack> {
  constructor(namespace: string, protected readonly itemStack: ItemStack) {
    super(namespace);
    this.itemStack.getDynamicPropertyIds().forEach((identifier) => {
      const id = this._dynamicProperty.extractDataIdentifier(identifier);
      const value = Utils.deserializeData(this.itemStack.getDynamicProperty(id));
      this._dataMap.set(id, value);
    });
  }

  public static create(namespace: string, options: { gameObject: ItemStack, initialIdList?: string[] }) {
    return new ItemStackDatabase(namespace, options.gameObject);
  }

  public getGameObject(): ItemStack {
    return this.itemStack;
  }

  public _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue) {
    super._saveData(runtimeId, identifier, value);
    this._dynamicProperty.putToItem(this.itemStack, identifier, value);
  }
}