const alfy = require('alfy');
const { exec } = require('child_process')
const process = require('node:process')

function read(f) {
    var clipboard = ""
    exec('pbpaste').stdout.on("data", function (chunk) { clipboard = chunk; }).on("end", function () { f(clipboard) })
}

let inputStr = alfy.input; //这个是输入
inputStr = inputStr.trim();

if (!inputStr && eval( process.env.readClipboard)) {
    read(function (c) {
        processTime(c, true,'','（内容来自剪贴板）')
    })
} else {
    processTime(inputStr, false,'','')
}



function processTime(input, handlerDefault,prefix,suffix) {
    let outputItems = [];
    let resp = toTime(input, handlerDefault)
    resp.prefix=prefix
    resp.suffix=suffix
    if (resp.error) {
        outputItems = [resp.error];
    } else {
        outputItems = converTime(resp)
    }

    outputItems = outputItems.map(item => {
        if (!item.arg) {
            item.arg = item.title;
        }
        return item;
    })

    alfy.output(outputItems);
}

function timeResp(time, description, withNumber,withPrefixAndSuffix,err) {
    return {
        withNumber:withNumber,
        withPrefixAndSuffix:withPrefixAndSuffix,
        time: time,
        description: description,
        error: err,
        prefix:"",
        suffix:"",
        GetStr: function(str){
            if (!this.withPrefixAndSuffix){
                return str
            }
            return this.prefix+str+this.suffix
        }
    }
}
function toTime(input, handlerDefault) {
    let time = new Date()
    if (!input || input == "now") {
        return timeResp(time, "当前时间", true,undefined)
    }
    //是否是合法的数字
    if (input * 1 >= 0) {
        if (input > 10445212800) {
            //如果是毫秒
            if (input >999999999999999){
                if (handlerDefault) {
                    return timeResp(new Date(), "当前时间", true,false,undefined)
                }
                return timeResp(undefined, input, true,false,{
                    title: "输入不符合规范"
                })
            }
            time = new Date(input * 1);
        } else {
            //如果是秒
            time = new Date(input * 1000)
        }
        return timeResp(time, input, eval(process.env.alwaysShowTimestamp),true,undefined)
    }

    try {
        var timestamp=Date.parse(input)
        if (isNaN(timestamp)){
            throw Error("非法字符串")
          }
        time = new Date(timestamp);
        return timeResp(time,input, true,true,undefined)
    } catch (e) {
        if (handlerDefault) {
            return timeResp(new Date(), "当前时间", true,true,undefined)
        }
        return timeResp(undefined, input, true,false,{
            title: "输入不符合规范"
        })
     
    }
}


function converTime(resp) {
    timeZones = JSON.parse(process.env.timeZone)

    result = []
    if (resp.withNumber){
        result = [
            {
                title: resp.time.getTime(),
                subtitle:resp.GetStr(resp.description + "的毫秒级时间戳")
            }, {
                title: Math.floor(resp.time.getTime() / 1000),
                subtitle: resp.GetStr(resp.description + "的秒级时间戳")
            },
        ]
    }
   
      
    for(var i = 0 ; i<timeZones.length;i++){
        timeStr = format(resp.time,timeZones[i].timeZone)
        result.push(
            {
                title: timeStr,
                arg:timeStr,
                subtitle:resp.GetStr(timeZones[i].subTitile?timeZones[i].subTitile:timeZones[i].timeZon),
            }
        )
    }
    return result
}



function format(time,timeZone) {
    ts = Number(time)

    date = new Date(Number(time));
    options = { timeZone:  timeZone};
    return date.toLocaleString('zh', options);
}