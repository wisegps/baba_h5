var carJson,chCity=[],cityJ={"engineno":"0","classno":"0"},carBST={};
var _custId_=localStorage.getItem('cust_id');
try{
	carJson=JSON.parse(localStorage.getItem('carJson'));
}catch(err){
	alert("错误页面进入",function(){history.back()});
}
preset();

var tem=LS("userPosName",1);
if(tem){
	var Ucity=tem.addressComponents.city.slice(0,-1);
}


$.ajax({//获取城市列表
	url:_apiUrl_+"violation/city?cuth_code="+_authCode_,
	type:"GET",
	dataType: "json",
	success:function(json){
		if(json.status_code){
			statusCode(json.status_code);
			return;
		}
		E("province_list").list=json.result;
		getCityJ();//比较出需要发动机号和车架号后几位
	}
});
$("#choose_province td").on("click",chooseProvince);
window.onload=function(){
	$.ajax({//获取保险公司列表
		url:_apiUrl_+"base/insurance",
		type:"GET",
		dataType: "json",
		success:function(json){
			var ht="<div onclick='chooseInsurance(this)'>insurance<small>insurance_tel</small></div>";
			var htm,allHt="";
			for (var i =0; i<json.length; i++) {
				htm=ht.replace("insurance",json[i].name);
				htm=htm.replace("insurance_tel",json[i].service_phone);
				//htm=htm.replace("Iid",json[i].id);
				allHt+=htm;
			};
			C("#insurance_list").innerHTML=allHt;
		}
	});

	$("#province_list option").on("click",function(){//监听省份点击事件
		$(this).addClass("active").siblings().removeClass("active");
		var pro=E("province_list");
		var city=E("city_list");
		var c=pro.list[this.value].citys;
		city.list=c;
		var htm="";
		for (var i=0;i<c.length;i++) {
			htm+="<option value="+c[i].city_code+" onclick='chooseCity(this)' data-i='"+i+"'>"+c[i].city_name+"</option>";
		};
		city.innerHTML=htm;
	});
}
function preset(){
	//预设值
	if(!carJson)return;
	for (items in carJson){//字符串先直接赋值
		$("[name="+items+"]").val(carJson[items]);
	}
	//需要特殊处理的特殊处理
	var series;//车型
	if(carJson.car_series_id!=carJson.car_type_id)
		series=carJson.car_series+carJson.car_type;
	else 
		series=carJson.car_series;
	C("[name=car_series]").value=series;
	carBST.seriesId=carJson.car_series_id;
	carBST.series=carJson.car_series;
	carBST.type=carJson.car_type;
	carBST.typeId=carJson.car_type_id;
	carBST.brand=carJson.car_brand;
	carBST.brandId=carJson.car_brand_id;

	var province="";//车牌
	var obj_name="";
	if(carJson.obj_name.length>0){
		obj_name=carJson.obj_name.slice(1);
		province=carJson.obj_name.slice(0,1);
		E("province").innerText=province;
	}
	C("[name=obj_name]").value=obj_name;

	if(carJson.vio_citys&&carJson.vio_citys.length>0){//违章城市
		chCity=carJson.vio_citys;
		showCityName();
	}
	//三个日期
	if(carJson.insurance_date)
		C("[name=insurance_date]").value=carJson.insurance_date.slice(0,10);
	if(carJson.annual_inspect_date)
		C("[name=annual_inspect_date]").value=carJson.annual_inspect_date.slice(0,10);
	if(carJson.buy_date)
		C("[name=buy_date]").value=carJson.buy_date.slice(0,10);
}

function deleteCar(b){
	if(!b)return;
	var obj_id=carJson.obj_id;
	$.ajax({
		url:_apiUrl_+"vehicle/"+obj_id+"?auth_code="+_authCode_,
		type:"DELETE",
		dataType: "json",
		success:function(json){
			if(json.status_code){
				statusCode(json.status_code);
				return;
			}
			deleteC(obj_id);//从本地存储里删除车辆
			history.back();
		}
	})
}

function askDelete(){
	myConfirm("确定删除该车辆？",deleteCar);
}

function resultCar(car){
	var series;
	if(car.seriesId!=car.typeId)
		series=car.series+car.type;
	else 
		series=car.series;
	C("[name=car_series]").value=series;
	carBST=car;
	hideCarSeries();
}
function hideCarSeries(){
	viewBack(C("#carSeries iframe"));
}
function chooseProvince(){
	//点击选择了省份
	var P=this.innerText;
	$("#province").text(P);
	$("#choose_province .back_div").click();
}
function chooseInsurance(h){
	//选择保险公司
	C("[name=insurance_company]").value=h.childNodes[0].nodeValue;
	C("[name=insurance_tel]").value=h.childNodes[1].innerText;
	viewBack(h);
}


function callCity(){
	C("#province_list option").click();
	callView('vio_citys');
}
function chooseCity(h){
	//选择城市
	var cJson={vio_location:h.value,vio_city_name:h.innerHTML,province:C("#province_list .active").value}

	for (var i = chCity.length - 1; i >= 0; i--) {//选择相同城市不处理
		if(cJson.vio_location==chCity[i].vio_location)return;
	};
	if(chCity.length>1){
		tip("最多选择两个城市");
		return;
	}
	if(chCity.length>0&&chCity[0].province=="粤"&&cJson.province=="粤"){
		tip("广东省内只需要添加一个城市即可");
		return;
	}
	chCity.push(cJson);
	showCityName();
	getCityJ();
	//var temJ=E("city_list").list[h.getAttribute("data-i")];//城市json对象
}
function showCityName(){
	//显示已选择的城市名
	var htm="",val="";
	for (var i = chCity.length - 1; i >= 0; i--) {
		htm+='<label><t>'+chCity[i].vio_city_name+'</t><span class="ico umeng_update_close_bg_normal" onclick="Dthis(this)" data-code="'+chCity[i].vio_location+'"></span></label>';
		val+=chCity[i].vio_city_name+" ";
	};
	C("[name=vio_city_name]").value=val;
	$("#citys").addClass("show").empty().append(htm);
}
function Dthis(h){
	//删除已选择的城市
	var code=h.getAttribute("data-code");
	for (var i =0;i<chCity.length; i++) {
		if(code==chCity[i].vio_location){
			chCity.splice(i,1);
			break;
		}
	};
	showCityName();
	getCityJ();
}
function getCityJ(){
	//比较出需要发动机号和车架号后几位
	var temCitys=E("province_list").list;
	switch(chCity.length){
	case 0:
		break;
	case 1:
		cityJ=_get(chCity[0].vio_location);
		break;
	default:
		var c0=_get(chCity[0].vio_location);
		var c1=_get(chCity[1].vio_location);
		if(c0.engineno<c1.engineno&&c0.engineno!=1)
			c0.engineno=c1.engineno;
		if(c0.classno<c1.classno&&c0.classno!=1)
			c0.classno=c1.classno;
		cityJ=c0;
	}
	//提示用户需要提供什么信息，车架号还是发动机号
	var frame=C('[name="frame_no"]');
	var engine=C('[name="engine_no"]');

	if(cityJ.classno==0||!cityJ.classno||cityJ.classno==""){
		frame.value="";
		frame.parentElement.style.display="none";
	}else if(cityJ.classno==1){
		frame.placeholder="需要完整的车架号";
		frame.parentElement.style.display="block";
	}else{
		frame.placeholder="需要车架号后"+cityJ.classno+"位";
		frame.parentElement.style.display="block";
		if(frame.value.length>cityJ.classno)
			frame.value=frame.value.slice(-cityJ.classno)
	}

	if(cityJ.engineno==0||!cityJ.engineno||cityJ.engineno==""){
		engine.value="";
		engine.parentElement.style.display="none";
	}else if(cityJ.engineno==1){
		engine.placeholder="需要完整的发动机号";
		engine.parentElement.style.display="block";
	}else{
		engine.placeholder="需要发动机号后"+cityJ.engineno+"位";
		engine.parentElement.style.display="block";
		if(engine.value.length>cityJ.engineno)
			engine.value=engine.value.slice(-cityJ.engineno)
	}
	function _get(code){
		var json={"engineno":"1","classno":"1"};
		for (items in temCitys){
			for (var i = temCitys[items].citys.length - 1; i >= 0; i--) {
				if(code==temCitys[items].citys[i].city_code){
					json.engineno=temCitys[items].citys[i].engineno;
					json.classno=temCitys[items].citys[i].classno;
					return json;
				}
			};
		}
	}
}

function save(){
	//提交修改后的资料
	var dataJson=getInput();
	if(cityJ.classno==0||!cityJ.classno||cityJ.classno==""){
	}else if(cityJ.classno==1&&dataJson.frame_no==""){
		tip("需要完整的车架号");
		return;
	}else if(dataJson.frame_no.length<cityJ.classno){
		tip("需要车架号后"+cityJ.classno+"位");
		return
	}

	if(cityJ.engineno==0||!cityJ.engineno||cityJ.engineno==""){
	}else if(cityJ.engineno==1&&dataJson.engine_no==""){
		tip("需要完整的发动机号");
		return;
	}else if(dataJson.engine_no.length<cityJ.engineno){
		tip("需要发动机号后"+cityJ.engineno+"位");
		return
	}

	$.ajax({
		url:_apiUrl_+"vehicle/"+carJson.obj_id+"?auth_code="+_authCode_,
		type:"PUT",
		dataType: "json",
		data:dataJson,
		success:function(json){
			if(json.status_code){
		        statusCode(json.status_code);
		    	return;
		    }
		    var userCar=LS("_userCar_",1);
		    for(var i=0;i<userCar.length;i++){
		    	if(userCar[i].obj_id=carJson.obj_id){
		    		$.extend(userCar[i],dataJson);
		    		setLS("_userCar_",userCar,1);
		    		break;
		    	}
		    }
		    self.location='add_car.html';
		    resultToParent(dataJson);
		}
	});
}
function resultToParent(){}//算是接口，供父页面实现调用
function getInput(){
	var input=All("#main_div input:not(.notneed),#main_div select:not(.notneed)");
	var json={};
	for (var i = input.length - 1; i >= 0; i--) {
		json[input[i].name]=d_trim(input[i].value);
	};
	if(json.obj_name!=""){
		json.obj_name=E("province").innerText+json.obj_name;
	}
	json.vio_citys=JSON.stringify(chCity).replace(/"vio_city_name":/g, "vio_city_name:").replace(/"vio_location":/g, "vio_location:").replace(/"province":/g, "province:");

	json.car_brand_id=carBST.brandId;
	json.car_series_id=carBST.seriesId;
	json.car_type_id=carBST.typeId;
	json.car_brand=carBST.brand;
	json.car_series=carBST.series;
	json.car_type=carBST.type;

	json.reg_no="";
	json.maintain_last_mileage="0";
	json.maintain_last_date="2014-10-10";
	return json;
}


//4s店
function callMaintain(){
	$.ajax({//获取4S店列表
		url:_apiUrl_+"base/dealer?city="+Ucity+"&brand="+carJson.car_brand+"&cust_id="+_custId_,
		type:"GET",
		dataType: "json",
		success:function(json){
			var ht="<div onclick='chooseMaintain(this)' data-tel='insurance_tel'>maintain</div>";
			var htm,allHt="";
			for (var i =0; i<json.length; i++) {
				htm=ht.replace("maintain",json[i].name);
				htm=htm.replace("insurance_tel",json[i].tel);
				allHt+=htm;
			};
			C("#maintain_list").innerHTML=allHt;
		}
	});

	callView('maintain');
}

function chooseMaintain(h){
	//选择4s
	C("[name=maintain_company]").value=h.innerText;
	C("[name=maintain_tel]").value=h.getAttribute("data-tel");
	viewBack(h);
}
function changeGas(){
	//获取油价
	$.ajax({
	url:_apiUrl_+"base/city/"+Ucity,
		type:"GET",
		dataType: "json",
		success:function(json){
			var gas=C("[name=gas_no]").value;
			var gasP=json.fuel_price;
			if(gas!=="0#"){
				gas=gas.slice(0,2);
				C("[name=fuel_price]").value=gasP["fuel"+gas];
			}else{
				C("[name=fuel_price]").value=gasP["fuel0"];
			}
		}
	})
}


function callSMS(h,code){//进入验证环节
	//$(h).parents(".car_view").find(".car").attr("activity",code);
	if(!carJson.device_id||carJson.device_id==0){
		tip("该车辆没有绑定设备");
		return;
	}
	getIframe("#SMS iframe").preset(code);
	callView("SMS");
}

function iframeSuccess(code){//验证结束后调用
	switch(code){
		case 0:
			var removeUrl=_apiUrl_+"vehicle/"+carJson.obj_id+"/device?auth_code="+_authCode_;
			myConfirm("验证成功，是否在解除绑定的同时清除终端的所有数据？",
				function(b){
					var p={device_id:0};
					if(b)deal_data=1;
					$.ajax({
						url:removeUrl,
						type:"PUT",
						data:p,
						dataType:"json",
						success:function(json){
							if(json.status_code){
								statusCode(json.status_code);
								alert("解除绑定失败");
								return;
							}
							getCusCar();
							carJson.device_id=null;
							alert("解除绑定成功");
						}
					});
				},"是","否");
		    break;
		case 1:
			//setLS('carJson',carJson,1);
			getIframe("#add_device iframe").preset();
			callView("add_device");
			break;
	}
}

var _getCusCar=getCusCar;
getCusCar=function(fun){
	carJson.device_id="虚假device_id";
	_getCusCar();
}