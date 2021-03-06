/*
 * @Author: TonyJiangWJ
 * @Date: 2019-11-27 09:03:57
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-01-09 11:00:18
 * @Description: 
 */
'ui';

let currentEngine = engines.myEngine().getSource() + ''
let isRunningMode = currentEngine.endsWith('/config.js')
importClass(android.text.TextWatcher)
importClass(android.view.View)
importClass(android.view.MotionEvent)

// 执行配置
var default_config = {
  timeout_existing: 6000,
  timeout_findOne: 1000,
  timeout_unlock: 1000,
  password: '',
  is_alipay_locked: false,
  alipay_lock_password: '',
  color_offset: 20,
  // 是否显示调试日志信息
  show_debug_log: true,
  // 是否toast调试日志
  toast_debug_info: false,
  saveLogFile: true,
  // 完成后通过手势kill支付宝应用，目前只支持MIUI全面屏手势 默认关闭
  killAppWithGesture: false,
  // 是否使用加速卡 默认为true
  useSpeedCard: true,
  starBallScore: 205,
  // 倒计时结束 等待的窗口时间
  windowTime: 5,
  recheckTime: 5
}

// 配置缓存的key值
const CONFIG_STORAGE_NAME = 'chick_config_version'
var storageConfig = storages.create(CONFIG_STORAGE_NAME)
var config = {}
if (!storageConfig.contains('password')) {
  toastLog('使用默认配置')
  // 存储默认配置到本地
  Object.keys(default_config).forEach(key => {
    storageConfig.put(key, default_config[key])
  })
  config = default_config
} else {
  Object.keys(default_config).forEach(key => {
    let storedConfigItem = storageConfig.get(key)
    if (storedConfigItem === undefined) {
      storedConfigItem = default_config[key]
    }
    config[key] = storedConfigItem
  })
}
log('当前配置信息：' + JSON.stringify(config))
if (!isRunningMode) {
  module.exports = {
    config: config,
    default_config: default_config,
    storage_name: CONFIG_STORAGE_NAME
  }
} else {
  // 传递给commonFunction 避免二次引用config.js
  const storage_name = CONFIG_STORAGE_NAME
  let { commonFunctions } = require('./lib/CommonFunction.js')
  let AesUtil = require('./lib/AesUtil.js')
  let loadingDialog = null
  threads.start(function () {
    loadingDialog = dialogs.build({
      title: "加载中...",
      progress: {
        max: -1
      },
      cancelable: false
    }).show()
    setTimeout(function () {
      loadingDialog.dismiss()
    }, 3000)
  })

  const TextWatcherBuilder = function (textCallback) {
    return new TextWatcher({
      onTextChanged: (text) => {
        textCallback(text + '')
      },
      beforeTextChanged: function (s) { }
      ,
      afterTextChanged: function (s) { }
    })
  }

  const setUiValues = function () {
    ui.password.text(config.password)
    ui.isAlipayLockedChkBox.setChecked(config.is_alipay_locked)
    ui.alipayLockPasswordInpt.setText(config.alipay_lock_password)
    ui.alipayLockPasswordContainer.setVisibility(config.is_alipay_locked ? View.VISIBLE : View.GONE)
    ui.colorThresholdInput.text('' + config.color_offset)
    let precent = parseInt(config.color_offset / 255 * 100)
    ui.colorThresholdSeekbar.setProgress(precent)

    ui.useSpeedCardChkBox.setChecked(config.useSpeedCard)
    ui.windowTimeInpt.text('' + config.windowTime)
    ui.recheckTimeInpt.text('' + config.recheckTime)
    ui.showDebugLogChkBox.setChecked(config.show_debug_log)
    ui.saveLogFileChkBox.setChecked(config.saveLogFile)
    ui.starBallScoreInpt.setText(config.starBallScore + '')
  }

  setTimeout(function () {
    ui.layout(
      <drawer>
        <vertical>
          <appbar>
            <toolbar id="toolbar" title="运行配置" />
          </appbar>
          <frame>
            <vertical padding="24 0">
              {/* 锁屏密码 */}
              <horizontal gravity="center">
                <text text="锁屏密码：" />
                <input id="password" inputType="textPassword" layout_weight="80" />
              </horizontal>
              <checkbox id="isAlipayLockedChkBox" text="支付宝是否锁定" />
              <horizontal gravity="center" id="alipayLockPasswordContainer">
                <text text="支付宝手势密码对应的九宫格数字：" textSize="10sp" />
                <input id="alipayLockPasswordInpt" inputType="textPassword" layout_weight="80" />
              </horizontal>
              <horizontal w="*" h="1sp" bg="#cccccc" margin="5 5"></horizontal>
              {/* 颜色识别 */}
              <text text="颜色相似度（拖动为百分比，实际使用0-255）" textColor="black" textSize="16sp" />
              <horizontal gravity="center">
                <text id="colorThresholdInput" />
                <seekbar id="colorThresholdSeekbar" progress="20" layout_weight="85" />
              </horizontal>
              {/* 是否使用加速卡 */}
              <checkbox id="useSpeedCardChkBox" text="是否使用加速卡" />
              <text text="喂食等待窗口时间是为了避免倒计时计算不准确而加入的冗余时间，不建议设置成0" textSize="8sp" />
              <horizontal padding="10 0" gravity="center">
                <text text="喂食等待窗口时间：" layout_weight="20" />
                <input id="windowTimeInpt" inputType="number" textSize="14sp" layout_weight="80" />
              </horizontal>
              <text text="循环检测等待时间是驱赶野鸡的轮询间隔，不建议设置太低" textSize="8sp" />
              <horizontal padding="10 0" gravity="center">
                <text text="循环检测等待时间：" layout_weight="20" />
                <input id="recheckTimeInpt" inputType="number" textSize="14sp" layout_weight="80" />
              </horizontal>
              <horizontal w="*" h="1sp" bg="#cccccc" margin="5 0"></horizontal>
              {/* 是否显示debug日志 */}
              <checkbox id="showDebugLogChkBox" text="是否显示debug日志" />
              <checkbox id="saveLogFileChkBox" text="是否保存日志到文件" />
              <horizontal padding="10 0" gravity="center">
                <text text="星星球目标分数：" layout_weight="20" />
                <input id="starBallScoreInpt" inputType="number" textSize="14sp" layout_weight="80" />
              </horizontal>
            </vertical>
          </frame>
        </vertical>
      </drawer>
    )

    // 创建选项菜单(右上角)
    ui.emitter.on("create_options_menu", menu => {
      menu.add("全部重置为默认")
      menu.add("从配置文件中读取")
      menu.add("将配置导出")
      menu.add("导出运行时数据")
      menu.add("导入运行时数据")
    })
    // 监听选项菜单点击
    ui.emitter.on("options_item_selected", (e, item) => {
      let local_config_path = files.cwd() + '/local_config.cfg'
      let runtime_store_path = files.cwd() + '/runtime_store.cfg'
      let aesKey = device.getAndroidId()
      switch (item.getTitle()) {
        case "全部重置为默认":
          confirm('确定要将所有配置重置为默认值吗？').then(ok => {
            if (ok) {
              Object.keys(default_config).forEach(key => {
                let defaultValue = default_config[key]
                config[key] = defaultValue
                storageConfig.put(key, defaultValue)
              })
              setUiValues()
            }
          })
          break
        case "从配置文件中读取":
          confirm('确定要从local_config.cfg中读取配置吗？').then(ok => {
            if (ok) {
              try {
                if (files.exists(local_config_path)) {
                  const refillConfigs = function (configStr) {
                    let local_config = JSON.parse(configStr)
                    Object.keys(default_config).forEach(key => {
                      let defaultValue = local_config[key]
                      if (typeof defaultValue === 'undefined') {
                        defaultValue = default_config[key]
                      }
                      config[key] = defaultValue
                      storageConfig.put(key, defaultValue)
                    })
                    setUiValues()
                  }
                  let configStr = AesUtil.decrypt(files.read(local_config_path), aesKey)
                  if (!configStr) {
                    toastLog('local_config.cfg解密失败, 请尝试输入秘钥')
                    dialogs.rawInput('请输入秘钥，可通过device.getAndroidId()获取')
                      .then(key => {
                        if (key) {
                          key = key.trim()
                          configStr = AesUtil.decrypt(files.read(local_config_path), key)
                          if (configStr) {
                            refillConfigs(configStr)
                          } else {
                            toastLog('秘钥不正确，无法解析')
                          }
                        }
                      })
                  } else {
                    refillConfigs(configStr)
                  }
                } else {
                  toastLog('local_config.cfg不存在无法导入')
                }
              } catch (e) {
                toastLog(e)
              }
            }
          })
          break
        case "将配置导出":
          confirm('确定要将配置导出到local_config.cfg吗？此操作会覆盖已有的local_config数据').then(ok => {
            if (ok) {
              Object.keys(default_config).forEach(key => {
                console.verbose(key + ': ' + config[key])
              })
              try {
                let configString = AesUtil.encrypt(JSON.stringify(config), aesKey)
                files.write(local_config_path, configString)
                toastLog('配置信息导出成功，刷新目录即可，local_config.cfg内容已加密仅本机可用，除非告知秘钥')
              } catch (e) {
                toastLog(e)
              }

            }
          })
          break
        case "导出运行时数据":
          confirm('确定要将运行时数据导出到runtime_store.cfg吗？此操作会覆盖已有的数据').then(ok => {
            if (ok) {
              try {
                let runtimeStorageStr = AesUtil.encrypt(commonFunctions.exportRuntimeStorage(), aesKey)
                files.write(runtime_store_path, runtimeStorageStr)
              } catch (e) {
                toastLog(e)
              }
            }
          })
          break
        case "导入运行时数据":
          confirm('确定要将从runtime_store.cfg导入运行时数据吗？此操作会覆盖已有的数据').then(ok => {
            if (ok) {
              if (files.exists(runtime_store_path)) {
                let encrypt_content = files.read(runtime_store_path)
                const resetRuntimeStore = function (runtimeStorageStr) {
                  if (commonFunctions.importRuntimeStorage(runtimeStorageStr)) {
                    setUiValues()
                    return true
                  }
                  toastLog('导入运行配置失败，无法读取正确信息')
                  return false
                }
                try {
                  let decrypt = AesUtil.decrypt(encrypt_content, aesKey)
                  if (!decrypt) {
                    toastLog('runtime_store.cfg解密失败, 请尝试输入秘钥')
                    dialogs.rawInput('请输入秘钥，可通过device.getAndroidId()获取')
                      .then(key => {
                        if (key) {
                          key = key.trim()
                          decrypt = AesUtil.decrypt(encrypt_content, key)
                          if (decrypt) {
                            resetRuntimeStore(decrypt)
                          } else {
                            toastLog('秘钥不正确，无法解析')
                          }
                        }
                      })
                  } else {
                    resetRuntimeStore(decrypt)
                  }
                } catch (e) {
                  toastLog(e)
                }
              } else {
                toastLog('配置信息不存在，无法导入')
              }
            }
          })
          break
      }
      e.consumed = true
    })
    activity.setSupportActionBar(ui.toolbar)

    setUiValues()


    ui.password.addTextChangedListener(
      TextWatcherBuilder(text => { config.password = text + '' })
    )


    ui.isAlipayLockedChkBox.on('click', () => {
      config.is_alipay_locked = ui.isAlipayLockedChkBox.isChecked()
      ui.alipayLockPasswordContainer.setVisibility(config.is_alipay_locked ? View.VISIBLE : View.GONE)
    })


    ui.useSpeedCardChkBox.on('click', () => {
      config.useSpeedCard = ui.useSpeedCardChkBox.isChecked()
    })

    ui.alipayLockPasswordInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.alipay_lock_password = text + '' })
    )

    ui.colorThresholdSeekbar.on('touch', () => {
      let precent = ui.colorThresholdSeekbar.getProgress()
      let trueVal = parseInt(precent * 255 / 100)
      ui.colorThresholdInput.text('' + trueVal)
      config.color_offset = trueVal
    })

    ui.windowTimeInpt.addTextChangedListener(
      TextWatcherBuilder(text => {
        let val = parseInt(text)
        config.windowTime = val >= 0 ? val : 0
      })
    )
    ui.recheckTimeInpt.addTextChangedListener(
      TextWatcherBuilder(text => {
        let val = parseInt(text)
        config.recheckTime = val >= 0 ? val : 0
      })
    )
    ui.starBallScoreInpt.addTextChangedListener(
      TextWatcherBuilder(text => { config.starBallScore = parseInt(text) })
    )

    ui.isAlipayLockedChkBox.on('click', () => {
      config.is_alipay_locked = ui.isAlipayLockedChkBox.isChecked()
      ui.alipayLockPasswordContainer.setVisibility(config.is_alipay_locked ? View.VISIBLE : View.GONE)
    })

    ui.showDebugLogChkBox.on('click', () => {
      config.show_debug_log = ui.showDebugLogChkBox.isChecked()
    })

    ui.saveLogFileChkBox.on('click', () => {
      config.saveLogFile = ui.saveLogFileChkBox.isChecked()
    })

    setTimeout(() => {
      loadingDialog.dismiss()
    }, 500)
  }, 400)

  ui.emitter.on('pause', () => {
    ui.finish()
    Object.keys(default_config).forEach(key => {
      let newVal = config[key]
      if (typeof newVal !== 'undefined') {
        storageConfig.put(key, newVal)
      } else {
        storageConfig.put(key, default_config[key])
      }
    })
    log('修改后配置信息：' + JSON.stringify(config))
  })
}