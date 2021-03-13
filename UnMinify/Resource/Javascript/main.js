//=====todo=readme 询问上传，恢复空课室
//=====todo 小程序 选择聊天(打印店、印萌自主打印小程序) 
// 兼容vcs 1.0

import {
    GetMsg
} from "./GetMsg.js";
import {
    saveAs
} from './FileSaver.js';

// browserify -r -r ./_tools.js:ICalTools -r ./alarm.js:ICalAlarm -r ./attendee.js:ICalAttendee -r ./calendar.js:ICalCalendar   -r ./category.js:ICalCategory -r ./event.js:ICalEvent -r moment-timezone:moment ./ > bundle.js


const ICalCalendar = require("ICalCalendar");

var ical = new ICalCalendar({
    domain: "jwxt.scnu.edu.cn",
    timezone: "Asia/Hong_Kong",
    prodId: {
        company: 'https://github.com/Okami-2;LXJ&CZL',
        product: 'SCNU_jwxt_pdf2ics',
        language: 'zh-CN'
    },
    url: "https://github.com/lraty-li/SCNU-Jwxt-Pdf2Ics"
});
ical.clear();
var Day = new Date();


// var JwxtApi = "http://module.scnu.edu.cn/api.php?op=jw_date";
var pdfjsLib = window['pdfjs-dist/build/pdf'];
var pdfjsLibHome = "./Resource/pdfjs-2.6.347-dist/";
var SortedData = {};

/*Offical release of the pdfjs worker*/
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsLibHome + 'build/pdf.worker-min.js';





//预览pdf，同时获取数据
document.getElementById('UpLoadFileInput').onchange = function (event) {
    var file = event.target.files[0];
    var fileReader = new FileReader();
    fileReader.onload = function (event) {
        var typedarray = new Uint8Array(this.result);

        const loadingTask = pdfjsLib.getDocument({
            data: typedarray,
            cMapUrl: pdfjsLibHome + '/cmaps/',
            cMapPacked: true,
        });
        loadingTask.promise.then(pdf => {
            // The document is loaded here...
            //This below is just for demonstration purposes showing that it works with the moderen api
            pdf.getPage(1).then(function (page) {
                console.log('Page loaded');
                //================todo====== 自适应sacle
                var scale = 2;
                var TextItemArr = [];
                var viewport = page.getViewport({
                    scale: scale
                });

                //跟踪绘制操作，获取矩形坐标
                //感谢LXJ设计了不用线数据的整理程序
                // // console.log("pdfjsLib", pdfjsLib);
                // var standOPS = pdfjsLib.OPS;
                // var reverOPS = [];
                //制作标准绘制操作的字典，用于下一步查找
                // for (let k in standOPS) {
                //     let value = standOPS[k]; 
                //     reverOPS[value] = k; // 
                // }
                // page.getOperatorList().then(OperatorList => {
                //     // console.log("OperatorList", OperatorList);
                //     var index = 0;
                //     var rectangs = [];
                //     var Operators = [];
                //     OperatorList.fnArray.forEach(function (item) {
                //         Operators.push(reverOPS[item]);
                //         if (item == 91) {
                //             // console.log(OperatorList.argsArray[index]);
                //             rectangs.push(OperatorList.argsArray[index][1]);
                //         }
                //         index += 1;
                //     });
                //     // console.log("Operators", Operators)
                //     // console.log("rectangs", rectangs); //矩形绘制数据
                // });

                page.getTextContent({
                    normalizeWhitespace: true
                }).then(textContent => {

                    var text = textContent;
                    // find all text start points
                    text.items.forEach(function (item) {
                        //进行变换，因为不考虑实际绘制，该处效果等同于
                        // TextItemArr.push({
                        //     "x": tx[5],
                        //     "y": tx[4],
                        //     "str": item.str
                        // });
                        let tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
                        // avoiding tx * [0,0,1] taking x, y directly from the transform
                        TextItemArr.push({
                            "x": tx[4],
                            "y": tx[5],
                            "str": item.str
                        });
                    });
                    console.log("Got TextItemArr",TextItemArr);
                    SortedData = GetMsg(TextItemArr);
                    console.log("Got SortedData",TextItemArr);
                });

                var canvas = document.getElementById('pdfCanvas');
                var context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Render PDF page into canvas context
                var renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                var renderTask = page.render(renderContext);
                renderTask.promise.then(function () {
                    console.log('Page rendered');
                });

            });
            //end of example code
        });

    }
    fileReader.readAsArrayBuffer(file);
}


function UpLoadFile() {
    var fileObj = document.getElementById("UpLoadFileInput");

    if (fileObj.files.length === 0) {
        alert("没选到文件哦。");
        return;
    }
    if (fileObj.files[0].type !== "application/pdf") {
        alert("不是pdf文件哦。");
        return;
    }
    var AlarmPre = parseInt(document.getElementById("AlarmSelect").value);

    var ByDaysMatch = {
        "星期一": "MO",
        "星期二": "TU",
        "星期三": "WE",
        "星期四": "TH",
        "星期五": "FR",
        "星期六": "SA",
        "星期日": "SU",
    }
    //课程开始结束时间
    //石牌、大学城、南海
    var CampusSelect = {
        "StoneBrand": ["", "8:30", "9:20", "10:20", "11:10", "14:30", "15:20", "16:10", "17:00", "19:00", "19:50", "20:40", "21:30"],
        "BigLearnCity&SouthSea": ["", "8:30", "9:20", "10:20", "11:10", "14:00", "14:50", "15:40", "16:30", "19:00", "19:50", "20:40", "21:30"],
    };
    var CourseSessionsMatch = CampusSelect[document.getElementById("CampusSelect").value];

    //==============todo 非法输入弹框。
    var TeachingWeekCurr = parseInt(document.getElementById("rangeInput").value);


    SortedData.Class.forEach(SortedDataClassItem => {
        // Class: "大学物理（III-1）*"
        // Detail: "周数: 1-16周 .............:3总学时:48 学分:3"
        // Time: "1-3"
        // Week: "星期一"

        // var location = item.Detail.match(/校区: .*? 地点: .*?\s/)[0]; //新版无校区信息

        //"1-2"
        var CourseSessionsStart = CourseSessionsMatch[parseInt(SortedDataClassItem.Time.split("-")[0])].split(":");
        var CourseSessionsEnd = CourseSessionsMatch[parseInt(SortedDataClassItem.Time.split("-")[1])].split(":"); //should+40mins

        //"1-11周，13-17周"
        //边界会设置事件
        var WeeksIntervalArray = [...SortedDataClassItem.Detail.matchAll(/(\d+)-(\d+)周/g)];

        WeeksIntervalArray.forEach(WeeksIntervalArrayItem => {
            //该课程共有教学周
            var TeachingWeekSum = parseInt(WeeksIntervalArrayItem[2]) - parseInt(WeeksIntervalArrayItem[1]) + 1;

            //[["1-11周","1","11"],[13-17周,"13","17"] 创新创业周？
            var tmp = parseInt(WeeksIntervalArrayItem[1]) - TeachingWeekCurr;

            tmp >= 0 ? tmp = tmp - 1 : null;

            //回到课程开始那周的那天
            Day = new Date();
            Day.setDate(Day.getDate() - Day.getDay() + 1 + (tmp * 7));
            Day.setHours(parseInt(CourseSessionsStart[0]), parseInt(CourseSessionsStart[1]), 0);
            var CourseStartTimeISOString = Day.toISOString();
            Day.setHours(parseInt(CourseSessionsEnd[0]), parseInt(CourseSessionsEnd[1]), 0);
            Day.setMinutes(Day.getMinutes() + 40);
            var CourseEndTimeISOString = Day.toISOString();


            //前往教学周结束
            Day.setDate(Day.getDate() + (7 * TeachingWeekSum) - 1);
            //创建事件
            ical.events([{
                start: CourseStartTimeISOString,
                end: CourseEndTimeISOString,
                summary: SortedDataClassItem.Class,
                description: SortedDataClassItem.Detail,
                location: SortedDataClassItem.Detail.match(/地点: .*?\s/)[0],
                organizer: {
                    email: "example@example.com",
                    name: "教师:" + SortedDataClassItem.Detail.match(/教师: .*?\s/)[0]
                },
                repeating: {
                    freq: 'WEEKLY',
                    until: Day,
                    byDay: ByDaysMatch[SortedDataClassItem.Week],
                },
                alarms: [{
                    type: 'display',
                    trigger: 60 * AlarmPre
                }]

            }]);
        });

    });
    saveAs(ical.toBlob(), fileObj.files[0].name + ".ics");
}
document.querySelector('button').addEventListener('click', UpLoadFile)