const dataApi = require('../../utils/data')
const util = require('../../utils/util')

// xlsx.mini.js 的 CDN 地址
const XLSX_URL = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.mini.min.js'

Page({
  data: {
    step: 'intro', // intro, preview, done
    fileName: '',
    previewData: [],
    importCount: 0,
    loading: false
  },

  // 选择文件
  onChooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xlsx', 'xls', 'csv'],
      success: (res) => {
        const file = res.tempFiles[0]
        if (file) {
          this.setData({ fileName: file.name, loading: true })
          this.parseFile(file.path)
        }
      },
      fail: () => {
        wx.showToast({ title: '选择文件失败', icon: 'error' })
      }
    })
  },

  // 解析文件
  parseFile(filePath) {
    // 使用小程序文件系统读取
    const fs = wx.getFileSystemManager()

    // 尝试使用简单的 CSV 解析（如果文件是 CSV）
    if (filePath.toLowerCase().endsWith('.csv')) {
      fs.readFile({
        filePath: filePath,
        encoding: 'utf-8',
        success: (res) => {
          this.parseCSV(res.data)
        },
        fail: () => {
          this.setData({ loading: false })
          wx.showToast({ title: '读取文件失败', icon: 'error' })
        }
      })
    } else {
      // 对于 Excel 文件，提示手动格式
      this.setData({ loading: false })
      this.showManualImportGuide()
    }
  },

  // 解析 CSV
  parseCSV(content) {
    try {
      const lines = content.split(/\r?\n/).filter(l => l.trim())
      if (lines.length < 2) {
        wx.showToast({ title: '文件内容为空', icon: 'error' })
        this.setData({ loading: false })
        return
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      const students = []

      // 尝试映射列
      const nameIdx = this.findColumn(headers, ['姓名', 'name', '学生'])
      const phoneIdx = this.findColumn(headers, ['电话', 'phone', '手机', '手机号'])
      const ageIdx = this.findColumn(headers, ['年龄', 'age'])
      const feeIdx = this.findColumn(headers, ['课时费', 'fee', '费用'])
      const projectsIdx = this.findColumn(headers, ['项目', 'project', '课程'])
      const purchasedIdx = this.findColumn(headers, ['已购课时', 'purchased', '课时数', '课时'])

      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i])
        if (!values.length || !values[nameIdx]) continue

        const student = {
          name: (values[nameIdx] || '').trim(),
          phone: phoneIdx > -1 ? (values[phoneIdx] || '').trim() : '',
          age: ageIdx > -1 ? (values[ageIdx] || '').trim() : '',
          feePerLesson: feeIdx > -1 ? parseInt(values[feeIdx]) || 200 : 200,
          projects: projectsIdx > -1 ? (values[projectsIdx] || '').split(/[、,，]/).map(p => p.trim()).filter(p => p) : [],
          scheduleDays: [],
          purchasedLessons: purchasedIdx > -1 ? parseInt(values[purchasedIdx]) || 0 : 0,
          completedLessons: 0,
          remainingLessons: purchasedIdx > -1 ? parseInt(values[purchasedIdx]) || 0 : 0,
          notes: ''
        }

        if (student.name) {
          students.push(student)
        }
      }

      this.setData({
        step: 'preview',
        previewData: students.slice(0, 20),
        loading: false
      })
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: '解析失败', icon: 'error' })
    }
  },

  parseCSVLine(line) {
    const result = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    result.push(current.trim())
    return result
  },

  findColumn(headers, names) {
    for (const name of names) {
      const idx = headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()))
      if (idx > -1) return idx
    }
    return -1
  },

  // 手动导入指导
  showManualImportGuide() {
    wx.showModal({
      title: '提示',
      content: 'Excel文件(.xlsx/.xls)需要通过CSV格式导入。请将Excel另存为CSV格式后重试，或使用手动添加学生功能。',
      showCancel: false
    })
  },

  // 确认导入
  onConfirmImport() {
    const students = this.data.previewData
    if (students.length === 0) {
      wx.showToast({ title: '没有数据可导入', icon: 'error' })
      return
    }

    const count = dataApi.importStudents(students)
    this.setData({
      step: 'done',
      importCount: count
    })
    wx.showToast({ title: `成功导入${count}名学生`, icon: 'success' })
  },

  // 返回
  onBack() {
    wx.navigateBack()
  },

  // 重新导入
  onReimport() {
    this.setData({
      step: 'intro',
      fileName: '',
      previewData: [],
      importCount: 0
    })
  }
})
