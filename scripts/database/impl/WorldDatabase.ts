import {GameObjectDatabase} from "../GameObjectDatabase";
import {World} from "@minecraft/server";
import {TendrockDynamicPropertyValue} from "../DynamicPropertySerializer";
import {Utils} from "../helper/Utils";
import {DatabaseManager} from "../manager";

export class WorldDatabase extends GameObjectDatabase<World> {
  constructor(manager: DatabaseManager, protected readonly world: World, initialIdList?: [string, string][]) {
    super(manager);
    this._uid = 'world@0';
    if (initialIdList) {
      initialIdList.forEach(([propertyId, dataId]) => {
        const value =  this._dynamicProperty.deserializePropertyValueToData(world.getDynamicProperty(propertyId));
        this._dataMap.set(dataId, this._dynamicProperty.deserializeDataToInstance(this._uid, value, dataId, this) as any);
      });
    }
  }

  public static create(manager: DatabaseManager, gameObject: World, initialIdList?: [string, string][]) {
    return new WorldDatabase(manager, gameObject, initialIdList);
  }

  public getGameObject(): World {
    return this.world;
  }

  public _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue) {
    Utils.assertInvokedByTendrock(runtimeId);
    this._dynamicProperty.putToWorld(identifier, value);
  }
}