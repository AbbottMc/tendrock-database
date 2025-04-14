import {GameObjectDatabase} from "../GameObjectDatabase";
import {World} from "@minecraft/server";
import {TendrockDynamicPropertyValue} from "../NamespacedDynamicProperty";
import {Utils} from "../helper/Utils";
import {NamespacedDatabaseManager} from "../manager/NamespacedDatabaseManager";

export class WorldDatabase extends GameObjectDatabase<World> {
  constructor(namespace: string, manager: NamespacedDatabaseManager, protected readonly world: World, initialIdList?: [string, string][]) {
    super(namespace, manager);
    this._uid = 'world@0';
    if (initialIdList) {
      initialIdList.forEach(([propertyId, dataId]) => {
        const value = Utils.deserializeData(world.getDynamicProperty(propertyId));
        this._dataMap.set(dataId, value);
      });
    }
  }

  public static create(namespace: string, manager: NamespacedDatabaseManager, gameObject: World, initialIdList?: [string, string][]) {
    return new WorldDatabase(namespace, manager, gameObject, initialIdList);
  }

  public getGameObject(): World {
    return this.world;
  }

  public _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue) {
    Utils.assertInvokedByTendrock(runtimeId);
    this._dynamicProperty.putToWorld(identifier, value);
  }
}