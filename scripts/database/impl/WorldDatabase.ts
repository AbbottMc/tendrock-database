import {GameObjectDatabase} from "../GameObjectDatabase";
import {world, World} from "@minecraft/server";
import {TendrockDynamicPropertyValue} from "../NamespacedDynamicProperty";
import {Utils} from "../helper/Utils";

export class WorldDatabase extends GameObjectDatabase<World> {
  constructor(namespace: string, initialIdList?: string[]) {
    super(namespace);
    if (initialIdList) {
      initialIdList.forEach(id => {
        const value = Utils.deserializeData(this._dynamicProperty.getFromWorld(id));
        this._dataMap.set(id, value);
      });
    }
  }

  public static create(namespace: string, options?: { initialIdList: string[] }) {
    return new WorldDatabase(namespace, options?.initialIdList);
  }

  public getGameObject(): World {
    return world;
  }

  public _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue) {
    super._saveData(runtimeId, identifier, value);
    this._dynamicProperty.putToWorld(identifier, value);
  }
}