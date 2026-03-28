/**
 * 数据存储/读取封装
 */

const STUDENTS_KEY = 'students'
const RECORDS_KEY = 'records'

// ========== 学生操作 ==========

function getStudents() {
  return wx.getStorageSync(STUDENTS_KEY) || []
}

function saveStudents(students) {
  wx.setStorageSync(STUDENTS_KEY, students)
}

function getStudentById(id) {
  const students = getStudents()
  return students.find(s => s.id === id)
}

function addStudent(student) {
  const students = getStudents()
  student.id = generateId()
  student.createTime = new Date().toISOString()
  students.push(student)
  saveStudents(students)
  return student
}

function updateStudent(id, data) {
  const students = getStudents()
  const index = students.findIndex(s => s.id === id)
  if (index > -1) {
    students[index] = { ...students[index], ...data }
    saveStudents(students)
    return students[index]
  }
  return null
}

function deleteStudent(id) {
  let students = getStudents()
  students = students.filter(s => s.id !== id)
  saveStudents(students)
  // 同时删除该学生的所有记录
  let records = getRecords()
  records = records.filter(r => r.studentId !== id)
  saveRecords(records)
}

// ========== 上课记录操作 ==========

function getRecords() {
  return wx.getStorageSync(RECORDS_KEY) || []
}

function saveRecords(records) {
  wx.setStorageSync(RECORDS_KEY, records)
}

function getRecordsByStudentId(studentId) {
  const records = getRecords()
  return records.filter(r => r.studentId === studentId)
}

function getRecordsByDate(date) {
  const records = getRecords()
  return records.filter(r => r.date === date)
}

function addRecord(record) {
  const records = getRecords()
  record.id = generateId()
  records.push(record)
  saveRecords(records)
  // 更新学生已完成课时
  updateStudentLessonCount(record.studentId)
  return record
}

function deleteRecord(id) {
  const records = getRecords()
  const record = records.find(r => r.id === id)
  const newRecords = records.filter(r => r.id !== id)
  saveRecords(newRecords)
  if (record) {
    updateStudentLessonCount(record.studentId)
  }
}

function updateRecord(id, data) {
  const records = getRecords()
  const index = records.findIndex(r => r.id === id)
  if (index > -1) {
    records[index] = { ...records[index], ...data }
    saveRecords(records)
    return records[index]
  }
  return null
}

// ========== 统计 ==========

function updateStudentLessonCount(studentId) {
  const records = getRecordsByStudentId(studentId)
  const completedLessons = records.length
  const student = getStudentById(studentId)
  if (student) {
    const remainingLessons = student.purchasedLessons - completedLessons
    updateStudent(studentId, {
      completedLessons,
      remainingLessons: remainingLessons < 0 ? 0 : remainingLessons
    })
  }
}

function getMonthStats(year, month) {
  const records = getRecords()
  const students = getStudents()
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthRecords = records.filter(r => r.date.startsWith(monthPrefix))

  let totalMinutes = 0
  let totalIncome = 0

  monthRecords.forEach(r => {
    totalMinutes += r.duration || 0
    const student = students.find(s => s.id === r.studentId)
    if (student) {
      totalIncome += student.feePerLesson || 0
    }
  })

  return {
    totalStudents: students.length,
    totalLessons: monthRecords.length,
    totalMinutes,
    totalIncome
  }
}

function getStudentTotalMinutes(studentId) {
  const records = getRecordsByStudentId(studentId)
  let total = 0
  records.forEach(r => {
    total += r.duration || 0
  })
  return total
}

// ========== 工具 ==========

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

// ========== 导入导出 ==========

function exportAllData() {
  return {
    students: getStudents(),
    records: getRecords(),
    exportTime: new Date().toISOString()
  }
}

function importStudents(newStudents) {
  const existing = getStudents()
  const merged = [...existing]
  let addedCount = 0

  newStudents.forEach(s => {
    if (s.name) {
      s.id = generateId()
      s.createTime = new Date().toISOString()
      merged.push(s)
      addedCount++
    }
  })

  saveStudents(merged)
  return addedCount
}

function clearAllData() {
  wx.removeStorageSync(STUDENTS_KEY)
  wx.removeStorageSync(RECORDS_KEY)
}

module.exports = {
  getStudents,
  saveStudents,
  getStudentById,
  addStudent,
  updateStudent,
  deleteStudent,
  getRecords,
  saveRecords,
  getRecordsByStudentId,
  getRecordsByDate,
  addRecord,
  deleteRecord,
  updateRecord,
  updateStudentLessonCount,
  getMonthStats,
  getStudentTotalMinutes,
  exportAllData,
  importStudents,
  clearAllData
}
