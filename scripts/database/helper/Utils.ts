import {system, Vector3} from "@minecraft/server";
import {
  DynamicPropertyValue, DynamicPropertySerializer, TendrockDynamicPropertyValue
} from "../DynamicPropertySerializer";
import {UniqueIdUtils} from "./UniqueIdUtils";
import {ConstructorRegistryImpl} from "../instance/ConstructorRegistry";
import {GameObjectDatabase} from "../GameObjectDatabase";

export interface IdentifierParseResult {
  dataIdentifier: string;
  lid?: string;
}

export class Utils {

  public static assertInvokedByTendrock(runtimeId: string) {
    if (runtimeId !== UniqueIdUtils.RuntimeId) {
      throw new Error("This method can not be invoked manually!");
    }
  }

  public static isVector3(value: any): value is Vector3 {
    return typeof value === "object" && value.x !== undefined && value.y !== undefined && value.z !== undefined;
  }

  public static serializeData(value: TendrockDynamicPropertyValue): DynamicPropertyValue {
    if (value === undefined) return undefined;
    if (this.isVector3(value)) {
      return value;
    }
    const valueType = typeof value;
    if (valueType === 'object') {
      return '[tendrock object]' + JSON.stringify(value);
    } else if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
      return value as DynamicPropertyValue;
    } else {
      throw new Error(`Invalid data type: ${valueType}`);
    }
  }

  public static deserializeData(value: DynamicPropertyValue): TendrockDynamicPropertyValue {
    if (typeof value === 'string' && value.startsWith('[tendrock object]')) {
      return JSON.parse(value.substring(17)) as TendrockDynamicPropertyValue;
    } else {
      return value as TendrockDynamicPropertyValue;
    }
  }

  public static deserializeInstance(uniqueId: string, value: TendrockDynamicPropertyValue, identifier: string, database: GameObjectDatabase<any>) {
    if (typeof value !== 'object' || Utils.isVector3(value)) {
      return value;
    }
    const {constructorName} = value;
    if (typeof constructorName !== 'string') return value;
    const constructor = ConstructorRegistryImpl.Instance.get(constructorName);
    if (!constructor) return value;
    return new constructor(value, {uniqueId, identifier, database}, undefined);
  }

  private static _getTendrockPropertyId(identifier: string) {
    if (!identifier.startsWith(DynamicPropertySerializer.TendrockPropertyIdPrefix)) {
      return undefined;
    }
    return identifier.substring(DynamicPropertySerializer.TendrockPropertyIdPrefix.length);
  }

  private static parseDataIdentifier(identifier: string) {
    const split = identifier.split('-');
    if (split.length !== 1) {
      return undefined;
    }
    return {dataIdentifier: identifier};
  }

  private static parseBlockDataIdentifier(identifier: string) {
    const split = identifier.split('-');
    if (split.length !== 2) {
      return undefined;
    }
    return {lid: split[0], dataIdentifier: split[1]};
  }

  public static parseIdentifier(identifier: string): IdentifierParseResult {
    const tendrockPropertyId = this._getTendrockPropertyId(identifier);
    if (!tendrockPropertyId) {
      return {} as IdentifierParseResult;
    }
    return this.parseDataIdentifier(tendrockPropertyId) ?? this.parseBlockDataIdentifier(tendrockPropertyId) ?? {} as IdentifierParseResult;
  }

  public static async runJob(generator: Generator<void, void, void>) {

    return new Promise((resolve, reject) => {
      const genGenerator = function* () {
        try {
          yield* generator;
          resolve(undefined);
        } catch (e) {
          reject(e);
        }
      };
      system.runJob(genGenerator());
    });
  }
}