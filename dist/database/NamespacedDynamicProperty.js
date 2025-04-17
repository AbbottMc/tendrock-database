import { world } from "@minecraft/server";
import { Utils } from "./helper/Utils";
export class NamespacedDynamicProperty {
    constructor(namespace) {
        this.namespace = namespace;
        if (namespace.includes('-')) {
            throw new Error(`Invalid namespace: ${namespace}`);
        }
    }
    static create(namespace) {
        var _a;
        const db = (_a = this._dbMap.get(namespace)) !== null && _a !== void 0 ? _a : new NamespacedDynamicProperty(namespace);
        this._dbMap.set(namespace, db);
        return db;
    }
    getDataIdentifier(identifier) {
        if (identifier.includes('-')) {
            throw new Error(`Invalid identifier: "${identifier}"`);
        }
        return `${NamespacedDynamicProperty.TendrockPropertyIdPrefix}${this.namespace}-${identifier}`;
    }
    getBlockDataIdentifier(locationOrLid, identifier) {
        if (identifier.includes('-')) {
            throw new Error(`Invalid identifier: "${identifier}"`);
        }
        return `${NamespacedDynamicProperty.TendrockPropertyIdPrefix}${this.namespace}-${typeof locationOrLid === 'string' ? locationOrLid : Utils.getLocationId(locationOrLid)}-${identifier}`;
    }
    extractDataIdentifier(dataIdentifier) {
        return dataIdentifier.split('-')[1];
    }
    extractBlockDataIdentifier(block, dataIdentifier) {
        if (!dataIdentifier.includes('-')) {
            return dataIdentifier;
        }
        if (!this.validateBlockDataIdentifier(dataIdentifier)) {
            return dataIdentifier;
        }
        const lid = typeof block === 'string' ? block : Utils.getLocationId(block);
        const blockDataIdentifier = this.extractDataIdentifier(dataIdentifier);
        return blockDataIdentifier.startsWith(lid) ? blockDataIdentifier.substring(lid.length + 2) : blockDataIdentifier;
    }
    validateDataIdentifier(identifier) {
        return identifier.startsWith(`${NamespacedDynamicProperty.TendrockPropertyIdPrefix + this.namespace}-`);
    }
    validateBlockDataIdentifier(identifier) {
        return identifier.startsWith(`${NamespacedDynamicProperty.TendrockPropertyIdPrefix + this.namespace}-`) && identifier.split('-').length === 3;
    }
    putToWorld(identifier, value) {
        world.setDynamicProperty(this.getDataIdentifier(identifier), Utils.serializeData(value));
    }
    putToBlock(blockOrLid, identifier, value) {
        world.setDynamicProperty(this.getBlockDataIdentifier(blockOrLid, identifier), Utils.serializeData(value));
    }
    putToEntity(entity, identifier, value) {
        entity.setDynamicProperty(this.getDataIdentifier(identifier), Utils.serializeData(value));
    }
    putToItem(item, identifier, value) {
        item.setDynamicProperty(this.getDataIdentifier(identifier), Utils.serializeData(value));
    }
    getFromWorld(identifier) {
        return world.getDynamicProperty(this.getDataIdentifier(identifier));
    }
    getFromBlock(blockOrLid, identifier) {
        return world.getDynamicProperty(this.getBlockDataIdentifier(blockOrLid, identifier));
    }
}
NamespacedDynamicProperty.TendrockPropertyIdPrefix = '[tendrock]';
NamespacedDynamicProperty._dbMap = new Map();
