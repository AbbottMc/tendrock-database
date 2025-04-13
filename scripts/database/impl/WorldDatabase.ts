import {GameObjectDatabase} from "../GameObjectDatabase";
import {World} from "@minecraft/server";
import {TendrockDynamicPropertyValue} from "../NamespacedDynamicProperty";
import {Utils} from "../helper/Utils";
import {NamespacedDatabaseManager} from "../manager/NamespacedDatabaseManager";

export class WorldDatabase extends GameObjectDatabase<World> {
  constructor(namespace: string, manager: NamespacedDatabaseManager, protected readonly world: World, initialIdList?: string[]) {
    super(namespace, manager);
    this._uid = 'world@0';
    if (initialIdList) {
      initialIdList.forEach(id => {
        const value = Utils.deserializeData(this._dynamicProperty.getFromWorld(id));
        this._dataMap.set(id, value);
      });
    }
  }

  public static create(namespace: string, manager: NamespacedDatabaseManager, gameObject: World, initialIdList?: string[]) {
    return new WorldDatabase(namespace, manager, gameObject, initialIdList);
  }

  public getGameObject(): World {
    return this.world;
  }

  public _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue) {
    this._assertInvokedByTendrock(runtimeId);
    this._dynamicProperty.putToWorld(identifier, value);
  }
}