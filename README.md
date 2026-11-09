# 星群管家 · StarKeeper

<p align="center">
  <img src="docs/screenshots/dashboard-dark.png" alt="StarKeeper 控制台" width="920">
</p>

<p align="center">
  用 Go 写的 Telegram 多群管理控制台。<br>
  让每一个群，都像银河一样有序发光。
</p>

<p align="center">
  <img alt="Go" src="https://img.shields.io/badge/Go-1.26+-00ADD8?style=flat-square&logo=go">
  <img alt="SQLite" src="https://img.shields.io/badge/SQLite-embedded-003B57?style=flat-square&logo=sqlite">
  <img alt="Telegram" src="https://img.shields.io/badge/Telegram-Bot%20API-26A5E4?style=flat-square&logo=telegram">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-f4efe4?style=flat-square">
</p>

> **免费开源 · MIT License**  
> 这不是一个只有演示页面的壳子，而是一套可以直接部署、接真实 Telegram Bot、长期运营的完整系统。  
> 无订阅、无隐藏收费版本；需要定制开发、部署支持或现成 TG 系统，见文末「商业合作」。

**Telegram 交流群：[https://t.me/StarKeepera](https://t.me/StarKeepera)**  
群名：**星群管家 · TG 运营交流群**

星群管家是一套「机器人 + 可视化控制台」的完整源码实现：多群组管理、多机器人、定时发送、进群欢迎、入群验证、广告拦截、防炸群与全局黑名单、签到积分、积分商城、任务中心、Telegram Stars 数字商品、AI 群聊问答与总结、工单申诉、开放 API / Webhook、群组健康分、备份恢复、积分红包、抽奖/兑换码营销活动、广告位轮播、审计日志、模板版本历史，以及可自由编辑的文案与按钮。数据使用 **SQLite**，后端遵循 **MVC** 分层。

### 为什么做这个项目

很多 Telegram 群工具只解决“发欢迎语”或“关键词踢人”一个点；真正运营一个群，还需要签到、积分、活动、商城、会员、工单、数据、审计和团队协作。StarKeeper 想提供的是一套**可以长期运行、可以二次开发、可以私有化部署**的完整底座。

### 设计原则

- **单文件可跑**：Go + 纯 Go SQLite，无 CGO，无 Redis / MySQL / Node 运行时依赖
- **先能运营，再谈智能**：文案、按钮、签到、积分、商城、自动化都可配置
- **数据在自己手里**：SQLite 文件、备份、导出、私有部署
- **不锁死供应商**：AI 使用 OpenAI 兼容接口，Webhook / 开放 API 对接任意外部系统
- **可解释**：审计日志、健康分、周报都给出可读的原因
- **尽量少依赖**：前端原生 JS + CSS，不引入重型框架

### 适合谁

- 个人社群主、摄影/读书/课程/会员群
- 代运营团队：一套控制台管理多个客户群、多个 Bot
- 想私有化部署、数据不上云的团队
- 想基于现有系统做二次开发、白标交付的开发者

### 不适合谁

- 需要官方 Telegram 账号托管、自动加粉、批量私聊等违规能力
- 需要企业级多活集群、几十万群超大规模（当前 SQLite 单实例更适合中小规模）
- 希望开箱即用、完全不想配置 Bot Token / 服务器的人

## 机器人在群里的真实表现

<p align="center">
  <img src="docs/screenshots/group-bot-demo.png" alt="机器人群内效果" width="380">
</p>

机器人可以直接在群里完成这些动作：

- 发送每日签到卡片，按钮直接触发签到与排行榜
- 展示积分排行榜、连续签到与成员积分
- 发送欢迎语、群规、活动召集与 2.0 上线公告
- 根据每群独立配置的文案、按钮、定时任务运行
- 无需打开控制台，成员在群里就能完成签到、查看排行、打开商城、提交申诉

## 交流群

欢迎加入 StarKeeper 的 Telegram 交流群：

**https://t.me/StarKeepera**

群名：**星群管家 · TG 运营交流群**

<p align="center">
  <img src="docs/brand/avatar-primary.png" alt="StarKeeper 群头像" width="150">
</p>

- 反馈 Bug、提功能建议
- 交流群运营、机器人、自动化、签到积分、Stars 数字商品
- 获取模板、部署与二次开发经验
- 群内不欢迎广告、拉人、灰产与违规交易

加群后先看置顶与群规；提问请带上版本、截图、复现步骤和报错日志。

## 目录

- [机器人在群里的真实表现](#机器人在群里的真实表现)
- [交流群](#交流群)
- [功能](#功能)
- [界面预览](#界面预览)
- [完整截图库](#完整截图库)
- [快速开始](#快速开始)
- [Telegram 机器人配置](#telegram-机器人配置)
- [功能详解](#功能详解)
- [安全中心与防炸群](#安全中心与防炸群)
- [积分商城与任务中心](#积分商城)
- [审计日志与模板版本](#审计日志)
- [文案变量与按钮](#文案变量与按钮)
- [配置项](#配置项)
- [项目结构（MVC）](#项目结构mvc)
- [API 一览](#api-一览)
- [数据库表](#数据库表)
- [测试](#测试)
- [生产部署](#生产部署)
- [安全建议](#安全建议)
- [常见问题](#常见问题)
- [GitHub 仓库信息](#github-仓库信息)
- [开源与商业合作](#开源与商业合作)
- [赞助我们](#赞助我们)

## 功能

| 模块 | 能力 |
| --- | --- |
| 多群组管理 | 主机器人 + 多机器人账号管理多个群；每个群单独的时区、开关、模板和参数 |
| 定时发送 | 每天 / 每周 / 固定间隔 / 单次 / 5 段 Cron；支持发送到指定群或全部群 |
| 进群欢迎 | 自定义 HTML 文案、封面图、按钮、变量；可设置自动删除时间 |
| 入群验证 | 算术验证或点按验证；验证期间禁言；支持超时移出、通过奖励积分 |
| 广告拦截 | 关键词、正则、链接、转发、批量 @；白名单；删除/警告/禁言/移出/封禁 |
| 安全中心 | 入群频率防炸群、自动进入防护期、解除防护、最近入群事件 |
| 全局黑名单 | 跨群封禁、手动/自动/防炸群来源、有效期、启停与删除 |
| 审计日志 | 登录、群组、模板、排期、积分、红包、活动、广告、机器人等管理动作留痕 |
| 积分商城 | 商品/库存/限购/兑换码发放、兑换订单、积分扣减流水 |
| 任务中心 | 签到/发言/活动任务、每日/一次性、进度自动累计、群内领取 |
| 签到积分 | 每日签到、随机积分、连续签到加成、积分排行榜、手动调整 |
| 积分红包 | 拼手气 / 均分、按钮领取、进度与领取记录、过期自动结束 |
| 营销活动 | 抽奖报名 + 自动开奖；批量兑换码；活动卡片发布到多群 |
| 广告管理 | 多广告位、定时轮播、立即投放、投放记录、违规拦截记录 |
| 机器人管理 | 后台保存 Bot Token、自动 getMe、无需重启热连接、权限与命令说明 |
| 多机器人 | 多个 Bot 账号独立长轮询、群组自动绑定、按群选择机器人发送 |
| 自动化 | 入群/发言/签到/工单触发，发消息/加积分/禁言/踢出/黑名单/Webhook 动作 |
| 团队权限 | Owner/Admin/Operator/Viewer，团队成员管理、重置密码、只读写保护 |
| 邀请裂变 | `/invite` 专属链接、Telegram 原生入群归因、邀请奖励、排行榜 |
| 周报告警 | 每周群组周报、入群/广告/离线/卡密售罄告警、推送 Chat ID |
| 成员 Mini App | 移动端签到、积分、商城、任务、会员、申诉 |
| 会员计划 | Stars 购买 30/90 天会员，时长累加、到期状态、订单 |
| AI 知识库 | 群/全局知识条目，AI 回答前关键词检索，减少编造 |
| 模板市场 | 内置模板套装一键安装、JSON 导出/导入 |
| 白标 | 品牌名称、Slogan、Logo 上传，控制台与登录页同步 |
| AI 助手 | OpenAI 兼容接口、群聊问答、管理员群聊总结、可选聊天归档 |
| 数字商品 | Telegram Stars 售卖会员/课程/资料包/兑换码，支付后私聊发放 |
| 开放平台 | API Key、/api/v1 开放接口、Webhook 事件推送、HMAC-SHA256 签名 |
| 工单与申诉 | 群内 `/appeal` 提交、后台回复、私聊送达、状态流转 |
| 群组健康分 | 签到率、活跃度、广告拦截、验证/工单综合评分与改进建议 |
| 备份与恢复 | 全量 SQLite 快照下载、上传恢复、旧库自动留档 |
| 模板工坊 | 13 个场景、多模板、封面图上传、逐行按钮编排（每行 1–4 个）、版本历史/回滚、实时预览 |
| 数据看板 | 7 日新成员/签到、积分消耗、黑名单、审计、活动流与运营指标 |
| 控制台 | 登录鉴权、CSRF、仪表盘图表、活动流、深浅主题、移动端适配 |

## 界面预览

| 群组配置 | 模板工坊 |
| --- | --- |
| ![群组设置](docs/screenshots/group-settings.png) | ![模板](docs/screenshots/templates.png) |

| 深色总览 | 浅色总览 |
| --- | --- |
| ![深色](docs/screenshots/dashboard-dark.png) | ![浅色](docs/screenshots/dashboard-light.png) |

| 签到看板 | 积分红包 |
| --- | --- |
| ![签到](docs/screenshots/checkin.png) | ![红包](docs/screenshots/redpackets.png) |

| 机器人设置 | 逐行按钮编辑器 |
| --- | --- |
| ![机器人](docs/screenshots/bot.png) | ![按钮编辑器](docs/screenshots/button-editor-rows.png) |

| 安全中心 | 商城与任务 | 审计日志 |
| --- | --- | --- |
| ![安全](docs/screenshots/security.png) | ![商城](docs/screenshots/shop.png) | ![审计](docs/screenshots/audit.png) |

| AI 助手 | 数字商品 | 多机器人 |
| --- | --- | --- |
| ![AI](docs/screenshots/ai.png) | ![Stars](docs/screenshots/stars.png) | ![多机器人](docs/screenshots/bots.png) |

| 群组健康分 | 开放平台 | 工单与申诉 |
| --- | --- | --- |
| ![健康](docs/screenshots/health.png) | ![开放](docs/screenshots/developer.png) | ![工单](docs/screenshots/tickets.png) |

| 备份与恢复 | 模板市场 |
| --- | --- |
| ![备份](docs/screenshots/backup.png) | ![模板市场](docs/screenshots/market.png) |

| 自动化 | 团队与权限 | 周报与告警 |
| --- | --- | --- |
| ![自动化](docs/screenshots/automations.png) | ![团队](docs/screenshots/team.png) | ![周报](docs/screenshots/reports.png) |

| 邀请裂变 | 会员计划 | 成员 Mini App |
| --- | --- | --- |
| ![邀请](docs/screenshots/invites.png) | ![会员](docs/screenshots/memberships.png) | ![Mini App](docs/screenshots/miniapp.png) |

| 登录页 |
| --- |
| ![登录](docs/screenshots/login.png) |

> 截图来自内置演示数据。未配置 `BOT_TOKEN` 时，控制台默认进入演示模式，方便先把界面玩一遍。

## 完整截图库

### 控制台与群组

| 深色总览 | 浅色总览 |
| --- | --- |
| ![深色总览](docs/screenshots/dashboard-dark.png) | ![浅色总览](docs/screenshots/dashboard-light.png) |

| 群组配置 | 群内文案编辑 |
| --- | --- |
| ![群组配置](docs/screenshots/group-settings.png) | ![群内文案编辑](docs/screenshots/group-inline-editor.png) |

| 文案与按钮 | 模板编辑器 |
| --- | --- |
| ![模板工坊](docs/screenshots/templates.png) | ![模板编辑器](docs/screenshots/template-editor.png) |

| 按钮编辑器 | 逐行按钮编排 |
| --- | --- |
| ![按钮编辑器](docs/screenshots/button-editor.png) | ![逐行按钮](docs/screenshots/button-editor-rows.png) |

### 增长与变现

| 签到积分 | 积分红包 |
| --- | --- |
| ![签到](docs/screenshots/checkin.png) | ![红包](docs/screenshots/redpackets.png) |

| 积分商城 | 商城任务 |
| --- | --- |
| ![商城](docs/screenshots/shop.png) | ![商城任务](docs/screenshots/shop-tasks.png) |

| 数字商品 | 卡密池 |
| --- | --- |
| ![数字商品](docs/screenshots/stars.png) | ![卡密池](docs/screenshots/star-codes.png) |

| 会员计划 | 邀请裂变 |
| --- | --- |
| ![会员计划](docs/screenshots/memberships.png) | ![邀请裂变](docs/screenshots/invites.png) |

### AI、自动化与运营

| AI 助手 | 自动化工作流 |
| --- | --- |
| ![AI 助手](docs/screenshots/ai.png) | ![自动化](docs/screenshots/automations.png) |

| 模板市场 | 群组健康分 |
| --- | --- |
| ![模板市场](docs/screenshots/market.png) | ![群组健康](docs/screenshots/health.png) |

| 周报与告警 | 成员 Mini App |
| --- | --- |
| ![周报与告警](docs/screenshots/reports.png) | ![Mini App](docs/screenshots/miniapp.png) |

### 安全、开放平台与运维

| 安全中心 | 审计日志 |
| --- | --- |
| ![安全中心](docs/screenshots/security.png) | ![审计日志](docs/screenshots/audit.png) |

| 开放平台 | 工单与申诉 |
| --- | --- |
| ![开放平台](docs/screenshots/developer.png) | ![工单](docs/screenshots/tickets.png) |

| 机器人设置 | 多机器人 |
| --- | --- |
| ![机器人](docs/screenshots/bot.png) | ![多机器人](docs/screenshots/bots.png) |

| 团队与权限 | 备份与恢复 |
| --- | --- |
| ![团队与权限](docs/screenshots/team.png) | ![备份与恢复](docs/screenshots/backup.png) |

### 登录、移动端与群内效果

| 登录页 | 浅色登录页 |
| --- | --- |
| ![登录](docs/screenshots/login.png) | ![浅色登录](docs/screenshots/login-light.png) |

| 移动端 | 机器人群内表现 |
| --- | --- |
| ![移动端](docs/screenshots/mobile.png) | ![群内表现](docs/screenshots/group-bot-demo.png) |

## 快速开始

### 环境要求

- Go **1.26+**（项目使用纯 Go 的 `modernc.org/sqlite`，不需要 CGO / GCC）
- 能访问 Telegram Bot API 的网络环境
- 生产环境建议使用 Linux + 反向代理（HTTPS）

### 启动

```bash
cd tgkeeper

# 1. 安装依赖
go mod download

# 2. 准备环境变量
cp .env.example .env
# 编辑 .env：至少改 ADMIN_PASSWORD 和 SESSION_SECRET
# Bot Token 可以启动后在「机器人」页面保存，无需写进 .env

# 3. 启动
go run ./cmd/server
```

打开 <http://127.0.0.1:8787>。

演示模式默认账号：

```text
账号：admin
密码：admin123
```

> 首次启动会自动创建管理员、默认模板与演示数据。配置 `BOT_TOKEN` 后，`SEED_DEMO` 默认变为 `false`；若要清空演示数据，停止服务后删除 `data/starkeeper.db*` 再启动即可。

### 编译单个可执行文件

```bash
go build -trimpath -ldflags="-s -w" -o starkeeper ./cmd/server
./starkeeper
```

Windows：

```powershell
go build -o starkeeper.exe ./cmd/server
.\starkeeper.exe
```

## Telegram 机器人配置

### 1. 创建机器人

1. 在 Telegram 中找到 [@BotFather](https://t.me/BotFather)。
2. 发送 `/newbot`，按提示设置名称与用户名。
3. 复制 Bot Token，打开控制台的「机器人」页面，粘贴并点击「保存并连接」。系统会立即调用 `getMe` 读取机器人名称、用户名、ID 与权限，不需要重启；Token 用 AES-GCM 加密后保存到 SQLite。

### 2. 关闭 Privacy Mode（广告拦截必需）

默认的 Privacy Mode 会让机器人只收到命令和回复，**看不到普通群消息**，因此无法拦截广告。

在 BotFather 中：

```text
/setprivacy
→ 选择你的机器人
→ Disable
```

修改后，把机器人**移出群再重新拉进群**，权限才会刷新。

### 3. 设为群管理员

机器人需要以下管理员权限：

- **删除消息**（广告拦截、兑换码回收）
- **封禁用户 / 限制成员**（验证禁言、违规处理）
- **邀请用户**（部分群组限制场景）
- 可选：**置顶消息**、**管理视频聊天**

如果只是做欢迎/定时发送，必须至少有「发送消息」和管理员身份。

### 4. 在控制台接入群组

打开「群组管理 → 接入群组」，填写：

- 群组数字 ID：`-100...`（推荐）
- 或公开群组的 `@username`

机器人必须已经在群里，否则接口会返回无法读取群组。

> 获取 Chat ID：在群里发送 `/id`，机器人会返回群组 ID 和你的用户 ID。

### 5. Token 保存与热连接

侧边栏的「机器人」页面是独立的机器人工作台：

- 保存 Token 后立即 `getMe`，自动显示机器人名称、`@username`、Bot ID、是否可加入群组、是否可读取全部群消息。
- Token 只以 AES-GCM 密文写入 SQLite，管理接口不会回传明文，只显示掩码。
- 连接成功后在当前进程内自动启动长轮询，不需要重启。
- 「断开连接」会停止收发并删除后台保存的 Token。
- 环境变量 `BOT_TOKEN` 仍然兼容；如果后台也保存了 Token，以后台保存的为准。
- 修改 `SESSION_SECRET` 后，旧 Token 将无法解密，需要重新保存一次。

群组被机器人加入后会自动出现在「群组管理」，但机器人不会自动获得管理员权限；需要你在 Telegram 中手动提升。

### 6. 群内命令

| 命令 | 作用 |
| --- | --- |
| `/checkin` | 每日签到 |
| `/me` | 查看积分、排名、今日签到 |
| `/rank` | 本群积分排行榜 |
| `/shop` | 打开积分商城 |
| `/tasks` | 查看任务进度并领取奖励 |
| `/store` | 打开 Telegram Stars 数字商品 |
| `/ai` | 向 AI 助手提问 |
| `/summary` | 总结最近群聊（管理员） |
| `/appeal` | 提交申诉/工单 |
| `/rules` | 群规卡片 |
| `/id` | 群组 ID / 用户 ID |
| `/help` | 帮助 |

## 功能详解

### 定时发送

支持五种模式：

| 模式 | 用法 |
| --- | --- |
| 每天 | `HH:MM`，按控制台时区计算 |
| 每周 | `HH:MM` + 勾选星期（ISO，周一到周日） |
| 固定间隔 | 每 N 分钟发送一次 |
| 单次 | 指定日期时间，发送后自动完成 |
| Cron | 标准 5 段表达式：`分 时 日 月 周` |

Cron 示例：

```text
0 9 * * 1-5     工作日每天 09:00
30 20 * * 5     每周五 20:30
0 */2 * * *     每两小时整点
0 10 1 * *      每月 1 日 10:00
```

目标群组可以选「全部群组」，此时会发送到所有启用中的群。

### 进群欢迎

- 每个群可绑定不同模板。
- 文案支持 Telegram HTML：`<b>`、`<i>`、`<code>`、`<a>`、`<blockquote>`、`<tg-spoiler>`。
- 可设置自动删除时间（秒），0 表示保留。
- 支持封面图 URL 或直接上传图片。
- 按钮支持链接和内置回调动作。

### 群组内直接编辑文案与按钮

不需要跳到模板工坊：

1. 打开「群组管理 → 选择群组」。
2. 在「进群欢迎 / 入群验证 / 签到积分」标签页中，点击「✎ 编辑文案与按钮」。
3. 会就地打开模板编辑器，修改文案、封面、按钮后保存，页面自动刷新。

按钮编辑器按**行**编排：

- 每行可放 1–4 个按钮；
- 可以单独增加/删除某一行；
- 同一行内可继续增加按钮，最多 8 个；
- 右侧 Telegram 预览会实时显示每一行的列数；
- 旧模板没有行信息时，默认每行 2 个，向后兼容。

标签本身是功能分类，不可重命名；标签页里的卡片文案和按钮都可以编辑。

### 入群验证

1. 新成员入群后，机器人立即限制其发言。
2. 发送验证卡片：
   - **算术验证**：自动生成 4 个答案按钮，正确答案随机排布。
   - **点按验证**：点击「我是人类」按钮。
3. 验证通过：解锁发言，可按配置发放积分。
4. 超时：
   - `mute`：Telegram 到期自动解除限制；
   - `kick`：机器人将用户移出群（封禁后立即解封，允许重新通过邀请链接加入）。

> 验证依赖「限制成员」权限；权限不足时会记录日志并继续发送验证卡片。

### 广告拦截

每个群单独配置：

- **关键词**：逗号或换行分隔，大小写不敏感。
- **正则**：每行一条，示例 `(?i)加微信|私聊我`。
- **链接**：识别 `http(s)://`、`www.`、`t.me/`、`telegram.me/`、`discord.gg/` 等。
- **转发**：识别转发来源与自动转发。
- **批量 @**：默认关闭，避免误伤正常提及。
- **白名单**：用户 ID、`@username` 或域名片段，命中即跳过。
- **处理策略**：达到阈值后删除 / 警告 / 禁言 10 分钟 / 移出 / 封禁。
- **日志频道**：可选，把违规记录同步到一个管理员频道。

机器人会豁免群管理员与频道身份发送者。

### 签到与积分

- 群内发送 `/checkin`、`/签到`，或点击按钮。
- 基础积分在 `最少 ~ 最多` 之间随机。
- 连续签到第 N 天额外获得 `(N-1) × 连续加成`，最高计算 6 天加成。
- 积分账户按「群组 + 用户」隔离。
- `/me` 查看余额、排名、今日状态；`/rank` 查看排行榜。
- 管理台支持按用户 ID 手动补发/扣除，写入积分流水。

### 积分红包

- 管理员在「积分红包」创建草稿，再点击「立即发送」。
- 拼手气：二倍均值随机拆分；均分：按剩余人数均摊。
- 每位成员限领一次；抢完自动结束；过期自动标记。
- 领取人、积分、时间都可在控制台回看。

> Telegram Bot API 不支持机器人直接转账法币，因此这里的红包是**群内积分红包**，用于活跃与回馈，不涉及提现。

### 营销活动

**抽奖活动**

1. 设置奖池、中奖人数、报名截止与开奖时间。
2. 点击「发布」，活动卡片发送到目标群。
3. 群友点击「报名参与」进入奖池。
4. 到开奖时间自动随机抽取并发放积分；也可以手动「立即开奖」。
5. 中奖公告会发送到活动发布过的群。

**兑换码活动**

1. 设置生成数量与每码积分。
2. 创建时自动生成一次性兑换码。
3. 群友在群内直接发送兑换码即可到账。
4. 在活动详情的「兑换码」页签可复制全部代码。

### 广告位

- 支持指定群或全部群。
- 设置轮播间隔（分钟）与起止时间。
- 点击「立即投放」可跳过排期直接发送。
- 机器人自己发送的广告不会被广告拦截规则误伤。

### 安全中心与防炸群

- **入群频率防护**：在 N 秒内超过 M 人入群时自动进入防护期。
- **防护动作**：踢出 / 永久封禁 / 踢出并加入全局黑名单。
- **防护期**：默认 15 分钟；防护期内所有新成员会被立即处理。
- **自动提醒**：触发时在群内发送警报，并写入审计和动态。
- **手动解除**：安全中心顶部「解除防护」。
- **全局黑名单**：跨群生效；支持手动、防炸群、自动来源；可设置到期时间、停用、删除。
- 命中黑名单的用户入群会被封禁；发言时会被删除消息并移出。

### 积分商城

- 商品支持图标、说明、所需积分、库存（-1 为无限）、每人限兑。
- 兑换成功后自动扣除积分、扣减库存、生成订单。
- 发放内容支持兑换码、链接、联系方式；会优先私聊发送给成员。
- 成员在群内发送 `/shop` 打开商品按钮；点击即可兑换。
- 管理端可查看兑换记录与积分消耗。

### 任务中心

- 任务类型：
  - `checkin`：每日签到
  - `message`：群内发言
  - `campaign`：报名活动
  - `manual`：预留手动任务
- 周期：每日重置 / 一次性。
- 进度由签到、发言、活动报名自动累计；成员发送 `/tasks` 查看并领取。
- 领取时写入积分流水，重复领取会被拒绝。
- 管理端可以查看任务进度与领取记录。

### 审计日志

- 记录管理员登录、群组接入/配置、模板编辑/恢复/删除、定时任务、积分调整、红包、活动、广告、机器人 Token、黑名单等操作。
- 记录管理员、动作、目标、详情、IP、User-Agent、时间。
- 支持按动作、管理员、关键词筛选与分页。
- 不记录群成员聊天内容。

### 模板版本历史

- 每次保存模板都会写入一个版本快照。
- 每个模板保留最近 30 个版本。
- 模板卡片点击「历史版本」可查看版本说明、时间与内容摘要。
- 一键恢复历史版本；恢复动作同样写入审计日志。

### 数据看板

- 7 日新成员、7 日签到、商城兑换/积分消耗、全局黑名单、今日审计。
- 签到/入群/验证/拦截 7 日曲线。
- 群组星图、最近活动、下一次发送、最近审计。
- 安全中心会显示当前防护状态与最近入群事件。

### 自动化工作流

- 触发：成员入群、群内发言、完成签到、提交工单。
- 条件：关键词、最低积分、仅管理员/仅普通成员。
- 动作：发送消息、增加积分、禁言、踢出、加入全局黑名单、触发 Webhook。
- 动作按顺序执行；每次触发写入运行记录。
- 支持按群或全部群生效。
- 示例：退款关键词 → 发消息 + 加分 + 建工单；签到 → 额外奖励；入群 → 10 分钟提醒。

### 团队与权限

- Owner：全部权限，包括团队、机器人 Token、备份、开放平台。
- Admin：日常运营与内容编辑。
- Operator：发消息、工单、活动与自动化。
- Viewer：只读；所有写操作会被中间件拒绝。
- 团队成员可创建、改角色、重置密码、删除；至少保留一个 owner。
- 当前版本是角色级写入保护，不是逐群细粒度授权。

### 邀请裂变

- 成员发送 `/invite`，机器人用 `createChatInviteLink` 生成专属链接。
- 新成员通过链接入群时，`chat_member` 更新带回 invite_link，机器人归因到邀请人。
- 可配置每位新成员奖励积分，写入积分流水与动态。
- 后台查看邀请链接、使用次数、入群人数与排行榜。
- 只统计通过专属链接入群，普通邀请链接不归因。

### 周报与告警

- 每周一 09:00 自动生成群组周报，也可手动生成。
- 周报含成员、签到、动态、广告拦截、未处理工单。
- 告警：入群暴增、广告暴增、机器人离线、一次性卡密售罄。
- 同类告警 1 小时内只提醒一次；写入告警列表，可选推送到 Chat ID。
- 运营人员可在控制台关闭告警。

### 多机器人 / 多租户

- 主机器人继续使用「机器人」页面的 Token。
- 在「机器人账号」添加第 2、3 个 Bot Token；每个机器人独立长轮询。
- 机器人被拉进群后，群组自动绑定到该机器人；群配置、欢迎、验证、签到、广告拦截、积分和命令都按群独立运行。
- 定时发送、广告、红包、活动开奖会按群选择绑定的机器人发送。
- 删除机器人会删除它绑定的群组配置；主机器人不可删除，只能断开 Token。
- 适合代运营团队把不同客户群放在不同机器人下，共用一个控制台。

### 成员 Mini App

- `/miniapp?group=群组ID` 提供移动端成员中心。
- 通过 Telegram WebApp `initData` 做 HMAC 校验；演示模式可直接在浏览器打开。
- 支持：签到、积分、商城兑换、任务领取、会员状态、提交申诉。
- 机器人 `/app` 发送链接；正式环境需要公网 HTTPS 的 `PUBLIC_URL`。

### 会员计划

- 后台创建 Stars 会员计划：名称、价格、天数、权益。
- 群内 `/member` 展示计划，点击创建 Stars 发票。
- 支付成功后自动累加会员时长（续费叠加），写入会员订单。
- 后台查看会员名单、到期状态、订单。
- 会员权益目前是信息与时长记录，具体群权限可由管理员结合自动化执行。

### AI 知识库

- 在「AI 助手」添加群级或全局知识条目。
- `/ai` 回答前按关键词重叠检索最多 5 条知识，拼入系统提示。
- 知识库没有答案时要求 AI 说明不确定，减少编造。
- 不使用外部向量库，部署简单；适合 FAQ、群规、课程说明。

### 模板市场

- 内置「温柔社群」「知识付费」「活动运营」模板套装。
- 一键安装为一组新模板，安装后可在「文案与按钮」继续编辑。
- 支持导出全部模板 JSON、导入 JSON 模板数组。
- 适合把一套运营方法快速复制到新群或新客户。

### 白标

- 品牌名称、Slogan、Logo 可配置。
- Logo 上传后出现在控制台侧边栏与登录页。
- 白标是品牌层；不同客户的数据隔离仍依赖工作区/机器人规划。

### 多租户边界

当前实现是 **按机器人/工作区隔离的运营模型**：

- 每个 Bot 有独立 Token、独立长轮询、自动绑定自己的群组。
- 群配置、欢迎验证、签到、自动化、积分、工单按群/机器人隔离。
- 定时、广告、活动按群选择对应机器人发送。
- 管理员目前是同一控制台内的角色权限，不做独立租户数据库隔离。

真正的「每客户独立数据库、独立管理员、独立账单」还需要拆库或 tenant_id 全表改造，当前版本先提供可用的多机器人工作区。

### AI 助手

控制台「AI 助手」支持任意 OpenAI Chat Completions 兼容接口：

- Base URL、模型、API Key、系统提示词、总结提示词都可编辑。
- API Key 使用 `SESSION_SECRET` 加密保存。
- 群内 `/ai 你的问题` 进行问答。
- 管理员 `/summary` 总结最近群聊。
- 可选「归档群聊消息」：开启后最近 1,200 条文本保存在本地 SQLite，供总结使用。
- 关闭归档时不会保存聊天内容；AI 请求会把选中片段发送给第三方 API，请先告知成员。
- 控制台可试运行测试与直接生成当前群摘要。

### Telegram Stars 数字商品

- 「数字商品」用 Stars 给会员、课程、资料包、兑换码定价。
- 三种发放模式：
  - **固定内容（可重复）**：每次支付都发送同一段内容。
  - **一次性卡密池**：批量导入卡密，每次支付原子领取一条未使用卡密，发完即止。
  - **重复卡密/口令**：所有买家收到同一条卡密或通用口令。
- 卡密池支持批量导入、自动去重、查看未使用/已使用、删除、订单关联。
- 卡密池管理界面：![卡密池](docs/screenshots/star-codes.png)
- 群内 `/store` 展示商品按钮。
- 点击后由机器人创建 Stars 发票，支付由 Telegram 完成。
- 支付成功回调后，机器人私聊发送商品内容/卡密，并写入订单；卡密池售罄时订单标记为 `pending` 并提示补发。
- 机器人不接触银行卡，也不能直接把 Stars 提现为法币；收入按 Telegram 的 Stars 结算规则处理。
- 商品支持上架/下架、排序、内容编辑；订单可在控制台查看。

### 开放 API / Webhook

- 「开放平台」创建 API Key，Token 只展示一次，数据库只保存 SHA-256 哈希。
- 开放接口：群组列表、统计摘要、签到记录、发送群消息、调整积分。
- 所有开放接口使用 `Authorization: Bearer sk_live_...`。
- Webhook 订阅事件：`member.joined`、`checkin.completed`、`redpacket.claimed`、`campaign.joined`、`shop.redeemed`、`task.claimed`、`star.purchased`、`ticket.created`。
- 请求头包含 `X-StarKeeper-Event`；配置 Secret 后附带 `X-StarKeeper-Signature: sha256=...`，用 HMAC-SHA256 验证。
- 控制台可发送测试事件、查看最近投递结果。

### 工单与申诉

- 成员在群里发送 `/appeal 我被误禁言了` 提交工单。
- 工单进入「工单与申诉」，管理员可筛选待处理/已回复/已关闭。
- 回复会私聊发送给提交人；若对方未启动机器人，控制台会提示私聊失败。
- 支持关闭工单与搜索。

### 群组健康分

- 基础分 45，叠加 7 日签到覆盖率与群内动态。
- 广告拦截、待验证、未处理工单会扣分。
- 每个群给出 0–100 健康分、等级与具体改进建议。
- 附最佳/待改善群组与平均分，便于巡场。

### 备份与恢复

- 「备份与恢复」通过 SQLite `VACUUM INTO` 下载一致性快照。
- 上传 `.db` 备份后保存为 `data/restore.db`，下次启动自动替换。
- 当前数据库会先改名为 `pre-restore-时间戳.db`，可回滚。
- 包含群配置、模板、积分、活动、审计、订单、工单与机器人账号。

## 文案变量与按钮

### 可用变量

| 变量 | 含义 |
| --- | --- |
| `{name}` | 用户昵称 |
| `{username}` | `@username` |
| `{mention}` | 可点击的用户提及（HTML） |
| `{group}` | 群组名称 |
| `{count}` | 群成员数 |
| `{date}` | 当前日期时间 |
| `{points}` | 本次获得积分 |
| `{streak}` | 连续签到天数 |
| `{balance}` | 当前积分余额 |
| `{question}` | 验证问题 |
| `{timeout}` | 验证有效期 |
| `{title}` / `{note}` | 红包标题 / 祝福 |
| `{total}` / `{count}` | 红包总积分 / 个数 |
| `{expire}` | 红包过期时间 |
| `{entries}` / `{end}` | 活动报名数 / 截止时间 |
| `{currency}` | 货币名称（默认「积分」） |
| `{rules}` | 群规文案 |
| `{bot}` | 机器人用户名 |

变量值会做 HTML 转义；文案本身可以直接写 HTML。

### 按钮类型

- **链接**：`https://...`、`tg://...`
- **回调**：由机器人处理的内置动作
  - `checkin` 签到
  - `rules` 群规
  - `rank` 积分排行榜
  - `join` 活动报名（发布抽奖时自动替换为具体活动）
  - `rp:<红包ID>` 红包（系统生成）

按钮按每行 2 个自动排列，最多 8 个。

## 配置项

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `APP_ADDR` | `127.0.0.1:8787` | 控制台监听地址 |
| `PUBLIC_URL` | 空 | 对外访问地址；上传图片、控制台按钮需要 |
| `BOT_TOKEN` | 空 | 可选的启动 Token；日常推荐在「机器人」页面保存，后台值优先且加密存储 |
| `ADMIN_USER` | `admin` | 首次启动管理员账号 |
| `ADMIN_PASSWORD` | `admin123` | 首次启动管理员密码 |
| `SESSION_SECRET` | 本地默认值 | Session / CSRF 派生密钥，生产必改 |
| `DB_PATH` | `data/starkeeper.db` | SQLite 文件路径 |
| `UPLOAD_DIR` | `data/uploads` | 上传图片目录 |
| `APP_TIMEZONE` | `Asia/Shanghai` | 全局时区 |
| `SEED_DEMO` | 无 Token 时 true | 是否写入演示数据 |
| `LOG_LEVEL` | `info` | 预留日志级别 |

## 项目结构（MVC）

```text
tgkeeper/
├── cmd/server/main.go              # 依赖装配、HTTP 服务、优雅退出
├── internal/
│   ├── model/                      # M —— SQLite 模型与仓储
│   │   ├── db.go / migrate.go      # 连接、WAL、建表
│   │   ├── types.go                # 实体
│   │   ├── repo_*.go               # 群组、内容、积分、活动仓储
│   │   └── model_test.go
│   ├── view/                       # V —— Go html/template + 静态资源
│   │   ├── view.go                 # 模板解析、函数、embed
│   │   ├── templates/              # 登录、总览、群组、模板、Mini App…
│   │   ├── static/                 # app.css / app.js / favicon
│   │   └── miniapp.html            # 独立移动端成员中心
│   ├── controller/                 # C —— 页面控制器 + REST API
│   │   ├── app.go                  # 路由、中间件、JSON、上传
│   │   ├── auth.go                 # 登录、Session、CSRF
│   │   ├── pages.go                # 服务端渲染页面数据
│   │   ├── page_audit.go           # 审计日志页
│   │   ├── page_security.go        # 防炸群 / 黑名单页
│   │   ├── page_shop.go            # 商城与任务页
│   │   ├── page_ai.go              # AI 设置与总结
│   │   ├── page_stars.go           # Stars 数字商品
│   │   ├── page_developer.go       # API Key / Webhook
│   │   ├── page_tickets.go         # 工单与申诉
│   │   ├── page_health.go          # 群组健康分
│   │   ├── page_bots.go            # 多机器人
│   │   ├── page_backup.go          # 备份 / 恢复
│   │   ├── page_automations.go     # 自动化工作流
│   │   ├── page_team.go            # 团队与权限
│   │   ├── page_reports.go         # 周报与告警
│   │   ├── page_invites.go         # 邀请裂变
│   │   ├── page_memberships.go     # 会员计划
│   │   ├── page_market.go          # 模板市场
│   │   ├── mini.go                 # 成员 Mini App + 身份校验
│   │   ├── workers.go              # 周报/告警后台任务
│   │   ├── api_open.go             # /api/v1 开放接口
│   │   ├── api_bot.go              # 机器人 Token / 热连接
│   │   └── api_*.go                # 各模块接口
│   ├── bot/                        # 机器人业务
│   │   ├── bot.go                  # 长轮询、命令、回调分发
│   │   ├── welcome.go              # 欢迎 / 验证 / 防炸群 / 黑名单入场
│   │   ├── moderation.go           # 广告拦截
│   │   ├── engagement.go           # 签到 / 红包 / 活动 / 兑换码 / 商城 / 任务
│   │   ├── ai.go                   # /ai 与 /summary
│   │   ├── stars.go                # Stars 发票与支付回调
│   │   ├── tickets.go              # /appeal 工单
│   │   ├── automation.go           # 自动化规则执行
│   │   ├── invites.go              # 邀请链接与归因
│   │   ├── membership.go           # 会员 Stars 支付
│   │   ├── miniapp.go              # /app 打开成员中心
│   │   ├── pool.go                 # 多机器人实例池
│   │   └── delivery.go             # 定时消息 / 广告 / 开奖
│   ├── ai/                         # OpenAI 兼容 Chat Completions 客户端
│   ├── webhook/                    # Webhook 分发与 HMAC 签名
│   ├── scheduler/                  # 定时调度 + Cron 解析
│   ├── telegram/                   # Bot API 客户端（无 SDK 依赖）
│   ├── render/                     # 模板变量、按钮、键盘
│   ├── security/                   # PBKDF2 密码、CSRF、随机码
│   ├── seed/                       # 默认模板、演示数据
│   └── config/                     # 环境变量 + .env
├── docs/screenshots/
├── .env.example
├── Dockerfile
└── go.mod
```

**MVC 边界**

- Model 不引用 HTTP / 模板，只负责实体、SQL、事务。
- View 只负责模板与静态资源，所有数据由 Controller 传入。
- Controller 处理鉴权、参数校验、调用 Model / Service，再渲染 View 或返回 JSON。
- `bot` / `scheduler` 是可复用的业务层，Controller 和后台调度共同调用。

## API 一览

所有 `/api/*` 接口（除登录）都需要登录 Session；修改类请求还需 `X-CSRF-Token` 请求头。

```text
POST   /api/auth/login              登录
POST   /api/auth/logout             退出
GET    /api/me                      当前管理员

GET    /api/dashboard               仪表盘统计
GET    /api/activity                动态流

GET    /api/groups                  群组列表
POST   /api/groups                  接入群组
GET    /api/groups/{id}             群组 + 配置
PUT    /api/groups/{id}             更新群组
DELETE /api/groups/{id}             移除群组
POST   /api/groups/{id}/sync        同步群信息 / 机器人权限
GET    /api/groups/{id}/settings    读取群配置
PUT    /api/groups/{id}/settings    保存群配置
POST   /api/groups/{id}/test        发送测试消息

GET    /api/templates               模板列表
POST   /api/templates               新建模板
PUT    /api/templates/{id}          更新模板
DELETE /api/templates/{id}          删除模板
POST   /api/templates/{id}/duplicate 复制模板
GET    /api/templates/{id}/versions  模板版本历史
POST   /api/templates/{id}/versions/{versionID}/restore 恢复版本

GET/POST /api/schedules             排期列表 / 新建
PUT/DELETE /api/schedules/{id}      更新 / 删除
POST   /api/schedules/{id}/run      立即发送
POST   /api/schedules/{id}/toggle   启用 / 暂停

GET    /api/checkins                签到记录
GET    /api/points                  积分账户
POST   /api/points/adjust           手动调整积分

GET/POST /api/redpackets            红包列表 / 创建
GET    /api/redpackets/{id}         红包详情 + 领取记录
POST   /api/redpackets/{id}/send    发送红包
POST   /api/redpackets/{id}/status  暂停 / 恢复
DELETE /api/redpackets/{id}         删除

GET/POST /api/campaigns             活动列表 / 创建
PUT/DELETE /api/campaigns/{id}      更新 / 删除
POST   /api/campaigns/{id}/publish  发布活动
POST   /api/campaigns/{id}/draw     手动开奖
GET    /api/campaigns/{id}/entries  报名 / 中奖 / 兑换码

GET/POST /api/ads                   广告位列表 / 创建
PUT/DELETE /api/ads/{id}            更新 / 删除
POST   /api/ads/{id}/send           立即投放
POST   /api/ads/{id}/toggle         启用 / 暂停

GET    /api/antispam/logs           拦截记录
GET    /api/audit                   审计日志（筛选/分页）
GET    /api/security                防炸群 + 黑名单状态
PUT    /api/security/group/{id}     保存群防炸群设置
POST   /api/security/group/{id}/unlock 解除防护
GET/POST /api/blacklist             全局黑名单列表 / 新增
DELETE /api/blacklist/{id}          删除黑名单
POST   /api/blacklist/{id}/toggle   启用 / 停用

GET/POST /api/shop/items            商品列表 / 新建
PUT/DELETE /api/shop/items/{id}     更新 / 删除商品
GET    /api/shop/orders             兑换记录
GET/POST /api/tasks                 任务列表 / 新建
PUT/DELETE /api/tasks/{id}          更新 / 删除任务
GET    /api/tasks/progress          任务进度

GET/POST /api/stars/products        Stars 商品列表 / 新建
PUT/DELETE /api/stars/products/{id} 更新 / 删除
GET/POST /api/stars/products/{id}/codes 卡密列表 / 批量导入
DELETE /api/stars/codes/{id}        删除卡密
GET    /api/stars/orders            Stars 订单

GET    /api/ai                      AI 配置（不含 Key）
PUT    /api/ai                      保存 AI 配置
POST   /api/ai/test                 试运行
POST   /api/ai/summary              生成群聊总结

GET/POST /api/tickets               工单列表
POST   /api/tickets/{id}/reply      回复并通过机器人私聊
POST   /api/tickets/{id}/close      关闭工单

GET/POST /api/api-keys              API Key 列表 / 新建
DELETE /api/api-keys/{id}           删除
POST   /api/api-keys/{id}/toggle    启用 / 停用
GET/POST /api/webhooks              Webhook 列表 / 新建
PUT/DELETE /api/webhooks/{id}       更新 / 删除
POST   /api/webhooks/{id}/test      发送测试事件
GET    /api/webhooks/deliveries     投递记录

GET    /api/v1/groups               开放接口：群组
GET    /api/v1/stats                开放接口：统计
GET    /api/v1/checkins             开放接口：签到
POST   /api/v1/messages             开放接口：发送消息
POST   /api/v1/points/adjust        开放接口：调整积分

GET/POST /api/automations           自动化列表 / 新建
PUT/DELETE /api/automations/{id}    更新 / 删除
POST   /api/automations/{id}/toggle 启用 / 暂停

GET/POST /api/admins                团队成员 / 创建（owner）
PUT/DELETE /api/admins/{id}         修改角色 / 删除（owner）
POST   /api/admins/{id}/password    重置密码（owner）

GET    /api/invites                 邀请链接与排行榜
PUT    /api/invites/settings        邀请奖励
POST   /api/reports/generate        生成周报
PUT    /api/reports/settings        周报/告警设置
GET    /api/alerts                  告警列表
POST   /api/alerts/{id}/close       关闭告警

GET/POST /api/memberships/plans     会员计划 / 新建
PUT/DELETE /api/memberships/plans/{id} 更新 / 删除
GET    /api/memberships             会员名单
GET    /api/memberships/orders      会员订单

GET/POST /api/ai/knowledge          AI 知识库
PUT/DELETE /api/ai/knowledge/{id}   更新 / 删除

POST   /api/market/install          安装模板包
GET    /api/market/export           导出模板 JSON
POST   /api/market/import           导入模板 JSON

POST   /api/miniapp/overview        Mini App 首页数据
POST   /api/miniapp/checkin         Mini App 签到
POST   /api/miniapp/shop/redeem     Mini App 兑换
POST   /api/miniapp/tasks/claim     Mini App 领任务
POST   /api/miniapp/ticket          Mini App 申诉

GET    /api/bots                    多机器人列表
POST   /api/bots                    添加机器人
DELETE /api/bots/{id}               删除机器人及绑定群组
POST   /api/bots/{id}/reconnect     重连机器人
GET    /api/backup/download         下载数据库快照
POST   /api/backup/restore          上传恢复文件

GET    /api/bot                     主机器人状态
POST   /api/bot/connect             保存 Token、getMe 并连接
POST   /api/bot/disconnect          断开连接并删除 Token
POST   /api/bot/refresh             刷新机器人信息

GET/PUT /api/settings               系统设置
POST   /api/settings/password       修改密码
POST   /api/upload                  上传图片
```

## 数据库表

| 表 | 用途 |
| --- | --- |
| `admins` / `sessions` | 管理员与登录会话 |
| `groups` / `group_settings` | 群组与每群独立配置 |
| `templates` / `template_versions` | 模板与最多 30 个历史版本 |
| `audit_logs` | 管理员操作审计 |
| `blacklist` / `group_security` / `join_events` | 全局黑名单、防炸群配置、入群速率 |
| `shop_items` / `shop_orders` | 积分商城、库存与订单 |
| `tasks` / `task_progress` | 任务、进度与领取状态 |
| `bots` | 多机器人账号与加密 Token |
| `star_products` / `star_codes` / `star_orders` | Stars 商品、卡密池与订单 |
| `tickets` | 工单与申诉 |
| `api_keys` / `webhook_endpoints` / `webhook_deliveries` | 开放 API 与 Webhook |
| `message_archive` | 可选的 AI 群聊归档（每群近期 1,200 条） |
| `automations` / `automation_runs` | 自动化规则与运行记录 |
| `invites` / `invite_joins` | 邀请链接、归因与入群记录 |
| `reports` / `alerts` | 周报与告警 |
| `membership_plans` / `memberships` / `membership_orders` | 会员计划、会员时长与订单 |
| `ai_knowledge` | AI 知识库条目 |
| `schedules` / `deliveries` | 定时任务与送达记录 |
| `verifications` | 入群验证会话 |
| `checkins` / `point_accounts` / `point_logs` | 签到、积分账户、流水 |
| `red_packets` / `red_packet_claims` | 红包与领取记录 |
| `campaigns` / `campaign_entries` / `campaign_winners` | 营销活动 |
| `campaign_messages` / `redeem_codes` | 活动消息与兑换码 |
| `ads` | 广告位与轮播排期 |
| `antispam_logs` / `activities` | 违规日志与仪表盘动态 |
| `settings` | 品牌、货币、时区等全局设置 |

SQLite 使用 WAL、外键与单写连接，适合中小型社群；如需多实例部署，请改用 PostgreSQL 并抽出仓储层。

## 测试

```bash
go test ./...
```

当前测试覆盖：

- PBKDF2 密码哈希、CSRF 派生、Bot Token 加密往返
- 模板变量转义、按钮过滤、逐行键盘布局
- 每日 / 每周 / Cron 的下一次触发时间
- 红包并发领取不超发、重复领取拒绝
- 签到连续天数、重复签到、负余额拒绝
- 商城库存/限购/扣积分、任务进度与重复领取
- 黑名单生效/过期、防炸群配置与入群事件、审计与模板版本
- Stars 商品/订单、卡密一次性领取、工单回复、API Key 哈希与 Webhook 配置
- 多机器人 ID 隔离与群组绑定、AI OpenAI 兼容请求
- 自动化规则/运行记录、邀请归因、会员时长、AI 知识检索、周报/告警

## 生产部署

### 反向代理（推荐）

控制台只需要暴露 HTTP；用 Caddy / Nginx 终止 HTTPS：

```caddyfile
starkeeper.example.com {
    reverse_proxy 127.0.0.1:8787
}
```

并在 `.env` 中设置：

```env
APP_ADDR=127.0.0.1:8787
PUBLIC_URL=https://starkeeper.example.com
SESSION_SECRET=<随机 64 位字符串>
ADMIN_PASSWORD=<强密码>
SEED_DEMO=false
```

`PUBLIC_URL` 必须是 Telegram 能访问的公网 HTTPS 地址，否则上传图片无法作为 `sendPhoto` 的图片地址。

### systemd

```ini
[Unit]
Description=StarKeeper Telegram group manager
After=network.target

[Service]
WorkingDirectory=/opt/starkeeper
EnvironmentFile=/opt/starkeeper/.env
ExecStart=/opt/starkeeper/starkeeper
Restart=always
User=starkeeper

[Install]
WantedBy=multi-user.target
```

### Docker

```bash
docker build -t starkeeper .
docker run -d --name starkeeper \
  --env-file .env \
  -p 8787:8787 \
  -v starkeeper-data:/data \
  starkeeper
```

## 安全建议

- 首次登录后立刻修改 `admin123`。
- `SESSION_SECRET` 使用随机长字符串；修改后所有会话失效。
- 生产环境通过 HTTPS 访问；Session Cookie 在 HTTPS 下自动加 `Secure`。
- 控制台默认只监听 `127.0.0.1`，不要直接裸奔在公网。
- 不要把 `.env`、`data/`、SQLite 文件提交到 Git。
- 机器人 Token 在后台用 AES-GCM 加密后保存，但仍建议限制 `data/` 目录权限；泄露后立即在 BotFather `/revoke`。
- 更换 `SESSION_SECRET` 会使已保存的 Token 失效，需要在「机器人」页面重新保存。
- 给机器人最小必要权限；不需要广告拦截时可开启 Privacy Mode。
- 定期备份 `data/starkeeper.db`（WAL 模式下建议先停服务或使用 SQLite 在线备份）。

## 常见问题

**Q：机器人收不到普通群消息，广告拦截无效？**  
关闭 BotFather 的 Privacy Mode，并把机器人移出群后重新加入；「机器人」页面的「可读取全部群消息」应显示「是」。

**Q：Token 填错了怎么办？**  
「机器人」页面重新粘贴正确 Token 即可；校验失败不会覆盖当前可用连接。也可以点击「断开连接」彻底清除。

**Q：验证按钮点击没反应？**  
确认机器人是管理员且有「限制成员」权限；查看服务端日志中的 `restrict new member` 报错。

**Q：欢迎卡片发送失败？**  
检查机器人是否被禁言、群是否开启了慢速模式、模板 HTML 是否闭合；Telegram 会返回具体错误。

**Q：定时任务没有发送？**  
确认任务状态为「进行中」、`NextRunAt` 在未来；「机器人」页显示已连接；目标群处于启用状态。

**Q：上传图片后 Telegram 不显示？**  
`PUBLIC_URL` 必须是公网可访问的 HTTPS 地址；`/uploads/...` 需要能被 Telegram 服务器访问。

**Q：红包里的钱可以提现吗？**  
不能。这里的红包是群内积分红包，不接入任何支付通道。

**Q：可以一个机器人管理多少个群？**  
代码没有硬限制；受 Telegram 机器人速率与服务器资源限制。SQLite 适合单实例中小规模部署。

**Q：演示数据怎么清空？**  
停止服务，删除 `data/starkeeper.db`、`data/starkeeper.db-shm`、`data/starkeeper.db-wal`，再以 `SEED_DEMO=false` 启动。

---

## GitHub 仓库信息

<p align="center">
  <img src="docs/brand/logo-horizontal-dark.png" alt="StarKeeper" width="760">
</p>

建议仓库名：

```text
starkeeper
```

如果 `starkeeper` 已被占用，使用：

```text
starkeeper-telegram
```

**Description（GitHub 仓库简介，直接复制）：**

```text
Open-source, self-hosted Telegram group management bot & admin panel: welcome, verification, anti-spam, check-in points, shop, Stars payments, AI, automation, tickets, multi-bot. Go + SQLite.
```

**Website：**

```text
https://t.me/StarKeepera
```

**Topics：**

```text
telegram  telegram-bot  telegram-groups  group-management  golang  sqlite
telegram-stars  ai  automation  community  self-hosted  mit-license
```

**仓库简介（中文）：**

> 星群管家 StarKeeper：免费开源的 Telegram 群运营系统。欢迎验证、广告拦截、签到积分、积分商城、Stars 数字商品、AI 群聊、自动化、工单、开放 API 与多机器人管理。

## 开源与商业合作

### 这个项目

- 开源版本：**MIT License，免费使用、修改、商用**
- 功能：上面截图里的能力全部包含，没有“付费解锁”的功能阉割
- 适合：社群主、代运营团队、课程/会员群、需要私有化部署的团队
- 技术栈：Go + SQLite + 原生 html/template + 原生 JS，无重型前端依赖

如果你用它跑起了自己的群，欢迎回来说一声，也欢迎 Star / Fork / 提 Issue。

品牌与群资料：[docs/brand/README.md](docs/brand/README.md)  
群名建议：**星群管家 · TG 运营交流群** · 交流群：**https://t.me/StarKeepera**

### 开源发布前检查

- 不要提交 `.env`、`data/`、`uploads/`、`*.db`、日志与本地截图临时文件
- 不要在 README / 截图里暴露真实 Bot Token、管理员密码、客户群 ID
- 截图建议使用演示数据；真实群截图请打码成员昵称与头像
- 首次部署后立刻修改默认密码与 `SESSION_SECRET`
- 如果要发布 Docker 镜像，确认 `SEED_DEMO=false`

### 定制开发 / 部署支持

需要以下服务可以联系 Telegram 客服：

- 机器人定制开发：欢迎语、验证、签到、积分、商城、自动化、AI、支付
- 私有化部署：Linux / Docker / 反向代理 / HTTPS / 数据迁移
- 二次开发：接入你的 CRM、客服系统、数据仓库、现有业务
- 白标交付：品牌、Logo、域名、独立版本
- 代运营团队工作区方案

**Telegram 客服 / 定制开发：[@easSearchs](https://t.me/easSearchs)**

### 现成售卖系统

我们还有几套已经打磨好的 Telegram 系统，均支持独立部署、贴牌与二次开发：

| 系统 | 说明 | 演示 / 咨询 |
| --- | --- | --- |
| **TG 搜索引擎系统** | Telegram 群组 / 频道 / 资源搜索，支持入库、分类、关键词与结果页 | [https://www.68i.net](https://www.68i.net)（介绍页里有演示） |
| **TG 担保交易系统** | 面向 Telegram 场景的担保交易、订单、放款与纠纷处理 | 联系 [@easSearchs](https://t.me/easSearchs) |
| **TG 发卡系统** | 自动发卡、卡密库存、订单查询、支付回调 | 联系 [@easSearchs](https://t.me/easSearchs) |

> 以上系统与 StarKeeper 是独立产品，按需咨询；开源版 StarKeeper 仍然完整免费。

## 赞助我们

如果这个项目帮你省下了时间，欢迎请我们喝杯咖啡。赞助完全自愿，不影响开源版功能。

**USDT · TRC20：**

```text
THzYfLHVbEaZ4UXwq5AxuZ9aunxq4m4pQg
```

> 请务必确认网络为 **TRC20**，转错网络无法找回。赞助后可以联系 [@easSearchs](https://t.me/easSearchs) 备注，我们会记下你的支持。

## 贡献

- 提交 Issue：说明版本、复现步骤、日志与截图
- 提交 PR：保持 MVC 分层，补测试，避免引入重型依赖
- 安全漏洞：不要公开贴 Token / 数据库；先私下联系客服
- 文档与截图：欢迎补充部署案例、群运营模板与翻译

## 免责声明

本项目是群组管理工具，不提供 Telegram 账号、不绕过 Telegram 限制、不承诺任何收益。请遵守 Telegram Terms of Service、当地法律法规与群成员隐私约定；因使用方式产生的责任由使用者自行承担。

---

## License

MIT License · 可免费使用、修改、分发与商用，保留版权声明即可。

如果这个项目对你有帮助，欢迎在 GitHub 点一个 **Star**，这是我们继续维护最大的动力。
