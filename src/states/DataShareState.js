import {BaseState} from './BaseState';
import {constructCallerInfo} from '../utils';

const Status = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const DataShareStateType = 'data_share';

export class DataShareState extends BaseState {
  static _RequiredFields = ['targetKey'];

  static _ChainKeyFields = [
    'approverIdentity',
    'proposerIdentity',
    'targetKey'
  ];

  constructor(stub, data, immutableFields) {
    DataShareState.validateRequiredFields(DataShareState._RequiredFields, data);
    super(stub, data, immutableFields);
    this.updateFields({status: Status.PENDING, stateType: DataShareStateType});
  }

  ChainKeyFields() {
    return DataShareState._ChainKeyFields;
  }

  static ChainKeyType() {
    return DataShareState._ChainKeyFields.map(k => k.toLowerCase()).join('~');
  }

  static ChainKeyValues(data) {
    // ensure order
    return DataShareState._ChainKeyFields.map(k => data[k]).filter(v => !!v);
  }

  async request() {
    if (!this.proposerPublicKey || !this.proposerIdentity) {
      throw new Error('Proposer information is required for data sharing');
    }
    const isValidProposer = this.proposerIdentity === this.memberIdentity;
    if (!isValidProposer) {
      throw new Error('Invalid proposer identity for data sharing');
    }
    const targetBytes = await this._stub.getState(this.targetKey);
    if (!targetBytes || !targetBytes.length) {
      throw new Error(`State[${this.targetKey}] not found`);
    }
    const targetData = JSON.parse(targetBytes.toString());
    if (this.approverIdentity !== targetData.memberIdentity) {
      throw new Error(`State[${this.targetKey}] not belong to ${targetData.memberIdentity}`);
    }
    this.status = Status.PENDING;
    return this;
  }

  async share() {
    if (!this.encryptedKeyForProposer) {
      throw new Error(`Field[encryptedKeyForProposer] is required for data sharing`);
    }
    const isApprover = this.approverIdentity === this.memberIdentity;
    if (!isApprover) {
      throw new Error(`Approver[${this.approverIdentity}] not match Caller[${this.memberIdentity}]`);
    }
    if (!this.proposerIdentity || !this.proposerPublicKey) {
      throw new Error(`Invalid proposer information`);
    }
    this.status = Status.APPROVED;
    return this;
  }

  approve(newState) {
    if (!newState.encryptedKeyForProposer) {
      throw new Error('Field[encryptedKeyForProposer] is required for data sharing');
    }
    if (this.status !== Status.PENDING) {
      throw new Error('Invalid dataShare status');
    }
    Object.assign(this, newState.toJSON());
    this.status = Status.APPROVED;
    return this;
  }

  reject(handledTime) {
    if (this.status !== Status.PENDING) {
      throw new Error('Invalid DataShare Status');
    }
    this.status = Status.REJECTED;
    this.handledTime = handledTime;
    return this;
  }
}
