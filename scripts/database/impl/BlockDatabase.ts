import {GameObjectDatabase} from "../GameObjectDatabase";
import {Block, DimensionLocation, world} from "@minecraft/server";
import {TendrockDynamicPropertyValue} from "../DynamicPropertySerializer";
import {Utils} from "../helper/Utils";
import {UniqueIdUtils} from "../helper/UniqueIdUtils";
import {DatabaseManager} from "../manager";
import {tryCatch} from "@tendrock/lib";
import {LocationUtils} from "@tendrock/location-id";

export class BlockDatabase extends GameObjectDatabase<Block> {
  protected block: Block | undefined;
  protected location: DimensionLocation;

  constructor(manager: DatabaseManager, locationOrLid: DimensionLocation | string, initialIdList?: [string, string][]) {
    super(manager);
    this._uid = UniqueIdUtils.getBlockUniqueId(locationOrLid);
    this.location = LocationUtils.getDimensionLocation(locationOrLid);
    this.initBlock();
    if (initialIdList) {
      initialIdList.forEach(([propertyId, dataId]) => {
        const value = Utils.deserializeData(world.getDynamicProperty(propertyId));
        this._dataMap.set(dataId, Utils.deserializeInstance(this._uid, value, dataId, this) as any);
      });
    }
  }

  protected initBlock() {
    this.block = tryCatch(() => this.location.dimension.getBlock(this.location)).data;
  }

  public static create(manager: DatabaseManager, gameObject: DimensionLocation | string, initialIdList: [string, string][]) {
    return new BlockDatabase(manager, gameObject, initialIdList);
  }

  public getGameObject(): Block {
    if (!this.block) {
      this.initBlock();
    }
    return this.block!;
  }

  public _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue) {
    Utils.assertInvokedByTendrock(runtimeId);
    this._dynamicProperty.putToBlock(this._uid, identifier, value);
  }
}