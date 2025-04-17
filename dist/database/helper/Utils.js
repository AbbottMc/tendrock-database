var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { system, world } from "@minecraft/server";
import { NamespacedDynamicProperty } from "../NamespacedDynamicProperty";
import { UniqueIdUtils } from "./UniqueIdUtils";
export class Utils {
    static assertInvokedByTendrock(runtimeId) {
        if (runtimeId !== UniqueIdUtils.RuntimeId) {
            throw new Error("This method can not be invoked manually!");
        }
    }
    static getDimensionShortName(dimension) {
        switch (dimension.id) {
            case "minecraft:overworld":
                return 'o';
            case "minecraft:nether":
                return 'n';
            case "minecraft:the_end":
                return 'e';
        }
        return undefined;
    }
    static toFixed(num, precision = 2, isFixed = true) {
        return isFixed ? num.toFixed(precision) : num;
    }
    static getLocationId(dimensionLocation, fixed = false) {
        const { dimension } = dimensionLocation, location = __rest(dimensionLocation, ["dimension"]);
        const dimensionShortName = this.getDimensionShortName(dimension);
        if (!dimensionShortName) {
            throw new Error(`Invalid dimension: ${dimension.id}`);
        }
        return `${dimensionShortName}${this.toFixed(location.x, 2, fixed)}_${this.toFixed(location.y, 2, fixed)}_${this.toFixed(location.z, 2, fixed)}`.replaceAll('-', 'f');
    }
    static isLocationId(str) {
        return /^[one](f\d+|\d+)_(f\d+|\d+)_(f\d+|\d+)$/g.test(str);
    }
    static lidToVec(lid) {
        const lidSub = lid.substring(1);
        const lidSplit = lidSub.replaceAll('f', '-').split('_');
        return {
            x: Number(lidSplit[0]),
            y: Number(lidSplit[1]),
            z: Number(lidSplit[2])
        };
    }
    static lidToDimension(lid) {
        if (!this.isLocationId(lid)) {
            throw new Error(`Invalid location id: ${lid}`);
        }
        const dimensionShortName = lid.substring(0, 1);
        switch (dimensionShortName) {
            case 'o':
                return world.getDimension("minecraft:overworld");
            case 'n':
                return world.getDimension("minecraft:nether");
            case 'e':
                return world.getDimension("minecraft:the_end");
            default:
                throw new Error(`Invalid dimension short name: ${dimensionShortName}`);
        }
    }
    static lidToDimensionLocation(lid) {
        if (!this.isLocationId(lid))
            return {};
        return Object.assign({ dimension: this.lidToDimension(lid) }, this.lidToVec(lid));
    }
    static getDimensionLocation(locationOrLid) {
        if (typeof locationOrLid === 'string') {
            return this.lidToDimensionLocation(locationOrLid);
        }
        return locationOrLid;
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
    static _getTendrockPropertyId(identifier) {
        if (!identifier.startsWith(NamespacedDynamicProperty.TendrockPropertyIdPrefix)) {
            return undefined;
        }
        return identifier.substring(NamespacedDynamicProperty.TendrockPropertyIdPrefix.length);
    }
    static parseDataIdentifier(identifier) {
        const split = identifier.split('-');
        if (split.length !== 2) {
            return undefined;
        }
        return { namespace: split[0], dataIdentifier: split[1] };
    }
    static parseBlockDataIdentifier(identifier) {
        const split = identifier.split('-');
        if (split.length !== 3) {
            return undefined;
        }
        return { namespace: split[0], lid: split[1], dataIdentifier: split[2] };
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
