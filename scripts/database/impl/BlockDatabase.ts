import {GameObjectDatabase} from "../GameObjectDatabase";
import {Block} from "@minecraft/server";
import {TendrockDynamicPropertyValue} from "../NamespacedDynamicProperty";
import {Utils} from "../helper/Utils";
import {UniqueIdUtils} from "../helper/UniqueIdUtils";
import {NamespacedDatabaseManager} from "../manager/NamespacedDatabaseManager";

export class BlockDatabase extends GameObjectDatabase<Block> {
  constructor(namespace: string, manager: NamespacedDatabaseManager, protected readonly block: Block, initialIdList?: string[]) {
    super(namespace, manager);
    this._uid = UniqueIdUtils.getBlockUniqueId(block);
    if (initialIdList) {
      initialIdList.forEach(id => {
        const value = Utils.deserializeData(this._dynamicProperty.getFromBlock(this._uid, id));
        this._dataMap.set(id, value);
      });
    }
  }

  public static create(namespace: string, manager: NamespacedDatabaseManager, gameObject: Block, initialIdList: string[]) {
    return new BlockDatabase(namespace, manager, gameObject, initialIdList);
  }

  public getGameObject(): Block {
    return this.block;
  }

  public _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue) {
    this._assertInvokedByTendrock(runtimeId);
    this._dynamicProperty.putToBlock(this._uid, identifier, value);
  }
}