const dataApi = require('../../utils/data')
const util = require('../../utils/util')

Page({
  data: {
    isEdit: false,
    editId: '',
    name: '',
    phone: '',
    age: '',
    feePerLesson: 200,
    feeOptions: util.FEE_OPTIONS,
    projects: [],
    projectOptions: util.PROJECTS,
    scheduleDays: [],
    weekDays: util.getWeekDays(),
    purchasedLessons: 0,
    notes: ''
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, editId: options.id })
      this.loadStudent(options.id)
    }
  },

  loadStudent(id) {
    const student = dataApi.getStudentById(id)
    if (student) {
      this.setData({
        name: student.name || '',
        phone: student.phone || '',
        age: student.age || '',
        feePerLesson: student.feePerLesson || 200,
        projects: student.projects || [],
        scheduleDays: student.scheduleDays || [],
        purchasedLessons: student.purchasedLessons || 0,
        notes: student.notes || ''
      })
    }
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  onAgeInput(e) {
    this.setData({ age: e.detail.value })
  },

  onFeeSelect(e) {
    const fee = e.currentTarget.dataset.fee
    this.setData({ feePerLesson: fee })
  },

  onProjectToggle(e) {
    const project = e.currentTarget.dataset.project
    let projects = [...this.data.projects]
    const index = projects.indexOf(project)
    if (index > -1) {
      projects.splice(index, 1)
    } else {
      projects.push(project)
    }
    this.setData({ projects })
  },

  onDayToggle(e) {
    const day = parseInt(e.currentTarget.dataset.day)
    let scheduleDays = [...this.data.scheduleDays]
    const index = scheduleDays.indexOf(day)
    if (index > -1) {
      scheduleDays.splice(index, 1)
    } else {
      scheduleDays.push(day)
    }
    scheduleDays.sort()
    this.setData({ scheduleDays })
  },

  onPurchasedInput(e) {
    this.setData({ purchasedLessons: parseInt(e.detail.value) || 0 })
  },

  onNotesInput(e) {
    this.setData({ notes: e.detail.value })
  },

  onSave() {
    if (!this.data.name.trim()) {
      wx.showToast({ title: '请输入学生姓名', icon: 'error' })
      return
    }

    const studentData = {
      name: this.data.name.trim(),
      phone: this.data.phone.trim(),
      age: this.data.age,
      feePerLesson: this.data.feePerLesson,
      projects: this.data.projects,
      scheduleDays: this.data.scheduleDays,
      purchasedLessons: this.data.purchasedLessons,
      completedLessons: 0,
      remainingLessons: this.data.purchasedLessons,
      notes: this.data.notes.trim()
    }

    if (this.data.isEdit) {
      // 编辑模式：保留已上课时
      const existing = dataApi.getStudentById(this.data.editId)
      if (existing) {
        studentData.completedLessons = existing.completedLessons || 0
        studentData.remainingLessons = studentData.purchasedLessons - studentData.completedLessons
        if (studentData.remainingLessons < 0) studentData.remainingLessons = 0
        studentData.createTime = existing.createTime
      }
      dataApi.updateStudent(this.data.editId, studentData)
      wx.showToast({ title: '已更新', icon: 'success' })
    } else {
      dataApi.addStudent(studentData)
      wx.showToast({ title: '已添加', icon: 'success' })
    }

    setTimeout(() => wx.navigateBack(), 1500)
  }
})
