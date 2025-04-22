import {GameObjectDatabase} from "../GameObjectDatabase";
import {Utils} from "../helper/Utils";
import {InstanceSerializer} from "./InstanceSerializer";

interface InstanceDataOptions {
  database: GameObjectDatabase<any>,
  identifier: string;
}

export class InstanceData {
  private _tendrockInstanceOptions!: InstanceDataOptions;

  constructor(dataJson: any | undefined, options: any | undefined) {
  }

  public toJSON() {
    const serializer = new InstanceSerializer();
    this.serialize(serializer);
    return serializer.toJSON();
  }

  public serialize(serializer: InstanceSerializer) {
    serializer.put('constructorName', this.constructor.name);
  }

  public _initInstanceOptions(runtimeId: string, options: InstanceDataOptions) {
    Utils.assertInvokedByTendrock(runtimeId);
    this._tendrockInstanceOptions = options;
    return this;
  }

  public markDirty() {
    this._tendrockInstanceOptions.database.set(this._tendrockInstanceOptions.identifier, this as any);
  }
}