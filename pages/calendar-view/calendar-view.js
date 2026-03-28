const dataApi = require('../../utils/data')
const util = require('../../utils/util')

Page({
  data: {
    studentId: '',
    student: null,
    year: new Date().getFullYear(),
    month: new Date().getMonth(), // 0-11
    monthLabel: '',
    calendarDays: [],
    weekHeaders: ['一', '二', '三', '四', '五', '六', '日'],
    recordDates: {},
    selectedDate: '',
    selectedRecords: [],
    filteredRecords: [],
    // 分页
    pageSize: 10,
    currentPage: 0,
    totalPages: 0,
    pagedRecords: [],
    // 筛选
    projectFilter: '',
    projectOptions: ['全部', ...util.PROJECTS],
    projectIndex: 0
  },

  onLoad(options) {
    if (options.studentId) {
      this.setData({ studentId: options.studentId })
      const student = dataApi.getStudentById(options.studentId)
      this.setData({ student })
    }

    this.buildCalendar()
  },

  buildCalendar() {
    const { year, month, studentId, projectFilter } = this.data
    const days = util.getCalendarDays(year, month)
    const monthLabel = `${year}年${month + 1}月`

    // 获取本月有记录的日期
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
    let allRecords = studentId
      ? dataApi.getRecordsByStudentId(studentId)
      : dataApi.getRecords()

    // 项目筛选
    if (projectFilter && projectFilter !== '全部') {
      allRecords = allRecords.filter(r => r.project === projectFilter)
    }

    const monthRecords = allRecords.filter(r => r.date.startsWith(monthPrefix))

    // 构建日期-记录数映射
    const recordDates = {}
    monthRecords.forEach(r => {
      if (!recordDates[r.date]) {
        recordDates[r.date] = 0
      }
      recordDates[r.date]++
    })

    // 标记有记录的日期
    const calendarDays = days.map(d => {
      if (d.date && recordDates[d.date]) {
        return { ...d, hasRecords: true, count: recordDates[d.date] }
      }
      return { ...d, hasRecords: false }
    })

    this.setData({
      calendarDays,
      monthLabel,
      recordDates,
      selectedDate: '',
      selectedRecords: [],
      pagedRecords: [],
      currentPage: 0,
      totalPages: 0
    })
  },

  onPrevMonth() {
    let { year, month } = this.data
    month--
    if (month < 0) {
      month = 11
      year--
    }
    this.setData({ year, month })
    this.buildCalendar()
  },

  onNextMonth() {
    let { year, month } = this.data
    month++
    if (month > 11) {
      month = 0
      year++
    }
    this.setData({ year, month })
    this.buildCalendar()
  },

  onDayTap(e) {
    const date = e.currentTarget.dataset.date
    if (!date) return

    const { studentId, projectFilter } = this.data
    let records = studentId
      ? dataApi.getRecordsByStudentId(studentId)
      : dataApi.getRecords()

    let dayRecords = records.filter(r => r.date === date)

    if (projectFilter && projectFilter !== '全部') {
      dayRecords = dayRecords.filter(r => r.project === projectFilter)
    }

    // 格式化
    const students = dataApi.getStudents()
    dayRecords.forEach(r => {
      r.durationStr = util.formatDuration(r.duration)
      if (!studentId) {
        const s = students.find(st => st.id === r.studentId)
        r.studentName = s ? s.name : '未知学生'
      }
    })

    dayRecords.sort((a, b) => (a.time || '').localeCompare(b.time || ''))

    const totalPages = Math.ceil(dayRecords.length / this.data.pageSize) || 1

    this.setData({
      selectedDate: date,
      selectedRecords: dayRecords,
      filteredRecords: dayRecords,
      currentPage: 0,
      totalPages: totalPages,
      pagedRecords: dayRecords.slice(0, this.data.pageSize)
    })
  },

  // 分页
  onPrevPage() {
    const { currentPage, filteredRecords, pageSize } = this.data
    if (currentPage > 0) {
      const newPage = currentPage - 1
      this.setData({
        currentPage: newPage,
        pagedRecords: filteredRecords.slice(newPage * pageSize, (newPage + 1) * pageSize)
      })
    }
  },

  onNextPage() {
    const { currentPage, filteredRecords, pageSize, totalPages } = this.data
    if (currentPage < totalPages - 1) {
      const newPage = currentPage + 1
      this.setData({
        currentPage: newPage,
        pagedRecords: filteredRecords.slice(newPage * pageSize, (newPage + 1) * pageSize)
      })
    }
  },

  // 项目筛选
  onProjectFilter(e) {
    const index = parseInt(e.detail.value)
    const project = this.data.projectOptions[index]
    this.setData({
      projectIndex: index,
      projectFilter: project === '全部' ? '' : project
    })
    this.buildCalendar()
    // 如果有选中日期，重新加载
    if (this.data.selectedDate) {
      this.onDayTap({ currentTarget: { dataset: { date: this.data.selectedDate } } })
    }
  }
})
