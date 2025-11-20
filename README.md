# Claude配置切换工具 (CCS)

一个用于在不同的Claude API配置之间进行切换的命令行工具。

[ClaudeCode API 站点推荐](https://github.com/AlvinScrp/claude-code-switch/blob/main/ClaudeCode%20API%E7%AB%99.md)

**强烈推荐这个**倍率高5块钱相当于10美金 ：[https://instcopilot-api.com/register?aff=J2wX](https://instcopilot-api.com/register?aff=J2wX)

## 安装

### npm包安装

已发布到https://www.npmjs.com/package/claude-config-switch

```
npm i claude-config-switch
```

### 本地安装

```bash
# 克隆仓库
git clone <仓库地址>
cd claude-code-switch

# 安装依赖
npm install

# 全局安装
npm install -g .
```

### 依赖项

- Node.js (>= 12.0.0)
- npm (>= 6.0.0)
- 依赖库:
  - commander: 命令行界面解析
  - chalk: 终端彩色输出
  - inquirer: 交互式命令行用户界面

## 使用方法

### 配置文件

工具需要三个配置文件，都位于 `~/.claude/` 目录下：

#### 1. apiConfigs.json - API配置列表

存储所有可用的Claude API配置，格式如下：

```json
[
  {
    "name": "wenwen-ai",
    "config": {
      "env": {
        "ANTHROPIC_AUTH_TOKEN": "sk-XXXXXXX",
        "ANTHROPIC_BASE_URL": "https://code.wenwen-ai.com",
        "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
      },
      "permissions": {
        "allow": [],
        "deny": []
      },
      "model": "claude-sonnet-4-20250514"
    }
  },
  {
    "name": "zone",
    "config": {
      "env": {
        "ANTHROPIC_AUTH_TOKEN": "sk-XXXXXXX",
        "ANTHROPIC_BASE_URL": "https://zone.veloera.org/pg",
        "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
      },
      "permissions": {
        "allow": [],
        "deny": []
      },
      "model": "claude-sonnet-4-20250514"
    }
  }
]
```

#### 2. settings.json - 当前激活配置

存储当前使用的配置，格式如下：

```json
{
  "_configName": "zone",
  "env": {
    "ANTHROPIC_BASE_URL": "https://zone.veloera.org/pg",
    "ANTHROPIC_AUTH_TOKEN": "sk-XXXXXXX",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "permissions": {
    "allow": [],
    "deny": []
  },
  "model": "claude-sonnet-4-20250514",
  "alwaysThinkingEnabled": true
}
```

**重要说明**：

⚡ **配置切换行为（v1.8.0+ 重要更新）**

从 v1.8.0 开始，切换配置时的行为已优化：

- ✅ **只更新 API 凭证**：切换时仅更新以下 3 个字段
  - `_configName` - 当前配置名称（新增）
  - `env.ANTHROPIC_AUTH_TOKEN` - API 密钥
  - `env.ANTHROPIC_BASE_URL` - API 端点

- ✅ **保留所有其他设置**：以下配置完全保留
  - `permissions` - 权限设置
  - `model` - 模型配置
  - `alwaysThinkingEnabled` - 思考模式
  - `hooks` - 钩子配置
  - `statusLine` - 状态栏配置
  - `mcpServers` - MCP 服务器配置
  - 任何其他自定义字段

**使用场景**：
```bash
# 场景：你的 settings.json 中有很多自定义配置
{
  "env": { "ANTHROPIC_AUTH_TOKEN": "sk-old...", "ANTHROPIC_BASE_URL": "..." },
  "alwaysThinkingEnabled": true,
  "mcpServers": { "custom-server": {...} },
  "permissions": { "allow": ["somePermission"] },
  "customFeature": true
}

# 执行 ccs list 切换到新配置后
{
  "_configName": "new-config",  // ⚡ 已更新
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-new...",  // ⚡ 已更新
    "ANTHROPIC_BASE_URL": "https://new-url.com"  // ⚡ 已更新
  },
  "alwaysThinkingEnabled": true,  // ✅ 保留
  "mcpServers": { "custom-server": {...} },  // ✅ 保留
  "permissions": { "allow": ["somePermission"] },  // ✅ 保留
  "customFeature": true  // ✅ 保留
}
```

💡 **建议**：
- `apiConfigs.json` 只需存储不同的 API 凭证信息
- 在 `settings.json` 中配置你的个性化设置（permissions、model、MCP 等）
- 切换 API 时无需担心丢失自定义配置

### 命令

#### 列出所有可用的API配置并提示选择

```bash
ccs list
# 或使用简写
ccs ls
```

输出示例：

```
? 请选择要切换的配置: (Use arrow keys)
> 1. [wenwen-ai   ]  sk-XXXXXXX  https://code.wenwen-ai.com (当前)
  2. [zone        ]  sk-XXXXXXX  https://zone.veloera.org/pg
  3. [co.yes.vg   ]  sk-XXXXXXX  https://co.yes.vg/api
  4. [a-generic   ]  sk-XXXXXXX  https://a-generic.be-a.dev/api
  ──────────────
  输入序号...

? 请选择要切换的配置: 2. [zone        ]  sk-XXXXXXX  https://zone.veloera.org/pg

当前选择的配置:
{
  "name": "zone",
  "config": {
    "env": {
      "ANTHROPIC_AUTH_TOKEN": "sk-xxxx",
      "ANTHROPIC_BASE_URL": "https://zone.veloera.org/pg",
      "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
    },
    "permissions": {
      "allow": [],
      "deny": []
    },
    "model": "claude-sonnet-4-20250514"
  }
}

? 确认切换到此配置? Yes

成功切换到配置: zone
```

**交互方式**:

1. **光标选择**: 使用键盘上下箭头选择配置，按Enter确认
2. **手动输入**: 选择"输入序号..."选项，然后输入配置的序号

#### 直接设置当前使用的API配置

```bash
ccs use <序号>
```

例如：

```bash
ccs use 2
```

输出示例：

```
当前选择的配置:
{
  "name": "zone",
  "config": {
    "env": {
      "ANTHROPIC_AUTH_TOKEN": "sk-xxxxxx",
      "ANTHROPIC_BASE_URL": "https://zone.veloera.org/pg",
      "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
    },
    "permissions": {
      "allow": [],
      "deny": []
    },
    "model": "claude-sonnet-4-20250514"
  }
}

? 确认切换到此配置? Yes

成功切换到配置: zone
```

#### 打开配置文件

```bash
# 打开API配置文件 (apiConfigs.json)
ccs o api

# 打开设置配置文件 (settings.json)
ccs o setting
```

这些命令会在默认编辑器中打开相应的配置文件，方便直接编辑配置。如果文件不存在，会自动创建包含示例内容的配置文件。

**自动创建的示例内容**：

- **API配置文件** (`apiConfigs.json`)：包含一个示例配置，使用最新的Claude Sonnet 4模型
- **设置配置文件** (`settings.json`)：包含基本的环境变量和权限设置

只需将示例中的 `sk-YOUR_API_KEY_HERE` 替换为实际的API密钥即可使用。

#### 健康检查功能

使用 `health` 命令可以检查所有配置的API端点的可用性和网络延迟：

```bash
ccs health
```

**功能特性**：

- **智能端点检测**：自动尝试多种常见的API端点格式
- **去重优化**：相同的 `ANTHROPIC_BASE_URL` 只检测一次
- **实时反馈**：逐行显示检测进度和结果
- **多端点支持**：支持以下端点格式：
  - `/v1/models` - Claude Models API (默认)
  - `/v1/chat/completions` - OpenAI 兼容 API
  - `/v1/models` (无 anthropic-version 头)
  - `/` - 根路径
  - `/health` - 健康检查端点
  - `/api/v1/models` - 备用API路径

**输出示例**：

```
开始健康检查 (/v1/models)...

| Name                 | Base URL                           | Token        | Status                   | Latency |
|----------------------|------------------------------------|--------------|--------------------------|---------|
| instcopilot-config   | https://sg.instcopilot-api.com    | sk-JCzb7**** | Healthy (status: 200)    | 414ms   |
| co.yes.vg-config     | https://co.yes.vg                  | cr_2dc6**** | Healthy (status: 200)    | 892ms   |
  → Found working endpoint: /v1/chat/completions (OpenAI Compatible API)
| anthropic-official   | https://api.anthropic.com         | sk-ant-**** | Unhealthy (status: 401)  | 1205ms  |
  Error: Unauthorized
```

**状态说明**：

- **绿色 Healthy (2xx)**：端点正常工作
- **红色 Unhealthy (4xx/5xx)**：端点有问题或鉴权失败
- **黄色 Unhealthy**：网络错误或超时

**Token 显示格式**：前7位 + **** (如：`sk-JCzb7****`)

当检测到非默认端点可用时，会显示实际工作的端点信息，帮助用户了解服务的实际API格式。

#### 企微通知配置

##### 设置企微通知

```bash
ccs notify setup
# 或使用简写
ccs ntf setup
```

配置企微机器人通知功能：

1. 在企微群聊中添加机器人
2. 获取机器人的Webhook地址
3. 输入Webhook地址完成配置
4. 自动配置ClaudeCode Hooks

 notify.json - 通知配置

存储企微机器人等通知渠道的配置，格式如下：

```json
{
  "wechatWork": {
    "webhookUrl": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY",
    "enabled": true
  },
  "telegram": {
    "enabled": false
  },
  "slack": {
    "enabled": false
  }
}
```

**说明**：

- `wechatWork.webhookUrl`: 企微群机器人的Webhook地址
- `wechatWork.enabled`: 是否启用企微通知
- 其他通知渠道为预留配置，暂未实现

输出示例：

```
设置企微机器人通知配置:
请在企微群聊中添加机器人，获取Webhook地址
格式: https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY
配置完成后，将自动通过ClaudeCode Hooks监听Notification和Stop事件

请输入企微机器人Webhook地址: https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx

通知配置已保存到: /Users/username/.claude/notify.json
✓ Hook脚本已创建: /Users/username/.claude/scripts/wechat-notify.js
✓ ClaudeCode Hooks配置已更新

配置完成！现在ClaudeCode将在以下事件时发送企微通知:
  - Notification事件: 当Claude需要用户关注时
  - Stop事件: 当Claude任务完成时
```

##### 查看通知状态

```bash
ccs notify status
```

显示当前通知配置状态，包括：

- 企微机器人启用状态
- Hook事件配置状态
- ClaudeCode hooks配置状态

输出示例：

```
当前通知配置状态:
企微机器人: 已启用
Webhook地址: https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=***
Hook事件: 已启用
  Notification事件: 启用
  Stop事件: 启用
ClaudeCode hooks配置: 已配置
```

##### 测试通知功能

```bash
ccs notify test
```

发送测试通知到配置的企微群：

输出示例：

```
正在发送测试通知...
✓ 企微通知发送成功
```

#### 显示版本信息

```bash
ccs --version
# 或
ccs -v
```

输出示例：

```
ccs 版本: 1.6.0
```

#### 显示帮助信息

```bash
ccs --help
```

输出示例：

```
Usage: ccs [options] [command]

Claude配置切换工具

Options:
  -v, --version      显示版本信息
  -h, --help         display help for command

Commands:
  list, ls           列出所有可用的API配置并提示选择
  use <index>        设置当前使用的API配置
  health             检查各API端点的可用性与网络延迟
  notify, ntf        配置企微通知设置
    setup            设置企微机器人webhook地址
    status           查看当前通知配置状态
    test             测试企微通知功能
  o                  打开Claude配置文件
    api              打开API配置文件 (apiConfigs.json)
    setting          打开设置配置文件 (settings.json)
  help [command]     display help for command
```

#### 错误处理

当输入不存在的命令时，会显示错误信息和可用命令列表：

```bash
ccs unknown
```

输出示例：

```
错误: 未知命令 'unknown'

可用命令:
  list
  ls  
  use
  health
  notify
  ntf
  o

使用 --help 查看更多信息
```

## 注意事项

- 确保 `~/.claude/apiConfigs.json` 和 `~/.claude/settings.json` 文件存在并包含有效的配置信息
- 工具会自动创建 `~/.claude` 目录（如果不存在）
- 确认操作时默认为"是"，直接按Enter键即可确认
- **v1.8.0+**: 切换配置时只更新 API 凭证，保留所有其他自定义设置（详见上方"配置切换行为"说明）
- 使用 `ntf` 命令需要先在企微群中添加机器人并获取Webhook地址
- `notify.json` 文件首次使用时会自动创建

## 更新日志

### 1.8.0 配置切换优化（重要更新）⚡

**重大改进：智能配置保留机制**

+ **配置切换优化**: 切换配置时只更新 API 凭证，保留所有其他设置
  - 只更新：`_configName`、`ANTHROPIC_AUTH_TOKEN`、`ANTHROPIC_BASE_URL`
  - 保留：`permissions`、`model`、`alwaysThinkingEnabled`、`hooks`、`statusLine`、`mcpServers` 等所有自定义字段
+ **新增配置名称标记**: settings.json 中新增 `_configName` 字段，记录当前使用的配置
+ **改进配置匹配**: 优先使用配置名称匹配，提升匹配速度和准确性
+ **向后兼容**: 完全兼容旧版本的配置文件格式

**升级说明**：
- 从旧版本升级后，首次切换配置会自动添加 `_configName` 字段
- 现有的自定义配置（如 `alwaysThinkingEnabled`）不会丢失
- 无需手动迁移配置文件

**典型使用场景**：
```bash
# 你可以在 settings.json 中配置 MCP、自定义权限等
# 然后通过 ccs list 快速切换不同的 API 提供商
# 无需担心自定义配置被覆盖
```

### 1.7.0 健康检查

  ccs health

### **1.6.0 通知功能**

+ **新增企微通知功能**: 支持通过企微机器人接收Claude Code通知
+ **智能Hook集成**: 自动配置ClaudeCode Hooks，无需手动监听
+ **事件通知支持**:
  - `Notification`事件: 当Claude需要用户关注时自动通知
  - `Stop`事件: 当Claude任务完成时自动通知
+ **完整通知管理**:
  - `ccs notify setup` - 配置企微机器人
  - `ccs notify status` - 查看通知配置状态
  - `ccs notify test` - 测试通知功能
+ **自动化配置**: 自动创建Hook脚本和更新Claude设置文件
+ **配置文件支持**: 新增 `notify.json`配置文件管理通知设置

### **1.5.0**

+ 新增配置切换成功后的详细信息显示（名称、API Key、Base URL、Model）
+ 新增自动询问是否启动 Claude CLI 功能：切换配置成功后会询问是否在当前目录运行 `claude` 命令
+ 改进用户体验：一站式完成配置切换和 Claude 启动流程

### 1.4.0

- 优化配置文件打开功能：文件不存在时自动创建包含示例内容的配置文件
- 更新默认模型为 `claude-sonnet-4-20250514`（Claude Sonnet 4）
- 改进用户体验：新用户可以立即开始使用工具，无需手动创建配置文件

### 1.3.0

- 新增 `ccs ls` 命令作为 `ccs list` 的简写
- 新增 `ccs o api` 命令用于打开API配置文件 (apiConfigs.json)
- 新增 `ccs o setting` 命令用于打开设置配置文件 (settings.json)
- 改进配置文件编辑体验，可以直接在默认编辑器中修改配置

### 1.2.0

- 支持完整的Claude配置对象格式
- 新增配置深度比较功能，准确识别当前激活配置
- 优化配置显示格式，对齐显示配置名称
- 更新配置文件结构，支持env、permissions、model等完整配置项

### 1.1.0

- 添加交互式菜单，支持光标上下移动选择
- 保留原有的序号输入功能
- 优化用户体验，确认操作时默认为"是"

### 1.0.0

- 初始版本发布
- 基本的API配置切换功能
