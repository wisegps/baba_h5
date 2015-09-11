var account,userCar;
var nameExist=true;

var params={};
window.onload=function(){
	addYear();
	var p=getHttp();
	$(".child_view:eq("+p["actType"]+")").show();
	account=E("account").innerText=p['account'];
	var json={"code":3,"account":p['account']};
	getIframe("#SMS>iframe").preset(json);
}

function iframeSuccess(code,PData){
	//短信验证完
	viewBack("SMS");
	params=PData;
	E("info").style.display="block";
}

function addYear(){
	var y=new Date().getFullYear();
	var html="";
	for(var i=0;i<100;i++){
		html+="<option>"+(y-i)+"</option>";
	}
	C("[name='year']").innerHTML=html;
}

function showCar(){//显示车型选择
	$("#car_series").show();
	$("#service_type").hide();
}
function showService(){//显示服务商选择
	$("#car_series").hide();
	$("#service_type").show();
}
function selectCar(){
	//选择车型
	$("#carSeries").show();
}

function hideCarSeries(){//
	$("#carSeries").fadeOut(300);
}
function hideAll(){
	$("#car_series").hide();
	$("#service_type").hide();
}

function resultCar(json){
	//选择完车型，返回车的json
	hideCarSeries();
	var carName=json.series+" "+json.type;
	C('[name="car_series"]').value=carName;
	userCar=json;
}

function submitInfo(){
	//提交注册信息
	if(nameExist){
		alert("该用户名已存在");
		return;
	}
	
	if(params.accType){
		params.mobile="";
		params.email=account;
	}else{
		params.mobile=account;
		params.email="";
	}
	params.password=$.md5(C('[name="pwd"]').value);
	params.cust_type=C('[name="cust_type"]:checked').value;
	params.sex=C('[name="sex"]:checked').value;
	params.birth=C('[name="year"]').value+"-01-01";
	params.province="";
	params.city="";
	if(params.cust_type==1){
		params.car_brand=userCar.brand;
		params.car_series=userCar.series;
		params.service_type=C('[name="service_type"]').value;
	}
	params.cust_name=C('[name="cust_name"]').value;
	params.remark="";

	var get=getHttp();
	if(get.openid){
		params.qq_login_id=get.openid;
		params.sina_login_id="";
		params.logo=get.headimgurl;
	}else{
		params.qq_login_id="";
		params.sina_login_id="";
		params.logo="";
	}
	

	params.code=4;
	getIframe("#SMS>iframe").preset(params);
}

function checkName(){
	//检测用户名是否存在
	var name=C('[name="cust_name"]').value;
	$.ajax({
		url:_apiUrl_+"exists?query_type=5&value="+name,
		type:"GET",
		dataType:"json",
		success: function(json){
			if(json.status_code){
				statusCode(json.status_code);
				if(json.err_msg){
					alert("发生错误："+json.err_msg+",点击确定返回上一页；错误码:"+json.status_code,
					function(){history.back()});
				}
			}else{
				nameExist=json.exist;
				if(json.exist)
					alert("该用户名已存在");
			}
		}
	})
}