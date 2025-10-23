#!/usr/bin/env node

/**
 * Claude配置切换工具
 * 用于在不同的Claude API配置之间进行切换
 */

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const chalk = require('chalk');
const os = require('os');
const readline = require('readline');
const inquirer = require('inquirer');
const { spawn } = require('child_process');
const notify = require('./notify');
const health = require('./health');

// 版本号
const VERSION = '1.7.0';

// 配置文件路径
const CONFIG_DIR = path.join(os.homedir(), '.claude');
const API_CONFIGS_FILE = path.join(CONFIG_DIR, 'apiConfigs.json');
const SETTINGS_FILE = path.join(CONFIG_DIR, 'settings.json');

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
 * 读取API配置文件
 * @returns {Array} API配置数组
 */
function readApiConfigs() {
  try {
    if (!fs.existsSync(API_CONFIGS_FILE)) {
      console.log(chalk.yellow(`警告: API配置文件不存在 (${API_CONFIGS_FILE})`));
      return [];
    }
    
    const data = fs.readFileSync(API_CONFIGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(chalk.red(`读取API配置文件失败: ${error.message}`));
    return [];
  }
}

/**
 * 读取settings.json文件
 * @returns {Object} 设置对象
 */
function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      return { env: {} };
    }
    
    const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(chalk.red(`读取设置文件失败: ${error.message}`));
    return { env: {} };
  }
}

/**
 * 保存settings.json文件
 * @param {Object} settings 设置对象
 */
function saveSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
  } catch (error) {
    console.error(chalk.red(`保存设置文件失败: ${error.message}`));
    process.exit(1);
  }
}

/**
 * 保存API配置文件
 * @param {Array} apiConfigs API配置数组
 */
function saveApiConfigs(apiConfigs) {
  try {
    fs.writeFileSync(API_CONFIGS_FILE, JSON.stringify(apiConfigs, null, 2), 'utf8');
  } catch (error) {
    console.error(chalk.red(`保存API配置文件失败: ${error.message}`));
    process.exit(1);
  }
}

/**
 * 保存配置时保持现有的hooks和其他设置
 * @param {Object} newConfig 新的配置对象
 */
function saveSettingsPreservingHooks(newConfig) {
  try {
    // 读取当前设置
    const currentSettings = readSettings();
    
    // 合并配置，只有当前设置中存在hooks时才保持
    const mergedSettings = {
      ...newConfig
    };
    
    // 如果当前设置中有hooks，则保持
    if (currentSettings.hooks) {
      mergedSettings.hooks = currentSettings.hooks;
    }
    
    // 如果当前设置中有statusLine，则保持
    if (currentSettings.statusLine) {
      mergedSettings.statusLine = currentSettings.statusLine;
    }
    
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(mergedSettings, null, 2), 'utf8');
  } catch (error) {
    console.error(chalk.red(`保存设置文件失败: ${error.message}`));
    process.exit(1);
  }
}

/**
 * 深度比较两个对象是否相等
 * @param {Object} obj1 
 * @param {Object} obj2 
 * @returns {boolean}
 */
function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (let key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}

/**
 * 获取当前激活的API配置
 * @returns {Object|null} 当前激活的配置对象或null（如果没有找到）
 */
function getCurrentConfig() {
  const settings = readSettings();
  
  // 如果settings为空，返回null
  if (!settings || Object.keys(settings).length === 0) {
    return null;
  }
  
  // 查找匹配的配置，只比较核心字段
  const apiConfigs = readApiConfigs();
  return apiConfigs.find(config => {
    if (!config.config) return false;
    
    // 主要比较 env 字段中的关键配置
    const currentEnv = settings.env || {};
    const configEnv = config.config.env || {};
    
    return currentEnv.ANTHROPIC_BASE_URL === configEnv.ANTHROPIC_BASE_URL &&
           currentEnv.ANTHROPIC_AUTH_TOKEN === configEnv.ANTHROPIC_AUTH_TOKEN;
  }) || null;
}

/**
 * 列出所有可用的API配置并提示用户选择（同时支持交互式菜单和序号输入）
 */
function listAndSelectConfig() {
  const apiConfigs = readApiConfigs();
  
  if (apiConfigs.length === 0) {
    console.log(chalk.yellow('没有找到可用的API配置'));
    process.exit(0);
  }
  
  // 获取当前激活的配置
  const currentConfig = getCurrentConfig();
  
  // 如果有当前激活的配置，显示它
  if (currentConfig) {
    console.log(chalk.green('当前激活的配置: ') + chalk.white(currentConfig.name));
    console.log();
  }
  
  // 找出最长的名称长度，用于对齐
  const maxNameLength = apiConfigs.reduce((max, config) => 
    Math.max(max, config.name.length), 0);
  
  // 准备选项列表
  const choices = apiConfigs.map((config, index) => {
    // 如果是当前激活的配置，添加标记
    const isActive = currentConfig && config.name === currentConfig.name;
    
    // 格式化配置信息：[name] key url，name对齐，密钥不格式化
    const paddedName = config.name.padEnd(maxNameLength, ' ');
    const configInfo = `[${paddedName}]  ${config.config.env.ANTHROPIC_AUTH_TOKEN}  ${config.config.env.ANTHROPIC_BASE_URL}`;
    
    return {
      name: `${index + 1}. ${configInfo}${isActive ? chalk.green(' (当前)') : ''}`,
      value: index
    };
  });
  
  // 添加一个输入选项
  choices.push(new inquirer.Separator());
  choices.push({
    name: '输入序号...',
    value: 'input',
    disabled: ' ' // 让输入序号选项不可选中
  });
  
  // 使用inquirer创建交互式菜单
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'configIndex',
        message: '请选择要切换的配置:',
        choices: choices,
        pageSize: choices.length, // 显示所有选项，确保"输入序号..."始终在底部
        // 设置更宽的显示宽度以支持长配置信息
        prefix: '',
        suffix: '',
      }
    ])
    .then(answers => {
      // 如果用户选择了"输入序号"选项
      if (answers.configIndex === 'input') {
        // 显示配置列表以供参考
        console.log(chalk.cyan('\n可用的API配置:'));
        apiConfigs.forEach((config, index) => {
          const isActive = currentConfig && config.name === currentConfig.name;
          const activeMarker = isActive ? chalk.green(' (当前)') : '';
          const paddedName = config.name.padEnd(maxNameLength, ' ');
          const configInfo = `[${paddedName}]  ${config.config.env.ANTHROPIC_AUTH_TOKEN}  ${config.config.env.ANTHROPIC_BASE_URL}`;
          console.log(chalk.white(` ${index + 1}. ${configInfo}${activeMarker}`));
        });
        
        const rl = createReadlineInterface();
        
        rl.question(chalk.cyan('\n请输入配置序号 (1-' + apiConfigs.length + '): '), (indexAnswer) => {
          const index = parseInt(indexAnswer, 10);
          
          if (isNaN(index) || index < 1 || index > apiConfigs.length) {
            console.error(chalk.red(`无效的序号: ${indexAnswer}，有效范围: 1-${apiConfigs.length}`));
            rl.close();
            return;
          }
          
          const selectedConfig = apiConfigs[index - 1];
          
          // 如果选择的配置就是当前激活的配置，提示用户
          if (currentConfig && selectedConfig.name === currentConfig.name) {
            console.log(chalk.yellow(`\n配置 "${selectedConfig.name}" 已经是当前激活的配置`));
            rl.close();
            return;
          }
          
          processSelectedConfig(selectedConfig);
          rl.close();
        });
        return;
      }
      
      // 用户通过交互式菜单选择了配置
      const selectedIndex = answers.configIndex;
      const selectedConfig = apiConfigs[selectedIndex];
      
      // 如果选择的配置就是当前激活的配置，提示用户
      if (currentConfig && selectedConfig.name === currentConfig.name) {
        console.log(chalk.yellow(`\n配置 "${selectedConfig.name}" 已经是当前激活的配置`));
        return;
      }
      
      processSelectedConfig(selectedConfig);
    })
    .catch(error => {
      console.error(chalk.red(`发生错误: ${error.message}`));
    });
}

/**
 * 处理用户选择的配置
 * @param {Object} selectedConfig 选择的配置对象
 */
function processSelectedConfig(selectedConfig) {
  console.log(chalk.cyan('\n当前选择的配置:'));
  console.log(JSON.stringify(selectedConfig, null, 2));
  
  inquirer
    .prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '确认切换到此配置?',
        default: true // 修改默认值为true，按Enter键表示确认
      }
    ])
    .then(confirmAnswer => {
      if (confirmAnswer.confirm) {
        // 保存配置时保持现有的hooks设置
        saveSettingsPreservingHooks(selectedConfig.config);
        
        console.log(chalk.green(`\n成功切换到配置: ${selectedConfig.name}`));
        
        // 显示当前配置信息
        console.log(chalk.cyan('\n当前激活配置详情:'));
        const { name, config } = selectedConfig;
        console.log(chalk.white(`名称: ${name}`));
        console.log(chalk.white(`API Key: ${config.env.ANTHROPIC_AUTH_TOKEN}`));
        console.log(chalk.white(`Base URL: ${config.env.ANTHROPIC_BASE_URL}`));
        console.log(chalk.white(`Model: ${config.model || 'default'}`));
        
        // 询问是否要在当前目录运行 Claude
        inquirer
          .prompt([
            {
              type: 'confirm',
              name: 'runClaude',
              message: '是否要在当前目录运行 claude?',
              default: true
            }
          ])
          .then(runAnswer => {
            if (runAnswer.runClaude) {
              console.log(chalk.green('\n正在启动 Claude...'));
              
              // 启动 Claude
              const claudeProcess = spawn('claude', [], {
                stdio: 'inherit',
                cwd: process.cwd()
              });
              
              claudeProcess.on('error', (error) => {
                console.error(chalk.red(`启动 Claude 失败: ${error.message}`));
                console.log(chalk.yellow('请确保 Claude CLI 已正确安装'));
              });
            } else {
              console.log(chalk.yellow('您可以稍后手动运行 claude 命令'));
            }
          })
          .catch(error => {
            console.error(chalk.red(`发生错误: ${error.message}`));
          });
      } else {
        console.log(chalk.yellow('\n操作已取消'));
      }
    });
}

/**
 * 列出所有可用的API配置
 */
function listConfigs() {
  const apiConfigs = readApiConfigs();
  
  if (apiConfigs.length === 0) {
    console.log(chalk.yellow('没有找到可用的API配置'));
    return;
  }
  
  console.log(chalk.cyan('可用的API配置:'));
  apiConfigs.forEach((config, index) => {
    console.log(chalk.white(` ${index + 1}. ${config.name}`));
  });
}

/**
 * 设置当前使用的API配置（使用交互式确认）
 * @param {number} index 配置索引
 */
function setConfig(index) {
  const apiConfigs = readApiConfigs();
  
  if (apiConfigs.length === 0) {
    console.log(chalk.yellow('没有找到可用的API配置'));
    return;
  }
  
  // 检查索引是否有效
  if (index < 1 || index > apiConfigs.length) {
    console.error(chalk.red(`无效的索引: ${index}，有效范围: 1-${apiConfigs.length}`));
    return;
  }
  
  const selectedConfig = apiConfigs[index - 1];
  
  // 显示当前选择的配置
  console.log(chalk.cyan('当前选择的配置:'));
  console.log(JSON.stringify(selectedConfig, null, 2));
  
  // 使用inquirer进行确认
  inquirer
    .prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '确认切换到此配置?',
        default: true // 修改默认值为true，按Enter键表示确认
      }
    ])
    .then(answers => {
      if (answers.confirm) {
        // 直接使用选择的配置替换整个settings.json
        saveSettingsPreservingHooks(selectedConfig.config);
        
        console.log(chalk.green(`\n成功切换到配置: ${selectedConfig.name}`));
      } else {
        console.log(chalk.yellow('\n操作已取消'));
      }
    })
    .catch(error => {
      console.error(chalk.red(`发生错误: ${error.message}`));
    });
}

/**
 * 获取API配置文件的示例内容
 */
function getApiConfigTemplate() {
  return [
    {
      "name": "example-config",
      "config": {
        "env": {
          "ANTHROPIC_AUTH_TOKEN": "sk-YOUR_API_KEY_HERE",
          "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
          "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
        },
        "permissions": {
          "allow": [],
          "deny": []
        }
      }
    }
  ];
}

/**
 * 获取设置文件的示例内容
 */
function getSettingsTemplate() {
  return {
    "env": {
      "ANTHROPIC_AUTH_TOKEN": "sk-YOUR_API_KEY_HERE",
      "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
      "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
    },
    "permissions": {
      "allow": [],
      "deny": []
    }
  };
}

/**
 * 打开指定的配置文件
 * @param {string} filePath 文件路径
 */
function openConfigFile(filePath) {
  const fullPath = path.resolve(filePath);
  
  if (!fs.existsSync(fullPath)) {
    // 确保配置目录存在
    ensureConfigDir();
    
    // 创建示例配置文件
    let templateContent;
    if (fullPath === API_CONFIGS_FILE) {
      templateContent = JSON.stringify(getApiConfigTemplate(), null, 2);
      console.log(chalk.green(`创建API配置文件: ${fullPath}`));
    } else if (fullPath === SETTINGS_FILE) {
      templateContent = JSON.stringify(getSettingsTemplate(), null, 2);
      console.log(chalk.green(`创建设置配置文件: ${fullPath}`));
    } else {
      console.log(chalk.yellow(`配置文件不存在: ${fullPath}`));
      return;
    }
    
    try {
      fs.writeFileSync(fullPath, templateContent, 'utf8');
      console.log(chalk.green(`已创建示例配置文件，请根据需要修改配置内容`));
    } catch (error) {
      console.error(chalk.red(`创建配置文件失败: ${error.message}`));
      return;
    }
  }
  
  console.log(chalk.cyan(`正在打开: ${fullPath}`));
  
  // 使用spawn执行open命令
  const child = spawn('open', [fullPath], { 
    stdio: 'inherit',
    detached: true 
  });
  
  child.on('error', (error) => {
    console.error(chalk.red(`打开文件失败: ${error.message}`));
  });
  
  child.unref(); // 允许父进程独立于子进程退出
}

/**
 * 添加新的API配置
 */
function addConfig() {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'name',
        message: '请输入配置名称:',
        validate: (input) => {
          if (!input.trim()) {
            return '配置名称不能为空';
          }
          const apiConfigs = readApiConfigs();
          if (apiConfigs.some(config => config.name === input.trim())) {
            return `配置名称 "${input.trim()}" 已存在，请使用其他名称`;
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'baseUrl',
        message: '请输入API Base URL:',
        validate: (input) => {
          if (!input.trim()) {
            return 'API Base URL不能为空';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'authToken',
        message: '请输入Auth Token:',
        validate: (input) => {
          if (!input.trim()) {
            return 'Auth Token不能为空';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'model',
        message: '请输入Model (可选，直接回车跳过):',
        default: ''
      }
    ])
    .then(answers => {
      // 构建新的配置对象
      const newConfig = {
        name: answers.name.trim(),
        config: {
          env: {
            ANTHROPIC_AUTH_TOKEN: answers.authToken.trim(),
            ANTHROPIC_BASE_URL: answers.baseUrl.trim(),
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1"
          },
          permissions: {
            allow: [],
            deny: []
          }
        }
      };

      // 如果用户输入了model，添加到配置中
      if (answers.model.trim()) {
        newConfig.config.model = answers.model.trim();
      }

      // 显示新配置并确认
      console.log(chalk.cyan('\n新配置预览:'));
      console.log(JSON.stringify(newConfig, null, 2));

      inquirer
        .prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: '确认添加此配置?',
            default: true
          }
        ])
        .then(confirmAnswer => {
          if (confirmAnswer.confirm) {
            // 读取现有配置
            const apiConfigs = readApiConfigs();

            // 添加新配置
            apiConfigs.push(newConfig);

            // 保存配置
            saveApiConfigs(apiConfigs);

            console.log(chalk.green(`\n成功添加配置: ${newConfig.name}`));
            console.log(chalk.cyan(`当前共有 ${apiConfigs.length} 个配置`));
          } else {
            console.log(chalk.yellow('\n操作已取消'));
          }
        });
    })
    .catch(error => {
      console.error(chalk.red(`发生错误: ${error.message}`));
    });
}

/**
 * 显示版本信息
 */
function showVersion() {
  console.log(`ccs 版本: ${VERSION}`);
}


// 设置命令行程序
program
  .name('ccs')
  .description('Claude配置切换工具')
  .version(VERSION, '-v, --version', '显示版本信息');

program
  .command('list')
  .alias('ls')
  .description('列出所有可用的API配置并提示选择')
  .action(() => {
    ensureConfigDir();
    listAndSelectConfig();
  });

// 根据需求移除 set/use 命令

const openCommand = program
  .command('o')
  .description('打开Claude配置文件');

openCommand
  .command('api')
  .description('打开API配置文件 (apiConfigs.json)')
  .action(() => {
    openConfigFile(API_CONFIGS_FILE);
  });

openCommand
  .command('setting')
  .description('打开设置配置文件 (settings.json)')
  .action(() => {
    openConfigFile(SETTINGS_FILE);
  });

program
  .command('add')
  .description('添加新的API配置')
  .action(() => {
    ensureConfigDir();
    addConfig();
  });

// 注册notify相关命令
notify.registerNotifyCommands(program);

// 注册health相关命令
health.registerHealthCommands(program);

// 添加错误处理
program.on('command:*', (operands) => {
  console.error(chalk.red(`错误: 未知命令 '${operands[0]}'`));
  const availableCommands = program.commands.map(cmd => cmd.name());
  console.log(chalk.cyan('\n可用命令:'));
  availableCommands.forEach(cmd => {
    console.log(`  ${cmd}`);
  });
  console.log(chalk.cyan('\n使用 --help 查看更多信息'));
  process.exit(1);
});

// 如果没有提供命令，显示帮助信息
if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit(0); // 添加process.exit(0)确保程序在显示帮助信息后退出
}

program.parse(process.argv); 