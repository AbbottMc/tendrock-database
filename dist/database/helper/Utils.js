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
import { DynamicPropertySerializer } from "../DynamicPropertySerializer";
import { UniqueIdUtils } from "./UniqueIdUtils";
import { ConstructorRegistryImpl } from "../instance/ConstructorRegistry";
export class Utils {
    static assertInvokedByTendrock(runtimeId) {
        if (runtimeId !== UniqueIdUtils.RuntimeId) {
            throw new Error("This method can not be invoked manually!");
        }
    }
    static isVector3(value) {
        return typeof value === "object" && value.x !== undefined && value.y !== undefined && value.z !== undefined;
    }
    static serializeData(value) {
        if (value === undefined)
            return undefined;
        if (this.isVector3(value)) {
            return value;
        }
        const valueType = typeof value;
        if (valueType === 'object') {
            return '[tendrock object]' + JSON.stringify(value);
        }
        else if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
            return value;
        }
        else {
            throw new Error(`Invalid data type: ${valueType}`);
        }
    }
    static deserializeData(value) {
        if (typeof value === 'string' && value.startsWith('[tendrock object]')) {
            return JSON.parse(value.substring(17));
        }
        else {
            return value;
        }
    }
    static deserializeInstance(uniqueId, value, identifier, database) {
        if (typeof value !== 'object' || Utils.isVector3(value)) {
            return value;
        }
        const { constructorName } = value;
        if (typeof constructorName !== 'string')
            return value;
        const constructor = ConstructorRegistryImpl.Instance.get(constructorName);
        if (!constructor)
            return value;
        return new constructor(value, { uniqueId, identifier, database }, undefined);
    }
    static _getTendrockPropertyId(identifier) {
        if (!identifier.startsWith(DynamicPropertySerializer.TendrockPropertyIdPrefix)) {
            return undefined;
        }
        return identifier.substring(DynamicPropertySerializer.TendrockPropertyIdPrefix.length);
    }
    static parseDataIdentifier(identifier) {
        const split = identifier.split('-');
        if (split.length !== 1) {
            return undefined;
        }
        return { dataIdentifier: identifier };
    }
    static parseBlockDataIdentifier(identifier) {
        const split = identifier.split('-');
        if (split.length !== 2) {
            return undefined;
        }
        return { lid: split[0], dataIdentifier: split[1] };
    }
    static parseIdentifier(identifier) {
        var _a, _b;
        const tendrockPropertyId = this._getTendrockPropertyId(identifier);
        if (!tendrockPropertyId) {
            return {};
        }
        return (_b = (_a = this.parseDataIdentifier(tendrockPropertyId)) !== null && _a !== void 0 ? _a : this.parseBlockDataIdentifier(tendrockPropertyId)) !== null && _b !== void 0 ? _b : {};
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
