import {GameObjectDatabase} from "../GameObjectDatabase";
import {Block, world} from "@minecraft/server";
import {TendrockDynamicPropertyValue} from "../NamespacedDynamicProperty";
import {Utils} from "../helper/Utils";
import {UniqueIdUtils} from "../helper/UniqueIdUtils";
import {NamespacedDatabaseManager} from "../manager/NamespacedDatabaseManager";

export class BlockDatabase extends GameObjectDatabase<Block> {
  constructor(namespace: string, manager: NamespacedDatabaseManager, protected readonly block: Block, initialIdList?: [string, string][]) {
    super(namespace, manager);
    this._uid = UniqueIdUtils.getBlockUniqueId(block);
    if (initialIdList) {
      initialIdList.forEach(([propertyId, dataId]) => {
        const value = Utils.deserializeData(world.getDynamicProperty(propertyId));
        this._dataMap.set(dataId, value);
      });
    }
  }

  public static create(namespace: string, manager: NamespacedDatabaseManager, gameObject: Block, initialIdList: [string, string][]) {
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