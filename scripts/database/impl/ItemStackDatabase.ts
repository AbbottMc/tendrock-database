import {GameObjectDatabase} from "../GameObjectDatabase";
import {ItemStack} from "@minecraft/server";
import {TendrockDynamicPropertyValue} from "../NamespacedDynamicProperty";

export class ItemStackDatabase extends GameObjectDatabase<ItemStack> {
  constructor(namespace: string, protected readonly itemStack: ItemStack) {
    super(namespace);
    this.itemStack.getDynamicPropertyIds().forEach((identifier) => {
      const id = this._dynamicProperty.extractDataIdentifier(identifier);
      const value = this.itemStack.getDynamicProperty(id);
      this._dataMap.set(id, value);
    });
  }

  public static create(namespace: string, options: { gameObject: ItemStack, initialIdList?: string[] }) {
    return new ItemStackDatabase(namespace, options.gameObject);
  }

  public getGameObject(): ItemStack {
    return this.itemStack;
  }

  public saveData(identifier: string, value: TendrockDynamicPropertyValue) {
    this._dynamicProperty.putToItem(this.itemStack, identifier, value);
  }
}