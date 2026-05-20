function generateCourseOfferingCode({ courseCode, academicYear, semester }) {
  return `${courseCode}-${academicYear}-${semester}`;
}

module.exports = generateCourseOfferingCode;