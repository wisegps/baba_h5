var car_name=localStorage.getItem('car_name');//设备的昵称
var carAddress=localStorage.getItem('address');//设备的位置

var date;

window.onload=function(){
	var nowDate=new Date();
	date=nowDate.getFullYear()+"-"+(nowDate.getMonth()+1)+"-"+nowDate.getDate();
	try{
		var driveData=LS('driveData',1).drive;
	}catch(err){
		getDataAndShow();
	}

	$("#car_name").text(car_name);
	$("#car_address").text(carAddress);
	showData(driveData);
}

function showData(json){
	var d=new Date(date.replace(/-/g,"/"));
	var week=["天","一","二","三","四","五","六"];
	$("#date").text(d.getFullYear()+"年"+(d.getMonth()+1)+"月"+d.getDate()+"日 星期"+week[d.getDay()]);

	$("[name='score']").text(json.drive_score);
	setaa(json.drive_score,$("[name='drive']"));
	$("#safe_score").text(json.safe_score);
	$("#eco_score").text(json.eco_score);
	$("#env_score").text(json.env_score);
	$("#quick_accel").text(json.quick_accel);
	$("#quick_break").text(json.quick_break);
	$("#quick_reflexes").text(json.quick_reflexes);
	$("#total_distance").text(json.total_distance);
	$("#total_fuel").text(json.total_fuel);
	$("#avg_fuel").text(json.avg_fuel);
	$("#drive_advice").text(json.drive_advice);
}

function next(b){
	var d=new Date(date.replace(/-/g,"/"));
	if(b) d.setDate(d.getDate()+1);
	else d.setDate(d.getDate()-1);

	date=d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
	getDataAndShow();
}

function getDataAndShow(){
	resetAA($("[name='drive'] .shan"));
	
	$.ajax({//驾驶指数                      
    url:_apiUrl_+"device/"+_deviceId_+"/day_drive",
    data:{
          auth_code: _authCode_,
          day: date
        },
    type:"GET",
    dataType:"json",
    async: true,
    timeout: 10000,
    success: function(json){
      if(json.status_code){
        statusCode(json.status_code);
        return;
      }
      showData(json);
    },
    error: function(){alert("获取车辆驾驶指数错误")}
  	})
}