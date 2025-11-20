#!/usr/bin/env node

/**
 * 验证配置切换前后的字段保留情况
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SETTINGS_FILE = path.join(os.homedir(), '.claude', 'settings.json');

console.log('📋 当前 settings.json 配置:\n');

const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));

console.log('🔑 API 配置:');
console.log(`  配置名称: ${settings._configName || '(未设置)'}`);
console.log(`  Base URL: ${settings.env?.ANTHROPIC_BASE_URL || '(未设置)'}`);
console.log(`  API Token: ${settings.env?.ANTHROPIC_AUTH_TOKEN?.substring(0, 15)}...` || '(未设置)');

console.log('\n🛠️  其他保留的配置:');
console.log(`  alwaysThinkingEnabled: ${settings.alwaysThinkingEnabled !== undefined ? settings.alwaysThinkingEnabled : '(未设置)'}`);
console.log(`  model: ${settings.model || '(未设置)'}`);
console.log(`  permissions: ${JSON.stringify(settings.permissions || {})}`);
console.log(`  hooks: ${settings.hooks ? '已配置' : '(未配置)'}`);
console.log(`  statusLine: ${settings.statusLine ? '已配置' : '(未配置)'}`);

console.log('\n💡 提示:');
console.log('  切换配置后，只有 _configName、ANTHROPIC_AUTH_TOKEN 和 ANTHROPIC_BASE_URL 会变化');
console.log('  其他所有字段（alwaysThinkingEnabled、permissions、hooks 等）都会保留');
