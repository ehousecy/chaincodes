import {log, lintKeys, lintParam, loopIterator} from '../utils';
import {BaseState} from '../states/BaseState';
import {DataState} from '../states/DataState';
import {DataShareState, DataShareStateType} from '../states/DataShareState';

const PAGE_SIZE = 10;

export class ContractHelper {

  constructor(isDataShare = false) {
    this._stateCls = isDataShare ? DataShareState : DataState;
  }

  constructStateFromString(stub, state, stateCls) {
    if (!stateCls) throw new Error('Must pass state class if use constructStateFromString');
    if (state instanceof stateCls) return state;
    let data = state;
    if (typeof state === 'string') {
      data = JSON.parse(state);
    }
    return new stateCls(stub, data);
  }

  constructStatesFromString(stub, stateList, stateCls) {
    if (typeof stateList !== 'string') return stateList;
    if (!stateCls) throw new Error('Must pass state class if use constructStatesFromString');
    let data = JSON.parse(stateList);
    if (!Array.isArray(data)) {
      data = [data];
    }
    return data.map(s => new stateCls(stub, s));
  }

  convertBytesToState(stub, buf) {
    log(['convertBytesToState', stub, buf], 'debug');
    if (!Buffer.isBuffer(buf) && typeof buf !== 'string') return buf;
    const data = JSON.parse(buf.toString());
    if (!data.stateType) {
      log(['stateType or dataType not found in data, return BaseState']);
      return new BaseState(stub, data, []);
    }
    if (data.stateType === DataShareStateType) {
      const state = new DataShareState(stub, data, []);
      state.updateFields({status: data.status});
      return state;
    }
    return new DataState(stub, data, []);
  }

  async addOneState(stub, stateString, overwrite = true) {
    log(['addOneState', stateString], 'debug');
    const state = this.constructStateFromString(stub, stateString, this._stateCls);
    const chainKey = state.ChainKey();
    if (!overwrite) {
      const bytes = await stub.getState(chainKey);
      if (bytes && bytes.length) return state;
    }
    await stub.putState(chainKey, state.toBuffer());
    return state;
  }

  async addMultiState(stub, stateListString, overwrite = true) {
    log(['addMultiState', stateListString], 'debug');
    const stateList = this.constructStatesFromString(stub, stateListString, this._stateCls);
    await Promise.all(
      stateList.map(async s => {
        const chainKey = s.ChainKey();
        if (!overwrite) {
          const bytes = await stub.getState(chainKey);
          if (bytes && bytes.length) return s;
        }
        await stub.putState(chainKey, s.toBuffer());
        return s;
      }),
    );
    return stateList;
  }

  async findOneStateByKey(stub, chainKey) {
    log(['findOneStateByKey', chainKey], 'debug');
    const bytes = await stub.getState(chainKey);
    if (!bytes || !bytes.length) throw new Error(`${chainKey} Not Found`);
    return this.convertBytesToState(stub, bytes.toString('utf8'));
  }

  async findOneStateByBusinessId(stub, businessId) {
    log(['findOneStateByBusinessId', businessId], 'debug');
    const query = {
      selector: {businessId: lintParam(businessId)},
      use_index: ['indexBaseDoc', 'indexBase'],
    };
    const {items} = await this.listStateByQuery({
      stub,
      query,
      pageSize: 1,
      bookmark: '',
    });
    if (!items || !items.length) throw new Error(`State with ${businessId} Not Found`);
    return this.convertBytesToState(stub, Buffer.from(JSON.stringify(items[0])));
  }

  async updateOneState(stub, stateString, memberOnly = true, orgOnly = true) {
    log(['updateOneState', stateString], 'debug');
    const newState = this.constructStateFromString(stub, stateString, this._stateCls);
    const chainKey = newState.ChainKey();
    const oldStateBytes = await stub.getState(chainKey);
    if (!oldStateBytes || !oldStateBytes.length) {
      throw new Error(`Update Target[${chainKey}] Not Found`);
    }
    const oldState = this.convertBytesToState(stub, oldStateBytes);
    // 同组织成员可修改
    if (orgOnly) {
      oldState.isSubmitByCallerOrg();
    }
    if (memberOnly) {
      oldState.isSubmitByCaller();
    }
    await stub.putState(chainKey, newState.toBuffer());
    return newState;
  }

  async updateMultiState(stub, stateListString, memberOnly = true) {
    log(['updateMulti', stateListString], 'debug');
    const newStateList = this.constructStatesFromString(stub, stateListString, this._stateCls);
    const promises = newStateList.map((states, s) => this.updateOneState(
      stub,
      s.toString(),
      memberOnly,
    ));
    return Promise.all(promises);
  }

  async updateStateFields(stub, chainKey, fields, values, memberOnly = true) {
    log(['updateFields', fields, values], 'debug');
    if (fields.length !== values.length) {
      throw new Error('Fields And Values Length Not Matched');
    }
    const oldState = this.findOneStateByKey(chainKey);
    oldState.isSubmitByCallerOrg();
    if (memberOnly) {
      oldState.isSubmitByCaller();
    }
    fields.forEach((field, index) => {
      oldState[field] = values[index];
    });
    await stub.putState(chainKey, oldState.toBuffer());
    return oldState;
  }

  async deleteStateByChainKey(stub, chainKey, memberOnly = true) {
    log(['deleteByKey', chainKey], 'debug');
    const bytes = await stub.getState(chainKey);
    if (!bytes || !bytes.length) throw new Error(`${chainKey} Not Found`);
    const oldState = this.convertBytesToState(stub, bytes.toString());
    // 同组织成员可修改
    oldState.isSubmitByCallerOrg();
    if (memberOnly) {
      oldState.isSubmitByCaller();
    }
    await stub.deleteState(chainKey);
    return chainKey;
  }

  async deleteStatesByChainKeys(stub, chainKeys, memberOnly = true) {
    log(['deleteMultiByKey', chainKeys], 'debug');
    const keys = JSON.parse(chainKeys);
    if (!Array.isArray(keys)) throw new Error('No valid chain key array');
    await Promise.all(keys.map(key =>
      this.deleteStateByChainKey(stub, key, memberOnly)),
    );
    return chainKeys;
  }

  async listStateByChainKey({stub, objectType, objectKeys, pageSize, bookmark}) {
    const _bookmark = lintParam(bookmark) ? lintParam(bookmark) : '';
    if (!objectType || !objectKeys) throw new Error('objectType & objectKeys is necessary');
    log([
      '_listStateByChainKey',
      JSON.stringify(lintKeys(objectKeys)),
      lintParam(pageSize),
      _bookmark,
    ], 'debug');
    const {iterator, metadata} = await stub.getStateByPartialCompositeKeyWithPagination(
      objectType,
      lintKeys(objectKeys),
      lintParam(pageSize) || PAGE_SIZE,
      _bookmark,
    );
    const items = await loopIterator(iterator);
    return {
      items,
      count: items.length,
      metadata,
    };
  }

  async listStateByQuery({stub, querystring, pageSize, bookmark}) {
    // eslint-disable-next-line
    const escapedQueryString = querystring.replace(new RegExp('\u0000', 'gi'), '\\u0000');
    log(['listStateByQuery', querystring, escapedQueryString, lintParam(pageSize), bookmark], 'debug');
    const query = JSON.parse(escapedQueryString);
    if (!query.selector) throw new Error('Query string must contain selector field');
    const _bookmark = lintParam(bookmark) ? lintParam(bookmark) : '';
    const {iterator, metadata} = await stub.getQueryResultWithPagination(
      escapedQueryString,
      lintParam(pageSize) || PAGE_SIZE,
      _bookmark,
    );
    const items = await loopIterator(iterator);
    return {
      items,
      count: items.length,
      metadata,
    };
  }

  async listStateHistoryForKey({stub, chainKey}) {
    log(['listStateHistoryForKey', chainKey], 'debug');
    const iterator = await stub.getHistoryForKey(chainKey);
    const items = await loopIterator(iterator);
    return {
      items,
      count: items.length,
    }; 
  }
}
