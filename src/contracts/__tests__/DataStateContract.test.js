import {DataStateContract} from '../DataStateContract';
import {DataState} from '../../states/DataState';
import {ContractHelper} from '../ContractHelper';

jest.mock('fabric-contract-api');
jest.mock('../ContractHelper');

describe('DataStateContract', () => {
  test('should set stateType, init helper in constructor', () => {
    new DataStateContract();
    expect(ContractHelper).toBeCalledWith(false);
  });

  describe('APIs', () => {
    const stub = jest.fn();
    const MockChainKey = 'mock-chain-key';
    const dataStateContract = new DataStateContract();

    test('expose getByChainKey API', async () => {
      expect(dataStateContract.getByChainKey).toBeTruthy();
      await dataStateContract.getByChainKey({stub}, MockChainKey);
      expect(dataStateContract._helper.findOneStateByKey).toBeCalledWith(stub, MockChainKey);
    });

    test('expose addState API', async () => {
      expect(dataStateContract.addState).toBeTruthy();
      await dataStateContract.addState({stub}, '{}');
      expect(dataStateContract._helper.addOneState).toBeCalledWith(stub, '{}');
    });

    test('expose addStates API', async () => {
      expect(dataStateContract.addStates).toBeTruthy();
      await dataStateContract.addStates({stub}, '[{}]');
      expect(dataStateContract._helper.addMultiState).toBeCalledWith(stub, '[{}]');
    });

    test('expose updateState API', async () => {
      expect(dataStateContract.updateState).toBeTruthy();
      await dataStateContract.updateState({stub}, '{}');
      expect(dataStateContract._helper.updateOneState).toBeCalledWith(stub, '{}');
    });

    test('expose updateStateFields API', async () => {
      expect(dataStateContract.updateStateFields).toBeTruthy();
      await dataStateContract.updateStateFields({stub}, 'chainKey', '["field"]', '["value"]');
      expect(dataStateContract._helper.updateStateFields).toBeCalledWith(stub, 'chainKey', ['field'], ['value']);
    });

    test('expose deleteByChainKey API', async () => {
      expect(dataStateContract.deleteByChainKey).toBeTruthy();
      await dataStateContract.deleteByChainKey({stub}, MockChainKey);
      expect(dataStateContract._helper.deleteStateByChainKey).toBeCalledWith(stub, MockChainKey);
    });

    test('expose deleteByChainKeys API', async () => {
      expect(dataStateContract.deleteByChainKeys).toBeTruthy();
      const chainKeys = JSON.stringify([MockChainKey, MockChainKey]);
      await dataStateContract.deleteByChainKeys({stub}, chainKeys);
      expect(dataStateContract._helper.deleteStatesByChainKeys).toBeCalledWith(stub, chainKeys);
    });

    test('expose list API', async () => {
      expect(dataStateContract.list).toBeTruthy();
      const querystring = '{selector: {}}';
      await dataStateContract.list({stub}, querystring, '10', 'null');
      expect(dataStateContract._helper.listStateByQuery).toBeCalledWith({
        stub,
        querystring,
        pageSize: '10',
        bookmark: 'null',
      });
    });

    test('expose listByChainKey API', async () => {
      expect(dataStateContract.listByChainKey).toBeTruthy();
      expect(dataStateContract.list).toBeTruthy();
      const keyObjectString = JSON.stringify({
        stateType: 'house',
        businessId: 'abc'
      });
      await dataStateContract.listByChainKey({stub}, keyObjectString, '10', 'null');
      expect(dataStateContract._helper.listStateByChainKey).toBeCalledWith({
        stub,
        objectType: DataState.ChainKeyType(),
        objectKeys: ['house', 'abc'],
        pageSize: '10',
        bookmark: 'null',
      });
    });
  });

});
