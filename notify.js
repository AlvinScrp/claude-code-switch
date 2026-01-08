/**
 * 通知功能模块
 * 处理企微机器人通知相关的所有功能
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const readline = require('readline');
const https = require('https');
const inquirer = require('inquirer');

// 配置文件路径
const CONFIG_DIR = path.join(os.homedir(), '.claude');
const NOTIFY_CONFIG_FILE = path.join(CONFIG_DIR, 'notify.json');

/**
 * 创建readline接口
 * @returns {readline.Interface} readline接口
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * 确保配置目录存在
 */
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    console.log(chalk.green(`创建配置目录: ${CONFIG_DIR}`));
  }
}

/**
 * 读取通知配置文件
 * @returns {Object} 通知配置对象
 */
function readNotifyConfig() {
  try {
    if (!fs.existsSync(NOTIFY_CONFIG_FILE)) {
      return null;
    }
    
    const data = fs.readFileSync(NOTIFY_CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(chalk.red(`读取通知配置文件失败: ${error.message}`));
    return null;
  }
}

/**
 * 保存通知配置文件
 * @param {Object} config 通知配置对象
 */
function saveNotifyConfig(config) {
  try {
    ensureConfigDir();
    fs.writeFileSync(NOTIFY_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    console.log(chalk.green(`通知配置已保存到: ${NOTIFY_CONFIG_FILE}`));
  } catch (error) {
    console.error(chalk.red(`保存通知配置文件失败: ${error.message}`));
    process.exit(1);
  }
}

/**
 * 发送企微机器人通知
 * @param {string} webhookUrl 企微机器人webhook地址
 * @param {string} message 通知消息
 */
function sendWeChatWorkNotification(webhookUrl, message) {
  const postData = JSON.stringify({
    msgtype: 'text',
    text: {
      content: message
    }
  });

  const url = new URL(webhookUrl);
  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (response.errcode === 0) {
          console.log(chalk.green('✓ 企微通知发送成功'));
        } else {
          console.error(chalk.red(`企微通知发送失败: ${response.errmsg}`));
        }
      } catch (error) {
        console.error(chalk.red(`解析企微响应失败: ${error.message}`));
      }
    });
  });

  req.on('error', (error) => {
    console.error(chalk.red(`企微通知发送失败: ${error.message}`));
  });

  req.write(postData);
  req.end();
}

/**
 * 创建企微通知Hook脚本
 * @param {string} scriptPath Hook脚本的完整路径
 */
function createWeChatNotifyScript(scriptPath) {
  const scriptContent = `#!/usr/bin/env node
/**
 * ClaudeCode企微通知Hook脚本
 * 由claude-code-switch自动生成
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const NOTIFY_CONFIG_PATH = path.join(require('os').homedir(), '.claude', 'notify.json');

/**
 * 发送企微机器人通知
 * @param {string} webhookUrl 企微机器人webhook地址
 * @param {string} message 通知消息
 */
function sendWeChatWorkNotification(webhookUrl, message) {
  const postData = JSON.stringify({
    msgtype: 'text',
    text: {
      content: message
    }
  });

  const url = new URL(webhookUrl);
  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (response.errcode !== 0) {
          console.error('企微通知发送失败:', response.errmsg);
        }
      } catch (error) {
        console.error('解析企微响应失败:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('企微通知发送失败:', error.message);
  });

  req.write(postData);
  req.end();
}

/**
 * 读取通知配置
 */
function readNotifyConfig() {
  try {
    if (fs.existsSync(NOTIFY_CONFIG_PATH)) {
      const data = fs.readFileSync(NOTIFY_CONFIG_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('读取通知配置失败:', error.message);
  }
  return null;
}

// 处理命令行参数
const eventType = process.argv[2];
const config = readNotifyConfig();

// 检查是否启用通知
if (!config || !config.wechatWork?.enabled || !config.wechatWork?.webhookUrl) {
  process.exit(0);
}

// 检查特定事件是否启用
if (config.hooks?.events?.[eventType]?.enabled === false) {
  process.exit(0);
}

// 读取stdin获取事件数据
let inputData = '';
process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const eventData = JSON.parse(inputData);
    let message = '';
    
    if (eventType === 'notification') {
      message = \`[Claude Code通知]\\n时间: \${new Date().toLocaleString()}\\n\${config.hooks?.events?.Notification?.message || 'Claude Code需要您的关注'}\\n会话ID: \${eventData.session_id || 'unknown'}\`;
      
      // 如果有payload消息，添加到通知中
      if (eventData.payload?.message) {
        message += \`\\n消息: \${eventData.payload.message.substring(0, 100)}\${eventData.payload.message.length > 100 ? '...' : ''}\`;
      }
    } else if (eventType === 'stop') {
      message = \`[Claude Code完成]\\n时间: \${new Date().toLocaleString()}\\n\${config.hooks?.events?.Stop?.message || 'Claude Code任务已完成'}\\n会话ID: \${eventData.session_id || 'unknown'}\`;
      
      if (eventData.cwd) {
        message += \`\\n工作目录: \${eventData.cwd}\`;
      }
    }
    
    if (message && config.wechatWork?.webhookUrl) {
      sendWeChatWorkNotification(config.wechatWork.webhookUrl, message);
    }
  } catch (error) {
    console.error('处理事件数据失败:', error.message);
  }
});
`;

  try {
    fs.writeFileSync(scriptPath, scriptContent, 'utf8');
    // 设置可执行权限
    fs.chmodSync(scriptPath, 0o755);
    console.log(chalk.green(`✓ Hook脚本已创建: ${scriptPath}`));
  } catch (error) {
    console.error(chalk.red(`创建Hook脚本失败: ${error.message}`));
    throw error;
  }
}

/**
 * 设置ClaudeCode Hooks配置
 * @param {Object} config 通知配置对象
 */
function setupClaudeCodeHooks(config) {
  const claudeSettingsPath = path.join(os.homedir(), '.claude', 'settings.json');
  const scriptsDir = path.join(os.homedir(), '.claude', 'scripts');
  const hookScriptPath = path.join(scriptsDir, 'wechat-notify.js');
  
  console.log(chalk.cyan('\n正在配置ClaudeCode Hooks...'));
  
  // 确保scripts目录存在
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
    console.log(chalk.green(`创建scripts目录: ${scriptsDir}`));
  }
  
  // 检查hook脚本是否存在，不存在则创建
  if (!fs.existsSync(hookScriptPath)) {
    console.log(chalk.yellow(`Hook脚本不存在，正在创建: ${hookScriptPath}`));
    createWeChatNotifyScript(hookScriptPath);
  }
  
  // 读取现有的Claude设置
  let claudeSettings = {};
  if (fs.existsSync(claudeSettingsPath)) {
    try {
      const data = fs.readFileSync(claudeSettingsPath, 'utf8');
      claudeSettings = JSON.parse(data);
    } catch (error) {
      console.warn(chalk.yellow(`读取Claude设置文件失败，将创建新的设置: ${error.message}`));
    }
  }
  
  // 确保hooks配置存在
  if (!claudeSettings.hooks) {
    claudeSettings.hooks = {};
  }
  
  // 配置Notification和Stop事件的hooks
  claudeSettings.hooks.Notification = [
    {
      hooks: [
        {
          type: 'command',
          command: `node "${hookScriptPath}" notification`
        }
      ]
    }
  ];
  
  claudeSettings.hooks.Stop = [
    {
      hooks: [
        {
          type: 'command', 
          command: `node "${hookScriptPath}" stop`
        }
      ]
    }
  ];
  
  // 保存Claude设置
  try {
    fs.writeFileSync(claudeSettingsPath, JSON.stringify(claudeSettings, null, 2), 'utf8');
    console.log(chalk.green('✓ ClaudeCode Hooks配置已更新'));
    console.log(chalk.white(`Hook脚本位置: ${hookScriptPath}`));
    console.log(chalk.green('\n配置完成！现在ClaudeCode将在以下事件时发送企微通知:'));
    console.log(chalk.white('  - Notification事件: 当Claude需要用户关注时'));
    console.log(chalk.white('  - Stop事件: 当Claude任务完成时'));
  } catch (error) {
    console.error(chalk.red(`保存Claude设置文件失败: ${error.message}`));
  }
}

/**
 * 设置通知配置
 */
function setupNotifyConfig() {
  const rl = createReadlineInterface();
  
  console.log(chalk.cyan('\n设置企微机器人通知配置:'));
  console.log(chalk.white('请在企微群聊中添加机器人，获取Webhook地址'));
  console.log(chalk.white('格式: https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY'));
  console.log(chalk.yellow('配置完成后，将自动通过ClaudeCode Hooks监听Notification和Stop事件'));
  
  rl.question(chalk.cyan('\n请输入企微机器人Webhook地址: '), (webhookUrl) => {
    if (!webhookUrl || !webhookUrl.startsWith('https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=')) {
      console.error(chalk.red('无效的企微机器人Webhook地址'));
      rl.close();
      return;
    }
    
    const config = {
      wechatWork: {
        webhookUrl: webhookUrl,
        enabled: true,
        events: ['Notification', 'Stop'] // 支持的事件类型
      },
      hooks: {
        enabled: true,
        defaultEnabled: true, // 默认开启通知
        events: {
          Notification: {
            enabled: true,
            message: 'Claude Code需要您的关注'
          },
          Stop: {
            enabled: true,
            message: 'Claude Code任务已完成'
          }
        }
      },
      // 为未来支持更多通知渠道预留配置结构
      telegram: {
        enabled: false
      },
      slack: {
        enabled: false
      }
    };
    
    saveNotifyConfig(config);
    setupClaudeCodeHooks(config);
    rl.close();
  });
}

/**
 * 显示通知配置状态
 */
function showNotifyStatus() {
  const notifyConfig = readNotifyConfig();
  
  if (!notifyConfig) {
    console.log(chalk.yellow('未配置企微通知，请运行 ccs notify setup 进行配置'));
    return;
  }
  
  console.log(chalk.cyan('\n当前通知配置状态:'));
  console.log(chalk.white('企微机器人: ') + (notifyConfig.wechatWork?.enabled ? chalk.green('已启用') : chalk.red('未启用')));
  
  if (notifyConfig.wechatWork?.webhookUrl) {
    const maskedUrl = notifyConfig.wechatWork.webhookUrl.replace(/key=([^&]+)/, 'key=***');
    console.log(chalk.white('Webhook地址: ') + maskedUrl);
  }
  
  if (notifyConfig.hooks?.enabled) {
    console.log(chalk.white('Hook事件: ') + chalk.green('已启用'));
    console.log(chalk.white('  Notification事件: ') + (notifyConfig.hooks.events?.Notification?.enabled ? chalk.green('启用') : chalk.red('禁用')));
    console.log(chalk.white('  Stop事件: ') + (notifyConfig.hooks.events?.Stop?.enabled ? chalk.green('启用') : chalk.red('禁用')));
  } else {
    console.log(chalk.white('Hook事件: ') + chalk.red('未启用'));
  }
  
  // 检查ClaudeCode hooks配置文件
  const claudeHooksPath = path.join(os.homedir(), '.claude', 'settings.json');
  if (fs.existsSync(claudeHooksPath)) {
    try {
      const claudeSettings = JSON.parse(fs.readFileSync(claudeHooksPath, 'utf8'));
      if (claudeSettings.hooks && claudeSettings.hooks.Notification && claudeSettings.hooks.Stop) {
        console.log(chalk.white('ClaudeCode hooks配置: ') + chalk.green('已配置'));
      } else {
        console.log(chalk.white('ClaudeCode hooks配置: ') + chalk.yellow('未配置 - 需要恢复'));
      }
    } catch (error) {
      console.log(chalk.white('ClaudeCode hooks配置: ') + chalk.red('读取失败'));
    }
  } else {
    console.log(chalk.white('ClaudeCode hooks配置: ') + chalk.yellow('未找到'));
  }
}

/**
 * 测试企微通知功能
 */
function testNotification() {
  const notifyConfig = readNotifyConfig();
  
  if (!notifyConfig || !notifyConfig.wechatWork || !notifyConfig.wechatWork.webhookUrl) {
    console.log(chalk.yellow('未配置企微通知，请先运行 ccs notify setup'));
    return;
  }
  
  console.log(chalk.cyan('正在发送测试通知...'));
  const testMessage = `[CCS测试通知]\n时间: ${new Date().toLocaleString()}\n这是一条来自claude-code-switch的测试消息`;
  
  sendWeChatWorkNotification(notifyConfig.wechatWork.webhookUrl, testMessage);
}


/**
 * 注册notify相关的CLI命令
 * @param {Object} program commander程序对象
 */
function registerNotifyCommands(program) {
  // 新的notify命令，用于配置企微通知
  const notifyCommand = program
    .command('notify')
    .alias('ntf')
    .description('配置企微通知设置')
    .action(() => {
      // 直接输入 ccs notify 或 ccs ntf 时显示交互式选择菜单
      selectNotifyAction();
    });

  notifyCommand
    .command('setup')
    .description('设置企微机器人webhook地址')
    .action(() => {
      ensureConfigDir();
      setupNotifyConfig();
    });

  notifyCommand
    .command('status')
    .description('查看当前通知配置状态')
    .action(() => {
      ensureConfigDir();
      showNotifyStatus();
    });

  notifyCommand
    .command('test')
    .description('测试企微通知功能')
    .action(() => {
      ensureConfigDir();
      testNotification();
    });
}

/**
 * 交互式选择通知操作
 */
function selectNotifyAction() {
  const choices = [
    {
      name: '1. setup   - 设置企微通知',
      value: 'setup'
    },
    {
      name: '2. status  - 查看通知状态',
      value: 'status'
    },
    {
      name: '3. test    - 测试通知功能',
      value: 'test'
    }
  ];

  inquirer
    .prompt([
      {
        type: 'list',
        name: 'action',
        message: '请选择操作:',
        choices: choices
      }
    ])
    .then(answers => {
      ensureConfigDir();
      switch (answers.action) {
        case 'setup':
          setupNotifyConfig();
          break;
        case 'status':
          showNotifyStatus();
          break;
        case 'test':
          testNotification();
          break;
      }
    })
    .catch(error => {
      console.error(chalk.red(`发生错误: ${error.message}`));
    });
}

module.exports = {
  readNotifyConfig,
  saveNotifyConfig,
  sendWeChatWorkNotification,
  setupClaudeCodeHooks,
  setupNotifyConfig,
  showNotifyStatus,
  testNotification,
  registerNotifyCommands,
  ensureConfigDir,
  createWeChatNotifyScript
};