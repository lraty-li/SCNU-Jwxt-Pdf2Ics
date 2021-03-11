
function LXJNB(JsonFilePath)
{
  var resultList=[];
  //console.log("LXJNB")
  var baseObj=JSON.parse(require('fs').readFileSync(JsonFilePath,'utf8'));
  baseObj=JSON.parse(decodeURIComponent(JSON.stringify(baseObj)));
  for(key in baseObj["formImage"]["Pages"]) {
    resultList.push(GetItemFromPage(baseObj["formImage"]["Pages"][key]));
  }//页信息
  //*********************************************************
  //*                    下面是一大堆的函数                  *
  //*********************************************************
  function GetItemFromPage(Page){
    var jsonForHLines=Page["HLines"];
    var colBoundary=[];//列边界值，存放信息为[a,b,c]三个值
    var lineBoundary=[];//行边界值，存放信息为[[,,,],[,,,],[,,,]]三列的y值
    GetMsgFromHLinesList(jsonForHLines,colBoundary,lineBoundary);

    var jsonForTexts=Page["Texts"];
    var colMsg=[{},{},{}];//有3列的信息。为[{y:星期,,},{y:课时,,},{x:{y:[课名],,},x:{y:[课详情],,}}]
    var extraMsg=[];//不在课表表格内的信息
    var titleSign=[0];// 判断有无title(title里有**课表、学号**的信息)的，有就改[-1]，无就[0]
    GetMsgFromTextsList(jsonForTexts,colBoundary,colMsg,extraMsg,titleSign);
    var result=CombineMsg(colMsg,lineBoundary,titleSign);
    return [result,extraMsg];
  }

  function GetMsgFromHLinesList(jsonForHLines,colBoundary,lineBoundary){
    //【【【处理了jsonForHlines内的信息，关键数据：colBoundary、lineBoundary】】】
    var Array={};//伪集合。里头存放着关键点的值{x:{y:0,y:0,,,},,,}
    var item=0;//曲线救国，定义了个item变量
    for (key in jsonForHLines){//key被整成数组下标了，所以才要曲线救国
      item=jsonForHLines[key];
      if(!(item["x"] in Array))
        Array[item["x"]]={[item["y"]]:0};
      else
        Array[item["x"]][item["y"]]=0;//利用字典中的键的唯一性来实现伪集合
    }

    for(key in Array)
      colBoundary.push(key);
    colBoundary.sort((a,b)=>{return (a-b);});//从小到大排列。
    colBoundary.push(100);//这是临时添加的~(即，将表格最右的边界也加进了列表中)

    for(key in colBoundary){
      var result=[];//提取后的信息
      var temp=Array[colBoundary[key]];
      for(num in temp)
        result.push(eval(num));
      result.sort((a,b)=>{return (a-b);});//也是排序一下
      lineBoundary.push(result);
    }
  }

  function GetMsgFromTextsList(jsonForTexts,colBoundary,colMsg,extraMsg,titleSign){
    var item;
    for (key in jsonForTexts){
      item=jsonForTexts[key];
      if(item["x"]<colBoundary[1]){//说明信息是第一列的
        if(item["R"][0]["T"].length>10)
          extraMsg.push(item["R"][0]["T"]);
        else
          colMsg[0][item["y"]]=item["R"][0]["T"];
        continue;
      }
      if(item["x"]<colBoundary[2])//说明信息是第二列的
        colMsg[1][item["y"]]=item["R"][0]["T"];
      if(item["x"]>colBoundary[2]){//说明信息是第三列的
        if(item["R"][0]["T"].match(/课表|学号/)){
          extraMsg.push(item["R"][0]["T"]);
          titleSign[0]=-1;
        }
        else{
          if(!(item["x"] in colMsg[2]))
            colMsg[2][item["x"]]={};
          colMsg[2][item["x"]][item["y"]]=[item["R"][0]["T"]];
        }
      }
    }
  }

  function CombineMsg(colMsg,lineBoundary,titleSign){
    var result;
    WhereItis=(List,num,errorVal=0)=>{//判断数值num在升序序列List的哪个位置(若在x和x+1之间，则返回x)。errorVal是“误差值”
      for(i in List){
        if(eval(num)+eval(errorVal)<eval(List[i]))//出于某种难以描述的原因，加上了“误差值”这个东西
          return i-1;
      }
    };
    DictToList=(Dict)=>{//将字典转列表（列表将会是根据key值升序的）
      var temp=[];
      var result=[];
      for(key in Dict)
        temp.push(key);
      temp.sort((a,b)=>{return eval(a)-eval(b);})
      for(key in temp)
        result.push(Dict[temp[key]]);
      return result;
    };

    {//对colMsg[2]的信息进行处理，转化为ClassName:{y:[课名,课详情]}
      var temp=[];
      for(key in colMsg[2])
        temp.push(key);
      temp.sort((a,b)=>{return eval(a)-eval(b);})
      var ClassName=colMsg[2][temp[0]];//对应的课程名的信息{y:[课名],,}
      var ClassDetail=colMsg[2][temp[1]];//对应的课程详情的信息{y:[课详情],,}

      var assistDict={};//辅助工具人，很有用的东西，给课程详情的字符串合并用的
      for(key in lineBoundary[2])
        assistDict[key]=[];//有一项会是多余的(指最后一项)，不管了反正也不影响

      for(key in ClassDetail)
        assistDict[WhereItis(lineBoundary[2],key,0.5)].push([key,ClassDetail[key]]);//对着位置压入信息
      var str="";//工具人(用于字符串合并)
      for(key in assistDict){//字符串合并~
        assistDict[key].sort((a,b)=>{return a[0]-b[0];})
        for(key2 in assistDict[key])
          str+=assistDict[key][key2][1];
        assistDict[key]=str;
        str="";
      }
      for(key in ClassName)//此时，ClassName里存着的信息为:{y:[课名,课详情]}
        ClassName[key].push(assistDict[WhereItis(lineBoundary[2],key)]);
      result=ClassName;//ClassName功成身退
    }

    {//信息归并~将colMsg[0]和colMsg[1]里的时间信息加入到result中
      var colMsg_0=DictToList(colMsg[0]);//转成列表
      var colMsg_1=DictToList(colMsg[1]);//转成列表
      for(key in result){
        result[key].push(colMsg_0[WhereItis(lineBoundary[0],key)+titleSign[0]]);//星期信息
        result[key].push(colMsg_1[WhereItis(lineBoundary[1],key)]);//课时信息
      }
    }
    return DictToList(result);
  }

  return  resultList;
}

module.exports = LXJNB;