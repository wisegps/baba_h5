onmessage=function(oEvent){
	switch(oEvent.data){
		case "start":
			run();
			break;
		default:
			var data;
			try{
				data=JSON.parse(oEvent.data);
			}catch(err){
				throw "传递了未定义命令";
				return;
			}
			for (items in data){
				DATA[items]=data[items];
			}
	}
}

var DATA={};//主线程传来的参数

function run(){//本线程的主方法，传入start命令时执行
	//设置获取一个月的信息
	var nowDate=new Date();
	var day=nowDate.toLocaleDateString().replace(/\//g,"-");
	var startDay=nowDate.getFullYear()+"-"+(nowDate.getMonth()+1)+"-01";
	nowDate.setMonth(nowDate.getMonth()+1);
	nowDate.setDate(nowDate.getDate()-1);
	var endDay=nowDate.getFullYear()+"-"+(nowDate.getMonth()+1)+"-"+nowDate.getDate();

	var carData=DATA.carData;
	var result={},tem={},id;
	for (var i=0;i<carData.length;i++){
		id=carData[i].device_id;
		if(!id)
			continue;
		tem.total=getTotal(carData[i],startDay,endDay);
		tem.health=getHealth(id);
		tem.drive=getDrive(id,day);
		tem.device=getDevice(id);
		result[id]=tem;
		returnDate(tem);
		tem=new Object();
	};
	returnDate(result);
	self.close();//关闭本线程，释放资源
}


function getTotal(car,startDay,endDay){//油耗花费
	var temJson=workerAjax({
	    url:DATA._apiUrl_+"device/"+car.device_id+"/total",
	    data:{
			auth_code: DATA._authCode_,
			start_day: startDay,
			end_day:endDay,
			gas_no:car.gas_no
	    },
	    type:"GET"
	});
	return temJson;
}

function getHealth(device_id){//健康指数
	var temJson=workerAjax({                      
	    url:DATA._apiUrl_+"device/"+device_id+"/health_exam?auth_code="+DATA._authCode_,
	    type:"GET"
  	});
  	return temJson;
}

function getDrive(device_id,day){//驾驶指数 
	var temJson=workerAjax({                    
		url:DATA._apiUrl_+"device/"+device_id+"/day_drive",
		data:{
		      auth_code: DATA._authCode_,
		      day: day
		    },
		type:"GET"
	});
	return temJson;
}

function getDevice(device_id){
	var temJson=workerAjax({//设备状态信息                  
	    url:DATA._apiUrl_+"device/"+device_id,
	    data:{
	          auth_code: DATA._authCode_
	        },
	    type:"GET"
  	});
	return temJson;
}






function workerAjax(json){//worker专用ajax，同步的
    var xmlhttp;
    if(XMLHttpRequest)
    	xmlhttp=new XMLHttpRequest();
    else
    	xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");//低版本ie兼容
    xmlhttp.json=json;//临时存储成功后执行的方法
    
    var data="";
    if(json.data){
	    for (items in json.data){
			data+="&"+items+"="+json.data[items];
		}
		if(json.type=="GET")
			json.url+="?"+data;
    }

	xmlhttp.open(json.type,json.url,false);
    xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    xmlhttp.send(data);

    var xmlDoc=xmlhttp.responseText;
    if(xmlhttp.json.dataType!="text")
        try{
            var json=JSON.parse(xmlDoc);
        }catch(err){
            var json={err_msg:"返回非预期结果",text:xmlDoc};
        }
    return json;
}

function returnDate(json){
	postMessage(JSON.stringify(json));
}