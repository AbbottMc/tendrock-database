var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { system } from "@minecraft/server";
import { UniqueIdUtils } from "./UniqueIdUtils";
export class Utils {
    static assertInvokedByTendrock(runtimeId) {
        if (runtimeId !== UniqueIdUtils.RuntimeId) {
            throw new Error("This method can not be invoked manually!");
        }
    }
    static isVector3(value) {
        return typeof value === "object" && value.x !== undefined && value.y !== undefined && value.z !== undefined;
    }
    static runJob(generator) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const genGenerator = function* () {
                    try {
                        yield* generator;
                        resolve(undefined);
                    }
                    catch (e) {
                        reject(e);
                    }
                };
                system.runJob(genGenerator());
            });
        });
    }
}
