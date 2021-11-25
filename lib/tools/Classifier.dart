import 'dart:core';
import '../util/CourseData.dart';

/*
  根据字符坐标json数据归类出课程数据，用于生成ical文件
 */

class Classifier {
  static final Map<RegExp, Map<String, String>> regExpStrs = {
    //TODO
    //#: 实践 &: 实验 *: 理论 匹配为Rubbish
    //是否添加类型标注
    new RegExp(r"学年"): {"type": "Semester"},
    new RegExp(r"学号"): {"type": "Num"},
    new RegExp(r"课表"): {"type": "Name"},
    new RegExp(r"打印时间"): {"type": "Print"},
    new RegExp(r"其他|\/无"): {"type": "Other"},
    new RegExp(r"星期"): {"type": "ClassWeek"},
    new RegExp(r"^\d+-\d+"): {"type": "ClassSection"},
    new RegExp(r"周数"): {"type": "ClassMsg"},
    new RegExp(r".*?[#&*]$"): {"type": "ClassMsg"}
  };
  static final regExpStrsKeys = regExpStrs.keys.toList();
  static final Map regExpMsgStep2 = {
    "Name": new RegExp(r"(.*?)课表"),
    "Num": new RegExp(r"(\d+)"),
    "Print": new RegExp(r"([\d\-]+)")
  };
  static final Map regExpMsgStep3 = {
    "int": new RegExp(r"\d+"),
    "Section": new RegExp(r"([0-9]){1,2}-([0-9]){1,2}节"),
    "Weeks": new RegExp(r"([0-9]){1,2}-([0-9]){1,2}周"),
    "weekStr": new RegExp(r"周数.*?地点"),
    "Place": new RegExp(r"地点[:：\s]+?(.+?)\s"),
    "Teacher": new RegExp(r"教师[:：\s]+?(.+?)\s")
  };

  Classifier();

/*
    判断该字符串属于哪一类的信息
    参数: 待判断字符串
    返回值：类型的字符串
*/
  String? _whatTypeItIs(String str) {
    String? returnTypeStr = "Rubbish";
    for (final element in regExpStrsKeys) {
      if (element.hasMatch(str)) {
        returnTypeStr = regExpStrs[element]!["type"];
        break;
      }
    }
    return returnTypeStr;
  }

/*
  根据x坐标获取星期几，用于表格型课表
  参数1:x坐标的字符串
  参数2：存储星期几及其x坐标的列表，eg:[["285.6504", "星期一"]...]
  返回值：星期*字符串
*/
  String _getWeekStrByX(double x, List classWeek) {
    // double xNumber = double.parse(x);
    var i = classWeek.length - 1;
    for (; i >= 0; --i) {
      if (classWeek[i][0] < x) break;
    }
    return classWeek[i + 1][1];
  }

/*
  根据“误差值” 判断 a b 是否相等（足够近，同属于某一个课程）
  参数1：数值a
  参数2：数值b
  参数3：可接受范围，“误差值”
  返回值：是否相等
*/
  bool _areTheyEqual(double a, double b, double deviation) {
    return !((a - b).abs() > deviation);
  }

/*
  将传入的初步提取的pdf信息分类为各个课程的信息
  参数：pdf数据,[{x,y,str},{x,y,str}......]
  返回值: 归类后的课程信息
*/
  ClassifiedPdfData classify(List<dynamic> pdfRaw) {
    var pdfRawLength = pdfRaw.length;
    print("pdfRawLength: " + pdfRawLength.toString());
    ClassifiedPdfData pdfData = new ClassifiedPdfData();

    Map msgStep1 = Map();
    Map msgStep2 = {
      "Student": {},
      "Time": {
        "Print": "Null"
      }, //打印信息在表尾，如果获取的Data信息不完整那很大可能被略掉，所以在这补上一个键值对(强迫症
      "ClassWeek": [],
      "ClassSection": [],
      "ClassMsg": [],
      "Other": "",
      "Rubbish": [],
    };
    List msgStep3 = []; //存放课的信息：[{"Name":str,"Week":str,...},{...},...]

    /*****************************************【第一步】*****************************************/
    for (var i = 0; i < pdfRawLength; ++i) {
      if (i > 200) //课表信息再离谱也不会超过200个元素。初步排除
        return pdfData;

      var x = double.parse(pdfRaw[i]['x']);
      var y = double.parse(pdfRaw[i]['y']);
      var str = pdfRaw[i]['str'];
      msgStep1[x] ??= [];
      // if (msgStep1[x] == null) msgStep1[x] = [];
      msgStep1[x].add([y, str]);
    }
    //根据键排序msgStep1
    Map msgStep1Copy = new Map();
    var msgStep1SortedKeys = msgStep1.keys.toList()..sort();
    String _strTemp = "";
    msgStep1SortedKeys.forEach((element) {
      msgStep1Copy[element] = msgStep1[element];
      //排序msgStep1同时,判断某一x值的整一列属于哪个类型，并向msgStep2写入部分信息。
      _strTemp = msgStep1[element][0][1];
      var typeOfStr = _whatTypeItIs(_strTemp);
      switch (typeOfStr) {
        case "Name":
          msgStep2["Student"]["Name"] =
              regExpMsgStep2["Name"].firstMatch(_strTemp).group(1);
          break;
        case "Num":
          msgStep2["Student"]["Num"] =
              regExpMsgStep2["Num"].firstMatch(_strTemp).group(1);
          break;
        case "Print":
          msgStep2["Time"]["Print"] =
              regExpMsgStep2["Print"].firstMatch(_strTemp).group(1);
          break;
        case "Semester":
          msgStep2["Time"]["Semester"] = _strTemp;
          break;
        case "Other":
          {
            for (var j = 0; j < msgStep1[element].length; ++j)
              msgStep2["Other"] += msgStep1[element][j][1];
            break;
          }
        default:
          {
            msgStep2[typeOfStr].add([element, msgStep1[element]]);
            break;
          }
      }
    });
    msgStep1 = new Map.of(msgStep1Copy);

    if ((msgStep2["Student"]["Name"] == null &&
        msgStep2["Student"]["Num"] == null)) //二次排除，非课表pdf
      return pdfData;

    /*****************************************【第三步】*****************************************/
    var scheduvarype = "Table"; //课表类型-表格
    if (msgStep2["ClassSection"].length != 0) //列表型课表
      scheduvarype = "List";

    /*
        将detail的信息处理为键值对并存放在字典dict中
        参数1: 课程的某一详情信息，星期或地点等。 eg:{Name: "数据库系统原理*", Section: {…}, Week: "星期一", OriginDetail: "周数: 1-16周  地点: 北603  教
        参数2:存放各课程信息的字典数组中的某一个字典，msg_step3中的某一项（字典）。
        返回值：无
    */
    void getMsgFromDetail(detail, dict) {
      _strTemp = "";
      List weeks = [];
      List section = [];
      List listTemp = [];
      if (detail.length == 0) return;
      dict["OriginDetail"] = detail;
      dict["Weeks"] = [];

      //记录周数，开始周与结束周，注意有可能间断，例如：1-11周，13-17周
      listTemp =
          regExpMsgStep3["Weeks"].allMatches(detail).map((e) => e[0]).toList();
      listTemp.forEach((element) {
        weeks.add(regExpMsgStep3["int"]
            .allMatches(element)
            .map((m) => m[0])
            .toList());
      });
      for (var i = 0; i < weeks.length; i ++)
        dict["Weeks"].add({"Start": weeks[i][0], "End": weeks[i][1]});

      if (scheduvarype == "Table") {
        //表格型课表
        detail = detail.split("/");
        listTemp = regExpMsgStep3["Section"]
            .allMatches(detail[0])
            .map((e) => e[0])
            .toList();
        listTemp.forEach((element) {
          section.add(regExpMsgStep3["int"]
              .allMatches(element)
              .map((e) => e[0])
              .toList());
        });

        if (dict["Section"] == null) dict["Section"] = new Map();
        for (var i = 0; i < section.length; i += 2)
          dict["Section"]
              .addAll({"Start": section[i][0], "End": section[i][1]});

        dict["Place"] = detail[1];
        dict["Teacher"] = detail[2];
      } else {
        //列表型课表
        dict["Place"] = regExpMsgStep3["Place"].firstMatch(detail).group(1);
        dict["Teacher"] = regExpMsgStep3["Teacher"].firstMatch(detail).group(1);
      }
    }

    if (scheduvarype == "Table") {
      //【表格型课表】
      var classWeek = []; //[[x,str],[x,str],...]
      for (var i = 0; i < msgStep2["ClassWeek"].length; ++i) {
        var item = msgStep2["ClassWeek"][i];
        //[x坐标,星期*]
        classWeek.add([item[0], item[1][0][1]]);
      }

      for (var i = msgStep2["ClassMsg"].length - 1; i >= 0; --i) {
        var item = msgStep2["ClassMsg"][i];
        var week = _getWeekStrByX(item[0], classWeek);
        var msg = item[1];
        var detail = "";
        for (var j = 0; j < msg.length; ++j) {
          var str = msg[j][1];
          if (_whatTypeItIs(str) == "ClassMsg") {
            //只执行一次，创建某课程的列表
            //说明是课名
            if ((msgStep3.length - 1) >= 0)
              getMsgFromDetail(detail, msgStep3[msgStep3.length - 1]);
            msgStep3.add({"Name": str, "Week": week});
            detail = "";
          } else
            //上面添加完课之后，一只循环这里拼接字符串
            detail += str; //字符串拼接
        }
        //添加detial
        getMsgFromDetail(detail, msgStep3[msgStep3.length - 1]);
      }
    } else {
      //【列表型课表】
      List classNames = msgStep2["ClassMsg"][0][1];
      List classDetails = msgStep2["ClassMsg"][1][1];
      List classSections = msgStep2["ClassSection"][0][1];
      List classWeeks = msgStep2["ClassWeek"][0][1];
      var detail = ""; //合并多行的课程详情的
      if (classNames.length == 0) //极端情况————无课程
        return pdfData;

      if (classNames.length == 1) {
        //极端情况————课程数为1
        if (classNames.length == 1) {
          msgStep3.add({
            "Name": classNames[0][1],
            "Week": classWeeks[0][1],
            "Section": classSections[0][1]
          });
          for (var i = 0; i < classDetails.length; ++i)
            detail += classDetails[i][1];
        }

        getMsgFromDetail(detail, msgStep3[msgStep3.length - 1]);
      } else {
        //lraty: bug 已知原代码无法应对三行课程详情。

        //正常情况————课程数2以上
        final deviation = (classNames[1][0] - classNames[0][0]) / 3; //误差值
        //由它确定某课程所对应的周数、节次以及课程详情
        //这个误差值基本不会翻车，除非出现“第一节课的课程详情仅1行”这种极端情况而导致的行间距过小
        //(目前没遇到过上面说的极端情况，但不排除出现这种情况的可能

        var pstForWeek = [];
        var pstForSection = [];
        double sumForWeek = 0;
        double sumForSection = 0;
        int ptrWeek = 0;
        int ptrSection = 0;
        for (var i = 0; i < classNames.length; ++i) {
          msgStep3.add({"Name": classNames[i][1]});
          pstForWeek.add(i);
          pstForSection.add(i);
          sumForWeek += classNames[i][0];
          sumForSection += classNames[i][0];
          if (_areTheyEqual(sumForWeek / pstForWeek.length,
              classWeeks[ptrWeek][0], deviation)) {
            for (var i = pstForWeek.length - 1; i >= 0; --i)
              msgStep3[pstForWeek[i]]["Week"] = classWeeks[ptrWeek][1];
            pstForWeek = [];
            sumForWeek = 0;
            ++ptrWeek;
          }

          if (_areTheyEqual(sumForSection / pstForSection.length,
              classSections[ptrSection][0], deviation)) {
            for (var i = pstForSection.length - 1; i >= 0; --i) {
              List<String> nums = classSections[ptrSection][1].split("-");
              msgStep3[pstForSection[i]]
                  ["Section"] = {"Start": nums[0], "End": nums[1]};
            }
            pstForSection = [];
            sumForSection = 0;
            ++ptrSection;
          }
        }

        //lraty: 计算前10个课程详情间隔，以最小间隔为相邻行间距，遇到困难，摆大烂。
        double minGap = classDetails[1][0] - classDetails[0][0];
        for (int i = 1; i < classDetails.length && i < 11; i++) {
          var gap = classDetails[i][0] - classDetails[i - 1][0];
          if (gap < minGap) minGap = gap;
        }

        //如果与下一行详情间距为minGap，则合并。
        int detialIndex = 0;
        for (int i = 0; i < classNames.length; i++) {
          //detialIndex+1 越界
          while (detialIndex < classDetails.length - 1 &&
              classDetails[detialIndex + 1][0] - classDetails[detialIndex][0] ==
                  minGap) {
            detail += classDetails[detialIndex][1];
            detialIndex++;
          }
          detail += classDetails[detialIndex][1];
          //存入课程详情。
          getMsgFromDetail(detail, msgStep3[i]);
          detail = "";
          detialIndex++;
        }

        // for (var i = 0, j = 0;
        //     i < classDetails.length && j < classNames.length;
        //     ++i) {
        //   if (_areTheyEqual(classDetails[i][0], classNames[j][0], deviation))
        //     detail += classDetails[i][1];
        //   else {
        //     getMsgFromDetail(detail, msgStep3[j]);
        //     detail = "";
        //     ++j;
        //     --i;
        //   }
        // }
      }
    }

    /*****************************************【第四步】*****************************************/
//加载数据进ClassifiedPdfData 对象并返回
    pdfData.fileInfo["StudentName"] = msgStep2["Student"]["Name"];
    pdfData.fileInfo["ID"] = msgStep2["Student"]["Num"];
    pdfData.fileInfo["pdfPrintingTime"] = msgStep2["Time"]["Print"];
    pdfData.fileInfo["Semester"] = msgStep2["Time"]["Semester"];
    pdfData.other = msgStep2["Other"];

    msgStep3.forEach((element) {
      pdfData.courses.add(new Course(
          element["Name"],
          element["OriginDetail"],
          element["Place"],
          // element["Section"],
          new Map<String,String>.from(element["Section"]),
          element["Teacher"],
          element["Week"],
          element["Weeks"]));
    });
    return pdfData;
  }
}
