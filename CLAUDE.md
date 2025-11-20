# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **ccs** (Claude配置切换工具) - a CLI tool for switching between different Claude API configurations. It's a Node.js command-line utility that helps users manage and switch between multiple Claude API endpoint configurations.

## Architecture

### Core Components

- **Main executable**: `index.js` - Single-file Node.js CLI application using Commander.js for command parsing
- **Configuration management**: Reads from `~/.claude/apiConfigs.json` and `~/.claude/settings.json`
- **Interactive UI**: Uses inquirer.js for interactive menus and chalk for colored terminal output

### Key Functionality

1. **Configuration switching**: Reads API configs from `~/.claude/apiConfigs.json` and updates `~/.claude/settings.json`
2. **Interactive selection**: Provides both arrow-key navigation and manual index input
3. **Current config detection**: Shows which configuration is currently active
4. **Confirmation prompts**: Uses inquirer.js for user confirmation before switching

### File Structure

- `index.js`: Main application logic with all CLI commands and configuration management
- `notify.js`: WeChat Work notification module with hook script generation
- `health.js`: Health check module for API endpoint availability testing
- `package.json`: Dependencies (commander, chalk, inquirer)
- `example/`: Contains sample configuration files
- `README.md`: Comprehensive Chinese documentation

## Development Commands

```bash
# Install dependencies
npm install

# Install globally for testing
npm install -g .

# No specific test/lint/build commands defined - this is a simple CLI tool
```

## Configuration Format

The tool expects configuration files in `~/.claude/`:

1. **apiConfigs.json**: Array of complete configuration objects
   ```json
   [
     {
       "name": "config-name",
       "config": {
         "env": {
           "ANTHROPIC_BASE_URL": "https://example.com/api",
           "ANTHROPIC_AUTH_TOKEN": "sk-...",
           "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
         },
         "permissions": {
           "allow": [],
           "deny": []
         },
         "model": "opus"
       }
     }
   ]
   ```

2. **settings.json**: Current active configuration with user customizations
   ```json
   {
     "_configName": "config-name",
     "env": {
       "ANTHROPIC_BASE_URL": "https://...",
       "ANTHROPIC_AUTH_TOKEN": "sk-...",
       "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
     },
     "permissions": {
       "allow": [],
       "deny": []
     },
     "model": "opus",
     "alwaysThinkingEnabled": true
   }
   ```

3. **notify.json**: WeChat Work notification configuration (optional)
   ```json
   {
     "wechatWork": {
       "webhookUrl": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...",
       "enabled": true
     },
     "hooks": {
       "enabled": true,
       "events": {
         "Notification": { "enabled": true, "message": "..." },
         "Stop": { "enabled": true, "message": "..." }
       }
     }
   }
   ```

**Important** (v1.8.0+ behavior):
- When switching configurations, **only 3 fields are updated**:
  - `_configName` (new in v1.8.0)
  - `env.ANTHROPIC_AUTH_TOKEN`
  - `env.ANTHROPIC_BASE_URL`
- **All other fields are preserved**: permissions, model, alwaysThinkingEnabled, hooks, statusLine, mcpServers, etc.
- This allows users to maintain custom settings while quickly switching between API providers

## Key Functions

### index.js
- `saveSettingsPreservingHooks()`: Merges new config while preserving hooks and statusLine (index.js:115)
- `deepEqual()`: Deep comparison utility for configuration objects (index.js:148)
- `getCurrentConfig()`: Identifies currently active configuration using deep comparison (index.js:171)
- `listAndSelectConfig()`: Main interactive configuration selection (index.js:196)
- `processSelectedConfig()`: Handles configuration switching with confirmation (index.js:314)
- `addConfig()`: Interactive wizard for adding new API configurations (index.js:535)
- `removeConfig()`: Interactive configuration removal with safety checks (index.js:643)
- `readApiConfigs()` / `saveSettings()`: Configuration file I/O (index.js:52, 89)

### notify.js
- `setupNotifyConfig()`: Interactive WeChat Work webhook configuration (notify.js:343)
- `setupClaudeCodeHooks()`: Automatically configures Claude Code hooks for notifications (notify.js:269)
- `createWeChatNotifyScript()`: Generates hook script at ~/.claude/scripts/wechat-notify.js (notify.js:127)
- `sendWeChatWorkNotification()`: Sends messages via WeChat Work webhook (notify.js:76)

### health.js
- `checkConfigHealth()`: Intelligent endpoint probing with fallback strategies (health.js:106)
- `probeEndpoint()`: Tests individual endpoint with timeout and latency measurement (health.js:45)
- Supports multiple endpoint formats: /v1/models, /v1/chat/completions, /health, etc.

## CLI Commands

### Configuration Management
- `ccs list` / `ccs ls`: Interactive configuration selection with both arrow-key and manual input
- `ccs add`: Add new API configuration interactively
- `ccs remove` / `ccs rm`: Remove API configuration with safety warnings
- `ccs o api`: Open apiConfigs.json in default editor
- `ccs o setting`: Open settings.json in default editor

### Health Monitoring
- `ccs health`: Check all API endpoints for availability and latency
  - Automatically deduplicates URLs
  - Tests multiple endpoint formats with intelligent fallback
  - Displays real-time status with color-coded results

### Notification Setup
- `ccs notify setup` / `ccs ntf setup`: Configure WeChat Work webhook
- `ccs notify status`: View current notification configuration
- `ccs notify test`: Send test notification

### General
- `ccs --version` / `ccs -v`: Show version info

## Important Notes

### User Experience
- All user interactions are in Chinese
- Configuration files are automatically created in `~/.claude/` directory
- Uses inquirer.js with default confirmation (Enter = Yes)
- Supports both interactive menu navigation and manual index input
- After switching config, optionally launches `claude` CLI in current directory (index.js:343-372)

### Configuration Behavior (v1.8.0+)
- **Selective update strategy**: Only updates API credentials when switching configurations
  - Updates: `_configName`, `env.ANTHROPIC_AUTH_TOKEN`, `env.ANTHROPIC_BASE_URL`
  - Preserves: All other fields (permissions, model, alwaysThinkingEnabled, hooks, statusLine, mcpServers, etc.)
- **Config name tracking**: `_configName` field automatically added to settings.json (index.js:140)
- **Smart matching**: Priority matching by `_configName`, fallback to URL/Token comparison (index.js:193-209)
- **Backward compatible**: Works with settings.json files from older versions
- Configuration names must be unique when adding new configs (index.js:547)

### Notification System
- Notification setup automatically generates hook script at `~/.claude/scripts/wechat-notify.js`
- Hook script listens for `Notification` and `Stop` events from Claude Code
- Notification hooks are preserved during config switches
- Token display is masked (first 7 chars + ****) for security (health.js:181)

### Health Check
- Deduplicates URLs to avoid redundant checks (health.js:214)
- Tests multiple endpoints in sequence until 2xx response found
- Treats 2xx and 4xx as "reachable", 5xx and network errors as "unhealthy"
- 30-second timeout per endpoint probe (health.js:66)