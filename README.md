# AI Native

基于 JeecgBoot 管理端与 FlowGram 画布搭建的 AI Agent 编排平台。

## 当前已实现

- JeecgBoot 菜单内嵌 FlowGram；Vue 管理端与 React 画布保持独立工程。
- 统一登录、菜单与操作权限校验；有权限的团队成员共享流程。
- 流程创建、编辑、保存、版本校验及运行记录。
- “开启翻译”给系统英文界面文案增加括号中文，保留用户输入、变量名及代码。

## 仍在规划

MCP、提示词、知识库、模型的跨平台节点适配方案已出具，尚未完成四类能力的运行接口接入。录音/视频转写、需求整理、Figma/飞书 原型生成和关联变更同步为后续业务工作流。

## 目录

| 路径 | 内容 |
| --- | --- |
| `src/jeecgboot` | JeecgBoot 3.9.5 前后端源码及 FlowGram 包装页 |
| `src/flowgram` | FlowGram 完整已跟踪源码快照及本项目修改 |
| `src/flowgram/deployment/jeecg` | 网关、权限菜单 SQL、包装页及集成说明 |
| `docs` | 需求、部署、验收、依赖审计、翻译与接口方案及安全截图 |
| `SOURCE_VERSIONS.json` | 上游版本和本地修改来源 |
| `SANITIZATION.json` | 发布时替换的配置文件清单 |

## 开发与部署

1. 分别阅读两个子项目的 README 和开发约定。FlowGram 使用 Node.js 18、pnpm 10.6.5；JeecgBoot 按其版本文档准备 Java、Maven、数据库和 Redis。
2. 管理端包装页位于 `src/jeecgboot/jeecgboot-vue3/src/views/flowgram/index.vue`。
3. 参照 `src/flowgram/deployment/jeecg/README.md` 配置网关、权限和反向代理；部署记录见 `docs`。
4. 私下配置数据库、Redis、模型等连接信息。公开快照已移除 YAML 中的字面量凭据默认值，环境变量占位并非可直接使用的线上配置。
5. `YOUR_SERVER`、`YOUR_LOCAL_HOME` 是文档占位符。此快照没有生产数据库、用户运行数据、真实密码、服务器配置或依赖构建产物。

历史验收记录反映记录当时的验证，不代表从本仓库全新安装后的验收。发布快照的验证范围见 `docs/开源上传记录-2026-10-26.md`。

## 许可

请阅读 [第三方许可说明](THIRD_PARTY_NOTICES.md) 及各组件原始 LICENSE。
