import {Dimension, DimensionLocation, system, Vector3} from "@minecraft/server";
import {
  DynamicPropertyValue, NamespacedDynamicProperty, TendrockDynamicPropertyValue
} from "../NamespacedDynamicProperty";
import {UniqueIdUtils} from "./UniqueIdUtils";

export interface IdentifierParseResult {
  namespace: string;
  dataIdentifier: string;
  lid?: string;
}

export class Utils {

  public static assertInvokedByTendrock(runtimeId: string) {
    if (runtimeId !== UniqueIdUtils.RuntimeId) {
      throw new Error("This method can not be invoked manually!");
    }
  }

  public static getDimensionShortName(dimension: Dimension) {
    switch (dimension.id) {
      case "minecraft:overworld" :
        return 'o';
      case "minecraft:nether":
        return 'n';
      case "minecraft:the_end":
        return 'e';
    }
    return undefined;
  }

  public static toFixed(num: number, precision = 2, isFixed = true) {
    return isFixed ? num.toFixed(precision) : num;
  }

  public static getLocationId(dimensionLocation: DimensionLocation, fixed = false) {
    const {dimension, ...location} = dimensionLocation;
    const dimensionShortName = this.getDimensionShortName(dimension);
    if (!dimensionShortName) {
      throw new Error(`Invalid dimension: ${dimension.id}`);
    }
    return `${dimensionShortName}${this.toFixed(location.x, 2, fixed)}_${this.toFixed(location.y, 2, fixed)}_${this.toFixed(location.z, 2, fixed)}`.replaceAll('-', 'f');
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

  private static _getTendrockPropertyId(identifier: string) {
    if (!identifier.startsWith(NamespacedDynamicProperty.TendrockPropertyIdPrefix)) {
      return undefined;
    }
    return identifier.substring(NamespacedDynamicProperty.TendrockPropertyIdPrefix.length);
  }

  private static parseDataIdentifier(identifier: string) {
    const split = identifier.split('-');
    if (split.length !== 2) {
      return undefined;
    }
    return {namespace: split[0], dataIdentifier: split[1]};
  }

  private static parseBlockDataIdentifier(identifier: string) {
    const split = identifier.split('-');
    if (split.length !== 3) {
      return undefined;
    }
    return {namespace: split[0], lid: split[1], dataIdentifier: split[2]};
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