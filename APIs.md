# Contract APIs

## Universal Contract APIs
Calling Name                     | Calling Arguments                             
 ---                             |  ---                                          
<ContractName>:getByChainKey     | chainKey
<ContractName>:addState          | String<State> 
<ContractName>:addStates         | String<Array<State>> 
<ContractName>:updateState       | String<State>
<ContractName>:deleteByChainKey  | chainKey
<ContractName>:deleteByChainKeys | String<Array<chainKey>>
<ContractName>:list              | String<CouchdbQuery>, pageSize, bookmark                         
<ContractName>:listByChainKey    | city, String<KeyObject>, pageSize, bookmark

## DataShareContract

ContractName: DataShare

Calling Name             | Calling Arguments                
 ---                     |  ---                             
DataShare:request        | String<DataShareState>
DataShare:share          | String<DataShareState>
DataShare:approve        | chainKey, dataShareStateString            
DataShare:reject         | chainKey, handledTime            
DataShare:cancel         | chainKey 
DataShare:listDataShare  | String<{proposerIdentity, approverIdentity, targetKey, status}>, pageSize, bookmark                         

## EstateStateContract

ContractName: EstateState

## MemberStateContract

ContractName: MemberState

## DeveloperBizStateContract

ContractName: DeveloperBizState

## DelegationStateContract

ContractName: DelegationState

## IntentionStateContract 

ContractName: IntentionState

## EstateContractStateContract 

ContractName: EstateContractState

## EstateWatchRecordStateContract 

ContractName: EstateWatchRecordState
