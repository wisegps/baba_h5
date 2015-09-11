var _custId_=localStorage.getItem('cust_id');//用户id
var userCar,carJson;
window.Bjson=ajaxSend("",_apiUrl_+"base/car_brand","GET");
window.onload=function(){
	$("#choose_province td").on("click",chooseProvince);
    carJson=LS("_userCar_",1);
	drawCar(carJson);
}

function drawCar(json){
	$("#main_div").empty();
	var html='<div class="car" id="device_id" data-brand_id="car_brand_id" data-obj-id="obj_id"><img src="url_icon"><div onclick="toDetail(this)"><div class="brank">car_series</div><div>nick_name</div></div>';
	var carView,temH,allH="";
	var main_div=document.createElement("div");
	var t0=new Date().getTime();
	for (var i = json.length - 1; i >= 0; i--) {
		temH=html;
		carView=document.createElement("div");
		carView.addTouchF(touchCar,Tmove,endCar);//绑定触摸事件
		carView.className="car_view";

		temH=temH.replace("car_series",json[i].car_series);
		temH=temH.replace("nick_name",json[i].nick_name);
		temH=temH.replace("car_brand_id",json[i].car_brand_id);
		temH=temH.replace("obj_id",json[i].obj_id);
		temH=temH.replace("url_icon",getImg(json[i].car_brand_id));

		if(json[i].device_id)
			temH=temH.replace("device_id",json[i].device_id);
		else{
			temH=temH.replace('id="device_id"',"");
			temH+="<div class='binding' onclick='addDevice(this)'></div>";
		}
		carView.innerHTML=temH+'</div><div class="q_setting"><div onclick="callSMS(this,0)"><div class="center_y">解除绑定</div></div><div onclick="callSMS(this,1)"><div class="center_y">修改终端</div></div><div onclick="askDelete()"><div class="center_y" style="height: 1.25em;">删除</div></div></div>';
		main_div.appendChild(carView);
	};
	var add=document.createElement("div");
	E("main_div").appendChild(main_div);
	E("main_div").appendChild(add);
	add.outerHTML='<div class="add_car" onclick="addCar()"><span class="ico icon_add"></span><div>添加爱车</div></div>'
}

function getImg(id){
	//获取车辆品牌图片
	for (var i = Bjson.length - 1; i >= 0; i--) {
		if(id==Bjson[i].id){
			if(Bjson[i].url_icon)
				return _imageUrl_+Bjson[i].url_icon;
			else return "img/icon_car_moren.png";
		}
	};
}

function addCar(){
	//添加爱车
	$("#carSeries iframe").attr("src","car_series.html");
	callView("add_car");
}

function chooseProvince(){
	//点击选择了省份
	var P=this.innerText;
	$("#province").text(P);
	$("#choose_province .back_div").click();
}

function hideCarSeries(){
	viewBack(C("#carSeries iframe"));
}
function resultCar(json){
	//选择完车型，返回车的json
	hideCarSeries();
	var carName=json.series+" "+json.type;
	C('[name="car_series"]').innerText=carName;
	userCar=json;
}

function add(){
	//提交车辆信息
	var name=d_trim(C('[name="nick_name"]').value);
	if(!userCar||name==""){
		alert("车辆名与车型为必填项");
		return;
	}
	var obj_name=d_trim(E("province").innerText)+d_trim(C("[name='obj_name']").value);
	var carObj={
			cust_id:_custId_,
			obj_name:obj_name,
			nick_name:name,
			car_brand_id:userCar.brandId,
			car_brand:userCar.brand,
			car_series_id:userCar.seriesId,
			car_series:userCar.series,
			car_type_id:userCar.typeId,
			car_type:userCar.type
		};

	$.ajax({
		url:_apiUrl_+"vehicle/simple?auth_code="+_authCode_,
		type:"POST",
		dataType: "json",
		data:carObj,
		success:function(json){
			if(json.status_code){
				statusCode(json.status_code);
				return;
			}
			carObj.obj_id=json.obj_id;
			carJson.push(carObj);
			setLS("_userCar_",carJson,1);
			drawCar(carJson);
			viewBack("add_car");
		}
	});
}

function touchCar(){//触摸开始事件
	this._eLeft_=event.touches[0].screenX;
}
function endCar(){//触摸结束事件
	var l=event.changedTouches[0].screenX-this._eLeft_;
	if(l>30){
		this.className="car_view";
	}else if(l<-30){
		this.className="car_view show_q";
	}
}

function toDetail(h){
	event.stopPropagation();
	var id=h.parentElement.getAttribute("data-obj-id");
	for (var i = carJson.length - 1; i >= 0; i--) {
		if(carJson[i].obj_id==id){
			setLS('carJson',carJson[i],1);
			self.location='car_detail.html';
			return;
		}
	};
	alert("该车辆不存在");
}

function deleteCar(b){
	if(!b)return;
	var obj_id=$("[delete]").attr("data-obj-id");
	$.ajax({
		url:_apiUrl_+"vehicle/"+obj_id+"?auth_code="+_authCode_,
		type:"DELETE",
		dataType: "json",
		success:function(json){
			if(json.status_code){
				statusCode(json.status_code);
				return;
			}
			$("[delete]").parent().remove();
			carJson=deleteC(obj_id);//从本地存储里删除车辆
		}
	})
}

function askDelete(){
	$(event.target).parents(".car_view").children(".car").attr("delete","true");
	myConfirm("确定删除该车辆？",deleteCar);
}

function addDevice(h){
	//启动绑定view
	var id=h.parentElement.getAttribute("data-obj-id");
	var car=getCarFromArr(id);
	if(!car)return;
	setLS('carJson',car,1);
	getIframe("#add_device iframe").preset();
	callView("add_device");
}

function callSMS(h,code){//进入验证环节
	var id=$(h).parents(".car_view").find(".car").attr("activity",code).attr("id");
	if(!id){
		alert("当前车辆没有绑定设备");
		return;
	}
	getIframe("#SMS iframe").preset({"code":code});
	callView("SMS");
}

function iframeSuccess(code){
	var id=C("[activity='"+code+"']").getAttribute("data-obj-id");
	var car=getCarFromArr(id);
	if(!car)return;
	switch(code){
		case 0:
			var removeUrl=_apiUrl_+"vehicle/"+car.obj_id+"/device?auth_code="+_authCode_;
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
							getCusCar(function(json){carJson=json})
							alert("解除绑定成功");
						}
					});
				},"是","否");
		    break;
		case 1:
			setLS('carJson',car,1);
			getIframe("#add_device iframe").preset();
			callView("add_device");
			break;
	}
}

function getCarFromArr(obj_id){
	for (var i = carJson.length - 1; i >= 0; i--) {
		if(carJson[i].obj_id==obj_id){
			return carJson[i];
		}
	};
}