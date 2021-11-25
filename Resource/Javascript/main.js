//=====todo=readme 询问上传，恢复空课室
//=====todo 小程序 选择聊天(打印店、印萌自主打印小程序) 
// 兼容vcs 1.0

// browserify -r -r ./_tools.js:ICalTools -r ./alarm.js:ICalAlarm -r ./attendee.js:ICalAttendee -r ./calendar.js:ICalCalendar   -r ./category.js:ICalCategory -r ./event.js:ICalEvent -r moment-timezone:moment ./ > bundle.js
import {
    BetterGet
} from "./BetterGet.js"
import {
    saveAs
} from './FileSaver.js';

const ICalCalendar = require("ICalCalendar");
let Day = new Date();


let pdfjsLibHome = "./Resource/pdfjs-2.6.347-dist/";
let SortedData = {};

let pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsLibHome + 'build/pdf.worker-min.js';


//预览pdf，同时获取数据
document.getElementById('UpLoadFileInput').onchange = function (event) {
    let file = event.target.files[0];
    let fileReader = new FileReader();
    fileReader.onload = function (event) {
        let typedarray = new Uint8Array(this.result);

        const loadingTask = pdfjsLib.getDocument({
            data: typedarray,
            cMapUrl: pdfjsLibHome + '/cmaps/',
            cMapPacked: true,
        });
        loadingTask.promise.then(pdf => {
            console.log(pdf)
            pdf.getPage(1).then(function (page) {
                console.log('Page loaded');
                //================todo====== 自适应sacle
                let scale = 0.0005 * window.screen.width + 1;
                let TextItemArr = [];
                let viewport = page.getViewport({
                    scale: scale
                });

                //跟踪绘制操作，获取矩形坐标
                //感谢LXJ设计了不用线数据的整理程序
                // // console.log("pdfjsLib", pdfjsLib);
                // let standOPS = pdfjsLib.OPS;
                // let reverOPS = [];
                //制作标准绘制操作的字典，用于下一步查找
                // for (let k in standOPS) {
                //     let value = standOPS[k]; 
                //     reverOPS[value] = k; // 
                // }
                // page.getOperatorList().then(OperatorList => {
                //     // console.log("OperatorList", OperatorList);
                //     let index = 0;
                //     let rectangs = [];
                //     let Operators = [];
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

                    let text = textContent;
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
                    console.log("Got TextItemArr", TextItemArr);
                    SortedData = BetterGet(TextItemArr);
                    console.log("Got SortedData", SortedData);
                });

                let canvas = document.getElementById('pdfCanvas');
                let context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Render PDF page into canvas context
                let renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                let renderTask = page.render(renderContext);
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
    let fileObj = document.getElementById("UpLoadFileInput");

    if (fileObj.files.length === 0) {
        alert("没选到文件哦。");
        return;
    }
    if (fileObj.files[0].type !== "application/pdf") {
        alert("不是pdf文件哦。");
        return;
    }
    let AlarmPre = parseInt(document.getElementById("AlarmSelect").value);

    let ByDaysMatch = {
        "星期一": {
            abb: "MO",
            num: 0
        },
        "星期二": {
            aab: "TU",
            num: 1
        },
        "星期三": {
            abb: "WE",
            num: 2
        },
        "星期四": {
            abb: "TH",
            num: 3
        },
        "星期五": {
            abb: "FR",
            num: 4
        },
        "星期六": {
            abb: "SA",
            num: 5
        },
        "星期日": {
            abb: "SU",
            num: 6
        },
    }
    //课程开始结束时间
    //石牌、大学城、南海
    // let CampusSelect = {
    //     "StoneBrand": ["", "8:30", "9:20", "10:20", "11:10", "14:30", "15:20", "16:10", "17:00", "19:00", "19:50", "20:40", "21:30"],
    //     "BigLearnCity&SouthSea": ["", "8:30", "9:20", "10:20", "11:10", "14:00", "14:50", "15:40", "16:30", "19:00", "19:50", "20:40", "21:30"],
    // };
    let CampusSelect = {
        "StoneBrand": ["", {
            Hour: 8,
            Mins: 30
        }, {
            Hour: 9,
            Mins: 20
        }, {
            Hour: 10,
            Mins: 20
        }, {
            Hour: 11,
            Mins: 10
        }, {
            Hour: 14,
            Mins: 30
        }, {
            Hour: 15,
            Mins: 20
        }, {
            Hour: 16,
            Mins: 10
        }, {
            Hour: 17,
            Mins: 0
        }, {
            Hour: 19,
            Mins: 0
        }, {
            Hour: 19,
            Mins: 50
        }, {
            Hour: 20,
            Mins: 40
        }, {
            Hour: 21,
            Mins: 30
        }],
        "BigLearnCity&SouthSea": ["", {
            Hour: 8,
            Mins: 30
        }, {
            Hour: 9,
            Mins: 20
        }, {
            Hour: 10,
            Mins: 20
        }, {
            Hour: 11,
            Mins: 10
        }, {
            Hour: 14,
            Mins: 0
        }, {
            Hour: 14,
            Mins: 50
        }, {
            Hour: 15,
            Mins: 40
        }, {
            Hour: 16,
            Mins: 30
        }, {
            Hour: 19,
            Mins: 0
        }, {
            Hour: 19,
            Mins: 50
        }, {
            Hour: 20,
            Mins: 40
        }, {
            Hour: 21,
            Mins: 30
        }],
    };
    try {

        let ical = new ICalCalendar({
            domain: "jwxt.scnu.edu.cn",
            timezone: "Asia/Hong_Kong",
            url: "https://github.com/lraty-li/SCNU-Jwxt-Pdf2Ics",
            scale: "gregorian",
            method: "publish",
        });
        ical.prodId("//LXJ&CZL//Jwxt_Pdf2Js//CN")

        let CourseSessionsMatch = CampusSelect[document.getElementById("CampusSelect").value];

        //==============todo 非法输入弹框。
        let TeachingWeekCurr = parseInt(document.getElementById("rangeInput").value);

        // ical.clear();
        SortedData.Class.forEach(SortedDataClassItem => {
            //"1-2"
            let CourseSessionsStart = CourseSessionsMatch[parseInt(SortedDataClassItem.Section.Start)];
            let CourseSessionsEnd = CourseSessionsMatch[parseInt(SortedDataClassItem.Section.End)]; //should+40mins

            //"1-11周，13-17周"
            //边界会设置事件
            let WeeksIntervalArray = SortedDataClassItem.Weeks;
            WeeksIntervalArray.forEach(WeeksIntervalArrayItem => {
                //该课程共有教学周
                //单周课程
                let TeachingWeekSum = 1;
                if (WeeksIntervalArrayItem.End != undefined) {
                    TeachingWeekSum = parseInt(WeeksIntervalArrayItem.End) - parseInt(WeeksIntervalArrayItem.Start) + 1;
                }
                //[["1-11周","1","11"],[13-17周,"13","17"] 创新创业周？
                let tmp = parseInt(WeeksIntervalArrayItem.Start) - TeachingWeekCurr;

                //回到课程开始那周的那天
                Day = new Date();
                Day.setDate(Day.getDate() - Day.getDay() + 1 + (tmp * 7) + ByDaysMatch[SortedDataClassItem.Week].num);
                Day.setHours(parseInt(CourseSessionsStart.Hour), parseInt(CourseSessionsStart.Mins), 0);
                let CourseStartTimeDate = new Date(Day.valueOf());
                Day.setHours(parseInt(CourseSessionsEnd.Hour), parseInt(CourseSessionsEnd.Mins), 0);
                Day.setMinutes(Day.getMinutes() + 40);
                let CourseEndTimeDate = new Date(Day.valueOf());
                //前往教学周结束
                console.log("TeachingWeekSum", TeachingWeekSum);
                Day.setDate(Day.getDate() + (7 * TeachingWeekSum) - 1);
                //创建事件
                console.log("adding", SortedDataClassItem.Name);
                ical.events([{
                    start: CourseStartTimeDate,
                    end: CourseEndTimeDate,
                    summary: SortedDataClassItem.Name,
                    description: SortedDataClassItem.OriginDetail,
                    location: SortedDataClassItem.Place,
                    // organizer: {
                    //     email: "example@example.com",
                    //     name: "教师:" + SortedDataClassItem.Teacher
                    // },
                    repeating: {
                        freq: 'WEEKLY',
                        until: Day,
                        byDay: ByDaysMatch[SortedDataClassItem.Week].abb,
                    },
                    alarms: [{
                        type: 'display',
                        trigger: AlarmPre * 60
                    }]

                }]);
            });

        });
        saveAs(ical.toBlob(), fileObj.files[0].name + ".ics");
        console.log("ical", ical)
        ical.clear();
    } catch (error) {
        console.error(error);
        alert(error);
    }
}

document.querySelector('button').addEventListener('click', UpLoadFile)