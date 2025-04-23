import {GameObjectDatabase} from "../GameObjectDatabase";
import {InstanceSerializer} from "./InstanceSerializer";
import {DatabaseTypeBy, GameObjectType} from "../manager";

export interface InstanceDataOptions {
  database: GameObjectDatabase<any>,
  identifier: string;
  uniqueId: string;
}

export interface InstanceDataJson {
  constructorName: string;
}

export abstract class InstanceData<GOT extends Exclude<GameObjectType, string>> {
  public readonly database: DatabaseTypeBy<GOT>;
  public readonly identifier: string;
  public readonly uniqueId: string;
  private readonly _serializer = new InstanceSerializer();

  constructor(dataJson: InstanceDataJson | undefined, instanceDataOptions: InstanceDataOptions, options: any | undefined) {
    this.database = instanceDataOptions.database as DatabaseTypeBy<GOT>;
    this.identifier = instanceDataOptions.identifier;
    this.uniqueId = instanceDataOptions.uniqueId;
    if (dataJson) {
      this.onDeserialize(dataJson, instanceDataOptions, options);
    } else if (options) {
      this.onConstruct(options, instanceDataOptions);
    } else {
      this.onInitWithNoData(instanceDataOptions);
    }
  }

  public abstract onDeserialize(dataJson: InstanceDataJson, instanceDataOptions: InstanceDataOptions, options: any | undefined): void;

  public abstract onConstruct(options: unknown, instanceDataOptions: InstanceDataOptions): void;

  public abstract onInitWithNoData(instanceDataOptions: InstanceDataOptions): void;

  public toJSON() {
    this._serializer.clear();
    this.serialize(this._serializer);
    return this._serializer.toJSON();
  }

  public serialize(serializer: InstanceSerializer) {
    serializer.put('constructorName', this.constructor.name);
  }

  public markDirty() {
    this.database.set(this.identifier, this as any);
  }
}