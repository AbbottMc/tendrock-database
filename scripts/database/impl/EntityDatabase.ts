import {GameObjectDatabase} from "../GameObjectDatabase";
import {Entity} from "@minecraft/server";
import {TendrockDynamicPropertyValue} from "../NamespacedDynamicProperty";
import {Utils} from "../helper/Utils";

export class EntityDatabase extends GameObjectDatabase<Entity> {
  constructor(namespace: string, protected readonly entity: Entity) {
    super(namespace);
    this.entity.getDynamicPropertyIds().forEach((identifier) => {
      const id = this._dynamicProperty.extractDataIdentifier(identifier);
      const value = Utils.deserializeData(this.entity.getDynamicProperty(id));
      this._dataMap.set(id, value);
    });
  }

  public static create(namespace: string, options: { gameObject: Entity }) {
    return new EntityDatabase(namespace, options.gameObject);
  }

  public getGameObject(): Entity {
    return this.entity;
  }

  public _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue) {
    super._saveData(runtimeId, identifier, value);
    this._dynamicProperty.putToEntity(this.entity, identifier, value);
  }
}