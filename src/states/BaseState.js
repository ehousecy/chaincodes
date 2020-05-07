import { ChaincodeStub } from 'fabric-shim';
import { StateImmutableFields } from './Constants';
import { constructCallerInfo } from '../utils';

function validateArrayField(val) {
  if (!Array.isArray(val)) {
    throw new Error('Invalid array field');
  }
  return val;
}

function RequiredFieldError(fieldName) {
  return new Error(`Field is necessary: ${fieldName}`);
}

export class BaseState {
  static _RequiredFields = ['digest', 'signature', 'businessId'];
  static _ChainKeyFields = ['businessId'];

  constructor(stub, data, immutableFields) {
    if (!stub || !(stub instanceof ChaincodeStub)) {
      throw new Error('Chaincode State Error: Invalid Chainstub for constructing state data');
    }
    BaseState.validateRequiredFields(BaseState._RequiredFields, data);
    this.mergeSettledData(data, immutableFields || StateImmutableFields);
    const callerInfo = constructCallerInfo(stub);
    this.memberIdentity = data.memberIdentity || callerInfo.id;
    this.uploaderIdentity = callerInfo.id;
    this.orgMspId = callerInfo.mspid;
    // TODO: Ensure readRole & writeRole limitation
    this.encryptedFields = validateArrayField(data.encryptedFields || []);
    this._stub = stub;
  }

  updateFields(data) {
    Object.assign(this, data);
  }

  isSubmitByCallerOrg() {
    const orgMspId = constructCallerInfo(this._stub).mspid;
    if (this.orgMspId !== orgMspId) {
      throw new Error(`Invalid Organization MSP: ${this.orgMspId} != ${orgMspId}`);
    }
  }

  isSubmitByCaller() {
    const memberIdentity = constructCallerInfo(this._stub).id;
    if (this.memberIdentity !== memberIdentity && this.uploaderIdentity !== memberIdentity) {
      throw new Error(`Invalid member identity: ${this.memberIdentity} != ${memberIdentity}`);
    }
  }

  toJSON() {
    this.chainKey = BaseState.getChainKey(this._stub, this.ChainKeyFields(), this);
    const tmp = { ...this };
    delete tmp._stub;
    return tmp;
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }

  toBuffer() {
    return Buffer.from(this.toString());
  }

  mergeSettledData(data, immutableFields) {
    const _dataToMerge = Object.keys(data).reduce((res, key) => {
      if ((immutableFields || []).indexOf(key) === -1) {
        res[key] = data[key];
      }
      return res;
    }, {});
    Object.assign(this, _dataToMerge);
  }

  static validateRequiredFields(fields, data) {
    fields.forEach(field => {
      if (!data[field]) throw RequiredFieldError(field);
    });
  }

  ChainKey() {
    return BaseState.getChainKey(this._stub, this.ChainKeyFields(), this);
  }

  ChainKeyFields() {
    return BaseState._ChainKeyFields;
  }

  static ChainKeyType() {
    return BaseState._ChainKeyFields.map(k => k.toLowerCase()).join('~');
  }

  static getChainKey(__stub, keys, data) {
    if (!keys || !keys.length) throw new Error('Invalid chain keys definition');
    const _keys = keys.map(k => k.toString().toLowerCase()).join('~');
    const keystr = keys
      .reduce((vals, key) => vals.concat([(data[key] || '').toString()]), [])
      .filter(v => !!v)
      .join('_');
    if (!keystr.length) {
      throw new Error('Can not construct chainKey[' + _keys + ' with ', ...keystr);
    }
    return keystr;
  }
}
