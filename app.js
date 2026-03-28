App({
  onLaunch() {
    // 初始化存储
    if (!wx.getStorageSync('students')) {
      wx.setStorageSync('students', [])
    }
    if (!wx.getStorageSync('records')) {
      wx.setStorageSync('records', [])
    }
  },
  globalData: {}
})
