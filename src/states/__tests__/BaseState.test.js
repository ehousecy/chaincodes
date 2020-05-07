import {BaseState} from '../BaseState';
import {ChaincodeStub} from 'fabric-shim';
import {StateImmutableFields} from '../Constants';

jest.mock('fabric-shim');
jest.mock('../../utils', () => ({
  constructCallerInfo: () => ({mspid: 'orgid', id: 'id'})
}));


describe('BaseState', () => {
  const stub = new ChaincodeStub();
  stub.getCreator = jest.fn().mockReturnValue({
    getIdBytes: jest.fn(),
    getMspid: jest.fn()
  });
  const data = {encryptedFields: ['fieldname']};
  const fields = StateImmutableFields;
  const validateRequiredBackup = BaseState.validateRequiredFields;
  beforeEach(() => {
    BaseState.validateRequiredFields = jest.fn().mockReturnValue(true);
    BaseState.hash = jest.fn().mockReturnValue('id');
  });
  // const validateRequiredFields = BaseState.validateRequiredFields;
  test('should init BaseState', () => {
    const tmp = BaseState.prototype.mergeSettledData;
    BaseState.prototype.mergeSettledData = jest.fn();
    const bs = new BaseState(stub, data, fields);
    expect(BaseState.validateRequiredFields).toBeCalled();
    expect(bs.memberIdentity).toEqual('id');
    expect(bs.orgMspId).toEqual('orgid');
    expect(bs.encryptedFields).toEqual(['fieldname']);
    expect(bs._stub).toEqual(stub);
    expect(bs.mergeSettledData).toBeCalledWith(data, fields);
    BaseState.prototype.mergeSettledData = tmp;
  });

  test('isSubmitByCallerOrg', () => {
    const bs = new BaseState(stub, data, fields);
    bs.orgMspId = 'aorgid';
    expect(() => bs.isSubmitByCallerOrg()).toThrow(/organization msp/gi);
  });

  test('isSubmitByCaller', () => {
    const bs = new BaseState(stub, data, fields);
    bs.memberIdentity = 'aid';
    expect(() => bs.isSubmitByCaller()).toThrow(/identity/gi);
  });

  test('should implement toJSON, call getChainKey, set chainKey and remove _stub', () => {
    const tmp = BaseState.getChainKey;
    BaseState.getChainKey = jest.fn().mockReturnValue('chain-key');
    const bs = new BaseState(stub, data, fields);
    expect(bs.toJSON).toBeTruthy();
    expect(bs.chainKey).toBeFalsy();
    expect(bs._stub).toBeTruthy();
    const ret = bs.toJSON();
    expect(BaseState.getChainKey).toBeCalled();
    expect(bs.chainKey).toEqual('chain-key');
    expect(ret._stub).toBeFalsy();
    BaseState.getChainKey = tmp;
  });

  test('should implement toString, call toJSON inside of it', () => {
    const tmp = BaseState.prototype.toJSON;
    BaseState.prototype.toJSON = jest.fn().mockReturnValue({});
    const bs = new BaseState(stub, data, fields);
    expect(bs.toString).toBeTruthy();
    bs.toString();
    expect(bs.toJSON).toBeCalled();
    BaseState.prototype.toJSON = tmp;
  });

  test('should implement toBuffer, call toString inside of it', () => {
    const tmp = BaseState.prototype.toString;
    BaseState.prototype.toString = jest.fn().mockReturnValue('');
    const bs = new BaseState(stub, data, fields);
    expect(bs.toBuffer).toBeTruthy();
    bs.toBuffer();
    expect(bs.toString).toBeCalled();
    BaseState.prototype.toString = tmp;
  });

  test('mergeSettledData should ignore immutableFields', () => {
    const bs = new BaseState(stub, data, fields);
    bs.memberIdentity = 'id';
    bs.orgMspId = 'orgid';
    bs.mergeSettledData({memberIdentity: 'aid', orgMspId: 'aorgid'}, ['memberIdentity', 'orgMspId']);
    expect(bs.memberIdentity).toEqual('id');
    expect(bs.orgMspId).toEqual('orgid');
    bs.mergeSettledData({memberIdentity: 'aid', orgMspId: 'aorgid'});
    expect(bs.memberIdentity).toEqual('aid');
    expect(bs.orgMspId).toEqual('aorgid');
  });

  test('validateRequiredFields should throw error if missing required fields', () => {
    BaseState.validateRequiredFields = validateRequiredBackup;
    expect(() => BaseState.validateRequiredFields(['required'], {})).toThrow(/required/gi);
  });

  test('should implement ChainKey', () => {
    const bs = new BaseState(stub, data, fields);
    expect(bs.ChainKey).toBeTruthy();
  });

  test('should implement ChainKeyFields', () => {
    const bs = new BaseState(stub, data, fields);
    expect(bs.ChainKeyFields).toBeTruthy();
  });

  test('should implement static ChainKeyType', () => {
    expect(BaseState.ChainKeyType).toBeTruthy();
  });

  test('static getChainKey should throw error if keys is empty', () => {
    expect(() => BaseState.getChainKey(stub, [], {})).toThrow(/chain keys/gi);
  });

  test('static getChainKey should convert keys to lowercase', () => {
    expect(() => BaseState.getChainKey(stub, [], {})).toThrow(/chain keys/gi);
  });

  test('static getChainKey should filter empty value', () => {
    const key = 'UPPERCASE';
    const tmp = String.prototype.toLowerCase;
    String.prototype.toLowerCase = jest.fn().mockReturnValue(key.toLowerCase());
    BaseState.getChainKey(
      stub,
      [key, key],
      {[key]: 'VALUE'}
    );
    expect(String.prototype.toLowerCase).toBeCalledTimes(2);
    String.prototype.toLowerCase = tmp;
  });

  test('static getChainKey should throw if values is empty', () => {
    expect(() => BaseState.getChainKey(
      stub,
      ['missingfield'],
      {field: 'value'}
    )).toThrow(/construct chainKey/gi);

  });
});
