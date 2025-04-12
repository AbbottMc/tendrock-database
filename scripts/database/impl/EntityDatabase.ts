import {GameObjectDatabase} from "../GameObjectDatabase";
import {Block, Entity} from "@minecraft/server";
import {TendrockDynamicPropertyValue} from "../NamespacedDynamicProperty";

export class EntityDatabase extends GameObjectDatabase<Entity> {
  constructor(namespace: string, protected readonly entity: Entity) {
    super(namespace);
    this.entity.getDynamicPropertyIds().forEach((identifier) => {
      const id = this._dynamicProperty.extractDataIdentifier(identifier);
      const value = this.entity.getDynamicProperty(id);
      this._dataMap.set(id, value);
    });
  }

  public static create(namespace: string, options: { gameObject: Entity }) {
    return new EntityDatabase(namespace, options.gameObject);
  }

  public getGameObject(): Entity {
    return this.entity;
  }

  public saveData(identifier: string, value: TendrockDynamicPropertyValue) {
    this._dynamicProperty.putToEntity(this.entity, identifier, value);
  }
}