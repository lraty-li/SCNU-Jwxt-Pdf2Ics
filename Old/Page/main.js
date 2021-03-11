import {
    ics,
    saveAs
} from "./ics.min.js";
//import "./rrule.min.js";


var xhr;
var Termstart;
var ot; //
var oloaded;
var url = "http://localhost:11451"; // 接收上传文件的后台地址
//上传文件方法
function UpLoadFile() {
    var fileObj = document.getElementById("UpLoadFile"); // js 获取文件对象
    if (fileObj.files.length === 0) {
        alert("没选到文件哦");
        return;
    }
    if (fileObj.files[0].type !== "application/pdf") {
        alert("不是pdf文件");
        return;
    }

    var form = new FormData(); // FormData 对象
    form.append("FileForm", fileObj.files[0]); // 文件对象

    xhr = new XMLHttpRequest(); // XMLHttpRequest 对象
    xhr.open("post", url, true); //post方式，url为服务器请求地址，true 该参数规定请求是否异步处理。
    //        xhr.onload = uploadComplete; //请求完成
    xhr.onerror = function () {
        alert("出错了")
    }; //请求失败
    //        xhr.upload.onprogress = progressFunction;//【上传进度调用方法实现】
    // xhr.upload.onloadstart = function(){//上传开始执行方法
    //     ot = new Date().getTime();   //设置上传开始时间
    //     oloaded = 0;//设置上传开始时，以上传的文件大小为0
    // };
    xhr.send(form); //开始上传，发送form数据

    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status !== 200) {
                //alert(result["msg"]);
                xhr.abort();
                return;
            }
            var result = JSON.parse(xhr.response);
            //改成显示pdf吧
            document.getElementById("p1").innerHTML = xhr.responseText;
            var ByDaysMatch = {
                "星期一": "MO",
                "星期二": "TU",
                "星期三": "WE",
                "星期四": "TH",
                "星期五": "FR",
                "星期六": "SA",
                "星期日": "TU",
            }
            //课程开始结束时间
            //石牌、大学城、南海
            var CampusSelect = {
                "StoneBrand": ["", "8:30", "9:20", "10:20", "11:10", "14:30", "15:20", "16:10", "17:00", "19:00", "19:50", "20:40", "21:30"],
                "BigLearnCity": ["", "8:30", "9:20", "10:20", "11:10", "14:00", "14:50", "15:40", "16:30", "19:00", "19:50", "20:40", "21:30"],
                "SouthSea": ["", "8:30", "9:20", "10:20", "11:10", "14:00", "14:50", "15:40", "16:30", "19:00", "19:50", "20:40", "21:30"],
            };
            var ByClassMatch = CampusSelect[document.getElementById("CampusSelect").value];
            var cal = ics();
            var SelRrule = {
                "freq": "WEEKLY",
                //"until":"Mon Nov 09 2020 15:37:05 GMT+0800 (GMT+08:00)",
                "interval": 1,
                //"byday":"MO",
            };
            //当前教学周,!!!如果在放假？？
            // console.log(JSON.parse(this.response))
            // var CurrTeachingWeek = parseInt(result['PdfArray'].pop().match(/\d+/)[0]);
            var CurrTeachingWeek = prompt("当前教学周？")
            for (var item of result['PdfArray'][0][0]) {
                //item: 课程名 描述 星期 课程时间
                if (item[1] === "") {
                    alert("你可能上传了 表格 模式的课表");
                    return;
                }
                var location = item[1].match(/校区: .*? 地点: .*?\s/)[0];
                var teacher = item[1].match(/教师: .*?\s/)[0];
                //"1-2"
                var StartTime = ByClassMatch[parseInt(item[3].split("-")[0])].split(":");
                var EndTime = ByClassMatch[parseInt(item[3].split("-")[1])].split(":"); //should+40mins

                //星期*
                SelRrule["byday"] = [ByDaysMatch[item[2]]];

                //"1-11周，13-17周"
                //边界会设置事件
                var WeeksIntervalArray = [...item[1].matchAll(/(\d+)-(\d+)周/g)];
                for (var WeekIntervals of WeeksIntervalArray) {
                    //[["1-11周","1","11"],[13-17周,"13","17"] 创新创业周？
                    var tmp = parseInt(WeekIntervals[1]) - CurrTeachingWeek;
                    tmp >= 0 ? null : tmp = tmp - 1;
                    var Day = new Date();
                    //回到开始那周的那天
                    Day.setDate(Day.getDate() - (Day.getDay() - 1) + (tmp * 7));
                    Day.setHours(parseInt(StartTime[0]), parseInt(StartTime[1]), 0);
                    var StartTimeString = Day.toString();
                    Day.setHours(parseInt(EndTime[0]), parseInt(EndTime[1]), 0);
                    Day.setMinutes(Day.getMinutes() + 40);
                    var EndTimeString = Day.toString();

                    tmp = parseInt(WeekIntervals[2]) - CurrTeachingWeek;
                    //回到今天
                    Day = new Date();
                    //加到周末
                    Day.setDate(Day.getDate() + (tmp * 7 + (6 - Day.getDay())));
                    SelRrule['until'] = Day.toString();

                    //ics :事件名 描述 地点 开始时间 结束时间 重复规则
                    cal.addEvent(item[0], teacher, location, StartTimeString, EndTimeString, SelRrule);

                }
            }
            if (!document.getElementById("DownloadBtn")) {
                var DownloadBtn = document.createElement("button");
                DownloadBtn.id = "DownloadBtn"
                DownloadBtn.innerText = "下载";
                DownloadBtn.addEventListener('click', function () {
                    cal.download(fileObj.files[0].name)
                });
                document.body.insertBefore(DownloadBtn, document.getElementById("p1"));
            }


            cal.download(fileObj.files[0].name);
        }
    };
}
document.querySelector('button').addEventListener('click', UpLoadFile)