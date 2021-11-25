import '../util/CourseData.dart';
import '../util/ConvertingConfigurationData.dart';
import 'package:enough_icalendar/enough_icalendar.dart';
import 'package:uuid/uuid.dart';
import '../util/enums.dart';

class IcalGenerator {
  IcalGenerator() {
    _currTeachingWeek = ConvertingConfigurationData.currentTeachingWeek;
    _campus = ConvertingConfigurationData.campus;
    _icalTitleType = ConvertingConfigurationData.icalTitleType;
    _alarMinutes = ConvertingConfigurationData.alarMinutes;
    _ifSetAlarm = ConvertingConfigurationData.ifAlarm;
  }

  late campusIdEnum _campus;
  late icalTitleTypeEnum _icalTitleType;
  late int _currTeachingWeek;
  late final _alarMinutes;
  late final _ifSetAlarm;

  // TODO 留学生课表
  // TODO doc google 日历 就算导出时间再导入，提醒都无法生效
  static const Map<String, weekDay> _weekDayMap = {
    "星期一": weekDay.monday,
    "星期二": weekDay.tuesday,
    "星期三": weekDay.wednesday,
    "星期四": weekDay.thursday,
    "星期五": weekDay.friday,
    "星期六": weekDay.saturday,
    "星期日": weekDay.sunday
  };
  static const Set<Set> _Schdule_ShiPai_ShanWei = {
    {},
    {8, 30},
    {9, 20},
    {10, 20},
    {11, 10},
    {14, 30},
    {15, 20},
    {16, 10},
    {17, 0},
    {19, 0},
    {19, 50},
    {20, 40},
    {21, 30}
  };
  static const Set<Set> _Schdule_HEMC_NanHai = {
    {},
    {8, 30},
    {9, 20},
    {10, 20},
    {11, 10},
    {14, 0},
    {14, 50},
    {15, 40},
    {16, 30},
    {19, 0},
    {19, 50},
    {20, 40},
    {21, 30}
  };

  /// 根据分类后的课表数据，返回Vcalendar对象。
  VCalendar generate(ClassifiedPdfData courseData) {
    late VEvent event;
    late DateTime courseTimeDateStart;
    late DateTime courseTimeDateEnd;
    int teachingweekSum = 0;
    var dateTime = DateTime.now();
    final dateTimeUtcString = dateTime.toUtc().toString();

    var uuidGenrator = Uuid();
    final icalText = '''BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//LXJNB//pdf2ical_SCNU_Flutter//CN
CALSCALE:GREGORIAN
BEGIN:VTIMEZONE
TZID:Asia/Hong_Kong
LAST-MODIFIED:${dateTimeUtcString.substring(0, 4)}${dateTimeUtcString.substring(5, 7)}${dateTimeUtcString.substring(8, 10)}T${dateTimeUtcString.substring(11, 13)}${dateTimeUtcString.substring(14, 16)}${dateTimeUtcString.substring(17, 19)}Z
TZURL:http://tzurl.org/zoneinfo-outlook/Asia/Shanghai
X-LIC-LOCATION:Asia/Hong_Kong
BEGIN:DAYLIGHT
DTSTART:19700101T000000
TZOFFSETFROM:+0800
TZOFFSETTO:+0800
TZNAME:CST
END:DAYLIGHT
BEGIN:STANDARD
TZNAME:CST
TZOFFSETFROM:+0800
TZOFFSETTO:+0800
DTSTART:19700101T000000
END:STANDARD
END:VTIMEZONE
END:VCALENDAR''';

    final alarmText = '''BEGIN:VALARM
TRIGGER:-PT${_alarMinutes}M
ACTION:DISPLAY
END:VALARM
''';

    final calendar = VComponent.parse(icalText) as VCalendar;
    final alarm = VComponent.parse(alarmText) as VAlarm;

    //确定具体使用哪个校区的课程安排
    var schdule = _Schdule_ShiPai_ShanWei;
    if (_campus == campusIdEnum.HEMC && _campus == campusIdEnum.NanHai) {
      schdule = _Schdule_HEMC_NanHai;
    }

    courseData.courses.forEach((course) {
      //"1-2"
      var courseSectionStart = int.parse(course.section['Start'] as String);
      var courseSectionEnd = int.parse(course.section['End'] as String);

      //确定事件标题类型
      String summaryText = course.name;
      switch (_icalTitleType) {
        case icalTitleTypeEnum.CourseTitle:
          {
            break;
          }
        case icalTitleTypeEnum.CourseTitle_Location:
          {
            summaryText = "$summaryText ${course.place}";
            break;
          }
        case icalTitleTypeEnum.CourseTitle_TeacherName:
          {
            summaryText = "$summaryText ${course.teacher}";
            break;
          }
        case icalTitleTypeEnum.CourseTitle_Location_TeacherName:
          {
            summaryText = "$summaryText ${course.place} ${course.teacher}";
            break;
          }
      }
      //教学周有间断的课程将分为两个事件
      course.weeks.forEach((courseWeek) {
        if (courseWeek['End'] != "") {
          teachingweekSum =
              int.parse(courseWeek['End']) - int.parse(courseWeek['Start']) + 1;
        }
        dateTime = DateTime.now();
        //回到课程开始那周的那天
        dateTime = dateTime.add(Duration(
            days: -dateTime.weekday +
                (int.parse(courseWeek['Start']) - _currTeachingWeek) * 7 +
                _weekDayMap[course.day]!.index));

        //courseSectionStart =1  -> courseSectionStartSet={8,30}
        // var courseSectionStartSet = schdule.elementAt(courseSectionStart);
        courseTimeDateStart = new DateTime(
            dateTime.year,
            dateTime.month,
            dateTime.day,
            schdule.elementAt(courseSectionStart).elementAt(0),
            schdule.elementAt(courseSectionStart).elementAt(1));

        courseTimeDateEnd = new DateTime(
            dateTime.year,
            dateTime.month,
            dateTime.day,
            schdule.elementAt(courseSectionEnd).elementAt(0),
            schdule.elementAt(courseSectionEnd).elementAt(1));
        //下课时间
        courseTimeDateEnd = courseTimeDateEnd.add(Duration(minutes: 40));

        //前往课程结束后一天
        dateTime =
            dateTime.add(Duration(days: ((teachingweekSum - 1) * 7) + 1));

        event = VEvent();
        event
          ..summary = summaryText
          ..start = courseTimeDateStart
          ..end = courseTimeDateEnd
          ..location = course.place
          ..recurrenceRule = Recurrence(RecurrenceFrequency.weekly,
              until: dateTime,
              byWeekDay: [ByDayRule(_weekDayMap[course.day]!.index)])
          ..description = course.originDetail
          ..uid = uuidGenrator.v4()
          ..timeStamp = dateTime;

        if (_ifSetAlarm) {
          alarm.description = course.name;
          event.children.add(VComponent.parse(alarm.toString()) as VAlarm);
        }

        //extension
        // event.children.add(new VAlarm.copyFrom());
        calendar.children.add(event);
      });
    });

    // inspect(calendar);
    // print(calendar);
    return calendar;
  }
}
