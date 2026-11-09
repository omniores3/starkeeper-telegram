# 星群管家 · 品牌与群资料

这套资料用于创建 StarKeeper 的 Telegram 交流群、频道、GitHub 社交预览与宣传图。

## 1. 推荐群名

**星群管家 · TG 运营交流群**

理由：

- `星群管家` 是品牌名，放在最前面，方便老用户搜索。
- `TG 运营` 是群的核心关键词，比单纯的“交流群”更容易被搜到。
- `交流群` 明确群定位：不是客服群，也不是公告频道。

### 备选群名

| 群名 | 适合场景 |
| --- | --- |
| 星群管家用户社区 | 偏产品支持、用户互助 |
| 星群运营者俱乐部 | 偏高质量运营者、会员感 |
| StarKeeper 中文社区 | 偏开源、开发者、国际化 |
| 星群管家 · 开源交流群 | 偏 GitHub 开发者与二开 |
| 星群管家 · TG 群主交流群 | 偏群主、代运营团队 |

> 建议只注册一个主群，其他名字做成群内的“话题”或子频道，避免用户分散。

## 2. 用户名与群链接

**交流群：** [https://t.me/StarKeepera](https://t.me/StarKeepera)  
**用户名：`@StarKeepera`**

备选（如需备用群或频道）：

- `@StarKeeperChat`
- `@StarKeeperCN`
- `@StarKeeperGroup`
- `@StarKeeperClub`
- `@StarKeeperCommunity`

建议同时注册一个公告频道：

- 频道名：`星群管家 · 更新日志`
- 频道用户名：`@StarKeeperNews`

> Telegram 用户名先到先得，最终以 Telegram 注册结果为准。主群已使用 `@StarKeepera`，不要再改成相近拼写，避免用户走错群。

## 3. 群简介

```text
StarKeeper 星群管家 · 开源 Telegram 群运营系统交流群。
聊群运营、机器人、自动化、签到积分、Stars 数字商品、AI 群聊与增长。
开源免费 · 可私有化部署 · 定制开发联系 @easSearchs
```

短版（适合群资料）：

```text
开源 Telegram 群运营系统 StarKeeper 交流群｜自动化 · 签到积分 · 商城 · Stars · AI
```

## 4. 群规

```text
1. 友善交流，不攻击、不引战、不人身攻击。
2. 禁止任何形式的广告、拉人、灰产、诈骗与违规交易。
3. 技术问题请带上：版本、截图、复现步骤、报错日志。
4. 提问前先看置顶与文档，避免重复问同一个问题。
5. 不私聊骚扰群成员；商务合作请联系管理员。
6. 违规三次移出，情节严重的直接封禁。
7. 群内发言可能被用于产品改进；请勿发送密码、Token、身份证等敏感信息。
```

## 5. 置顶欢迎语

```text
🛰️ 欢迎来到 星群管家 · TG 运营交流群

这里是 StarKeeper 开源项目的用户与运营者社区。
你可以在这里：
· 反馈 Bug、提功能建议
· 交流群运营、自动化、签到积分、Stars 数字商品
· 获取模板、部署与二次开发经验

📌 先看群规：/rules
🔗 本群链接：https://t.me/StarKeepera
📖 开源文档：项目 README
🧩 模板与截图：见 GitHub docs/screenshots
💼 定制开发 / 部署：@easSearchs

提问请尽量带上截图、版本号与复现步骤，方便大家快速帮你。
```

## 6. Logo 文件

| 文件 | 用途 |
| --- | --- |
| `avatar-primary.png` | Telegram 群头像，512×512 |
| `avatar-primary@1024.png` | 高清头像 / 宣传图 |
| `avatar-light.png` | 浅色场景头像 |
| `avatar-constellation.png` | 备选方案：三星星群 |
| `logo-horizontal-dark.png` | GitHub 深色背景横幅、官网 |
| `logo-horizontal-light.png` | 浅色背景横幅、文档 |
| `*.svg` | 矢量源文件，可改色、改字号、改尺寸 |

### 设计说明

- 核心图形：一颗四角星 + 一条有缺口的轨道 + 两颗卫星。
- 含义：StarKeeper 是“星群的守门人”，轨道代表秩序，星星代表群成员，缺口代表给新成员留的入口。
- 颜色只有两种主色：近黑 `#0E1116` 与象牙白 `#F4EFE4`；没有紫蓝渐变，不依赖“AI 感”视觉。
- 小尺寸优先：在 40×40 的 Telegram 群列表里仍能看清星与轨道。

### 颜色

| 名称 | 色值 | 用途 |
| --- | --- | --- |
| Ink | `#0E1116` | 深色背景 / 主视觉 |
| Ivory | `#F4EFE4` | 星、轨道、主按钮 |
| Paper | `#F4EFE4` | 浅色背景 |
| Charcoal | `#12100C` | 浅色背景上的文字 |
| Slate | `#9AA6B5` | 辅助说明文字 |

### 使用规范

- Telegram 群头像直接使用 `avatar-primary.png`，512×512；不要自己加圆角，Telegram 会自动裁圆。
- 横向 Logo 保持至少 24px 的四周留白，不要把字压到边缘。
- 深色背景用 `logo-horizontal-dark`，浅色背景用 `logo-horizontal-light`。
- 不要给 Logo 加投影、描边、渐变、旋转或额外星星。
- 不要改变星与轨道的相对比例；需要单色版时直接使用 SVG 改 `fill`。

## 7. 群与频道结构建议

```text
交流群（主群）  @StarKeepera · https://t.me/StarKeepera
├── 置顶：欢迎语 + 群规 + 文档链接
├── 话题：答疑 / 模板 / 部署 / 需求
└── 关联频道

公告频道        @StarKeeperNews
├── 版本更新
├── 新功能截图
└── 模板与教程

客服 / 商务      @easSearchs
```

## 8. 一句话介绍

**星群管家 StarKeeper：把 Telegram 群运营，做成一套可以自己掌控的系统。**

英文版：

**StarKeeper — an open-source Telegram group operating system you can actually own.**
