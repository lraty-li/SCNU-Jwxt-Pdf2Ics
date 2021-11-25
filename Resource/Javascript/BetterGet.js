function BetterGet(Data){
    let msg_step1={};
    let msg_step2={
        "Student":{},
        "Time":{"Print":"Null"},//打印信息在表尾，如果获取的Data信息不完整那很大可能被略掉，所以在这补上一个键值对(强迫症
        "ClassWeek":[],
        "ClassSection":[],
        "ClassMsg":[],
        "Other":"",
        "Rubbish":[],
    };
    let msg_step3=[];//存放课的信息：[{"Name":str,"Week":str,...},{...},...]
    let msg_step4={
        "Student":{"Name":"Null","Num":"Null"},
        "Time":{"Print":"Null","Semester":"Null"},
        "Class":[],
        "Other":""
    }

/*****************************************【第一步】*****************************************/
    for(let i=0;i<Data.length;++i){
        if(i>200)//课表信息再离谱也不会超过200个元素。这只是初步排除而已
            return msg_step4;
        let x=Number(Data[i]['x']);
        let y=Number(Data[i]['y']);
        let str=Data[i]['str'];
        if(!msg_step1[x])
            msg_step1[x]=[];
        msg_step1[x].push([y,str]);
    }

/*****************************************【第二步】*****************************************/
    let WhatTypeItIs = (str) => {//判断该字符串属于哪一类的信息
        if(str.match(/学年/))
            return "Semester";
        if(str.match(/学号/))
            return "Num";
        if(str.match(/课表/))
            return "Name";
        if(str.match(/打印时间/))
            return "Print";
        if (str.match(/其他|\/无/))//表尾信息
            return "Other";

        if (str.match(/星期/))//星期数
            return "ClassWeek";
        if (str.match(/^\d+-\d+/))//上课时间(节)
            return "ClassSection";
        if (str.match(/.*?[#&*]$/))//课程信息
            return "ClassMsg";
        if(str.match(/周数/))//课程信息(仅列表的详情部分能匹配到这关键词)
            return "ClassMsg";
        return "Rubbish";
    };

    for(let i in msg_step1){
        msg_step1[i].sort((a,b)=>{return a[0]-b[0];});
        let str=msg_step1[i][0][1];
        let type=WhatTypeItIs(str);//判断某一x值的整一列属于哪个类型
        switch(type){
            case "Name":msg_step2["Student"]["Name"]=str.match(/(.*?)课表/)[1];break;
            case "Num":msg_step2["Student"]["Num"]=str.match(/(\d+)/)[1];break;
            case "Print":msg_step2["Time"]["Print"]=str.match(/([\d\-]+)/)[1];break;
            case "Semester":msg_step2["Time"]["Semester"]=str;break;            
            case "Other":{
                for(let j=0;j<msg_step1[i].length;++j)
                    msg_step2["Other"]+=msg_step1[i][j][1];
                break;
            }
            default:msg_step2[type].push([i,msg_step1[i]]);break;
        }
    }
    if(!(msg_step2["Student"]["Name"]&&
        msg_step2["Student"]["Num"]))//二次排除
        return msg_step4;
    
/*****************************************【第三步】*****************************************/
    let scheduleType="Table";//课表类型
    if(msg_step2["ClassSection"].length)//列表型课表
        scheduleType="List";
    let GetMsgFromDetail=(detail,dict)=>{//将detail的信息处理为键值对并存放在字典dict中
		if(detail.length==0)
			return;
        dict["OriginDetail"]=detail;
        dict["Weeks"]=[];
        if(scheduleType=="Table"){
            detail=detail.split("/");
            let section_weeks=detail[0].match(/\d+/g);
            dict["Section"]={"Start":section_weeks[0],"End":section_weeks[1]};
            for(let i=2;i<section_weeks.length;i+=2)
                dict["Weeks"].push({"Start":section_weeks[i],"End":section_weeks[i+1]});
            dict["Place"]=detail[1];
            dict["Teacher"]=detail[2];
        }
        else{
            let weekStr=detail.match(/周数.*?地点/)[0];
            let weeks=weekStr.match(/\d+/g);
            for(let i=0;i<weeks.length;i+=2)
                dict["Weeks"].push({"Start":weeks[i],"End":weeks[i+1]});
            dict["Place"]=detail.match(/地点[:：\s]+?(.+?)\s/)[1];
            dict["Teacher"]=detail.match(/教师[:：\s]+?(.+?)\s/)[1];
        }
    };

    if(scheduleType=="Table"){//【表格型课表】
        let ClassWeek=[];//[[x,str],[x,str],...]
        for(let i=0;i<msg_step2["ClassWeek"].length;++i){
            let item=msg_step2["ClassWeek"][i];
            ClassWeek.push([item[0],item[1][0][1]]);
        }
        let GetWeekFromX=(x)=>{
            x=Number(x);
            let i=ClassWeek.length-1;
            for(;i>=0;--i){
                if(ClassWeek[i][0]<x)
                    break;
            }
            return ClassWeek[i+1][1];
        };

        for(let i=msg_step2["ClassMsg"].length-1;i>=0;--i){
            let item=msg_step2["ClassMsg"][i];
            let week=GetWeekFromX(item[0]);
            let msg=item[1];
            let detail="";
            for(let j=0;j<msg.length;++j){
                let str=msg[j][1];
                if(WhatTypeItIs(str)=="ClassMsg"){//说明是课名
					GetMsgFromDetail(detail,msg_step3[msg_step3.length-1]);
                    msg_step3.push({"Name":str,"Week":week});
                    detail="";
                }
                else
                    detail+=str;//字符串拼接
            }
            GetMsgFromDetail(detail,msg_step3[msg_step3.length-1]);
        }
    }
    else{//【列表型课表】
        let ClassNames=msg_step2["ClassMsg"][0][1];
        let ClassDetails=msg_step2["ClassMsg"][1][1];
        let ClassSections=msg_step2["ClassSection"][0][1];
        let ClassWeeks=msg_step2["ClassWeek"][0][1];
		let Detail="";//合并多行的课程详情的
		if(ClassNames.length==0)//极端情况————无课程
			return msg_step4;
		if(ClassNames.length==1){//极端情况————课程数为1
            if(ClassNames.length==1){
                msg_step3.push({"Name":ClassNames[0][1],"Week":ClassWeeks[0][1],"Section":ClassSections[0][1]});
                for(let i=0;i<ClassDetails.length;++i)
                    Detail+=ClassDetails[i][1];
			}
        }
		else{//正常情况————课程数2以上
            const deviation=(ClassNames[1][0]-ClassNames[0][0])/3;//误差值
            //由它确定某课程所对应的周数、节次以及课程详情
            //这个误差值基本不会翻车，除非出现“第一节课的课程详情仅1行”这种极端情况而导致的行间距过小
            //(目前没遇到过上面说的极端情况，但不排除出现这种情况的可能
            let AreTheyEqual=(a,b)=>{
                if(a-b>deviation||b-a>deviation)
                    return false;
                return true;
            };

            let PstForWeek=[];
            let PstForSection=[];
            let SumForWeek=0;
            let SumForSection=0;
            let Ptr_Week=0;
            let Ptr_Section=0;
            for(let i=0;i<ClassNames.length;++i){
                msg_step3.push({"Name":ClassNames[i][1]});
                PstForWeek.push(i);
                PstForSection.push(i);
                SumForWeek+=ClassNames[i][0];
                SumForSection+=ClassNames[i][0];                
                if(AreTheyEqual(SumForWeek/PstForWeek.length,ClassWeeks[Ptr_Week][0])){
                    for(let i=PstForWeek.length-1;i>=0;--i)
                        msg_step3[PstForWeek[i]]["Week"]=ClassWeeks[Ptr_Week][1];
                    PstForWeek=[];
                    SumForWeek=0;
                    ++Ptr_Week;
                }
                if(AreTheyEqual(SumForSection/PstForSection.length,ClassSections[Ptr_Section][0])){
                    for(let i=PstForSection.length-1;i>=0;--i){
						let nums=ClassSections[Ptr_Section][1].match(/\d+/g);
                        msg_step3[PstForSection[i]]["Section"]={"Start":nums[0],"End":nums[1]};
					}
                    PstForSection=[];
                    SumForSection=0;
                    ++Ptr_Section;
                }
            }

            for(let i=0,j=0;i<ClassDetails.length&&j<ClassNames.length;++i){
                if(AreTheyEqual(ClassDetails[i][0],ClassNames[j][0]))
                    Detail+=ClassDetails[i][1];
                else{
                    GetMsgFromDetail(Detail,msg_step3[j]);
                    Detail="";
                    ++j;
                    --i;
                }
            }
        }
		GetMsgFromDetail(Detail,msg_step3[msg_step3.length-1]);
    }

/*****************************************【第四步】*****************************************/
    msg_step4["Student"]=msg_step2["Student"];
    msg_step4["Time"]=msg_step2["Time"];
    msg_step4["Other"]=msg_step2["Other"];
    msg_step4["Class"]=msg_step3;

    return msg_step4;
}

export{BetterGet};