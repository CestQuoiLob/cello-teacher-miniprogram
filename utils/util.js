/**
 * 工具函数
 */

const DAY_NAMES = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
const PROJECTS = ['陪练', '专业课', '上课', '乐理']
const FEE_OPTIONS = [200, 400, 450, 500, 600]
const DURATION_OPTIONS = [
  { value: 45, label: '45分钟' },
  { value: 60, label: '1小时' },
  { value: 90, label: '1.5小时' },
  { value: 120, label: '2小时' }
]

function formatDate(date) {
  if (typeof date === 'string') return date
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatTime(time) {
  return time || ''
}

function getDayName(day) {
  return DAY_NAMES[day] || ''
}

function getScheduleDayNames(scheduleDays) {
  if (!scheduleDays || !scheduleDays.length) return '未设置'
  return scheduleDays.map(d => DAY_NAMES[d]).join('、')
}

function getWeekDays() {
  return [
    { value: 1, label: '周一' },
    { value: 2, label: '周二' },
    { value: 3, label: '周三' },
    { value: 4, label: '周四' },
    { value: 5, label: '周五' },
    { value: 6, label: '周六' },
    { value: 7, label: '周日' }
  ]
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}小时`
  return `${h}小时${m}分钟`
}

function getNowDate() {
  return formatDate(new Date())
}

function getNowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getCalendarDays(year, month) {
  // month: 0-11
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekDay = firstDay.getDay() // 0=周日
  const daysInMonth = lastDay.getDate()

  const days = []
  // 填充前面的空白 (转换为周一为起始)
  const offset = startWeekDay === 0 ? 6 : startWeekDay - 1
  for (let i = 0; i < offset; i++) {
    days.push({ day: null, date: null })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({ day: d, date: dateStr })
  }
  return days
}

function getCurrentWeekSchedule(scheduleDays) {
  if (!scheduleDays || !scheduleDays.length) return []
  const today = new Date()
  const currentDay = today.getDay() // 0=周日
  const currentDayMapped = currentDay === 0 ? 7 : currentDay

  const result = []
  scheduleDays.forEach(d => {
    if (d >= currentDayMapped) {
      result.push(DAY_NAMES[d])
    }
  })
  return result
}

function sortStudentsByRemaining(students) {
  return [...students].sort((a, b) => {
    const ra = a.remainingLessons !== undefined ? a.remainingLessons : (a.purchasedLessons - a.completedLessons)
    const rb = b.remainingLessons !== undefined ? b.remainingLessons : (b.purchasedLessons - b.completedLessons)
    return ra - rb
  })
}

function formatIncome(amount) {
  return `¥${amount.toFixed(0)}`
}

function parseExcelDate(value) {
  // 处理 Excel 日期序列号
  if (typeof value === 'number') {
    const utcDays = Math.floor(value - 25569)
    const utcValue = utcDays * 86400
    const dateInfo = new Date(utcValue * 1000)
    return formatDate(dateInfo)
  }
  return value
}

module.exports = {
  DAY_NAMES,
  PROJECTS,
  FEE_OPTIONS,
  DURATION_OPTIONS,
  formatDate,
  formatTime,
  getDayName,
  getScheduleDayNames,
  getWeekDays,
  formatDuration,
  getNowDate,
  getNowTime,
  getCalendarDays,
  getCurrentWeekSchedule,
  sortStudentsByRemaining,
  formatIncome,
  parseExcelDate
}
