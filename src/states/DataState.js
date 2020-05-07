import { BaseState } from './BaseState';

const DataStateType = 'data';

export class DataState extends BaseState {
  static _ChainKeyFields = ['platformNo', 'dataType', 'businessId'];
  static _RequiredFields = ['platformNo', 'dataType'];

  constructor(stub, data, immutableFields) {
    DataState.validateRequiredFields(DataState._RequiredFields, data, immutableFields);
    super(stub, data, immutableFields);
    this.updateFields({ stateType: DataStateType });
  }

  
  ChainKeyFields() {
    return DataState._ChainKeyFields;
  }

  static ChainKeyType() {
    return DataState._ChainKeyFields.map(k => k.toLowerCase()).join('~');
  }

  static ChainKeyValues(data) {
    return DataState._ChainKeyFields.map(k => data[k]).filter(v => !!v);
  }
}
