const dataApi = require('../../utils/data')
const util = require('../../utils/util')

Page({
  data: {
    students: [],
    stats: {
      totalStudents: 0,
      totalLessons: 0,
      totalIncome: 0
    }
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  onPullDownRefresh() {
    this.loadData()
    wx.stopPullDownRefresh()
  },

  loadData() {
    const students = dataApi.getStudents()
    const sorted = util.sortStudentsByRemaining(students)

    // 转换上课日显示
    const displayStudents = sorted.map(s => {
      const remaining = s.remainingLessons !== undefined ? s.remainingLessons : (s.purchasedLessons - s.completedLessons)
      return {
        ...s,
        remainingLessons: remaining < 0 ? 0 : remaining,
        scheduleDaysStr: util.getScheduleDayNames(s.scheduleDays)
      }
    })

    const now = new Date()
    const stats = dataApi.getMonthStats(now.getFullYear(), now.getMonth())

    this.setData({
      students: displayStudents,
      stats: {
        totalStudents: stats.totalStudents,
        totalLessons: stats.totalLessons,
        totalIncome: stats.totalIncome
      }
    })
  },

  onStudentTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/student-detail/student-detail?id=${id}`
    })
  },

  onAddStudent() {
    wx.navigateTo({
      url: '/pages/add-student/add-student'
    })
  },

  onImport() {
    wx.navigateTo({
      url: '/pages/import/import'
    })
  },

  onCalendarView() {
    wx.navigateTo({
      url: '/pages/calendar-view/calendar-view'
    })
  },

  onSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  }
})
