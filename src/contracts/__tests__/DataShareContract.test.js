import {ContractHelper} from '../ContractHelper';
import {DataShareContract} from '../DataShareContract';
import {DataShareState} from '../../states/DataShareState';

jest.mock('fabric-contract-api');
jest.mock('../ContractHelper');
jest.mock('../../utils');


describe('DataShareContract', () => {
  test('should init helper in constructor', () => {
    new DataShareContract();
    expect(ContractHelper).toBeCalledWith(true);
  });

  describe('APIs', () => {
    const stub = jest.fn();
    const MockChainKey = 'mock-chain-key';
    const datashareContract = new DataShareContract();
    let mockDsState;
    beforeEach(() => {
      mockDsState = {
        request: jest.fn(),
        share: jest.fn(),
        approve: jest.fn(),
        reject: jest.fn(),
      };
      datashareContract._helper.constructStateFromString.mockReturnValue(mockDsState);
      datashareContract._helper.findOneStateByKey.mockReturnValue(mockDsState);
    });

    test('expose share API', async () => {
      const result = '{}';
      const tmp = String.prototype.replace;
      String.prototype.replace = jest.fn().mockReturnValue(result);
      expect(datashareContract.share).toBeTruthy();
      await datashareContract.share({stub}, result);
      expect(String.prototype.replace).toBeCalledWith(new RegExp('\u0000', 'gi'), '\\u0000');
      expect(mockDsState.share).toBeCalled();
      expect(datashareContract._helper.addOneState).toBeCalledWith(stub, mockDsState);
      String.prototype.replace = tmp;
    });

    test('expose request API', async () => {
      const result = '{}';
      const tmp = String.prototype.replace;
      String.prototype.replace = jest.fn().mockReturnValue(result);
      expect(datashareContract.request).toBeTruthy();
      await datashareContract.request({stub}, result);
      expect(String.prototype.replace).toBeCalledWith(new RegExp('\u0000', 'gi'), '\\u0000');
      expect(mockDsState.request).toBeCalled();
      expect(datashareContract._helper.addOneState).toBeCalledWith(stub, mockDsState);
      String.prototype.replace = tmp;
    });

    test('expose approve API', async () => {
      const val = {
        encryptedKeyForProposer: 'none',
        handledTime: new Date().toDateString(),
        status: 'pending'
      };
      Object.assign(mockDsState, val);
      mockDsState.toJSON = () => val;
      expect(datashareContract.approve).toBeTruthy();
      await datashareContract.approve({stub}, MockChainKey, JSON.stringify(mockDsState));
      expect(mockDsState.approve).toBeCalledWith(mockDsState);
      expect(datashareContract._helper.findOneStateByKey).toBeCalledWith(stub, MockChainKey);
      expect(datashareContract._helper.updateOneState).toBeCalledWith(stub, mockDsState);
    });

    test('expose reject API', async () => {
      const date = new Date().toDateString();
      expect(datashareContract.reject).toBeTruthy();
      await datashareContract.reject({stub}, MockChainKey, date);
      expect(mockDsState.reject).toBeCalledWith(date);
      expect(datashareContract._helper.findOneStateByKey).toBeCalledWith(stub, MockChainKey);
      expect(datashareContract._helper.updateOneState).toBeCalledWith(stub, mockDsState);
    });

    test('expose cancel API', async () => {
      expect(datashareContract.cancel).toBeTruthy();
      await datashareContract.cancel({stub}, MockChainKey);
      expect(datashareContract._helper.deleteStateByChainKey).toBeCalledWith(stub, MockChainKey);
    });

    test('expose getByChainKey API', async () => {
      expect(datashareContract.getByChainKey).toBeTruthy();
      await datashareContract.getByChainKey({stub}, MockChainKey);
      expect(datashareContract._helper.findOneStateByKey).toBeCalledWith(stub, MockChainKey);
    });

    test('disable addState API', async () => {
      expect(datashareContract.addState).toBeTruthy();
      await expect(datashareContract.addState({stub}, '{}')).rejects.toThrow();
    });

    test('disable addStates API', async () => {
      expect(datashareContract.addStates).toBeTruthy();
      await expect(datashareContract.addStates({stub}, '[{}, {}]')).rejects.toThrow();
    });

    test('disable updateState API', async () => {
      expect(datashareContract.updateState).toBeTruthy();
      await expect(datashareContract.updateState({stub}, '{}')).rejects.toThrow();
    });

    test('expose deleteByChainKey API', async () => {
      expect(datashareContract.deleteByChainKey).toBeTruthy();
      await datashareContract.deleteByChainKey({stub}, MockChainKey);
      expect(datashareContract._helper.deleteStateByChainKey).toBeCalledWith(stub, MockChainKey);
    });

    test('expose deleteByChainKeys API', async () => {
      expect(datashareContract.deleteByChainKeys).toBeTruthy();
      const chainKeys = JSON.stringify([MockChainKey, MockChainKey]);
      await datashareContract.deleteByChainKeys({stub}, chainKeys);
      expect(datashareContract._helper.deleteStatesByChainKeys).toBeCalledWith(stub, chainKeys);
    });

    test('expose list API', async () => {
      expect(datashareContract.list).toBeTruthy();
      const querystring = '{selector: {}}';
      await datashareContract.list({stub}, querystring, '10', 'null');
      expect(datashareContract._helper.listStateByQuery).toBeCalledWith({
        stub,
        querystring,
        pageSize: '10',
        bookmark: 'null',
      });
    });

    test('expose listByChainKey API', async () => {
      expect(datashareContract.listByChainKey).toBeTruthy();
      expect(datashareContract.list).toBeTruthy();
      const keyObjectString = JSON.stringify({
        status: 'approved',
        approverIdentity: 'approver',
        proposerIdentity: 'proposer',
      });
      await datashareContract.listByChainKey({stub}, keyObjectString, '10', 'null');
      expect(datashareContract._helper.listStateByChainKey).toBeCalledWith({
        stub,
        objectType: DataShareState.ChainKeyType(),
        objectKeys: ['approved', 'approver', 'proposer'],
        pageSize: '10',
        bookmark: 'null',
      });
    });
  });

});
