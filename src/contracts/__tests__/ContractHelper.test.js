import {ContractHelper} from '../ContractHelper';
import {BaseState} from '../../states/BaseState';
import {DataState} from '../../states/DataState';

jest.mock('../../states/BaseState', () => ({
  BaseState: jest.fn()
}));

jest.mock('../../states/DataState', () => ({
  DataState: jest.fn()
}));

jest.mock('../../utils', () => ({
  lintParam: jest.fn().mockImplementation((v) => v),
  lintKeys: jest.fn().mockImplementation((v) => v),
  loopIterator: jest.fn().mockImplementation(() => []),
  log: jest.fn()
}));

const MockChainKey = 'mock-chain-key';
const MockBytes = Buffer.from(JSON.stringify({chainKey: MockChainKey}));
const MockToBufferRet = Buffer.from('{}');

describe('ContractHelper', () => {
  let MockStateClass;
  let helper;
  let stub;

  beforeEach(() => {
    stub = {
      getState: jest.fn(),
      putState: jest.fn(),
      deleteState: jest.fn(),
      getStateByPartialCompositeKeyWithPagination: jest.fn(),
      getQueryResultWithPagination: jest.fn(),
    };
    DataState.mockClear();
    MockStateClass = DataState;
    helper = new ContractHelper(false);
  });

  test('constructStateFromString: throw error if call without stateType', async () => {
    const state = new MockStateClass().toString();
    expect(() => helper.constructStateFromString(stub, state.toString())).toThrow();
  });

  test('constructStateFromString: return input if input\' type is not string', async () => {
    const state = new MockStateClass();
    expect(helper.constructStateFromString(stub, state, MockStateClass)).toEqual(state);
  });

  test('constructStateFromString: call StateType Constructor', async () => {
    const stateString = '{}';
    helper.constructStateFromString(stub, '{}', MockStateClass);
    expect(MockStateClass).toBeCalledWith(stub, JSON.parse(stateString));
  });

  test('constructStatesFromString: throw error if call without stateType', async () => {
    const stateList = JSON.stringify([new MockStateClass().toString()]);
    expect(() => helper.constructStatesFromString(stub, stateList)).toThrow();
  });

  test('constructStatesFromString: return input if input\' type is not string', async () => {
    const states = [new MockStateClass()];
    expect(helper.constructStatesFromString(stub, states, MockStateClass)).toEqual(states);
  });

  test('constructStatesFromString: call StateType Constructor', async () => {
    const stateList = ['{}', '{}'];
    helper.constructStatesFromString(stub, JSON.stringify(stateList), MockStateClass);
    expect(MockStateClass).toBeCalledTimes(2);
  });

  test('convertBytesToState: return input if input\' type is not Buffer or string', async () => {
    const state = new MockStateClass();
    expect(helper.convertBytesToState(stub, state)).toEqual(state);
  });

  test('convertBytesToState: always call StateType Constructor With Empty Immutable Fields', async () => {
    const stateString1 = JSON.stringify({stateType: 'unknown'});
    helper.convertBytesToState(stub, stateString1.toString());
    expect(MockStateClass).toBeCalledWith(stub, JSON.parse(stateString1), []);
  });

  test('convertBytesToState: call BaseState Constructor With Empty Immutable Fields if stateType or dataType not set', async () => {
    const stateString = JSON.stringify({});
    helper.convertBytesToState(stub, stateString.toString());
    expect(BaseState).toBeCalledWith(stub, JSON.parse(stateString), []);
  });

  describe('addOneState', () => {
    let state;
    let methodSpy;
    beforeEach(() => {
      state = {};
      methodSpy = jest.spyOn(helper, 'constructStateFromString');
      methodSpy.mockImplementation((stub, stateString, stateType) => ({ // eslint-disable-line
        ChainKey: () => MockChainKey,
        toBuffer: () => MockToBufferRet
      }));
    });
    xtest('call constructStateFromString to with helper stateType without stateType in parameters', async () => {
      await helper.addOneState(stub, JSON.stringify(state));
      expect(methodSpy).toBeCalledWith(stub, JSON.stringify(state), helper._stateCls);
      expect(stub.putState).toBeCalledWith(MockChainKey, MockToBufferRet);
    });
    xtest('call constructStateFromString to with stateType in parameters', async () => {
      await helper.addOneState(stub, JSON.stringify(state));
      expect(methodSpy).toBeCalledWith(stub, JSON.stringify(state));
    });
  });

  describe('addMultiState', () => {
    let states;
    let methodSpy;
    const mockState = { // eslint-disable-line
      ChainKey: () => MockChainKey,
      toBuffer: () => MockToBufferRet
    };
    beforeEach(() => {
      states = [{}, {}];
      methodSpy = jest.spyOn(helper, 'constructStatesFromString');
      methodSpy.mockImplementation((stub, stateString, stateType) => ([ // eslint-disable-line
        mockState, mockState
      ]));
    });
    xtest('call constructStatesFromString to with helper stateType without stateType in parameters', async () => {
      await helper.addMultiState(stub, JSON.stringify(states));
      expect(methodSpy).toBeCalledWith(stub, JSON.stringify(states), helper._stateCls);
      expect(stub.putState).toBeCalledTimes(2);
      expect(stub.putState).toHaveBeenCalledWith(MockChainKey, MockToBufferRet);
    });
  });

  describe('findOneStateByKey', () => {
    let methodSpy;
    const mockState = {chainKey: MockChainKey};
    beforeEach(() => {
      methodSpy = jest.spyOn(helper, 'convertBytesToState');
      methodSpy.mockImplementation((stub, stateString, stateType) =>  // eslint-disable-line
        mockState
      );
    });

    test('getState and convert to state with convertBytesWithState', async () => {
      stub.getState.mockImplementation(() => MockBytes);
      await helper.findOneStateByKey(stub, MockChainKey);
      expect(stub.getState).toBeCalledWith(MockChainKey);
      expect(methodSpy).toBeCalledWith(stub, MockBytes.toString('utf8'));
    });

    test('throw error if getState return nothing', async () => {
      stub.getState.mockImplementation(() => '');
      await expect(helper.findOneStateByKey(stub, MockChainKey)).rejects.toThrow();
    });
  });

  describe('findOneStateByBusinessId', () => {
    let convertSpy;
    let listSpy;
    const mockBusinessId = 'mock-business-id';
    const mockState = {chainKey: MockChainKey};

    beforeEach(() => {
      listSpy = jest.spyOn(helper, 'listStateByQuery');
      listSpy.mockImplementation(() => ({items: [mockState]}));
      convertSpy = jest.spyOn(helper, 'convertBytesToState');
      convertSpy.mockImplementation((stub, stateString, stateType) =>  // eslint-disable-line
        mockState
      );
    });

    test('should call listStateByQuery with specific parameters and convertBytesToState', async () => {
      await helper.findOneStateByBusinessId(stub, mockBusinessId);
      expect(listSpy).toBeCalledWith({
        stub,
        query: {
          selector: {
            businessId: mockBusinessId,
          },
          use_index: ['indexBaseDoc', 'indexBase']
        },
        pageSize: 1,
        bookmark: ''
      });
      expect(convertSpy).toBeCalledWith(stub, MockBytes);
    });

    test('should not set stateType in selector if not passed in parameters and not set in helper', async () => {
      helper._stateType = null;
      await helper.findOneStateByBusinessId(stub, mockBusinessId);
      expect(listSpy).toBeCalledWith({
        stub,
        query: {selector: {businessId: mockBusinessId}, use_index: ['indexBaseDoc', 'indexBase']},
        pageSize: 1,
        bookmark: ''
      });
    });

    test('should throw error if not found', async () => {
      listSpy.mockImplementation(() => ({items: []}));
      await expect(helper.findOneStateByBusinessId(stub, mockBusinessId)).rejects.toThrow();
    });
  });

  describe('updateOneState', () => {
    let state;
    let stateFromStringSpy;
    let stateFromBytesSpy;
    let mockSubmitByOrg;
    let mockSubmitByCaller;
    const mockBytes = Buffer.from(JSON.stringify({chainKey: MockChainKey}));
    mockSubmitByOrg = jest.fn().mockImplementation(() => true);
    mockSubmitByCaller = jest.fn().mockImplementation(() => true);
    beforeEach(() => {
      state = {};
      stateFromStringSpy = jest.spyOn(helper, 'constructStateFromString');
      stateFromStringSpy.mockImplementation((stub, stateString, stateType) => ({ // eslint-disable-line
        ChainKey: () => MockChainKey,
        toBuffer: () => MockToBufferRet
      }));

      stateFromBytesSpy = jest.spyOn(helper, 'convertBytesToState');
      stateFromBytesSpy.mockImplementation((stub, stateString, stateType) => ({ // eslint-disable-line
        ChainKey: () => MockChainKey,
        toBuffer: () => MockToBufferRet,
        isSubmitByCallerOrg: () => mockSubmitByOrg(),
        isSubmitByCaller: () => mockSubmitByCaller()
      }));
    });

    test('throw error if target state not found', async () => {
      stub.getState.mockImplementation(() => null);
      await expect(helper.updateOneState(stub, '{}', )).rejects.toThrow();
    });

    test('should always check is submitted by caller org', async () => {
      stub.getState.mockImplementation(() => mockBytes);
      await helper.updateOneState(stub, '{}', true);
      expect(mockSubmitByOrg).toBeCalled();
      await helper.updateOneState(stub, '{}', false);
      expect(mockSubmitByCaller).toBeCalled();
    });

    test('should check is submitted by caller if memberOnly is true(default)', async () => {
      stub.getState.mockImplementation(() => mockBytes);
      await helper.updateOneState(stub, '{}', true);
      expect(mockSubmitByCaller).toBeCalled();
      await helper.updateOneState(stub, '{}');
      expect(mockSubmitByCaller).toBeCalled();
    });

    test('call constructStateFromString to with helper stateType without stateCls in parameters', async () => {
      stub.getState.mockImplementation(() => mockBytes);
      await helper.updateOneState(stub, JSON.stringify(state));
      expect(stateFromStringSpy).toBeCalledWith(stub, JSON.stringify(state), helper._stateCls);
      expect(stub.putState).toBeCalledWith(MockChainKey, MockToBufferRet);
    });
  });

  describe('updateMultiState', () => {
    let statesFromStringSpy;
    let updateOneSpy;
    beforeEach(() => {
      statesFromStringSpy = jest.spyOn(helper, 'constructStatesFromString');
      statesFromStringSpy.mockImplementation(() => [{
        ChainKey: () => MockChainKey,
        toBuffer: () => MockToBufferRet
      }, {
        ChainKey: () => MockChainKey,
        toBuffer: () => MockToBufferRet
      }]);
      updateOneSpy = jest.spyOn(helper, 'updateOneState');
      updateOneSpy.mockImplementation(() => Promise.resolve({}));
    });

    test('should call constructStatesFromString to construct states', async () => {
      await helper.updateMultiState(stub, '[{}, {}]');
      expect(statesFromStringSpy).toBeCalled();
    });

    test('should call updateOneState to update multi state', async () => {
      await helper.updateMultiState(stub, '[{}, {}]');
      expect(updateOneSpy).toBeCalledTimes(2);
    });
  });

  describe('updateStateFields', () => {
    let findOneStateByKey;
    let fields;
    let values;
    let state;
    let mockBytes;

    let mockSubmitByOrg;
    let mockSubmitByCaller;
    beforeEach(() => {
      mockSubmitByOrg = jest.fn().mockImplementation(() => true);
      mockSubmitByCaller = jest.fn().mockImplementation(() => true);
      fields = ['field1', 'field2', 'field3.subField.value'];
      values = ['nv1', 'nv2', 'nv3'];
      state = {
        chainKey: MockChainKey,
        field1: 'v1',
        field2: 'v2',
        field3: {
          subField: {value: 'v3'}
        },
        toBuffer: () => null,
        isSubmitByCallerOrg: () => mockSubmitByOrg(),
        isSubmitByCaller: () => mockSubmitByCaller()
      };
      mockBytes = Buffer.from(JSON.stringify(state));
      findOneStateByKey = jest.spyOn(helper, 'findOneStateByKey');
      findOneStateByKey.mockImplementation(() => state);
    });

    test('should throw error if fields.length not equal to values.length', async () => {
      fields = fields.slice(0, 2);
      await expect(helper.updateStateFields(stub, MockChainKey, fields, values)).rejects.toThrow();
    });

    test('should update key-value in state', async () => {
      fields = fields.slice(0, 2);
      values = values.slice(0, 2);
      const newState = {...state};
      newState.field1 = 'nv1';
      newState.field2 = 'nv2';
      const result = await helper.updateStateFields(stub, MockChainKey, fields, values);
      expect(findOneStateByKey).toBeCalled();
      expect(result).toEqual(newState);
    });

    xtest('should update subkey-value in state if key concat with .', async () => {
      const newState = {...state};
      const result = await helper.updateStateFields(stub, MockChainKey, fields, values);
      newState.field1 = 'nv1';
      newState.field2 = 'nv2';
      newState.field3.value = 'nv3';
      expect(result).toEqual(newState);
    });

    test('should add new value if key not exists in state', async () => {
      const result = await helper.updateStateFields(stub, MockChainKey, ['field4'], ['nv4']);
      state.field4 = 'nv4';
      expect(result).toEqual(state);
    });

    test('should call putState for saving to world state', async () => {
      stub.putState.mockImplementation(() => null);
      await helper.updateStateFields(stub, MockChainKey, fields, values);
      expect(stub.putState).toBeCalled();
    });

    test('should always check is caller belong to submitter\'s organization', async () => {
      await helper.updateStateFields(stub, MockChainKey, fields, values, false);
      await helper.updateStateFields(stub, MockChainKey, fields, values, true);
      expect(mockSubmitByOrg).toBeCalledTimes(2);
    });

    test('should check is call by submitter by default', async () => {
      stub.getState.mockImplementation(() => mockBytes);
      await helper.updateStateFields(stub, MockChainKey, fields, values);
      expect(mockSubmitByCaller).toBeCalled();
    });

    test('should not check is call by submitter if memberOnly is false', async () => {
      stub.getState.mockImplementation(() => mockBytes);
      await helper.updateStateFields(stub, MockChainKey, fields, values, false);
      expect(mockSubmitByCaller).not.toBeCalled();
    });
  });

  describe('deleteStateByChainKey', () => {
    let stateFromStringSpy;
    let stateFromBytesSpy;
    const mockSubmitByOrg = jest.fn().mockImplementation(() => true);
    const mockSubmitByCaller = jest.fn().mockImplementation(() => true);
    beforeEach(() => {
      stateFromStringSpy = jest.spyOn(helper, 'constructStateFromString');
      stateFromStringSpy.mockImplementation((stub, stateString, stateType) => ({ // eslint-disable-line
        ChainKey: () => MockChainKey,
        toBuffer: () => MockToBufferRet
      }));

      stateFromBytesSpy = jest.spyOn(helper, 'convertBytesToState');
      stateFromBytesSpy.mockImplementation((stub, stateString, stateType) => ({ // eslint-disable-line
        ChainKey: () => MockChainKey,
        toBuffer: () => MockToBufferRet,
        isSubmitByCallerOrg: () => mockSubmitByOrg(),
        isSubmitByCaller: () => mockSubmitByCaller()
      }));
    });

    test('throw error if target state not found', async () => {
      stub.getState.mockImplementation(() => null);
      await expect(helper.deleteStateByChainKey(stub, MockChainKey)).rejects.toThrow();
    });

    test('should always check is submitted by caller org', async () => {
      stub.getState.mockImplementation(() => MockBytes);
      await helper.deleteStateByChainKey(stub, MockChainKey, true);
      expect(mockSubmitByOrg).toBeCalled();
      await helper.deleteStateByChainKey(stub, MockChainKey, false);
      expect(mockSubmitByCaller).toBeCalled();
    });

    test('should check is submitted by caller if memberOnly is true(default)', async () => {
      stub.getState.mockImplementation(() => MockBytes);
      await helper.deleteStateByChainKey(stub, MockChainKey, true);
      expect(mockSubmitByCaller).toBeCalled();
      await helper.deleteStateByChainKey(stub, MockChainKey);
      expect(mockSubmitByCaller).toBeCalled();
    });

    test('should call stub.deleteState with given chainKey', async () => {
      stub.getState.mockImplementation(() => MockBytes);
      await helper.deleteStateByChainKey(stub, MockChainKey);
      expect(stub.deleteState).toBeCalledWith(MockChainKey);
    });
  });

  describe('deleteStatesByChainKeys', () => {
    let deleteOneSpy;
    beforeEach(() => {
      deleteOneSpy = jest.spyOn(helper, 'deleteStateByChainKey');
      deleteOneSpy.mockImplementation(() => null);
    });

    test('throw error if chainKeys is not a stringified array', async () => {
      await expect(helper.deleteStatesByChainKeys(stub, MockChainKey)).rejects.toThrow();
    });

    test('should call deleteStateByChainKey to delete state', async () => {
      await helper.deleteStatesByChainKeys(
        stub,
        JSON.stringify([MockChainKey, MockChainKey]),
        true
      );
      expect(deleteOneSpy).toHaveBeenCalledWith(stub, MockChainKey, true);
    });
  });

  describe('listStateChainKey', () => {
    const mockIterator = jest.fn();
    const mockMetadata = jest.fn();
    beforeEach(() => {
      stub.getStateByPartialCompositeKeyWithPagination.mockImplementation(() => ({
        iterator: mockIterator, metadata: mockMetadata
      }));
    });

    test('throw error if objectType or objectKeys not in parameters', async () => {
      await expect(helper.listStateByChainKey({
        stub, objectKeys: ['k-v1']
      })).rejects.toThrow();
      await expect(helper.listStateByChainKey({
        stub, objectType: 'k'
      })).rejects.toThrow();
      await expect(helper.listStateByChainKey({stub})).rejects.toThrow();
    });

    test('call stub.getStateByPartialCompositeKeyWithPagination to list by chain key', async () => {
      await helper.listStateByChainKey({
        stub,
        objectType: 'k',
        objectKeys: ['k-v1']
      });
      expect(stub.getStateByPartialCompositeKeyWithPagination).toBeCalledWith(
        'k', ['k-v1'], 10, ''
      );
    });

    test('return value should contains items, count and metadata', async () => {
      const ret = await helper.listStateByChainKey({
        stub,
        objectType: 'k',
        objectKeys: ['k-v1']
      });
      expect(ret.items).toEqual([]);
      expect(ret.count).toEqual(0);
      expect(ret.metadata).toEqual(mockMetadata);
    });
  });

  describe('listStateByQuery', () => {
    const mockIterator = jest.fn();
    const mockMetadata = jest.fn();
    beforeEach(() => {
      stub.getQueryResultWithPagination.mockImplementation(() => ({
        iterator: mockIterator, metadata: mockMetadata
      }));
    });

    test('throw error if querystring not contain selector field', async () => {
      await expect(helper.listStateByQuery({
        stub,
        querystring: JSON.stringify({})
      })).rejects.toThrow();
    });

    test('call stub.getQueryResultWithPagination to list by query string', async () => {
      const query = {selector: {businessId: 'abc'}};
      await helper.listStateByQuery({
        stub,
        querystring: JSON.stringify(query)
      });
      expect(stub.getQueryResultWithPagination).toBeCalledWith(
        JSON.stringify(query),
        10,
        ''
      );
    });

    test('should escape query string', async () => {
      const result = JSON.stringify({selector: {stateType: 'data'}});
      const tmp = String.prototype.replace;
      String.prototype.replace = jest.fn().mockReturnValue(result);
      const querystring = result;
      // querystring.replace = jest.fn().mockReturnValue(querystring);
      console.log(querystring);
      await helper.listStateByQuery({
        stub,
        querystring
      });
      expect(querystring.replace).toBeCalledWith(new RegExp('\u0000', 'gi'), '\\u0000');
      String.prototype.replace = tmp;
    });

    test('return value should contains items, count and metadata', async () => {
      const query = {selector: {stateType: 'data'}};
      const ret = await helper.listStateByQuery({
        stub, querystring: JSON.stringify(query)
      });
      expect(ret.items).toEqual([]);
      expect(ret.count).toEqual(0);
      expect(ret.metadata).toEqual(mockMetadata);
    });
  });
});
