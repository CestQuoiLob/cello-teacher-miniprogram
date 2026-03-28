const dataApi = require('../../utils/data')

Page({
  data: {
    showClearConfirm: false
  },

  // 数据导出
  onExportData() {
    try {
      const data = dataApi.exportAllData()
      const jsonStr = JSON.stringify(data, null, 2)

      // 写入临时文件并保存
      const fs = wx.getFileSystemManager()
      const filePath = `${wx.env.USER_DATA_PATH}/cello_teacher_export_${Date.now()}.json`

      fs.writeFile({
        filePath: filePath,
        data: jsonStr,
        encoding: 'utf-8',
        success: () => {
          wx.shareFileMessage({
            filePath: filePath,
            success: () => {
              wx.showToast({ title: '导出成功', icon: 'success' })
            },
            fail: () => {
              // 备用方案：复制到剪贴板
              wx.setClipboardData({
                data: jsonStr,
                success: () => {
                  wx.showToast({ title: '已复制到剪贴板', icon: 'success' })
                }
              })
            }
          })
        },
        fail: () => {
          // 备用方案
          wx.setClipboardData({
            data: jsonStr,
            success: () => {
              wx.showToast({ title: '已复制到剪贴板', icon: 'success' })
            }
          })
        }
      })
    } catch (e) {
      wx.showToast({ title: '导出失败', icon: 'error' })
    }
  },

  // 清除数据 - 第一次确认
  onClearData() {
    this.setData({ showClearConfirm: true })
  },

  onCancelClear() {
    this.setData({ showClearConfirm: false })
  },

  // 清除数据 - 最终确认
  onConfirmClear() {
    dataApi.clearAllData()
    this.setData({ showClearConfirm: false })
    wx.showToast({ title: '已清除所有数据', icon: 'success' })
  },

  // 关于
  onAbout() {
    wx.showModal({
      title: '关于',
      content: '大提琴教学管理 v1.0.0\n\n一个简洁高效的大提琴教学管理工具，帮助教师管理学生信息、上课记录和课时统计。',
      showCancel: false
    })
  }
})
