import { world } from "@minecraft/server";
import { Utils } from "./helper/Utils";
import { LocationUtils } from "@tendrock/location-id";
export class DynamicPropertySerializer {
    constructor() {
    }
    getDataIdentifier(identifier) {
        if (identifier.includes('-')) {
            throw new Error(`Invalid identifier: "${identifier}"`);
        }
        return `${DynamicPropertySerializer.TendrockPropertyIdPrefix}${identifier}`;
    }
    getBlockDataIdentifier(locationOrLid, identifier) {
        if (identifier.includes('-')) {
            throw new Error(`Invalid identifier: "${identifier}"`);
        }
        return `${DynamicPropertySerializer.TendrockPropertyIdPrefix}${typeof locationOrLid === 'string' ? locationOrLid : LocationUtils.getLocationId(locationOrLid)}-${identifier}`;
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
        const lid = typeof block === 'string' ? block : LocationUtils.getLocationId(block);
        const blockDataIdentifier = this.extractDataIdentifier(dataIdentifier);
        return blockDataIdentifier.startsWith(lid) ? blockDataIdentifier.substring(lid.length + 2) : blockDataIdentifier;
    }
    validateDataIdentifier(identifier) {
        return identifier.startsWith(`${DynamicPropertySerializer.TendrockPropertyIdPrefix}-`);
    }
    validateBlockDataIdentifier(identifier) {
        return identifier.startsWith(`${DynamicPropertySerializer.TendrockPropertyIdPrefix}-`) && identifier.split('-').length === 3;
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
DynamicPropertySerializer.TendrockPropertyIdPrefix = '[tendrock]';
DynamicPropertySerializer.Instance = new DynamicPropertySerializer();
