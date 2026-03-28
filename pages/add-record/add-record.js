const dataApi = require('../../utils/data')
const util = require('../../utils/util')

Page({
  data: {
    isEdit: false,
    editId: '',
    students: [],
    studentIndex: -1,
    studentId: '',
    date: '',
    time: '',
    duration: 60,
    durationOptions: util.DURATION_OPTIONS,
    project: '',
    projectOptions: util.PROJECTS,
    isAdjusted: false,
    originalDate: '',
    notes: ''
  },

  onLoad(options) {
    const students = dataApi.getStudents()
    const today = util.getNowDate()
    const nowTime = util.getNowTime()

    this.setData({
      students: students,
      date: today,
      time: nowTime
    })

    // 从学生详情进入时自动选择
    if (options.studentId) {
      const index = students.findIndex(s => s.id === options.studentId)
      if (index > -1) {
        this.setData({
          studentIndex: index,
          studentId: options.studentId
        })
        // 自动选择第一个项目
        const student = students[index]
        if (student.projects && student.projects.length > 0) {
          this.setData({ project: student.projects[0] })
        }
      }
    }

    // 编辑模式
    if (options.id) {
      this.setData({ isEdit: true, editId: options.id })
      this.loadRecord(options.id)
    }
  },

  loadRecord(id) {
    const records = dataApi.getRecords()
    const record = records.find(r => r.id === id)
    if (record) {
      const studentIndex = this.data.students.findIndex(s => s.id === record.studentId)
      this.setData({
        studentId: record.studentId,
        studentIndex: studentIndex,
        date: record.date,
        time: record.time,
        duration: record.duration,
        project: record.project,
        isAdjusted: record.type === 'adjusted',
        originalDate: record.originalDate || '',
        notes: record.notes || ''
      })
    }
  },

  onStudentChange(e) {
    const index = e.detail.value
    const student = this.data.students[index]
    this.setData({
      studentIndex: index,
      studentId: student.id
    })
    // 自动选择第一个项目
    if (student.projects && student.projects.length > 0) {
      this.setData({ project: student.projects[0] })
    }
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value })
  },

  onTimeChange(e) {
    this.setData({ time: e.detail.value })
  },

  onDurationSelect(e) {
    const duration = parseInt(e.currentTarget.dataset.duration)
    this.setData({ duration })
  },

  onProjectSelect(e) {
    const project = e.currentTarget.dataset.project
    this.setData({ project })
  },

  onAdjustedChange(e) {
    const isAdjusted = e.detail.value.indexOf('adjusted') > -1
    this.setData({
      isAdjusted: isAdjusted,
      originalDate: isAdjusted ? this.data.originalDate || this.data.date : ''
    })
  },

  onOriginalDateChange(e) {
    this.setData({ originalDate: e.detail.value })
  },

  onNotesInput(e) {
    this.setData({ notes: e.detail.value })
  },

  onSave() {
    if (!this.data.studentId) {
      wx.showToast({ title: '请选择学生', icon: 'error' })
      return
    }
    if (!this.data.project) {
      wx.showToast({ title: '请选择课程项目', icon: 'error' })
      return
    }

    const recordData = {
      studentId: this.data.studentId,
      date: this.data.date,
      time: this.data.time,
      duration: this.data.duration,
      project: this.data.project,
      type: this.data.isAdjusted ? 'adjusted' : 'normal',
      originalDate: this.data.isAdjusted ? this.data.originalDate : '',
      notes: this.data.notes.trim()
    }

    if (this.data.isEdit) {
      dataApi.updateRecord(this.data.editId, recordData)
      dataApi.updateStudentLessonCount(this.data.studentId)
      wx.showToast({ title: '已更新', icon: 'success' })
    } else {
      dataApi.addRecord(recordData)
      wx.showToast({ title: '已添加', icon: 'success' })
    }

    setTimeout(() => wx.navigateBack(), 1500)
  }
})
