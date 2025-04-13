import {GameObjectDatabase} from "../GameObjectDatabase";
import {Entity} from "@minecraft/server";
import {TendrockDynamicPropertyValue} from "../NamespacedDynamicProperty";
import {Utils} from "../helper/Utils";
import {UniqueIdUtils} from "../helper/UniqueIdUtils";
import {NamespacedDatabaseManager} from "../manager/NamespacedDatabaseManager";

export class EntityDatabase extends GameObjectDatabase<Entity> {
  constructor(namespace: string, manager: NamespacedDatabaseManager, protected readonly entity: Entity) {
    super(namespace, manager);
    this._uid = UniqueIdUtils.getEntityUniqueId(entity);
    this.entity.getDynamicPropertyIds().forEach((propertyId) => {
      if (!this._dynamicProperty.validateDataIdentifier(propertyId)) return;
      const id = this._dynamicProperty.extractDataIdentifier(propertyId);
      const value = Utils.deserializeData(this.entity.getDynamicProperty(propertyId));
      this._dataMap.set(id, value);
    });
  }

  public static create(namespace: string, manager: NamespacedDatabaseManager, gameObject: Entity) {
    return new EntityDatabase(namespace, manager, gameObject);
  }

  public getGameObject(): Entity {
    return this.entity;
  }

  public _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue) {
    this._assertInvokedByTendrock(runtimeId);
    this._dynamicProperty.putToEntity(this.entity, identifier, value);
  }
}