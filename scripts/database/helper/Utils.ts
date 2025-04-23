import {system, Vector3} from "@minecraft/server";
import {UniqueIdUtils} from "./UniqueIdUtils";

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