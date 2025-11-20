# Claude Config Switch (CCS) 快速使用指南

## 🚀 v1.8.0 重要更新

**现在切换配置时只会更新 API 凭证，保留所有其他自定义设置！**

## 📦 安装/更新

```bash
# 本地安装
cd claude-code-switch
npm install -g .

# 或从 npm 安装
npm i -g claude-config-switch
```

## 🎯 核心功能

### 1. 切换 API 配置（保留自定义设置）

```bash
# 交互式切换
ccs list
# 或
ccs ls

# 直接切换到第2个配置
ccs use 2
```

**新行为（v1.8.0+）**：
- ✅ 只更新：API Token、Base URL、配置名称
- ✅ 保留：permissions、model、alwaysThinkingEnabled、hooks、MCP 等所有自定义配置

### 2. 验证当前配置

```bash
# 查看当前配置状态
node verify-config.js
```

### 3. 添加/删除配置

```bash
# 添加新配置
ccs add

# 删除配置
ccs remove
# 或
ccs rm
```

### 4. 健康检查

```bash
# 检查所有 API 端点的可用性
ccs health
```

### 5. 企微通知

```bash
# 设置企微通知
ccs notify setup

# 查看通知状态
ccs notify status

# 测试通知
ccs notify test
```

## 📝 配置文件

### `~/.claude/apiConfigs.json`
存储所有可用的 API 配置：
```json
[
  {
    "name": "config-1",
    "config": {
      "env": {
        "ANTHROPIC_AUTH_TOKEN": "sk-...",
        "ANTHROPIC_BASE_URL": "https://..."
      }
    }
  }
]
```

### `~/.claude/settings.json`
当前激活的配置 + 你的自定义设置：
```json
{
  "_configName": "config-1",
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-...",
    "ANTHROPIC_BASE_URL": "https://..."
  },
  "alwaysThinkingEnabled": true,
  "mcpServers": { ... },
  // 你的其他自定义配置
}
```

## 💡 典型使用场景

### 场景 1：保留自定义配置，只换 API

```bash
# 你的 settings.json 中配置了很多东西
# - alwaysThinkingEnabled: true
# - 自定义 MCP 服务器
# - 自定义权限等

# 现在想换个 API 提供商
ccs list
# 选择新的配置

# ✅ 只有 API 变了，其他配置都保留！
```

### 场景 2：快速测试不同 API

```bash
# API 1 不行了，快速切换
ccs list  # 选择 API 2

# API 2 也不行，继续切换
ccs list  # 选择 API 3

# 无需担心配置丢失！
```

## ⚠️ 重要提示

1. **从旧版本升级**：首次切换配置会自动添加 `_configName` 字段，无需手动操作
2. **自定义配置**：所有在 settings.json 中的自定义字段都会被保留
3. **配置文件**：apiConfigs.json 只需存储不同的 API 凭证，其他配置在 settings.json 中维护

## 🔧 常用命令速查

```bash
ccs list          # 切换配置
ccs add           # 添加配置
ccs rm            # 删除配置
ccs health        # 健康检查
ccs --version     # 查看版本
ccs --help        # 查看帮助
```

## 📚 完整文档

详见 [README.md](README.md)
