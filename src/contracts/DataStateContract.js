import { Contract } from 'fabric-contract-api';
import { ContractHelper } from './ContractHelper';

const ContractName = 'DataState';

export class DataStateContract extends Contract {
  constructor() {
    super(ContractName);
    this._helper = new ContractHelper(false);
  }

  async getByChainKey({ stub }, chainKey) {
    const state = await this._helper.findOneStateByKey(stub, chainKey);
    return state.toString();
  }

  async addState({ stub }, stateString) {
    const state = await this._helper.addOneState(stub, stateString);
    return state.toString();
  }

  async addStates({ stub }, stateListString) {
    const states = await this._helper.addMultiState(stub, stateListString);
    return JSON.stringify(states.map(s => s.toJSON()));
  }

  async updateState({ stub }, stateString) {
    const state = await this._helper.updateOneState(stub, stateString);
    return state.toString();
  }

  async updateStateFields({ stub }, chainKey, fieldListString, valueListString) {
    const fields = JSON.parse(fieldListString).filter(v => !!v);
    const values = JSON.parse(valueListString);
    const state = await this._helper.updateStateFields(stub, chainKey, fields, values);
    return state.toString();
  }

  async deleteByChainKey({ stub }, chainKey) {
    return this._helper.deleteStateByChainKey(stub, chainKey);
  }

  async deleteByChainKeys({ stub }, chainKeys) {
    return this._helper.deleteStatesByChainKeys(stub, chainKeys);
  }

  async list({ stub }, querystring, pageSize, bookmark) {
    return JSON.stringify(
      await this._helper.listStateByQuery({
        stub,
        querystring,
        pageSize,
        bookmark
      })
    );
  }

  // eslint-disable-next-line no-unused-vars
  async listByChainKey(ctx,keyObjectString, pageSize, bookmark) {
    throw new Error('DataShare does not support listByChainKey');
  }

  async listStateHistory({ stub }, chainKey) {
    return JSON.stringify(await this._helper.listStateHistoryForKey({ stub, chainKey }));
  }
}
