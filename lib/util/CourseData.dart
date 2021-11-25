/*
单个课程
*/
class Course {
  String name = "";
  String originDetail = "";
  String place = "";
  Map<String,String> section = new Map();
  String teacher = "";
  String day = "";
  List weeks = [];

  Course(String initName, String initOriginDetail, String initPlace,
      Map<String,String> initSection, String initTeacher, String initWeek, List initWeeks) {
    name = initName;
    originDetail = initOriginDetail;
    place = initPlace;
    section = initSection;
    teacher = initTeacher;
    day = initWeek;
    weeks = initWeeks;
  }
}

/*
  将pdfBox提取出来的单个词以及其坐标集合转换为课程对象
*/
class ClassifiedPdfData {
  List<Course> courses = [];
  String other = "";
  Map fileInfo = {
    "StudentName": "",
    "ID": "",
    "pdfPrintingTime": "",
    "Semester": ""
  };
}
