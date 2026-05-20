function getFacultyPrefix(faculty) {
  const prefixes = {
    ENGINEERING: "ENG",
    ECONOMICS: "ECO",
    MEDICINE: "MED",
    SCIENCES: "SCI",
    OTHER: "GEN",
  };

  return prefixes[faculty] || "GEN";
}

function getCoursePrefix(name) {
  const prefixes = {
    SOFTWARE_ENGINEERING: "SWE",
    CIVIL_ENGINEERING: "CIV",
    COMPUTER_ENGINEERING: "CPE",
    DATA_SCIENCE: "DSC",
    ACCOUNTING: "ACC",
    FINANCE: "FIN",
    MEDICINE: "MED",
    NURSING: "NUR",
    MATHEMATICS: "MAT",
    PHYSICS: "PHY",
    OTHER: "OTH",
  };

  return prefixes[name] || "OTH";
}

function generateCourseCode({ faculty, name }) {
  return `${getFacultyPrefix(faculty)}-${getCoursePrefix(name)}`;
}

module.exports = generateCourseCode;