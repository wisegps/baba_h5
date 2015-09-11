var _carJson_;//用户车辆信息
var _deviceId_;//当前显示设备的id
var _deviceCity_;//当前显示设备的所在城市
var _deviceGas_;//当前显示设备的汽油类型
var _car_;//当前车辆卡片(jq对象)
var _thisCar_;//当前车辆json
var _custId_=LS('cust_id');//用户id
var vw,_carW_;//车辆可滑动卡片,卡片宽度

var askId;//下一次询问状态
var cardId;//要显示的卡片
getLocation(function(position){
  var point = new BMap.Point(position.coords.longitude,position.coords.latitude);
  setLS('userPos',point,1); 
  var myGeo = new BMap.Geocoder();
  myGeo.getLocation(point, function(result){      
    if (result){
      setLS('userPosName',result,1); 
    }      
  });
});

window.onload=function(){//加载用户信息
  setCard();//按用户设置是否显示卡片
  getAndShow();
  showUserAdds();//绘制常用地址
  vw=E("car_view");
  _carW_=$("#car_view_p").width();
  vw.data_l=0;//偏移量
}

function getAndShow(){
  _carJson_=LS("_userCar_",1);
  if(!_carJson_.length){
    noDevice();
    return;
  }
  
  if(!_carJson_[0].device_id){//如果第一台车没有设备id（即没有绑定设备）
    for(var i=0;i<_carJson_.length;i++){//则遍历json直到找到一个有设备id的节点
      if(_carJson_[0].device_id){//如果第一辆车有id则跳出循环
        break;
      }else{
        var temp=_carJson_.shift();//弹出没有设备id的第一“辆车”
        _carJson_.push(temp);//放到最后
      }
    }
    if(!_carJson_[0].device_id){//全部都没有id
      makeCarCard();//构造车况卡片
      return;
    }
  }
  _deviceId_=_carJson_[0].device_id;
  _deviceGas_=_carJson_[0].gas_no;
  _thisCar_=_carJson_[0];

  makeCarCard();//构造车况卡片
  askAirDesc();//获取空气质量以及设备信息
  _car_=$("#"+_deviceId_);
  getCar();

  $("#btnStartClean").click(turnStatus);
  vw.addEvent("touchstart", function(){touchCar(event)}).addEvent("touchmove", function(){moveCar(event)}).addEvent("touchend", function(){endCar(event)})//绑定触摸开始事件
}

function mapInit(lon,lat){//创建地图
  if(!_deviceId_)return;
  var map = new BMap.Map("allmap");            // 创建Map实例
  var point = new BMap.Point(lon,lat); // 创建点坐标
  map.centerAndZoom(point,17);

  var marker = new BMap.Marker(point);
  marker.disableMassClear();
  map.addOverlay(marker);              // 将标注添加到地图中
  map.addControl(new BMap.NavigationControl({anchor:BMAP_ANCHOR_TOP_LEFT}));//添加放大缩小控件
  map.addControl(new BMap.MapTypeControl());//添加地图类型切换控件
  //map.addTileLayer(new BMap.TrafficLayer());//交通流量图层

  //获取用户地址描述
  getAdd(point);

  document._map_=map;
  document._marker_=marker;
  map.addEventListener("tilesloaded", function(){$("[_cid='1']span").css("opacity","0");});//隐藏地图底部文字
}

function getAdd(point){//根据坐标得到地址描述
  var myGeo = new BMap.Geocoder();
  myGeo.getLocation(point, function(result){      
    if (result){
      _car_.find("[name='address']").text(result.address);  
      _deviceCity_=result.addressComponents.city.slice(0,-1);
      setLS('address',result.address); 
      setLS('addPoint',point,1); 
    }      
  });
}


/*获取数据*/
var is_open = 1;
var canChange=true;

function askAirDesc() {//查询空气状况和设备信息
  if(!_deviceId_)return;
  var logUrl = _apiUrl_+"device/"+_deviceId_+"?auth_code="+_authCode_;
  var logData = {};
  var obj = {type: "GET", url: logUrl, data: logData, success: success, error: error };
  ajax_function(obj);
}

function switchAir(open) {//开启或关闭空气净化
  if(!_deviceId_)return;
  is_open = open;
  var logUrl = _apiUrl_+"command?auth_code="+_authCode_;
  var logData = {
    device_id: _deviceId_,
    cmd_type: 16451,
    params: {switch: open}
  };
  setAirStatus(is_open);
  canChange=false;
  setTimeout("canChange=true",10000);//至少3秒后才能再次更改显示的状态
  var obj = {type: "POST", url: logUrl, data: logData, success: function(json){
    if(json.status_code != 0){
      setAirStatus(!is_open);
      statusCode(json.status_code);
    }
  }, error: function(json){
    setAirStatus(!is_open);
    alert("设置失败");
  }};
  ajax_function(obj);
}

//获取空气信息成功后，更新界面显示
var success = function OnSuccess(json) {
  if (json == null) {
    $("#txtAirScore").html("找不到相应的信息。");
  } else {
    var air = json.active_gps_data.air;
    if(!air){
      //$("#mainCard").hide();
    }else {
      //$("#mainCard").show();
      var air_desc = "优";
      var air_color= "#fff";
      if(air <= 1300){
        air_desc = "优";
        air_color="#fff";
      }else if(air > 1300 && air <= 1500){
        air_desc = "良";
        air_color="#fff";
      }else if(air > 1500 && air <= 2000){
        air_desc = "中";
        air_color="#999";
      }else{
        air_desc = "差";
        air_color="#777";
      }

      $("#txtAirScore").html(air_desc);//显示优良中差
      $("#mainCard").css("background",air_color);//背景颜色
      drawCurve(air);//svg画曲线图
    }
    
    //更改位置
    if(document._map_){
      var map=document._map_;
      var marker=document._marker_;
      var point = new BMap.Point(json.active_gps_data.lon, json.active_gps_data.lat);
      setLS('active_gps_data',json.active_gps_data,1);
      if(point.lng!=marker.point.lng||point.lat!=marker.point.lat)map.panTo(point);
      marker.setPosition(point);
      getAdd(point);
    }else{
      mapInit(json.active_gps_data.lon,json.active_gps_data.lat);
    }

    if(canChange)
    setAirStatus(json.params.switch);// 更新空气净化器状态
  }
  askId=setTimeout(askAirDesc,10000);
};

var error = function OnError(XMLHttpRequest, textStatus, errorThrown) {//获取空气信息失败
  if (errorThrown || textStatus == "error" || textStatus == "parsererror" || textStatus == "notmodified") {
    $("#txtAirScore").html("查询异常，请检查网络。");
    return;
  }
  if (textStatus == "timeout") {
    $("#txtAirScore").html("查询超时，请检查网络。");
  }
};

function drawCurve(val){//画折线图，增加一个点
  var w=$(".curve_svg").width();
  var h=$(".curve_svg").height();
  if(val<1000)val=1000;
  if(val>2450)val=2400;
  val=(val-950)/1500*h;

  var curve=$("#curve");
  var points=curve.attr("points");
  if(points){
    var pointsArr=points.split(" ");
    if(pointsArr.length*10>=w*0.8){//曲线超长，则左移
      var svg=$(".curve_svg svg");
      var left=svg.css("left").split("px")[0];
      left-=10;
      var svgWidth=svg.width()*1+10;
      $(".curve_svg svg").css({"left":left+"px","width":svgWidth+"px"});
      if(pointsArr.length*10>=w)points=points.replace(/\d*,\d*.?\d* /,"");//删除第一个点
    }
    var last=pointsArr.pop();
    points+=" "+(last.split(",")[0]*1+10)+","+val;
  }else{
    points="0,"+val;
  }

  curve.attr("points",points);
}

function turnStatus(){//转换净化器状态
    if($("#btnStartClean").hasClass("on")){
      switchAir(0);
    }else{
      switchAir(1);
    }
}
function setAirStatus(open){//设置净化器状态
  if(open!=undefined&&open==1){
    //$("#AirStatus").removeClass("off");
    $("#btnStartClean").text("净化中").addClass("on");
    $("#mainCard .circle_turn").show();
  }else{
    //$("#AirStatus").addClass("off");
    $("#btnStartClean").text("开启净化").removeClass("on");;
    $("#mainCard .circle_turn").hide();
  }
}

function touchCar(e){//触摸开始事件
  //vw.time=new Date().getTime();//记录当前时间，计算滑动速度时使用

  vw.className=vw.className.replace(/tLeft/g,"");

  window._eLeft_=e.touches[0].screenX;
  window._eTop_=e.touches[0].screenY;
  window._lW_=vw.data_l-_eLeft_;
  window._lORt_=null;//左右滑动还是上下滑动的标志位
}
function moveCar(e){//触摸移动事件
    if(!_lORt_){
      var top=Math.abs(e.changedTouches[0].screenY-_eTop_);
      var left=Math.abs(_eLeft_-e.changedTouches[0].screenX);
      if(left>top)_lORt_="left";
    }
    if(_lORt_=="left"){
      vw.style.webkitTransform="translate3d("+(_lW_+e.changedTouches[0].screenX)+"px,0,0)";
      e.preventDefault();
    }
}
function endCar(e){//触摸结束事件
  var s=e.changedTouches[0].screenX-_eLeft_;
  if(Math.abs(s)<10)return;
  var left=_lW_+e.changedTouches[0].screenX;//vw.getAttribute("data-l");
  //var time=new Date().getTime()-vw.time;//滑动所经历的时间长度
  //var v=s/time;//滑动的平均速度

  //计算最终偏移量
  var b=left/-_carW_
  var a=Math.round(b+0.2*(-s)/Math.abs(s));
  /*if(v>0.8){
    a=Math.floor(b);
  }else if(v<-0.8){
    a=Math.ceil(b);
  }*/
  if(a>_carJson_.length-1)a=_carJson_.length-1;
  if(a<0)a=0;
  slideTo(a);
}

function slideTo(i){
  var a=i*_carW_
  vw.className+=" tLeft";
  vw.style.webkitTransform="translate3d(-"+a+"px,0,0)";
  vw.data_l=-a

  _deviceId_=_carJson_[i].device_id;
  _deviceGas_=_carJson_[i].gas_no;
  _car_=$("#"+_deviceId_);
  _thisCar_=_carJson_[i];

  clearTimeout(askId);//取消下一次询问请求，马上开始请求（消除延迟）
  setTimeout(function(){
    askAirDesc();//获取车辆的各种信息
    getCar();//获取车辆具体信息
  },300);
  
}

function getCar(){//获取车辆具体信息
  if(!_deviceId_)return;
  if(!_deviceCity_){setTimeout(getCar,10);return;}
  var nowDate=new Date();
  var startDay=nowDate.getFullYear()+"-"+(nowDate.getMonth()+1)+"-01";
  nowDate.setMonth(nowDate.getMonth()+1);
  nowDate.setDate(nowDate.getDate()-1);
  var endDay=nowDate.getFullYear()+"-"+(nowDate.getMonth()+1)+"-"+nowDate.getDate();

  $.ajax({//油耗花费
    url:_apiUrl_+"device/"+_deviceId_+"/total",
    data:{
          auth_code: _authCode_,
          start_day: startDay,
          end_day:endDay,
          city:_deviceCity_,
          gas_no:_deviceGas_
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
      _car_.find("[name='distance']").text(json.total_distance);
      _car_.find("[name='fuel']").text(json.total_fuel);
      _car_.find("[name='fee']").text(json.total_fee);
      setLS('monthData',json,1);
    }
  })

  $.ajax({//健康指数                      
    url:_apiUrl_+"device/"+_deviceId_+"/health_exam?auth_code="+_authCode_,
    type:"GET",
    dataType:"json",
    async: true,
    timeout: 10000,
    success: function(json){
      if(json.status_code){
        statusCode(json.status_code);
        return;
      }
      setaa(json.health_score,_car_.find("[name='health']"));
      setLS('healthData',json,1);
    }
  })

  var nowDate=new Date();
  var day=nowDate.toLocaleDateString().replace(/\//g,"-");
  $.ajax({//驾驶指数                      
    url:_apiUrl_+"device/"+_deviceId_+"/day_drive",
    data:{
          auth_code: _authCode_,
          day: day,
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
      setaa(json.drive_score,_car_.find("[name='drive']"));
      setLS('driveData',json,1);
    }
  })

  $.ajax({//设备状态信息                  
    url:_apiUrl_+"device/"+_deviceId_,
    data:{
          auth_code: _authCode_
          //brand: "大众"
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
      //显示图标
      _car_.find("[name='device_flag']").addClass("ico_state_"+json.device_flag);
      _car_.find("[name='signal_level']").addClass("ico_wifi_"+json.signal_level);
      _car_.find("[name='total_traffic']").text(json.total_traffic);
      _car_.find("[name='remain_traffic']").text(json.remain_traffic);
      setStatus(_car_.find("[name='stealth_mode']")[0],!json.stealth_mode);
      if(json.is_online)_car_.find("[name='address']").css("color","#1BADED").prev().attr("src","img/ico_location_on.png");
      else _car_.find("[name='address']").css("color","#aaa").prev().attr("src","img/ico_location_off.png");

      E("vibrate").value=json.params.sensitivity;
      E("vibrate_val").innerText=json.params.sensitivity;
      setLS('is_online',json.is_online);
    }
  })
}
function makeCarCard(){//构造车况卡片
  var html=E("car_id").outerHTML;
  var carV=E("car_view");
  var ht="",j=100/_carJson_.length;
  for(var i=0;i<_carJson_.length;i++){
    ht+=html.replace("car_id",_carJson_[i].device_id).replace("nick_name",_carJson_[i].nick_name).replace("_repace_width",j);
  }
  carV.style.width=i+"00%";
  carV.innerHTML+=ht;
}

function stealthMode(h){//隐身状态
  if(!_deviceId_)return;
  changeStatus(h);
  if(getStatus(h))mode=0;
  else mode=1;
  $.ajax({                     
    url:_apiUrl_+"device/"+_deviceId_+"/stealth_mode?auth_code="+_authCode_,
    data:{stealth_mode:mode},
    type:"PUT",
    dataType:"json",
    async: true,
    timeout: 10000,
    success: function(json){
      if(json.status_code){
        statusCode(json.status_code);
        changeStatus(h);
        return;
      }
    },
    error: function(){alert("设置错误")}
  })
}

function goTo(name){//跳转
  setCar();
  self.location=name+'.html';
}
function setCar(){
  var car_name=_car_.find("[name='car_name']").text();
  setLS('car_name',car_name);
  setLS('_deviceId_',_deviceId_);
  setLS('_deviceCity_',_deviceCity_);
  setLS('_deviceGas_',_deviceGas_);
  setLS('carJson',_thisCar_,1);
}

function callM(h){
  callView('card_manage');
  $(h).parents(".card").attr("data-taget","true").siblings("[data-taget='true']").attr("data-taget","");
}

function toTop(){
  var id=$("[data-taget='true']").attr("data-id");
  cardId=cardId.filter(function(a){return a!=id;});
  cardId.unshift(id);
  setLS("card_id",cardId,1);
  setCard();
}
function delCard(){
  var id=$("[data-taget='true']").attr("data-id");
  cardId=cardId.filter(function(a){return a!=id;});
  setLS("card_id",cardId,1);
  setCard();
}
function setCard(){
  $(".card").hide();
  if(!cardId)
    cardId=LS("card_id",1)||["air","map","car"];
  if(!cardId.length)
    cardId=allCard;
  var Acard=All(".card");
  var p=Acard[0].parentElement;
  var tem;

  for (var i = cardId.length - 1; i >= 0; i--) {
    tem=C("[data-id="+cardId[i]+"]");
    tem.style.display="block";
    p.removeChild(tem);
    p.insertBefore(tem,p.childNodes[1]);
  };
}











/*
*
*
*大地图视图所使用的函数
*/
function inToMap(){//进入大地图模式
  $('[name="map"]').removeClass("map").addClass("map_card");
  $("#nav_top").prepend('<div type="tem" style="padding-left:1.2em;position: absolute;" onclick="outMap()"><span class="ico nav_icon_back"></span></div><div type="tem" style="right:1.2em;position: absolute;z-index: 2;" onclick="$(\'.set_v\').show()"><span class="ico set"></span></div>');
  C("nav").className="";

  var userPos=LS("userPos",1);
  if(userPos){
    var point = new BMap.Point(userPos.lng,userPos.lat);
    __m(point);
  }else
    getLocation(function(position){
      var point = new BMap.Point(position.coords.longitude,position.coords.latitude);
      __m(point);
      $("#myPoint").attr({"data-lng":position.coords.longitude,"data-lat":position.coords.latitude})
    });

    
  function __m(point){
    var myIcon = new BMap.Icon("img/ico_location_on.png", new BMap.Size(44,44),{anchor: new BMap.Size(22,44)});
    var marker = new BMap.Marker(point, {icon: myIcon});// 创建标注
    marker.disableMassClear();
    document._map_.panTo(point);
    document._map_.addOverlay(marker);
    document._map_.user_M=marker;
  }
}
function outMap(){//退出大地图模式
  var map=document._map_;
  $('[name="map"]').removeClass("map_card").addClass("map");
  $("#nav_top [type='tem']").remove();
  C("nav").className="fromDown";

  map.user_M.enableMassClear();
  map.removeOverlay(map.user_M);
  map.user_M=null;
  cleanO();
  $('.set_v').fadeOut(300);
}
function cleanO(){//清除寻车和围栏
  var map=document._map_;
  if(map.driving){
    map.driving.clearResults();
    map.driving=null;
  }
  
  if(map.fence){
    map.fence.enableMassClear();
    setFence();
  }
}

function findMyCar(){
  //寻车
  var map=document._map_;
  var p1 = map.user_M.point;//起点
  var p2 = document._marker_.point;

  var driving = new BMap.DrivingRoute(map, {renderOptions:{map: map, autoViewport: true}});
  driving.search(p1, p2);
  map.driving=driving;
  map.panTo(p2);
}

function localSearch(){
  //周边搜索
  cleanO();
  var meun=C(".meun");
  if(meun.className=="meun")
    meun.className=meun.className+" show";
  else 
    meun.className="meun";
}
function setFence(){
  //弹出设置围栏菜单
  var map=document._map_;
  if(map.driving){
    map.driving.clearResults();
    map.driving=null;
  }
  var meun=E("set_fence");
  if(meun.className!="meun"){
    meun.className="meun";
    document._map_.removeOverlay(document._map_.fence);
    document._map_.fence=null;
    return;
  }

  meun.className=meun.className+" show";

  if(geo){
    var geo=_thisCar_.geofence;
    E("fence").value=geo.width/1000;

    if(geo.geo_type==0)
      $("#set_fence [type='checkbox']").attr("checked","true");
    else if(geo.geo_type==1){
      E("alarm_in").checked=true;
      E("alarm_out").checked=false;
    }
  }
  
  //往地图上添加一个圆形围栏
  setTimeout(addFence,500);
}

function addFence(){
  var map=document._map_;
  var r=$("#fence").val();
  if(!map.fence){//地图上没有覆盖物
    var circle = new BMap.Circle(map.user_M.point,1000*r,{strokeColor:"#000", strokeWeight:2, strokeOpacity:0.5,fillColor:"rgba(57,187,244,.6)"}); //创建圆
    circle.disableMassClear();
    map.addOverlay(circle);
    map.panTo(map.user_M.point);
    map.fence=circle;
  }else{
    map.fence.setRadius(1000*r);
  }

  map.setZoom(15-r/2.5);
  E("fenN").innerText=r;
}

function saveFence(){
  //保存围栏设置
  var _in=E("alarm_in").checked;
  var _out=E("alarm_out").checked;
  var geoType=0;
  if(_in&&!_out)geoType=1;
  else if(!_in&&_out)geoType=2;

  var map=document._map_;
  var point=map.fence.getCenter();

  var geo={geo_type:geoType,lon:point.lng,lat:point.lat,width:E("fence").value*1000};
  _thisCar_.geofence=geo;
  
  $.ajax({                     
    url:_apiUrl_+"vehicle/"+_thisCar_.obj_id+"/geofence?auth_code="+_authCode_,
    data:{
      geo:JSON.stringify(geo)
    },
    type:"PUT",
    async: true,
    timeout: 10000,
    success: function(json){
      if(json.status_code){
        statusCode(json.status_code);
        return;
      }
      tip("设置成功");
    },
    error: function(){alert("设置错误")}
  });
}
function removeFence(){
  //删除围栏
  $.ajax({                     
    url:_apiUrl_+"vehicle/"+_thisCar_.obj_id+"/geofence?auth_code="+_authCode_,
    type:"DELETE",
    async: true,
    timeout: 10000,
    success: function(json){
      if(json.status_code){
        statusCode(json.status_code);
        return;
      }
      document._map_.removeOverlay(document._map_.fence);
      _thisCar_.geofence=null;
      tip("删除成功");
    },
    error: function(){alert("删除错误")}
  });
}

function collectAdress(){
  //常用地址
  cleanO();
  $("#collect_adress").show();
}

function saveVibrate(){
  //保存灵敏度
  if(localStorage.getItem('is_online')!="true"){
    tip("当前车子已离线，无法进行灵敏度设置");
    return;
  }
  var val=E("vibrate").value;
  $('.set_v').fadeOut(300);
  tip("正在保存");
  $.ajax({                     
    url:_apiUrl_+"command?auth_code="+_authCode_,
    data:{
      device_id:_deviceId_,
      cmd_type:16391,
      params:"{sensitivity:"+val+"}"
    },
    type:"POST",
    async: true,
    timeout: 10000,
    success: function(json){
      if(json.status_code){
        statusCode(json.status_code);
        tip("保存失败");
        return;
      }
      tip("保存设置成功");
    },
    error: function(){tip("保存失败");}
  });
} 
function vibrateChange(){
  //灵敏度更改
  var val=E("vibrate").value;
  if(val==0)val="关";
  E("vibrate_val").innerText=val;
}
function chooseAdd(h){
  //选择地址
  $("#choose_add").css("display","flex");
  $(h).siblings(".addDiv[taget='this']").attr("taget","");
  $(h).attr("taget","this");
}
function addAddress(){
  //添加一个常用地址
  $(".addDiv[taget='this']").attr("taget","");
  $("#choose_add").show();
}
function searchAdd(e){
  //搜索地址
  if(e.keyCode!=32&&e.keyCode!=13)return;
  var map=document._map_;
  var text=E("search_text").value;
  var local = new BMap.LocalSearch(map);
  local.setPageCapacity(10);
  local.setSearchCompleteCallback(searchResult);
  local.search(text);
}
function searchResult(result){
  //搜索完成后显示到页面上
  if(!result){
    tip("没有搜索到相关地点");
    return;
  }
  var adds=result.Oq||result.Nq;
  var htm='<div data-lng="Plng" data-lat="Plat" onclick="chooseThis(this)"><span class="ico ico_search" style="z-index:2;position: relative;"></span>address</div>'
  var ht,Aht="";
  for(var i=0;i<adds.length;i++){
    ht=htm;
    ht=ht.replace(/address/,adds[i].title+"-"+adds[i].address);
    ht=ht.replace(/Plng/,adds[i].point.lng);
    ht=ht.replace(/Plat/,adds[i].point.lat);
    Aht+=ht;
  }
  E("search_result").innerHTML=Aht;
}
function chooseThis(h){
  //选择这个地址
  var lng=$(h).attr("data-lng");
  var lat=$(h).attr("data-lat");
  var add=d_trim($(h).text());
  if(add=="我的位置")add=localStorage.getItem('address');

  var userAdds=localStorage.getItem('userAdds');
  if(!userAdds)userAdds=[];
  else userAdds=JSON.parse(userAdds);
  for(;userAdds.length<2;userAdds[userAdds.length]={});//如果不足两个则补成两个

  var taget=$("[taget='this']");
  if(!taget.length){
    //添加一个常用地址
    taget='<div class="addDiv" data-lng="'+lng+'" data-lat="'+lat+'" data-i="'+userAdds.length+'"onclick="chooseAdd(this)"><br><span name="addDescription">'+add+'</span><div class="addIco"><span class="ico body_icon_lbs_l" onclick="navigationTo(this)"></span><span class="ico map_delete" onclick="deleteAdd(this)"></span></div></div>';
    $("#collect_adress").append(taget);

    userAdds[userAdds.length]={lng:lng,lat:lat,title:add};
  }else{
    if(userAdds.length){
      var i=taget.attr("data-i");
      userAdds[i].title=add;
      userAdds[i].lng=lng;
      userAdds[i].lat=lat;
    }else userAdds[userAdds.length]={lng:lng,lat:lat,title:add};

    taget.find("[name='addDescription']").remove();
    taget.attr({"data-lng":lng,"data-lat":lat});
    taget.find("br").after('<span name="addDescription">'+add+'</span>');
  }
  $("#choose_add").hide();
  setLS('userAdds',userAdds,1);
  event.stopPropagation();
  $("#allmap").css("z-index","0");
  $(".map_card").removeAttr("style");
  document._map_.clearOverlays(document._map_.lab);
  //document._map_.removeEventListener("click", showInfo);
  document._map_.removeEventListener("touchend", showInfo);
  document._map_.lab=null;
}
function navigationTo(h){
  //调用百度导航到
  event.stopPropagation();
  var addE=$(h).parents(".addDiv");
  var lat=addE.attr("data-lat");
  var lng=addE.attr("data-lng");
  var add=d_trim(addE.text());

  var url="bdapp://map/direction?origin=我的位置&destination=latlng:"+lat+","+lng+"|name:"+add+"&mode=driving&src=微车联";
  self.location=url;
}
function deleteAdd(h){
  //删除常用地址
  var userAdds=localStorage.getItem('userAdds');
  var taget=$(h).parents(".addDiv");
  var i=taget.attr("data-i");
  try{
    var userAdds=JSON.parse(userAdds);
  }catch(err){
    return;
  }
  if(i>1){
    //非“家”和“公司”
    userAdds.splice(i,1);
    taget.remove();
  }else{
    userAdds[i].title=userAdds[i].lng=userAdds[i].lat=null;
    taget.attr({"data-lng":"","data-lat":""});
    taget.find("[name='addDescription']").remove();
  }
  event.stopPropagation();
  setLS('userAdds',userAdds,1);
}
function showUserAdds(){
  //打开时展示用户的常用地址
  var userAdds=LS('userAdds');
  if(!userAdds)return;
  try{
    var userAdds=JSON.parse(userAdds);
  }catch(err){
    return;
  }

  for(var i=0;i<userAdds.length;i++){
    if(i>1){//非“家”和“公司”
      taget='<div class="addDiv" data-lng="'+userAdds[i].lng+'" data-lat="'+userAdds[i].lat+'" data-i="'+i+'"onclick="chooseAdd(this)"><br><span name="addDescription">'+userAdds[i].title+'</span><div class="addIco"><span class="ico body_icon_lbs_l" onclick="navigationTo(this)"></span><span class="ico map_delete" onclick="deleteAdd(this)"></span></div></div>';
      $("#collect_adress").append(taget);
    }else{
      if(userAdds[i].title)
      $(".addDiv[data-i='"+i+"']").attr({"data-lng":userAdds[i].lng,"data-lat":userAdds[i].lat}).find("br").after('<span name="addDescription">'+userAdds[i].title+'</span>');
    }
  }
}

function mapChoose(){
  //地图选点
  var map=document._map_;
  //map.addEventListener("click", showInfo);
  map.addEventListener("touchend", showInfo);
  $(".card.map_card,#allmap").css("z-index","10000");
}

function showInfo(e){
  var map=document._map_;
  var point = new BMap.Point(e.point.lng,e.point.lat);
  if(!map.lab){
    var opts = {
      position : point,    // 指定文本标注所在的地理位置
      offset   : new BMap.Size(0,0)    //设置文本偏移量
    }
    var label = new BMap.Label("加载地址中...", opts);  // 创建文本标注对象
    label.setStyle({
       fontSize:"1em",
       border:"none",
       borderRadius: ".35em",
       boxShadow:"4px 3px 10px rgba(0,0,0,.7)",
       padding:".5em"
    });
    map.addOverlay(label);
    map.lab=label;
  }else{
    map.lab.setContent("加载地址中...");
    map.lab.setPosition(point);
  }
  //获取地址描述
  var myGeo = new BMap.Geocoder();
  myGeo.getLocation(point,function(result){      
    if(result){
      document._map_.lab.setContent("<div onclick='chooseThis(this)' data-lng='"+e.point.lng+"' data-lat='"+e.point.lng+"'>"+result.address+"</div>");
      document._map_.lab.addEventListener("click",function(){
        $(this.K).find("div").click();
      });
    }      
  });
}