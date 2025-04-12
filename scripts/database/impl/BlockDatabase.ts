import {GameObjectDatabase} from "../GameObjectDatabase";
import {Block} from "@minecraft/server";
import {TendrockDynamicPropertyValue} from "../NamespacedDynamicProperty";
import {Utils} from "../helper/Utils";

export class BlockDatabase extends GameObjectDatabase<Block> {
  private readonly _lid: string;

  constructor(namespace: string, protected readonly block: Block, initialIdList?: string[]) {
    super(namespace);
    this._lid = Utils.getLocationId(block);
    if (initialIdList) {
      initialIdList.forEach(id => {
        const value = Utils.deserializeData(this._dynamicProperty.getFromBlock(this._lid, id));
        this._dataMap.set(id, value);
      });
    }
  }

  public static create(namespace: string, options: { gameObject: Block, initialIdList: string[] }) {
    return new BlockDatabase(namespace, options.gameObject, options.initialIdList);
  }

  public getGameObject(): Block {
    return this.block;
  }

  public _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue) {
    super._saveData(runtimeId, identifier, value);
    this._dynamicProperty.putToBlock(this._lid, identifier, value);
  }
}