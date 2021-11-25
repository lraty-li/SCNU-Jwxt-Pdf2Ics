

function GetMsg(Data) {
    let TotalMsg = {
        "Class": [],//将存放着一份份的字典，即："Class":[{"Name":***,  "Time":***, ...},{...},...]
        "Header": [],
        "Footer": [],
        "PrintTime": [],
        "Other":[]
    };

    let WhatTypeItIs = (str) => {//判断该字符串属于哪一类的信息
        if (str.match(/学年|课表|学号/))//表头信息
            return "Header";
        if (str.match(/其他|\/无/))//表尾信息
            return "Footer";
        if (str.match(/星期/))//星期数
            return "Week";
        if (str.match(/^\d+-\d+/))//上课时间(节)
            return "Time";
        if (str.match(/.*?[#&*]$/))//课程名称
            return "Name";
        if (str.match(/周数|学分/))//课程详情
            return "Detail";
        if (str.match(/打印时间/))//打印时间
            return "PrintTime";
        return "Other";
    };

    let tableMsg = {
        "Week": [],
        "Time": [],
        "Name": [],
        "Detail":[],
        "Header":[],
        "Footer":[],
        "PrintTime":[],
        "Other":[]
    };
    for (let pst = 0; pst < Data.length; ++pst) {
        let item = Data[pst];
        let str = item["str"];
        let y = item["y"];
        tableMsg[WhatTypeItIs(str)].push([y,str]);
    }
    tableMsg["Week"].sort((a, b) => { return a[0] - b[0];});
    tableMsg["Time"].sort((a, b) => { return a[0] - b[0];});
    tableMsg["Name"].sort((a, b) => { return a[0] - b[0];});
    tableMsg["Detail"].sort((a, b) => { return a[0] - b[0]; });

	const lessonsCount = tableMsg["Name"].length;//课程个数
    for (let i = 0, item = tableMsg["Name"]; i < lessonsCount; ++i)//【【完成了课名部分】】
        TotalMsg["Class"].push({ "Class": item[i][1] });

    for (let i = 0, item = tableMsg["Detail"], pst = -1; i < item.length; ++i) {//【【完成了课详情部分】】
        let str = item[i][1];
        if (str.match(/周数/)) {
            ++pst;
            TotalMsg["Class"][pst]["Detail"] = str;
        }
        else 
            TotalMsg["Class"][pst]["Detail"] += str;
    }

    const deviation = tableMsg["Detail"][1][0] - tableMsg["Detail"][0][0];//随便找个看起来可以接受的、表格当中最小的值，作为误差
    let CircaEqual = (x, y) => {//x和y大概相等则返回真
        if (deviation>x-y&&deviation>y-x)//js函数可以捕获外面的变量，deviation就是上面的const变量
            return true;
        return false;
    }
    for (let i = 0, j = 0,len=tableMsg["Time"].length;i<len ;++i) {//【【完成了课节次部分】】
        let item_Time = tableMsg["Time"][i];
        let lst = [j];
        for (let count = 1,sum=0.0; j < lessonsCount; lst.push(++j),++count) {
            sum += tableMsg["Name"][j][0];
            if (CircaEqual(sum / count, item_Time[0])){
                ++j;
                break;
            }
        }
        for (let pst = lst.length - 1; pst >= 0; --pst)
            TotalMsg["Class"][lst[pst]]["Time"] = item_Time[1];
    }

    for (let i = 0, j = 0, len = tableMsg["Week"].length; i < len; ++i) {//【【完成了星期数的部分】】
        let item_Week = tableMsg["Week"][i];//这循环体的代码和上面的那个，九成相似。摸了，这部分代码这么短，重复了也无所谓
        let lst = [j];
        for (let count = 1,sum=0.0; j < lessonsCount; lst.push(++j), ++count) {
            sum += tableMsg["Name"][j][0];
            if (CircaEqual(sum / count, item_Week[0])){
                ++j;
                break;
            }
        }
        for (let pst = lst.length - 1; pst >= 0; --pst)
            TotalMsg["Class"][lst[pst]]["Week"] = item_Week[1];
    }

	for(let item=tableMsg["Header"],i=item.length-1;i>=0;--i){//【【完成了表头的部分】】
		let str=item[i][1];
		if(str.match(/学期/))
			TotalMsg["Header"]["Semester"]=str;
		if(str.match(/课表/))
			TotalMsg["Header"]["StudentName"]=str.match(/(.*?)课表/)[1];
		if(str.match(/学号/))
			TotalMsg["Header"]["StudentNum"]=str.match(/(\d+)/)[1];
	}

	TotalMsg["PrintTime"]["Time"]=tableMsg["PrintTime"][0][1].match(/[\d\-]+/)[0];//【【完成了打印时间的部分】】

	for(let item=tableMsg["Other"],i=item.length-1;i>=0;--i)//【【完成了其他内容的部分】】
		TotalMsg["Other"][i.toString()]=item[i][1];

	tableMsg["Footer"].sort((a, b) => { return a[0] - b[0]; });//【【完成了表尾的部分】】
	let otherStr="";
	for(let item=tableMsg["Footer"],i=0;i<item.length;++i)
		otherStr+=item[i][1];
	let otherStrs=otherStr.match(/.*?[:;：；]/g);
	if(otherStrs!=null){
		for(let i=otherStrs.length-1;i>0;i--)
			TotalMsg["Footer"][i.toString()]=(otherStrs[i].match(/\s*(.*?)[;；]/))[1];
	}

	return TotalMsg;
}

export{GetMsg};