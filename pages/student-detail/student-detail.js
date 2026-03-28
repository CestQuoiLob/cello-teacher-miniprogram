const dataApi = require('../../utils/data')
const util = require('../../utils/util')

Page({
  data: {
    student: null,
    records: [],
    scheduleDaysStr: '',
    totalMinutes: 0,
    totalMinutesStr: '',
    showRemainingModal: false,
    editRemaining: 0,
    showCompletedModal: false,
    editCompleted: 0,
    deleteRecordId: ''
  },

  studentId: '',

  onLoad(options) {
    this.studentId = options.id
  },

  onShow() {
    this.loadStudentData()
  },

  loadStudentData() {
    const student = dataApi.getStudentById(this.studentId)
    if (!student) {
      wx.showToast({ title: '学生不存在', icon: 'error' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    const records = dataApi.getRecordsByStudentId(this.studentId)
    records.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date)
      return (b.time || '').localeCompare(a.time || '')
    })

    // 格式化每条记录的时长显示
    records.forEach(r => {
      r.durationStr = util.formatDuration(r.duration)
      r.slideLeft = 0
    })

    const totalMinutes = dataApi.getStudentTotalMinutes(this.studentId)

    this.setData({
      student: {
        ...student,
        remainingLessons: student.remainingLessons !== undefined ? student.remainingLessons : (student.purchasedLessons - student.completedLessons)
      },
      records: records,
      scheduleDaysStr: util.getScheduleDayNames(student.scheduleDays),
      totalMinutes: totalMinutes,
      totalMinutesStr: util.formatDuration(totalMinutes)
    })
  },

  // 编辑学生
  onEditStudent() {
    wx.navigateTo({
      url: `/pages/add-student/add-student?id=${this.studentId}`
    })
  },

  // 添加记录
  onAddRecord() {
    wx.navigateTo({
      url: `/pages/add-record/add-record?studentId=${this.studentId}`
    })
  },

  // 月历视图
  onCalendarView() {
    wx.navigateTo({
      url: `/pages/calendar-view/calendar-view?studentId=${this.studentId}`
    })
  },

  // 编辑剩余课时
  onEditRemaining() {
    this.setData({
      showRemainingModal: true,
      editRemaining: this.data.student.remainingLessons
    })
  },

  onRemainingInput(e) {
    this.setData({
      editRemaining: parseInt(e.detail.value) || 0
    })
  },

  onCancelRemaining() {
    this.setData({ showRemainingModal: false })
  },

  onConfirmRemaining() {
    const remaining = this.data.editRemaining
    dataApi.updateStudent(this.studentId, { remainingLessons: remaining })
    this.setData({ showRemainingModal: false })
    this.loadStudentData()
    wx.showToast({ title: '已更新', icon: 'success' })
  },

  // 编辑已上课时
  onEditCompleted() {
    this.setData({
      showCompletedModal: true,
      editCompleted: this.data.student.completedLessons
    })
  },

  onCompletedInput(e) {
    this.setData({
      editCompleted: parseInt(e.detail.value) || 0
    })
  },

  onCancelCompleted() {
    this.setData({ showCompletedModal: false })
  },

  onConfirmCompleted() {
    const completed = this.data.editCompleted
    const student = this.data.student
    dataApi.updateStudent(this.studentId, {
      completedLessons: completed,
      remainingLessons: student.purchasedLessons - completed
    })
    this.setData({ showCompletedModal: false })
    this.loadStudentData()
    wx.showToast({ title: '已更新', icon: 'success' })
  },

  // 滑动删除记录
  onRecordTouchStart(e) {
    const index = e.currentTarget.dataset.index
    this.touchStartX = e.touches[0].clientX
    this.touchStartY = e.touches[0].clientY
    this.touchIndex = index
    this.isHorizontalSwipe = null

    // 重置其他已展开的项
    const records = this.data.records
    records.forEach((r, i) => {
      if (i !== index && r.slideLeft > 0) {
        this.setData({ [`records[${i}].slideLeft`]: 0 })
      }
    })
  },

  onRecordTouchMove(e) {
    const moveX = e.touches[0].clientX
    const moveY = e.touches[0].clientY
    const diffX = this.touchStartX - moveX
    const diffY = Math.abs(this.touchStartY - moveY)

    // 判断是否为水平滑动（避免与页面纵向滚动冲突）
    if (this.isHorizontalSwipe === null && (Math.abs(diffX) > 5 || diffY > 5)) {
      this.isHorizontalSwipe = Math.abs(diffX) > diffY
    }

    if (!this.isHorizontalSwipe) return

    const index = this.touchIndex
    if (diffX > 0) {
      this.setData({
        [`records[${index}].slideLeft`]: Math.min(diffX, 150),
        [`records[${index}].sliding`]: true
      })
    }
  },

  onRecordTouchEnd(e) {
    const index = this.touchIndex
    if (!this.isHorizontalSwipe) return

    const record = this.data.records[index]
    if (record.slideLeft > 80) {
      this.setData({
        [`records[${index}].slideLeft`]: 150,
        [`records[${index}].sliding`]: false
      })
    } else {
      this.setData({
        [`records[${index}].slideLeft`]: 0,
        [`records[${index}].sliding`]: false
      })
    }
  },

  onDeleteRecord(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条上课记录吗？',
      success: (res) => {
        if (res.confirm) {
          dataApi.deleteRecord(id)
          this.loadStudentData()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  // 删除学生
  onDeleteStudent() {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除学生「${this.data.student.name}」及其所有上课记录吗？此操作不可恢复。`,
      confirmColor: '#E74C3C',
      success: (res) => {
        if (res.confirm) {
          dataApi.deleteStudent(this.studentId)
          wx.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 1500)
        }
      }
    })
  }
})
