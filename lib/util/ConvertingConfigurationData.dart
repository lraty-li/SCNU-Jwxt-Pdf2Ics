import 'dart:async';

import 'package:flutter/cupertino.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../util/enums.dart';


/// campusId  校区ID
/// alarMinutes 提前多少分钟提醒
/// icalTitleType 日历事件标题类型
/// currentTeachingWeek 当前教学周
class ConvertingConfigurationData {


  ///校区ID
  //0 石牌
  //1 大学城
  //2 南海
  //3 汕头
  static int _campusId = 1; //校区
  static campusIdEnum campus = campusIdEnum.ShiPai;
  static late List<String> campusStrs;

  static bool ifAlarm = false;
  static int alarMinutes = 0; //提前多少分钟提醒

  //  0 课程名
  //  1 课程名+地点
  //  2 课程名+教师名称
  //  3 课程名+地点+教师名称
  static int icalTitleTypeId = 0; //日历事件标题类型
  static icalTitleTypeEnum icalTitleType = icalTitleTypeEnum.CourseTitle;
  static late List<String> icalTitleTypeStrs;

  static int currentTeachingWeek = 0; //当前教学周
  ConvertingConfigurationData() {    //keep the order
  }

  static void loadLocalization(BuildContext context) {
    //保持顺序
    campusStrs = [
      AppLocalizations.of(context)!.shiPai,
      AppLocalizations.of(context)!.daXueCheng,
      AppLocalizations.of(context)!.nanHai,
      AppLocalizations.of(context)!.shanWei
    ];
    icalTitleTypeStrs = [
      AppLocalizations.of(context)!.icalEventTitleType0,
      AppLocalizations.of(context)!.icalEventTitleType1,
      AppLocalizations.of(context)!.icalEventTitleType2,
      AppLocalizations.of(context)!.icalEventTitleType3
    ];
  }

  static Future loadPreference() async {
    final _preferences = await SharedPreferences.getInstance();

    _campusId = (_preferences.getInt('campusId') ?? 0);
    ifAlarm = ((_preferences.getInt('ifAlarm') ?? 0) == 1 ? true : false);
    alarMinutes = (_preferences.getInt('alarMinutes') ?? 0);
    icalTitleTypeId = (_preferences.getInt('icalTitleType') ?? 0);
    icalTitleType=icalTitleTypeEnum.values[icalTitleTypeId];
    currentTeachingWeek = (_preferences.getInt('currentTeachingWeek') ?? 0);
  }

  static String getToDrowDownValue(drowDownChooserWidgeTypeEnum widgetType) {
    switch (widgetType) {
      case drowDownChooserWidgeTypeEnum.campus:
        return _getCampusStr();

      case drowDownChooserWidgeTypeEnum.icalTitleType:
        return _geticalTitleType();

      default:
        //TODO change to log
        return "getDrowDownValue undefine";
    }
  }

  static void setByDrowDownValue(
      drowDownChooserWidgeTypeEnum widgetType, String newValue) {
    switch (widgetType) {
      case drowDownChooserWidgeTypeEnum.campus:
        {
          _setCampus(newValue);
          return;
        }

      case drowDownChooserWidgeTypeEnum.icalTitleType:
        {
          _seticalTitleType(newValue);
          return;
        }

      default:
        //TODO change to log
        print("setDrowDownValue undefine");
    }
  }

  static String _getCampusStr() {
    return campusStrs[_campusId];
  }

  static void _setCampus(String value) {
    _campusId = campusStrs.indexOf(value);
    _setPref("campusId", _campusId);
  }

  static String _geticalTitleType() {
    return icalTitleTypeStrs[icalTitleTypeId];
  }

  static void _seticalTitleType(String value) {
    icalTitleTypeId = icalTitleTypeStrs.indexOf(value);
    icalTitleType=icalTitleTypeEnum.values[icalTitleTypeId];
    _setPref("icalTitleType", icalTitleTypeId);
  }

  static void setAlarMinutes(int minutes) {
    alarMinutes = minutes;
    _setPref("alarMinutes", minutes);
  }

  static void setCurrentTeachingWeek(int week) {
    currentTeachingWeek = week;
    _setPref("currentTeachingWeek", week);
  }

  static void setIfAlarm(bool alarmSwitch) {
    ifAlarm = alarmSwitch;
    _setPref("ifAlarm", ifAlarm ? 1 : 0);
  }

  static Future<void> _setPref(String key, int value) async {
    final _preferences = await SharedPreferences.getInstance();
    _preferences.setInt(key, value);
    print("set $key and $value");
  }
}
