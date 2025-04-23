import { world } from "@minecraft/server";
import { Utils } from "./helper/Utils";
import { LocationUtils } from "@tendrock/location-id";
import { ConstructorRegistryImpl } from "./instance/ConstructorRegistry";
export class DynamicPropertySerializer {
    constructor() {
    }
    serializeNonBlockDataIdToPropertyId(identifier) {
        return `${DynamicPropertySerializer.TendrockPropertyIdPrefix}${identifier}`;
    }
    serializeBlockIdToPropertyId(locationOrLid, identifier) {
        if (identifier.includes('-')) {
            throw new Error(`Invalid identifier: "${identifier}"`);
        }
        return `${DynamicPropertySerializer.TendrockPropertyIdPrefix}${typeof locationOrLid === 'string' ? locationOrLid : LocationUtils.getLocationId(locationOrLid)}-${identifier}`;
    }
    validatePropertyId(propertyId) {
        return propertyId.startsWith(`${DynamicPropertySerializer.TendrockPropertyIdPrefix}`);
    }
    validateBlockPropertyId(propertyId) {
        return propertyId.startsWith(`${DynamicPropertySerializer.TendrockPropertyIdPrefix}`) && propertyId.split('-').length === 2;
    }
    getNonBlockDataId(propertyId) {
        if (!this.validatePropertyId(propertyId)) {
            return propertyId;
        }
        return propertyId.replace(DynamicPropertySerializer.TendrockPropertyIdPrefix, '');
    }
    getBlockDataId(block, propertyId) {
        if (!this.validateBlockPropertyId(propertyId)) {
            return propertyId;
        }
        const lid = typeof block === 'string' ? block : LocationUtils.getLocationId(block);
        const blockDataIdentifier = this.getNonBlockDataId(propertyId);
        return blockDataIdentifier.startsWith(lid) ? blockDataIdentifier.substring(lid.length + 2) : blockDataIdentifier;
    }
    serializeDataToPropertyValue(value) {
        if (value === undefined)
            return undefined;
        if (Utils.isVector3(value)) {
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
    deserializePropertyValueToData(value) {
        if (typeof value === 'string' && value.startsWith('[tendrock object]')) {
            return JSON.parse(value.substring(17));
        }
        else {
            return value;
        }
    }
    deserializeDataToInstance(uniqueId, value, identifier, database) {
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
    deserializePropertyId(propertyId) {
        if (!this.validatePropertyId(propertyId)) {
            return {};
        }
        const dataIdentifier = this.getNonBlockDataId(propertyId);
        const dataIdSplit = dataIdentifier.split('-');
        if (dataIdSplit.length === 2) {
            return { lid: dataIdSplit[0], dataIdentifier: dataIdSplit[1] };
        }
        else {
            return { dataIdentifier };
        }
    }
    putToWorld(identifier, value) {
        world.setDynamicProperty(this.serializeNonBlockDataIdToPropertyId(identifier), this.serializeDataToPropertyValue(value));
    }
    putToBlock(blockOrLid, identifier, value) {
        world.setDynamicProperty(this.serializeBlockIdToPropertyId(blockOrLid, identifier), this.serializeDataToPropertyValue(value));
    }
    putToEntity(entity, identifier, value) {
        entity.setDynamicProperty(this.serializeNonBlockDataIdToPropertyId(identifier), this.serializeDataToPropertyValue(value));
    }
    putToItem(item, identifier, value) {
        item.setDynamicProperty(this.serializeNonBlockDataIdToPropertyId(identifier), this.serializeDataToPropertyValue(value));
    }
    getFromWorld(identifier) {
        return world.getDynamicProperty(this.serializeNonBlockDataIdToPropertyId(identifier));
    }
    getFromBlock(blockOrLid, identifier) {
        return world.getDynamicProperty(this.serializeBlockIdToPropertyId(blockOrLid, identifier));
    }
}
DynamicPropertySerializer.TendrockPropertyIdPrefix = '[tendrock]';
DynamicPropertySerializer.Instance = new DynamicPropertySerializer();
