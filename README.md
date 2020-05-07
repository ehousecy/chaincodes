# EBaaS Chaincodes

EBaaS Chaincode 相关代码仓库

**chaincode 统一使用 javascript 进行开发**

## 项目结构

```bash
ebaas-chaincodes                                       # 项目根目录
  |
  |---> chaincodes                                     # 编译完成的 chaincode
  |
  |---> ebaas-business                                 # 业务相关 chaincode
  |   |
  |   |---> <business chaincode in javascript>         # 某个业务 chaincode
  |   |    |
  |   |    |---> src                                   # chaincode 源码
  |   |         |
  |   |         |---> META-INF/statedb/couchdb/indexes # 自定义 couchdb indexes
  |   |         |
  |   |         |---> models                           # 链上 state 定义 
  |   |
  |   |---> ...                                        # 其他业务 chaincode
  |
  |---> ebaas-universal                                # 通用代码, 包含了基础 contract 的定义以及工具方法
  |   |
  |   |---> build                                      # 编译完成的通用代码, 引用时使用这个
  |   |
  |   |---> src                                        # 通用代码为编译版本, 开发在这里进行
  |        |
  |        |---> states                                # 通用 State
  |        |
  |        |---> contracts                             # 通用 合约
  |
  |---> scripts                                        # 脚本工具
```

## EBaaS Universal - EBaaS chaincode 开发通用库

EBaaS 项目中开发 chaincode 需要的基础包

### state - 状态数据定义

#### BaseState

<b style="color: red;">所有的数据都需要以 BaseState 的结构上链</b>

|  Field         |   Description     |  Type  |  Mem                              | 
|  ----           | ----              | ----   | ----                             | 
| chainKey        | 状态库中的唯一的键值 | string |  ?uuid, 添加数据时需要返回给调用方   |
| encryptedKey    | 加密后加密密钥      | string |  数据拥有人公钥加密, 用来加密隐私字段  |
| encryptedFields | 被加密的字段        | array  |  需要被加密字段的集合               |
| digest          | 数据摘要           | string |  明文数据的摘要                    |
| signature       | 数据签名           | string |  数据上传人的私钥对数据摘要的签名     |
| memberIdentity  | 数据拥有人         | string |   确定数据的归属                    |
| orgMspId        | 数据所属组织编号    | string |   数据所属组织编号                  |
| dataType        | 数据类型           | string |   数据类型                        |
| businessId      | 数据业务编号       | string | ?orgMspId+dataType+bid 标识唯一数据 |
| readRole        | 读权限范围         | json   |   /                              |
| writeRole       | 写权限范围         | json   |   /                              |
| ...data         | 业务数据           | json   |  业务数据的剩余字段                 |
| stateType       | state 类型         | string | <b style="color: red">合约设置</b> |
| ebaasDataType   | ebaas data 类型    | string | <b style="color: red">合约设置</b> |

必要字段: digest, signature, businessId

```js
class BaseState {

  // 子类需要拥有自己的 _ChainKeyFields 静态成员, 用于构造 chainKey
  // 并实现 ChainKeyFields 方法(返回该值)
  static _ChainKeyFields;
  // BaseState 中必要的字段, 子类需要定义自己的 RequiredFields 并且在 constructor 调用 validateRequiredFields
  static _RequiredFields = ['digest', 'signature', 'businessId'];
  // 确认当前 state 由合约调用者所属组织提交
  isSubmitByCallerOrg();
  // 确认当前 state 由合约调用者提交
  isSubmitByCaller();
  // 转化为 Buffer
  toBuffer();
  // 转化为 utf8 string
  toString();
  // 转化为 JSON object
  toJSON();
  // 当前 state 的 chainKey
  ChainKey();
  // 子类必须实现该方法用于返回构成 chainKey 的键
  //// 直接返回 ChildState.ChildStateKeyKeys
  ChainKeyFields();
  // 子类必须实现该方法用于返回构成 chainKey 的键
  //// 直接返回 ChildState.ChildStateKeyKeys.join('~')
  ChainKeyType();
  // 根据 stateData 中的字段生成 chainKey, 子类需要重写该方法
  static ChainKey(keys, stateData);
  // 转化为 BaseData
  static parse(String);
}
```

#### MemberState

| Field                     | Description  | Type   |  Memo                              |
|  ----                     | ----         | ----   | ---                                |
| name                      | 名称          | string |          /                         |
| memberType                | 会员类型       | enum   |    企业或个人                       |
| identityType              | 证件类型       | enum   |    证件类型                        |
| encryptedIdentityIdHash   | 证件号码 hash  | string | encrypt(hash(证件号码)|salt)       |
| salt                      | 掩码          | string |    随机 6 位字符串                  |
| sdkCert                   | SDK 证书      | string |          /                        |
| signCert                  | 签名证书       | string |          /                        |
| city                      | 签名证书       | string |          /                        |
| district                  | 签名证书       | string |          /                        |
| ipAddress                 | 签名证书       | string |          /                        |
| superioId                 | state 类型     | string | <b style="color: red">合约设置</b> |
| ebaasDataType             | ebaas data 类型| string | <b style="color: red">合约设置</b> |

必要字段: name, memberType, identityType, encryptedIdentityIdHash, salt

DataType: member

EBaaSDataType: member

ChainKey: orgMspId(base)~memberType~identityType~mencryptedIdentityIdHash

#### EstateState

|  Field       | Description   | Type   |  Memo                            |
|  ----        | ----          | ----  | ----                              |
| city         | 城市          | string | 不动产所属城市                      |
| district     | 区县          | string |          /                        |
| address      | 地址          | string |  不动产具体地址                     |
| area         | 面积          | string |          /                        |
| estateType   | 不动产类型     | enum   | 商业、办公、酒店、住宅、公寓、车库     |
| stateType    | state 类型     | string | <b style="color: red">合约设置</b> |
| ebaasDataType| ebaas data 类型| string | <b style="color: red">合约设置</b> |

必要字段: city, district, address, area, estateType

DataType: estate

ChainKey: estateType~city~district

#### Order<b style="color: red">[待定]</b>

<b style="color: red">Order(待定)用于表示链上针对无形资产的行为</b>

|  Field           | Description   | Type  | Memo |
|  ---             | ----          | ----  | ---- |
| assetId          | ?无形资产 id   | string | /   |
| participants     | 参与方         | array  | /   |
| participantRoles | 参与方角色      | string | /   |
| status           | 状态           | enum   | /   |

#### DataShareState

|  Field                  |  Description          |  Type  |  备注                             |
|  ---                    | ----                  | ----   | ----                             |
| applyId                 | 申请id                 | string | 申请人 id + 受理人 id + 申请数据 id |
| proposerIdentity        | 提案人                 | string |               /                  |
| proposerPublicKey       | 提案人公钥              | string |               /                  |
| targetKey               | 申请授权的数据标识       | string |                /                  |
| status                  | 状态                   | enum   | 待处理、已通过、已拒绝               |
| approverIdentity        | 受理人id               | string |                /                  |
| encryptedKeyForProposer | 申请人公钥加密后的对称密钥 | string |               /                  |
| handledTime             | 处理时间                | string |               /                  |
| stateType               | state 类型             | string | <b style="color: red">合约设置</b> |
| ebaasDataType           | ebaas data 类型        | string | <b style="color: red">合约设置</b> |

必要字段: targetKey

DataType: data_share

EBaaSDataType: grant

Status: pending, approved, rejected

ChainKey: status~proposerIdentity~approverIdentity~businessId

```js
class DataShareState extends BaseState {
  static _RequiredFields = ['targetKey'];
  static _ChainKeyFields = ['status', 'approverIdentity', 'proposerIdentity', 'targetKey'];
  /** 如果传入数据没有设置 status, 默认 status 为 pending **/ 
  // 创建数据申请
  request(stateString);
  // 创建数据分享
  share(stateString);
  // 同意数据申请
  approve(chainKey, handledTime);
  // 拒绝数据申请
  reject(chainKey, handledTime); 
}
```

### ContractHelper - 合约编写辅助类

```js
class ContractHelper {
  constructor(stateType); 
  // 添加一个 state 数据, 如果存在会覆盖
  addOneState(stub, State);
  // 添加多个 state 数据, 如果存在会覆盖
  addMultiState(stub, stateListString);
  // 根据 keyData 构造 chainKey 获取唯一的 state 数据
  findOneStateByKey(stub, ChainKey);
  // 根据 BusinessId 寻找唯一的 state 数据
  findOneStateByBusinessId(stub, businessId);
  // 根据 state 构造 chainKey 进行更新, 返回 chainKey
  updateOneState(stub, State, memberOnly = true);
  // 更新 stateList 中的存在 state
  updateMultiState(stub, stateListString, memberOnly = true);
  // 删除 ChainKey 对应的 State 数据
  deleteByKey(stub, ChainKey, memberOnly = true);
  // 删除 ChainKeys 对应的 State 数据
  deleteMultiByKey(stub, ChainKeys, memberOnly = true);
  // 根据 keyPartString 构造 chainKey 进行寻找
  listStateByChainKey({stub, objectType, objectKeys, pageSize, bookmark});
  // 根据 queryString 进行寻找, 需要建立 indexes
  listStateByQuery({stub, querystring, pageSize, bookmark});
}
```

### Contract 接口

基本接口指的是 universal 中所有合约都会暴露的接口(但并不一定所有合约都允许调用, 比如 DataShare 不允许调用 addState)

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

`KeyObject` 是有构成 state chainKey 的键值构成的 object, 比如 Estate 可能是 `{orgMspId, memberType, identityType, mencryptedIdentityIdHash}

具体接口列表查看 [APIs](APIS.md)
