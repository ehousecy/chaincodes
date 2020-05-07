import { Contract } from "fabric-contract-api";
import { ContractHelper } from "./ContractHelper";
import { DataShareState, DataShareStateType } from "../states/DataShareState";
import { log, lintParam, constructCallerInfo } from "../utils";

const ContractName = "DataShare";

export class DataShareContract extends Contract {
  constructor() {
    super(ContractName);
    this._grantHelper = new ContractHelper(true);
    this._dataHelper = new ContractHelper(false);
  }

  _validateIsApprover(stub, state) {
    const callerIdentity = constructCallerInfo(stub).id;
    if (state.approverIdentity !== callerIdentity) {
      throw new Error(
        `Caller[${callerIdentity}] is not Approver[${state.approverIdentity}]`
      );
    }
  }

  _validateIsProposer(stub, state) {
    const callerIdentity = constructCallerInfo(stub).id;
    if (state.proposerIdentity !== callerIdentity) {
      throw new Error(
        `Caller[${callerIdentity}] is not Proposer[${state.proposerIdentity}]`
      );
    }
  }

  async request({ stub }, stateString) {
    log(["DataShare:request", stateString]);
    // eslint-disable-next-line no-control-regex
    const escaped = stateString.replace(new RegExp("\u0000", "gi"), "\\u0000");
    let states = [];
    if (Array.isArray(JSON.parse(stateString))) {
      states = this._grantHelper.constructStatesFromString(
        stub,
        escaped,
        DataShareState
      );
    } else {
      states = [
        this._grantHelper.constructStateFromString(
          stub,
          escaped,
          DataShareState
        )
      ];
    }
    states = await Promise.all(states.map(state => state.request()));
    if (states.length === 1) {
      return (await this._grantHelper.addOneState(stub, states[0])).toString();
    }
    return (await this._grantHelper.addMultiState(stub, states)).toString();
  }

  async _share(stub, stateString) {
    // eslint-disable-next-line no-control-regex
    const escaped = stateString.replace(new RegExp("\u0000", "gi"), "\\u0000");
    let states = [];
    if (Array.isArray(JSON.parse(stateString))) {
      states = this._grantHelper.constructStatesFromString(
        stub,
        escaped,
        DataShareState
      );
    } else {
      states = [
        this._grantHelper.constructStateFromString(
          stub,
          escaped,
          DataShareState
        )
      ];
    }
    return await Promise.all(states.map(state => state.share()));
  }

  async _uploadAndShare(
    stub,
    dataListString,
    grantListString,
    overwrite = true
  ) {
    log([
      "DataShare:uploadAndShare",
      dataListString.slice(0, 100) + "...",
      grantListString.slice(0, 100) + "...",
      "overwrite: " + overwrite
    ]);
    const datas = await this._dataHelper.addMultiState(
      stub,
      dataListString,
      overwrite
    );
    let grants = await this._share(stub, grantListString);
    grants = await this._grantHelper.addMultiState(stub, grants, overwrite);
    return JSON.stringify({
      datas: datas.map(s => s.toJSON()),
      grants: grants.map(g => g.toJSON())
    });
  }

  async share({ stub }, stateString) {
    log(["DataShare:share", stateString]);
    const states = await this._share(stub, stateString);
    if (states.length === 1) {
      return (await this._grantHelper.addOneState(stub, states[0])).toString();
    }
    return (await this._grantHelper.addMultiState(stub, states)).toString();
  }

  async uploadAndShare({ stub }, dataListString, grantListString) {
    return await this._uploadAndShare(stub, dataListString, grantListString);
  }

  async uploadAndShareNoOverwrite({ stub }, dataListString, grantListString) {
    return await this._uploadAndShare(
      stub,
      dataListString,
      grantListString,
      false
    );
  }

  async cancel({ stub }, chainKey) {
    log(["DataShare:cancel", chainKey]);
    const state = await this._grantHelper.findOneStateByKey(stub, chainKey);
    this._validateIsProposer(stub, state);
    return await this._grantHelper.deleteStateByChainKey(stub, chainKey);
  }

  async approve({ stub }, chainKey, dataShareStateString) {
    log(["DataShare:approve", chainKey, dataShareStateString]);
    const newState = this._grantHelper.constructStateFromString(
      stub,
      dataShareStateString,
      DataShareState
    );
    const state = await this._grantHelper.findOneStateByKey(stub, chainKey);
    this._validateIsApprover(stub, state);
    state.approve(newState);
    return (
      await this._grantHelper.updateOneState(stub, state, false, false)
    ).toString();
  }

  async reject({ stub }, chainKey, handledTime) {
    log(["DataShare:reject", chainKey]);
    const state = await this._grantHelper.findOneStateByKey(stub, chainKey);
    this._validateIsApprover(stub, state);
    state.reject(handledTime);
    return (
      await this._grantHelper.updateOneState(stub, state, false, false)
    ).toString();
  }

  async addState({ stub }, stateString) {
    // eslint-disable-line
    throw new Error(
      "DataShare not support addState, use request or share according to your requirements"
    );
  }

  async addStates({ stub }, stateString) {
    // eslint-disable-line
    throw new Error(
      "DataShare does not support addStates, use request or share according to your requirements"
    );
  }

  async getByChainKey({ stub }, chainKey) {
    return (
      await this._grantHelper.findOneStateByKey(stub, chainKey)
    ).toString();
  }

  async updateState({ stub }, stateString) {
    // eslint-disable-line
    throw new Error(
      "DataShare does not support updateState, use approve or reject according to your requirements"
    );
  }

  async deleteByChainKey({ stub }, chainKey) {
    // eslint-disable-line
    throw new Error("DataShare does not support deleteByChainKey, use cancel");
    // return this._helper.deleteStateByChainKey(stub, chainKey);
  }

  async deleteByChainKeys({ stub }, chainKeys) {
    // eslint-disable-line
    throw new Error("DataShare does not support deleteByChainKeys, use cancel");
  }

  async list({ stub }, querystring, pageSize, bookmark) {
    return JSON.stringify(
      await this._grantHelper.listStateByQuery({
        stub,
        querystring,
        pageSize,
        bookmark
      })
    );
  }

  // eslint-disable-next-line no-unused-vars
  async listByChainKey(ctx, keyObjectString, pageSize, bookmark) {
    throw new Error("DataShare does not support listByChainKey");
  }

  async listDataShare({ stub }, querystring, pageSize, bookmark) {
    // eslint-disable-next-line no-control-regex
    const escapedQueryString = querystring.replace(
      new RegExp("\u0000", "gi"),
      "\\u0000"
    );
    const queryData = JSON.parse(escapedQueryString);
    const query = {
      selector: { stateType: DataShareStateType },
      use_index: ["indexDataShareDoc", "indexDataShare"]
    };
    if (lintParam(queryData.proposerIdentity)) {
      query.selector.proposerIdentity = lintParam(queryData.proposerIdentity);
    }
    if (lintParam(queryData.approverIdentity)) {
      query.selector.approverIdentity = lintParam(queryData.approverIdentity);
    }
    if (lintParam(queryData.targetKey)) {
      query.selector.targetKey = lintParam(queryData.targetKey);
    }
    return JSON.stringify(
      await this._grantHelper.listStateByQuery({
        stub,
        querystring: JSON.stringify(query),
        pageSize,
        bookmark
      })
    );
  }

  async listStateHistory({ stub }, chainKey) {
    return JSON.stringify(
      await this._grantHelper.listStateHistoryForKey({ stub, chainKey })
    );
  }

  async listForApprover(
    { stub },
    approverIdentity,
    targetKey,
    pageSize,
    bookmark
  ) {
    const escapedTargetKey = targetKey.replace(
      new RegExp("\u0000", "gi"),
      "\\u0000"
    );
    const query = {
      selector: {
        stateType: DataShareStateType,
        targetKey: escapedTargetKey,
        approverIdentity
      },
      use_index: ["indexDataShareDoc", "indexDataShare"]
    };
    return JSON.stringify(
      await this._grantHelper.listStateByQuery({
        stub,
        querystring: JSON.stringify(query),
        pageSize,
        bookmark
      })
    );
  }
  async listForProposer(
    { stub },
    proposerIdentity,
    targetDataType,
    pageSize,
    bookmark
  ) {
    const query = {
      selector: {
        stateType: DataShareStateType,
        targetDataType,
        proposerIdentity
      },
      use_index: ["indexDataShareDoc", "indexDataShare"]
    };
    const dsPageReturn = await this._grantHelper.listStateByQuery({
      stub,
      querystring: JSON.stringify(query),
      pageSize,
      bookmark
    });
    const targetDataKeys = dsPageReturn.items.reduce((res, item) => {
      if (!item.data || !item.data.length) return res;
      return res.concat([item.targetKey]);
    }, []);
    if (!targetDataKeys && targetDataKeys.length) return dsPageReturn;
    const dataPageReturn = await this._dataHelper.listStateByQuery({
      stub,
      querystring: JSON.stringify({
        selector: { chainKey: { $in: targetDataKeys } }
      }),
      pageSize: targetDataKeys.length
    });
    const dataKeyMap = dataPageReturn.items.reduce((res, item) => {
      res[item.chainKey] = item;
      return res;
    }, {});
    return JSON.stringify({
      ...dsPageReturn,
      items: dsPageReturn.items.map(item => ({
        ...item,
        data: dataKeyMap[item.targetKey] || item.data
      }))
    });
  }
}
