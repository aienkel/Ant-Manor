// 执行配置
var default_config = {
  password: '',
  // 是否显示调试日志信息
  show_debug_log: false,
  // 是否toast调试日志
  toast_debug_info: false,
  timeout_existing: 6000,
  timeout_findOne: 1000,
  timeout_unlock: 1000
}
/**
 * 非可视化控制的配置 通过手动修改config.js来实现配置
 */
let no_gui_config = {
  saveLogFile: true,
  fuck_miui11: false
}

// UI配置
var ui_config = {
}

// 配置缓存的key值
const CONFIG_STORAGE_NAME = 'chick_config_version'
var configStorage = storages.create(CONFIG_STORAGE_NAME)
var config = {}
if (!configStorage.contains('password')) {
  toastLog('使用默认配置')
  // 存储默认配置到本地
  Object.keys(default_config).forEach(key => {
    configStorage.put(key, default_config[key])
  })
  config = default_config
} else {
  Object.keys(default_config).forEach(key => {
    let storedConfigItem = configStorage.get(key)
    if (storedConfigItem === undefined) {
      storedConfigItem = default_config[key]
    }
    config[key] = storedConfigItem
  })
}
// UI配置直接设置到storages
Object.keys(ui_config).forEach(key => {
  config[key] = ui_config[key]
})
// 非可视化配置
Object.keys(no_gui_config).forEach(key => {
  config[key] = no_gui_config[key]
})
module.exports = {
  config: config,
  default_config: default_config,
  storage_name: CONFIG_STORAGE_NAME
}