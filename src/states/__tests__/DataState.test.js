import {DataState} from '../DataState';
import {BaseState} from '../BaseState';

jest.mock('../BaseState', () => ({
  BaseState: jest.fn()
}));

describe('DataState', () => {
  const stub = jest.fn();
  const data = {};
  const fields = [];
  DataState.validateRequiredFields = jest.fn();
  test('should init BaseState to DataState', () => {
    new DataState(stub, data, fields);
    expect(DataState.validateRequiredFields).toBeCalled();
    expect(BaseState).toBeCalledWith(stub, data, fields);
  });

  test('should implement ChainKeyFields', () => {
    const es = new DataState(stub, data, fields);
    expect(es.ChainKeyFields).toBeTruthy();
  });

  test('should implement ChainKeyType', () => {
    expect(DataState.ChainKeyType).toBeTruthy();
  });

  test('should implement ChainKeyValues', () => {
    expect(DataState.ChainKeyValues).toBeTruthy();
  });
});
