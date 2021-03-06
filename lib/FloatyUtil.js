/*
 * @Author: TonyJiangWJ
 * @Date: 2019-12-02 19:05:01
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2019-12-08 14:15:59
 * @Description: 悬浮窗工具，单独提出来作为单例使用
 */
let Timers = require('./Timers.js')(runtime, this)

let FloatyUtil = function () {
  this.floatyWindow = null
  this.floatyInitStatus = false
  this.floatyLock = null
  this.floatyCondition = null
}
FloatyUtil.prototype.init = function () {
  this.floatyLock = threads.lock()
  this.floatyCondition = this.floatyLock.newCondition()
  let _this = this
  threads.start(function () {
    // 延迟初始化，避免死机
    sleep(400)
    _this.floatyLock.lock()
    try {
      _this.floatyWindow = floaty.rawWindow(
        <frame gravity="left">
          <text id="content" textSize="8dp" textColor="#00ff00" />
        </frame>
      )
      _this.floatyWindow.setTouchable(false)
      _this.floatyWindow.setPosition(50, 50)
      _this.floatyWindow.content.text('悬浮窗初始化成功')
      _this.floatyInitStatus = true
    } catch (e) {
      console.error('悬浮窗初始化失败' + e)
      _this.floatyInitStatus = false
    } finally {
      _this.floatyCondition.signalAll()
      _this.floatyLock.unlock()
    }
  })
  this.floatyLock.lock()
  if (this.floatyInitStatus === false) {
    console.verbose('等待悬浮窗初始化')
    this.floatyCondition.await()
  }
  this.floatyLock.unlock()
  console.verbose('悬浮窗初始化' + (this.floatyInitStatus ? '成功' : '失败'))
  return this.floatyInitStatus
}

FloatyUtil.prototype.close = function () {
  this.floatyLock.lock()
  this.floatyWindow.close()
  this.floatyWindow = null
  this.floatyInitStatus = false
  this.floatyLock.unlock()
}

FloatyUtil.prototype.setFloatyInfo = function (position, text) {
  if (this.floatyWindow === null) {
    this.init()
  }
  let _this = this
  ui.run(function () {
    _this.floatyLock.lock()
    if (position && isFinite(position.x) && isFinite(position.y)) {
      _this.floatyWindow.setPosition(parseInt(position.x), parseInt(position.y))
    }
    if (text) {
      _this.floatyWindow.content.text(text)
    }
    _this.floatyLock.unlock()
  })
}


FloatyUtil.prototype.setFloatyTextColor = function (colorStr) {
  if (this.floatyWindow === null) {
    this.init()
  }
  if (/#[\dabcdef]{6}/i.test(colorStr)) {
    let colorInt = colors.parseColor(colorStr)
    if (colorInt !== null) {
      let _this = this
      ui.run(function () {
        _this.floatyLock.lock()
        _this.floatyWindow.content.setTextColor(colorInt)
        _this.floatyLock.unlock()
      })
    }
  } else {
    console.error('颜色值字符串格式不正确: ' + colorStr)
  }
}

module.exports = new FloatyUtil()