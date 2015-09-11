var _custId_=LS('cust_id');//用户id
var lv,ls,_lORt_;//list_view,当前显示列表
var carJson,N,nI,_carW_,temCitys;//用户车辆列表json，用户车辆数量，当前车辆,页面宽度（px）,城市列表

getCityList();//获取城市列表

var loading,list_body;

window.onload=function(){
	lv=C(".list_view");
	ml=E("msg_list");
	_carW_=E("msg_list").clientWidth;
	lv.addTouchF(touchCar,moveCar,endCar);
	getCusCar();
	loading=C(".loading_back");
	loading.style.display="block";
}

function touchCar(){//触摸开始事件
	lv.time=new Date().getTime();//记录当前时间，计算滑动速度时使用
	//lv.className=lv.className.replace(/tLeft/g,"");
	window._eLeft_=event.touches[0].screenX;
	window._eTop_=event.touches[0].screenY;
	window._lW_=-_eLeft_-lv.data_l;
	_lORt_=null;//左右滑动还是上下滑动的标志位
}
function moveCar(){//触摸移动事件
	var top=event.changedTouches[0].screenY-_eTop_;
	var _top=Math.abs(top);
	if(!_lORt_){
		var left=Math.abs(_eLeft_-event.changedTouches[0].screenX);
		if(left>_top)_lORt_="left";
		else if(!ls.scrollTop&&top>0)
			_lORt_="top";
		else if((ls.scrollHeight-ls.offsetHeight-ls.scrollTop)<3&&top<0)
			_lORt_="bottom";
	}
	event.preventDefault();	
	if(_lORt_=="left"){
		//lv.style.webkitTransform="translate3d("+(_lW_+event.changedTouches[0].screenX)+"px,0,0)";//左右滑动	
	}else if(_top<100&&(_lORt_=="top"||_lORt_=="bottom")){
		lv.style.webkitTransform="translate3d(-"+lv.data_l+"px,"+top+"px,0)";//下拉刷新
	}
}
function endCar(){//触摸结束事件
	var a,left=_lW_+event.changedTouches[0].screenX;//
	var b=left/-_carW_;
	a=Math.round(b);
	if(_lORt_=="left"){
		var s=event.changedTouches[0].screenX-_eLeft_;
		var time=new Date().getTime()-lv.time;//滑动所经历的时间长度
		var v=s/time;//滑动的平均速度
		a=Math.round(b+0.2*(-v)/Math.abs(v));
		if(v>0.8){
			a=Math.floor(b);
		}else if(v<-0.8){
			a=Math.ceil(b);
		}
	}else if(_lORt_=="top"||_lORt_=="bottom"){
		var s=Math.abs(event.changedTouches[0].screenY-_eTop_);
		if(s<100)_lORt_="else";
		loading.style.zIndex="1";
	}
	if(a>(N-1))a=(N-1);
	if(a<0)a=0;
	lv.v=v;
	slideTo(a);
	reloadTimeout(changeList,400,a);
}

function slideTo(i){
	lv.className="list_view tLeft";
	lv.data_l=i*_carW_;
	lv.style.webkitTransform="translate3d(-"+lv.data_l+"px,0,0)";
	ls=list_body[i];
	nI=i;
}

function changeList(i){
	//切换列表
	getAndShow(i);
	$(".n>div:eq("+i+")").addClass("active").siblings().removeClass("active");
	C(".nav_top>span").innerText=carJson[i].nick_name;
}

function getAndShow(i){//获取并展示该车辆的违章信息
	var id=carJson[i].obj_id;
	var list=C("#id_"+id+" .list_body");
	var vio_id="";
	if(list.is_load||_lORt_=="left"||_lORt_=="else")return;
	if(_lORt_=="bottom"){
		//如果列表已经拉到最底，则继续获取更下面的内容
		vio_id="&min_id="+list.getAttribute("data-vio_id");
	}
	
	var tem=getCityJ(carJson[i]);//返回该车辆是否缺乏发动机号车架号等信息
	if(tem){
		list.style.display="none";
		C(".total",list.parentElement).style.display="none";
		C("#id_"+id+">.tip_word>h4").innerText=tem;
		loading.style.zIndex="-1";
		return;
	}else{
		C(".tip_word",list.parentElement).style.display="none";
	}

	loading.style.zIndex="1";
	list.is_load=true;//防止获取数据时用户再发起请求数据
	$.ajax({
		url:_apiUrl_+"vehicle/"+id+"/violation?auth_code="+_authCode_+vio_id,
		type:"GET",
		dataType:"json",
		success:function(json){
			if(json.status_code){
				statusCode(json.status_code);
				return;
			}
			var data=json.data;
			var ht=E("vio_id").outerHTML;
			var h,date,htm="";
			for (var j=0;j<data.length;j++){
				date=changeDate(data[j].vio_time);
				h=ht.replace("action_content",data[j].action).replace("vio_time",date);
				h=h.replace("city",data[j].city).replace("location",data[j].location);
				h=h.replace("score",data[j].score).replace("fine",data[j].fine);
				h=h.replace("total_vio",data[j].total_vio).replace("total_complain",data[j].total_complain);
				h=h.replace(/vio_id/g,data[j].vio_id);

				htm+=h;
			};
			if(vio_id)
				list.innerHTML+=htm;
			else
				list.innerHTML=htm;
			//list.setAttribute("data-has","true");
			if(j){
				list.setAttribute("data-vio_id",data[j-1].vio_id);
				C("#id_"+id+" [name='length']").innerText=j;
				C("#id_"+id+" [name='total_fine']").innerText=json.total_fine;
				C("#id_"+id+" [name='total_score']").innerText=json.total_score;
			}else if(!vio_id){
				list.style.display="none";
				C(".total",list.parentElement).style.display="none";
				C("#id_"+id+">.tip_word>h4").innerText="没有违章记录";
				C(".tip_word",list.parentElement).style.display="block";
			}
			list.is_load=false;
			loading.style.zIndex="-1";
		}
	});
}

function getCusCar(){//构造列
	$.ajax({
	    url: _apiUrl_+"customer/"+_custId_+"/vehicle?auth_code="+_authCode_,
	    type: "GET",
	    dataType: "json",
	    async: true,
	    timeout: 10000,
	    success: function(json){
			if(json.status_code){
				statusCode(json.status_code);
				return;
			}
			carJson=json;
			var ht=E("car_id").outerHTML;
			var htm="",h="";
			N=carJson.length;
			for (var i=0;i<N;i++) {
				htm+=ht.replace("car_id","id_"+carJson[i].obj_id).replace("car_width",100/N);
				h+=" <div></div>";
			};
			lv.innerHTML=htm;
			lv.style.width=100*N+"%";
			C(".n").innerHTML=h;
			list_body=All(".list_body");
			for (var i =0;i<N;i++){
				getAndShow(i);
			}
			slideTo(0);
		}	
  	});
}

function toDetail(h){
	//跳到修改车辆信息页面
	setLS("carJson",carJson[nI],1);
	callView("carDetail");
	setTimeout(openDetail,200);
}
function coverBack(h){//iframe加载完调用,用于覆盖子页面内的方法，慎用
	h.contentWindow.history.back=function(){
			iframeViewBack('carDetail');
		}
	h.contentWindow.resultToParent=function(json){
		window.parent.resultJson(json);
	}
}
function openDetail(){
	var iframe=C("#carDetail iframe");
	if(iframe.src!="car_detail.html"){
		iframe.src="car_detail.html";
	}else{
		iframe.contentWindow.location.reload(true);
	}
}
function resultJson(json){//子页面提交完成后把提交后的车辆信息返回给父页面（即violation.html），父页面直接处理，不用到网络上获取
	json.vio_citys=eval(json.vio_citys);
	carJson[nI]=$.extend(carJson[nI],json);
	changeList(nI);
	viewBack(C("#carDetail iframe"));
}

function getCityList(){
	$.ajax({//获取城市列表
		url:_apiUrl_+"violation/city?cuth_code="+_authCode_,
		type:"GET",
		dataType: "json",
		success:function(json){
			if(json.status_code){
				statusCode(json.status_code);
				return;
			}
			temCitys=json.result;//城市列表的全局变量
		}
	});
}

function getCityJ(car){
	//比较出需要发动机号和车架号后几位
	var chCity=car.vio_citys
	var cityJ;
	var result=null;
	switch(chCity.length){
	case 0:
		result="没选择违章城市";
		return result;
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
	var frame=car.frame_no||"";
	var engine=car.engine_no||"";

	if(cityJ.classno==1&&!frame.length){
		result="需要完整的车架号";
	}else if(cityJ.classno>1&&frame.length<cityJ.classno){
		result="需要车架号后"+cityJ.classno+"位";
	}

	if(cityJ.engineno==1&&!engine.length){
		result+=result ? "以及完整的发动机号" : "需要完整的发动机号";
	}else if(cityJ.engineno>1&&engine.length<cityJ.engineno){
		result+=result ? "以及发动机号后"+cityJ.engineno+"位" : "需要发动机号后"+cityJ.engineno+"位";
	}
	return result;

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


function callAdd(){
	//打开处理地点界面
	callView("location_add");
	var city=carJson[nI].vio_citys[0].vio_city_name;
	$.ajax({
		url:_apiUrl_+"location?city="+city+"&type=3&cust_id="+_custId_+"&auth_code="+_authCode_,
		type:"GET",
		dataType: "json",
		success:function(json){
			if(json.status_code){
				statusCode(json.status_code);
				return;
			}
			showAdd(json);
		}
	});
}

function showAdd(shops){//绘制收藏界面
	var d='<div name="shop">'+E("shop_m").innerHTML+"</div>";
	var dd,htm="";
	for(var i=0;i<shops.length;i++){
		dd=d.replace(/title/g,shops[i].name).replace("number",(i+1));
		dd=dd.replace(/address/,shops[i].address);
		dd=dd.replace(/point_lon/,shops[i].lon).replace(/point_lat/,shops[i].lat);

		if(shops[i].tel)
			dd=dd.replace(/phoneNumber/g,shops[i].tel);
		else dd=dd.replace(/phoneNumber/g,"未找到联系电话");
		htm+=dd;
	}
	C("#location_add>.main").innerHTML=htm;
}

function callComplain(id){
	callView("complain");
	var location=E(id+"-title").innerText;
	E("location").innerText=location;

	$.ajax({
		url:"http://api.bibibaba.cn/violation_complain/"+location+"?auth_code="+_authCode_,
		type:"GET",
		dataType:"json",
		success:function(json){
			if(json.status_code){
				statusCode(json.status_code);
				return;
			}
			E("total_vio").innerText=json.total_vio;
			E("total_complain").innerText=json.total_complain;
			var data=json.data;
			var ht='<div class="complain"><h4>cust_name<span>create_time</span></h4><p>content</p></div>';
			var date,htm="";
			for (var i = data.length - 1; i >= 0; i--) {
				date=changeDate(data[i].create_time);
				htm+=ht.replace("cust_name",data[i].cust_name).replace("content",data[i].content).replace("create_time",date);
			};
			C("#complain .body").innerHTML=htm;
		}
	});
}

function sendComplain(){
	//发送吐槽
	var str=d_trim(E("complain_text").value);
	if(!str||str==""){
		alert("内容不能为空");
		return;
	}
	var location=E("location").innerText;
	var custName=LS("user",1).cust_name;
	$.ajax({
		url:_apiUrl_+"violation_complain?auth_code="+_authCode_,
		type:"POST",
		dataType:"json",
		data:{"location":location,"cust_name":custName,"content":str},
		success:function(json){
			if(json.status_code){
				statusCode(json.status_code);
				return;
			}
			tip("发送成功");
			C("#complain .body").innerHTML+='<div class="complain"><h4>'+custName+'<span>'+new Date().toString()+'</span></h4><p>'+str+'</p></div>';
			E("complain_text").value="";
		}
	});
}