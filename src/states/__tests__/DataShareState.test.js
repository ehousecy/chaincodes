import {BaseState} from '../BaseState';
import {DataShareState} from '../DataShareState';
import {constructCallerInfo} from '../../utils';

jest.mock('../BaseState', () => ({
  BaseState: jest.fn().mockReturnValue({
    updateFields: jest.fn()
  })
}));

jest.mock('../../utils', () => ({
  constructCallerInfo: jest.fn()
}));

describe('DataShareState', () => {
  const stub = {
    getState: jest.fn()
  };
  const data = {};
  const fields = [];
  DataShareState.validateRequiredFields = jest.fn();
  test('should init BaseState to data_share, set stateType to data_share', () => {
    const dss = new DataShareState(stub, data, fields);
    expect(DataShareState.validateRequiredFields).toBeCalled();
    expect(dss.stateType).toEqual('data_share');
    expect(BaseState).toBeCalledWith(stub, data, fields);
  });

  test('should implement ChainKeyFields', () => {
    const es = new DataShareState(stub, data, fields);
    expect(es.ChainKeyFields).toBeTruthy();
  });

  test('should implement ChainKeyType', () => {
    expect(DataShareState.ChainKeyType).toBeTruthy();
  });

  test('should implement ChainKeyValues', () => {
    expect(DataShareState.ChainKeyValues).toBeTruthy();
  });

  describe('request', () => {
    let datashare;
    beforeEach(() => {
      datashare = {
        proposerIdentity: 'proposer',
        proposerPublicKey: 'publickey',
        targetKey: 'target',
        approverIdentity: 'approver',
        memberIdentity: 'proposer'
      };
    });
    test('should throw error if proposerPublicKey not set', async () => {
      delete datashare.proposerIdentity;
      const dss = new DataShareState(stub, datashare, []);
      await expect(dss.request()).rejects.toThrow(/required/gi);
    });
    test('should throw error if proposerIdentity not set', async () => {
      delete datashare.proposerPublicKey;
      const dss = new DataShareState(stub, datashare, []);
      await expect(dss.request()).rejects.toThrow(/required/gi);
    });
    test('should throw error if proposerIdentity is not current member identity', async () => {
      constructCallerInfo.mockReturnValueOnce({
        mspid: 'msp',
        id: 'anotherone'
      });
      const dss = new DataShareState(stub, datashare, []);
      Object.assign(dss, datashare, {_stub: stub});
      await expect(dss.request()).rejects.toThrow(/invalid proposer/gi);
      expect(constructCallerInfo).toBeCalledWith(stub);
    });
    test('should throw error if target state not found', async () => {
      constructCallerInfo.mockReturnValueOnce({
        mspid: 'msp',
        id: 'proposer'
      });
      const dss = new DataShareState(stub, datashare, []);
      Object.assign(dss, datashare, {_stub: stub});
      stub.getState.mockReturnValue('');
      await expect(dss.request()).rejects.toThrow(/not found/gi);
    });
    test('should throw error if target state memberIdentity is not approverIdentity', async () => {
      constructCallerInfo.mockReturnValueOnce({
        mspid: 'msp',
        id: 'proposer'
      });
      const dss = new DataShareState(stub, datashare, []);
      Object.assign(dss, datashare, {_stub: stub});
      stub.getState.mockReturnValue('{"memberIdentity": "proposer"}');
      await expect(dss.request()).rejects.toThrow(/not belong to/gi);
    });
    test('should set status to pending if request success', async () => {
      constructCallerInfo.mockReturnValueOnce({
        mspid: 'msp',
        id: 'proposer'
      });
      const dss = new DataShareState(stub, datashare, []);
      Object.assign(dss, datashare, {_stub: stub});
      stub.getState.mockReturnValue('{"memberIdentity": "approver"}');
      await dss.request();
      expect(dss.status).toEqual('pending');
    });
  });

  describe('share', () => {
    let datashare;
    beforeEach(() => {
      datashare = {
        encryptedKeyForProposer: 'key',
        proposerIdentity: 'proposer',
        proposerPublicKey: 'publickey',
        targetKey: 'target',
        approverIdentity: 'approver',
        memberIdentity: 'approver'
      };
      DataShareState.hash = jest.fn();
    });
    test('should throw error if encryptedKeyForProposer not set', async () => {
      delete datashare.encryptedKeyForProposer;
      const dss = new DataShareState(stub, datashare, []);
      await expect(dss.share()).rejects.toThrow(/required/gi);
    });
    test('should throw error if target state not found', async () => {
      const dss = new DataShareState(stub, datashare, []);
      Object.assign(dss, datashare, {_stub: stub});
      stub.getState.mockReturnValue('');
      await expect(dss.share()).rejects.toThrow(/not found/gi);
    });
    test('should throw error if target not belong to current member identity', async () => {
      const dss = new DataShareState(stub, datashare, []);
      Object.assign(dss, datashare, {_stub: stub});
      stub.getState.mockReturnValue('{"memberIdentity": "anotherone"}');
      await expect(dss.share()).rejects.toThrow(/not belong/gi);
    });

    test('should throw error if approverIdentity is not current member identity', async () => {
      const dss = new DataShareState(stub, datashare, []);
      datashare.approverIdentity = 'anotherone';
      Object.assign(dss, datashare, {_stub: stub});
      stub.getState.mockReturnValue('{"memberIdentity": "approver"}');
      await expect(dss.share()).rejects.toThrow(/not match/gi);
    });
    test('should set status to approved if request success', async () => {
      const dss = new DataShareState(stub, datashare, []);
      Object.assign(dss, datashare, {_stub: stub});
      stub.getState.mockReturnValue('{"memberIdentity": "approver"}');
      await dss.share();
      expect(dss.status).toEqual('approved');
    });
    test('should throw error if proposerPublicKey not set', async () => {
      delete datashare.proposerPublicKey;
      const dss = new DataShareState(stub, datashare, []);
      Object.assign(dss, datashare, {_stub: stub});
      stub.getState.mockReturnValue('{"memberIdentity": "approver"}');
      await expect(dss.share()).rejects.toThrow(/proposer/gi);
    });
    test('should throw error if proposerIdentity not set', async () => {
      delete datashare.proposerIdentity;
      const dss = new DataShareState(stub, datashare, []);
      Object.assign(dss, datashare, {_stub: stub});
      stub.getState.mockReturnValue('{"memberIdentity": "approver"}');
      await expect(dss.share()).rejects.toThrow(/proposer/gi);
    });
  });

  describe('approve', () => {
    let datashare;
    beforeEach(() => {
      const val = {
        encryptedKeyForProposer: 'key',
        proposerIdentity: 'proposer',
        proposerPublicKey: 'publickey',
        targetKey: 'target',
        approverIdentity: 'approver',
        memberIdentity: 'approver',
        status: 'pending',
      };
      datashare = {
        ...val,
        toJSON: () => val
      };
      DataShareState.hash = jest.fn();
    });
    test('should throw error if encryptedKeyForProposer not set', async () => {
      delete datashare.encryptedKeyForProposer;
      const dss = new DataShareState(stub, datashare, []);
      expect(() => dss.approve(new Date().toDateString())).toThrow(/required/gi);
    });
    test('should throw error if status is not pending', async () => {
      datashare.status = 'approved';
      const dss = new DataShareState(stub, datashare, []);
      Object.assign(dss, datashare, {_stub: stub});
      expect(() => dss.approve(dss)).toThrow(/status/gi);
    });
    xtest('should throw error if approverIdentity is not current member identity', async () => {
      const dss = new DataShareState(stub, datashare, []);
      datashare.approverIdentity = 'anotherone';
      Object.assign(dss, datashare, {_stub: stub});
      stub.getState.mockReturnValue('{"memberIdentity": "approver"}');
      expect(() => dss.approve(dss)).toThrow(/not match/gi);
    });
    test('should set status to approved and merge with provided state', async () => {
      const dss = new DataShareState(stub, datashare, []);
      Object.assign(dss, datashare, {_stub: stub});
      stub.getState.mockReturnValue('{"memberIdentity": "approver"}');
      dss.approve(dss);
      expect(dss).toEqual({...dss, status: 'approved'});
    });
  });

  describe('reject', () => {
    let datashare;
    beforeEach(() => {
      datashare = {
        encryptedKeyForProposer: 'key',
        proposerIdentity: 'proposer',
        proposerPublicKey: 'publickey',
        targetKey: 'target',
        approverIdentity: 'approver',
        memberIdentity: 'approver',
        status: 'pending'
      };
      DataShareState.hash = jest.fn();
    });
    test('should throw error if status is not pending', async () => {
      datashare.status = 'approved';
      const dss = new DataShareState(stub, datashare, []);
      Object.assign(dss, datashare, {_stub: stub});
      expect(() => dss.reject(new Date().toDateString())).toThrow(/status/gi);
    });
    xtest('should throw error if approverIdentity is not current member identity', async () => {
      const dss = new DataShareState(stub, datashare, []);
      datashare.approverIdentity = 'anotherone';
      Object.assign(dss, datashare, {_stub: stub});
      stub.getState.mockReturnValue('{"memberIdentity": "approver"}');
      expect(() => dss.reject(new Date().toDateString())).toThrow(/not match/gi);
    });
    test('should set status to rejected and set handledTime if reject success', async () => {
      const dss = new DataShareState(stub, datashare, []);
      Object.assign(dss, datashare, {_stub: stub});
      stub.getState.mockReturnValue('{"memberIdentity": "approver"}');
      dss.reject(new Date().toDateString());
      expect(dss.status).toEqual('rejected');
    });
  });
});
