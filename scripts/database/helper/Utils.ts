import {Dimension, DimensionLocation, system, Vector3} from "@minecraft/server";
import {MinecraftDimensionTypes} from "@minecraft/vanilla-data";
import {DynamicPropertyValue, TendrockDynamicPropertyValue} from "../NamespacedDynamicProperty";

export interface IdentifierParseResult {
  namespace: string;
  dataIdentifier: string;
  lid?: string;
}

export class Utils {
  public static getDimensionShortName(dimension: Dimension) {
    switch (dimension.id) {
      case MinecraftDimensionTypes.Overworld :
        return 'o';
      case MinecraftDimensionTypes.Nether:
        return 'n';
      case MinecraftDimensionTypes.TheEnd:
        return 'e';
    }
    return undefined;
  }

  public static getLocationId(dimensionLocation: DimensionLocation) {
    const {dimension, ...location} = dimensionLocation;
    const dimensionShortName = this.getDimensionShortName(dimension);
    if (!dimensionShortName) {
      throw new Error(`Invalid dimension: ${dimension.id}`);
    }
    return `${dimensionShortName}${location.x}_${location.y}_${location.z}`.replaceAll('-', 'f');
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
    return this.parseDataIdentifier(identifier) ?? this.parseBlockDataIdentifier(identifier) ?? {} as IdentifierParseResult;
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