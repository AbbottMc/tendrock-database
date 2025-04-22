import {GameObjectDatabase} from "../GameObjectDatabase";
import {InstanceSerializer} from "./InstanceSerializer";
import {DatabaseTypeBy, GameObjectType} from "../manager";

export interface InstanceDataOptions {
  database: GameObjectDatabase<any>,
  identifier: string;
  uniqueId: string;
}

export class InstanceData<GOT extends Exclude<GameObjectType, string>> {
  public readonly database: DatabaseTypeBy<GOT>;
  public readonly identifier: string;
  public readonly uniqueId: string;

  constructor(dataJson: any | undefined, instanceDataOptions: InstanceDataOptions, options: any | undefined) {
    this.database = instanceDataOptions.database as DatabaseTypeBy<GOT>;
    this.identifier = instanceDataOptions.identifier;
    this.uniqueId = instanceDataOptions.uniqueId;
  }

  public toJSON() {
    const serializer = new InstanceSerializer();
    this.serialize(serializer);
    return serializer.toJSON();
  }

  public serialize(serializer: InstanceSerializer) {
    serializer.put('constructorName', this.constructor.name);
  }

  public markDirty() {
    this.database.set(this.identifier, this as any);
  }
}