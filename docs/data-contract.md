# 物品信息数据约定

所有物品保存在同一个数组中。每条记录包含：

| 字段        | 含义                                       |
| ----------- | ------------------------------------------ |
| id          | 每条信息的唯一编号                         |
| type        | `lost` 表示寻物，`found` 表示招领          |
| name        | 物品名称，搜索时使用                       |
| category    | 物品类别                                   |
| description | 外观特征等描述                             |
| location    | 丢失或拾取地点                             |
| eventTime   | 丢失或拾取时间                             |
| contact     | 发布者提供的联系方式                       |
| status      | `active` 表示处理中，`resolved` 表示已完成 |
| ownerId     | 发布者在当前浏览器中的标识                 |
| createdAt   | 发布时间                                   |

状态显示规则：寻物的 `resolved` 显示“已找到”；招领的 `resolved` 显示“已归还”。

