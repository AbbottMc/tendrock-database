import {GameObjectDatabase} from "../GameObjectDatabase";
import {Entity} from "@minecraft/server";
import {TendrockDynamicPropertyValue} from "../DynamicPropertySerializer";
import {Utils} from "../helper/Utils";
import {UniqueIdUtils} from "../helper/UniqueIdUtils";
import {DatabaseManager} from "../manager";

export class EntityDatabase extends GameObjectDatabase<Entity> {
  private _newEntityBuffer: Entity | undefined;

  constructor(manager: DatabaseManager, protected _entity: Entity) {
    super(manager);
    this._uid = UniqueIdUtils.getEntityUniqueId(_entity);
    this._entity.getDynamicPropertyIds().forEach((propertyId) => {
      if (!this._dynamicProperty.validatePropertyId(propertyId)) return;
      const id = this._dynamicProperty.getNonBlockDataId(propertyId);
      const value = this._dynamicProperty.deserializePropertyValueToData(this._entity.getDynamicProperty(propertyId));
      this._dataMap.set(id, value);
    });
  }

  public static create(manager: DatabaseManager, gameObject: Entity) {
    return new EntityDatabase(manager, gameObject);
  }

  public getGameObject(): Entity {
    return this._entity;
  }

  public _saveData(runtimeId: string, identifier: string, value: TendrockDynamicPropertyValue) {
    Utils.assertInvokedByTendrock(runtimeId);
    this._dynamicProperty.putToEntity(this._entity, identifier, value);
  }

  protected _onFlushFinished() {
    super._onFlushFinished();
    if (this._newEntityBuffer) {
      this._markDirtyWhenEntityChange(this._newEntityBuffer);
      this._newEntityBuffer = undefined;
    }
  }

  protected _markDirtyWhenEntityChange(entity: Entity) {
    // this.clearDynamicProperties();
    this._dirtyDataIdList = Array.from(this._dataMap.keys());
    this.parentManager._markDirty(UniqueIdUtils.RuntimeId, this);
  }

  public _setEntity(runtimeId: string, entity: Entity) {
    Utils.assertInvokedByTendrock(runtimeId);
    this._uid = UniqueIdUtils.getEntityUniqueId(entity);
    this.parentManager.remove(this._entity);
    this._entity = entity;
    this.parentManager._addDatabase(UniqueIdUtils.RuntimeId, this);

    if (this.isFlushing()) {
      this._newEntityBuffer = entity;
    } else {
      this._markDirtyWhenEntityChange(entity);
    }
  }
}