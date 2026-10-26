# JeecgBoot 测试环境部署说明

2026-10-25 更新：已新增 FlowGram 工作流菜单并接通统一鉴权、共享流程及运行记录，Java 后端 JAR 保留。当前使用及权限分配见 [整合部署与验收](JeecgBoot-FlowGram-整合部署与验收-2026-10-25.md)。

日期：2026-10-24

项目讨论、需求演变和代码可修改边界见 [项目完整记录](AI-Agent编排平台-项目完整记录-2026-10-24.md)。本次续办只读复核确认服务 active、平台与原服务健康入口返回 200、JAR 校验值与本文一致。

## 访问入口

- 平台：http://YOUR_SERVER/agent/
- AI 流程设计：http://YOUR_SERVER/agent/process/list/airag
- 管理账号：`admin`；使用本次生成的独立随机密码，通过当前对话交付。本文不记录 SSH 或数据库密码。
- 验证入口：登录后进入“AI应用平台”，选择 AI流程设计、AI知识库、AI模型配置、MCP配置。

## 部署内容

- 官方源码版本：`jeecgboot/JeecgBoot`，tag `v3.9.5`。
- 后端：从源码构建单体可执行 JAR，Java 17，systemd 托管。
- 后端 JAR SHA-256：`bf634b337c08878b73508a47951d225ab78bc3da9efdf9e54d35574c4afe9fd3`。
- 前端：本机从源码编译，发布到 `/agent/` 子路径，接口前缀 `/agent-api`。
- 运行目录：服务器 `/opt/jeecg-agent`。
- 源码、构建日志与安装记录：服务器 `/home/ubuntu/jeecg-test`。
- 独立关系数据库：MariaDB，库 `jeecg_agent`。
- 缓存：Redis，本次安装的实例。
- 向量库基础服务：PostgreSQL 16 + pgvector，库 `jeecg_vector`。
- 上传使用本地目录 `/opt/jeecg-agent/upload`，应用接收上限配置为单文件 200MB；不代表浏览器组件、接口类型校验及实际业务格式均已验证。
- 平台后端仅监听 `127.0.0.1:8081`，通过现有 Caddy 转发。
- 外网 8088 访问检查未成功，正式测试入口改用现有 80 端口下的 `/agent/`；临时 8088 Web 服务已停用。
- 原站点 `/` 与 `/health` 保留；新增前已备份 Caddy 配置到 `/etc/caddy/Caddyfile.before-jeecg-20261024151818`。
- 样例非 admin 用户在新数据库中已禁用，admin 默认密码已替换为随机密码。
- 示例定时任务未启用；没有配置真实模型或转写服务凭据。

## 已完成的验证

| 项目 | 结果与证据边界 |
|---|---|
| 后端源码构建 | Maven BUILD SUCCESS，退出码 0；AI 模块参与源码编译 |
| 前端生产构建 | 成功，并使用 /agent/ 子路径配置 |
| 服务启动 | 后端 Tomcat 在 8081 启动，systemd 管理 |
| 外网访问 | /agent/ 返回 HTTP 200，浏览器渲染登录页 |
| 登录 | 经用户授权填写图形验证码，admin 登录成功 |
| AI 流程列表 | 浏览器正常加载官方导入的示例流程；示例不是本项目已实现的业务流程 |
| 流程画布 | 可打开“示例_LLM”，显示开始、LLM、结束节点 |
| 文件输入配置 | 开始节点→添加字段包含“文件”，选择后可配置允许格式；只查看并取消，未保存样例修改 |
| 原站点健康 | 新路由加入后 /health 仍返回 200 |

## 当前限制与待验证

- 测试服务器内存约 2GB，已有其他服务；本次 Java 堆上限 512MB，未进行并发压力验收。
- 已安装向量库并配置连接，不等于知识库导入、切片、嵌入生成与检索通过；仍需要可用嵌入模型及实际测试。
- 未配置可用 LLM、转写服务、Figma 或 GitHub 写入连接；现有示例不能当作这些服务已接通的证明。
- 已确认文件输入 UI，不等于录音、视频真实上传、格式校验、外部读取和长任务转写均已通过。
- 部分 AI 业务源码已保留；流程画布使用前端 `@jeecg/aiflow`，后端引用 `jeecg-aiflow-boot4`，其完整原始源码与扩展接口仍需按具体修改任务核实。
- 入口当前为 HTTP 测试地址；尚未配置域名与 HTTPS。

## 建议接着验证

1. 使用本次账号进入 AI流程设计，查看开始节点的文件字段。
2. 新建独立测试流程，配置允许的文件格式；先上传合成测试文件并确认传入值。
3. 配置真实转写服务，按其协议用 HTTP 或自定义节点传入文件。
4. 配置可用模型，将逐字稿传给 LLM，展示逐字稿和摘要。
5. 按总需求文档第 8 节执行慢任务、失败恢复和知识增量测试。

## 运维与回退

以下命令在测试服务器执行：

```bash
sudo systemctl status jeecg-agent
sudo tail -n 100 /opt/jeecg-agent/logs/backend.log
sudo systemctl restart jeecg-agent
```

配置位于 `/opt/jeecg-agent/config/application-prod.yml`，包含数据库凭据，请只在服务器内管理，不提交到开源仓库。

停止本平台使用 `sudo systemctl stop jeecg-agent`。如需移除入口，仅移除主 Caddyfile 中 `JEECG_AGENT_BEGIN` 到 `JEECG_AGENT_END` 的新增路由，验证配置后 reload Caddy；不要用旧备份覆盖之后可能发生的其他站点修改。

## 截图证据

![AI流程列表](JeecgBoot-测试环境-流程列表.png)

![文件输入配置](JeecgBoot-测试环境-文件输入配置.png)
