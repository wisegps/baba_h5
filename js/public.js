var _apiUrl_="http://api.bibibaba.cn/";
var _imageUrl_= "http://img.wisegps.cn/logo/";
var _authCode_=localStorage.getItem('auth_code');//用户的authCode
var _deviceId_=localStorage.getItem('_deviceId_');//设备的id

/**
*@property {0x} COMMAND_SWITCH 开关指令
*@property {0x} COMMAND_AIR_MODE 设置净化模式指令
*@property {0x} COMMAND_AIR_SPEED 设置净化速度指令
*/
var define={
  COMMAND_SWITCH:0x4043, 
  COMMAND_AIR_MODE:0x4044, 
  COMMAND_AIR_SPEED:0x4045, 
}

if((!_authCode_||_authCode_=="")&&self.location.href.search("index.html")==-1){
      ajaxLogin();
}//未登录则直接跳到登录界面

function ajaxSend(str,url,type){//提交
    var async=arguments[3]?arguments[3]:false;
    var xmlhttp;
    if (window.XMLHttpRequest)
    {xmlhttp=new XMLHttpRequest();}
    else
    {xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");}//低版本ie兼容
    xmlhttp.tempF=arguments[4];//临时存储成功后执行的方法
    xmlhttp.open(type,url,async);
    xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    xmlhttp.send(str);
    
    if(async){
        xmlhttp.onreadystatechange=function (){//异步时需要执行
            if (xmlhttp.readyState==4&&xmlhttp.status==200){
                var xmlDoc=xmlhttp.responseText;
                try{
                    var json=JSON.parse(xmlDoc);
                }catch(err){
                    alert("返回非预期结果:"+xmlDoc);
                    return;
                }
                xmlhttp.tempF(json);
            }
        }
    }else{
        var xmlDoc=xmlhttp.responseText;
        try{
            var json=JSON.parse(xmlDoc);
        }catch(err){
            alert("返回非预期结果:"+xmlDoc);
            return;
        }
        return json;
    }
}

function setCookie(c_name,value,expiredays)
{
var exdate=new Date()
if(expiredays>1)exdate.setDate(exdate.getDate()+expiredays);
else if(expiredays>0)exdate.setHours(exdate.getHours()+expiredays*24);
else exdate.setMinutes(exdate.getMinutes()-expiredays);;
document.cookie=c_name+ "=" +escape(value)+
((expiredays==null) ? "" : ";expires="+exdate.toGMTString())
}

function getCookie(c_name)
{
if (document.cookie.length>0)
  {
  c_start=document.cookie.indexOf(c_name + "=")
  if (c_start!=-1)
    { 
    c_start=c_start + c_name.length+1 
    c_end=document.cookie.indexOf(";",c_start)
    if (c_end==-1) c_end=document.cookie.length
    return unescape(document.cookie.substring(c_start,c_end))
    } 
  }
return ""
}
  
function getUrlComponent(text){//url编码
return encodeURIComponent(d_trim(text));
}
function d_trim(str) {
    str=str.replace(/\\/g,"");
    str=str.replace(/(^\s*)|(\s*$)/g, "");
return str;
}

function getdecodeURI(text){//url解码
return und_trim(decodeURIComponent(text));
}
function und_trim(str) {
return str.replace(/\\'/g, "'");
}

function strdate(str){//字符串格式化转日期
    str = str.replace(/-/g,"/");
    return new Date(str);
}

function getHttp(){
    var url=location.search;
    if(!url)return {};
    url=url.split("?")[1].split("&");
    var arr=new Array();
    var n=url.length;
    for(var i=0;i<n;i++){
        arr[url[i].split("=")[0]]=getdecodeURI(url[i].split("=")[1]);
    }
    return arr;
}

function reloadTimeout(callback,timeout,param){//重载setTimeout方法，使其能调用参数
    var __sto = setTimeout; 
　　var args = Array.prototype.slice.call(arguments,2);//获取不定数量参数
　　var _cb = function() 
　　{ 
　　callback.apply(null,args); //传递不定数量参数
　　} 
　　__sto(_cb,timeout); 
}

function statusCode(code){
    switch (code){
      case 1:alert("操作失败，账号不存在");
        break;
      case 2:alert("操作失败，密码错误");
        break;
      case 7:alert("操作失败，超过访问频率");
        break;
      case 3:alert("操作失败，登录失效，为您重新登录？",ajaxLogin);
        break;
      case 6: alert("操作失败，设备条码不存在");
        break;
      case 15:alert("指令发送失败");
        break;
      default:alert("操作失败，未知错误；status_code="+code);
    }
}

function changeStatus(h){
    $(h).toggleClass("off");
}
function setStatus(h,b){
    if($(h).hasClass("off")){
        if(b)$(h).removeClass("off");
    }else{
        if(!b)$(h).addClass("off");
    }
}
function getStatus(h){
    return !$(h).hasClass("off");
}


function E(id){
    return document.getElementById(id);
}
function C(name){
    var h=arguments[1];
    if(h)
      return h.querySelector(name);
    return document.querySelector(name);
}
function All(name){
  var h=arguments[1];
    if(h)
      return h.querySelectorAll(name);
  return document.querySelectorAll(name);
}

/*
function getAddName(position){//获得用户经纬度后向百度获取地址描述
  var userPos=position.coords.latitude+","+position.coords.longitude;
  var url="http://api.map.baidu.com/geocoder/v2/?ak=DjMyWnXm12o3esdcWR8gIQLm&callback=renderReverse&location="+userPos+"&output=json";
  localStorage.setItem('userPos',userPos); 
}
function renderReverse(json){
  //百度获取地址描述成功后储存描述
  localStorage.setItem('userPosName',JSON.stringify(json)); 
}*/
function getUserPosName(){
  localStorage.getItem('userPosName'); 
}

function LS(name,isJson){
  var r=localStorage.getItem(name);
  if(r&&r!=""){
    if(isJson){
      try{
        return JSON.parse(r);
      }catch(err){
        return null;
      }
    }else return r;
  }else return null;
}
function setLS(name,val,isJson){
  if(isJson)
    localStorage.setItem(name,JSON.stringify(val)); 
  else 
    localStorage.setItem(name,val); 
}

function getIframe(name){
  return document.querySelector(name).contentWindow;
}

function ajaxLogin(){
    var userName=LS('userName');
    var userPwd=LS('userPwd');
    if(userPwd&&userPwd!=""&&userName&&userName!=""){
      $.ajax({
              url: _apiUrl_+"user_login",
              type: "GET",
              dataType: "json",
              data: {
                  account: userName,
                  password: userPwd
              },
              async: true,
              timeout: 10000,
              success: loginSuccess,
              error: loginError
          });
    }else{
      alert("您还没有登录，请登录",
        function(){
          if(location.href.indexOf("index.html")==-1)
            self.location='index.html'
        });
    }
}

function loginSuccess(json){
  if(json.status_code==0){
    setLS('cust_id',json.cust_id);
    setLS('auth_code',json.auth_code);
    setLS('user',json,1);

    _custId_=json.cust_id;
    _authCode_=json.auth_code;
    getCusCar();
  } else {
      //处理登录失败
      C(".loading_back").style.display="none";
      statusCode(json.status_code);
      localStorage.removeItem('userName');
      localStorage.removeItem('userPwd');
      if(location.href.indexOf("index.html")==-1)
        self.location='index.html'
  }
}
function loginError(jXMLHttpRequest, textStatus, errorThrown){
    alert("访问服务器发生错误，您可以重试或者联系我们；错误对象："+errorThrown+"；错误类型："+textStatus);
}

function getCusCar(){
  var fun=arguments[0]||function(json){self.location='main.html'};
  var now=new Date().getTime();
  var last=new Date(LS("_userCar_time")).getTime();
  if(now-last<900000){
    fun(LS("_userCar_",1));
    return;
  }
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
      setLS("_userCar_",json,1);
      setLS("_userCar_time",new Date());
      fun(json);
    },
    error: function(a,b,c){
      alert("用户信息加载出错")
    }
  });
}

function deleteC(obj_id){
  //从本地存储里删除车辆
  var _userCar_=LS("_userCar_",1);
  for (var i = carJson.length - 1; i >= 0; i--) {
    if(carJson[i].obj_id==obj_id){
      carJson.splice(i,1);
      break;
    }
  };
  setLS("_userCar_",_userCar_,1);
  return _userCar_;
}

function ajax_function(obj) {
    var datas = JSON.stringify(obj.data);
    $.ajax({
        url: obj.url,
        type: obj.type,
        dataType: "json",
        data: obj.data,
        async: true,
        timeout: 15000,
        success: obj.success,
        error: obj.error
    });
}


function aa(e){//分数动画
  var div=e.target;
  var i=div.getAttribute("name")*1;
  var Ni=i+1;

  var nextE=$(div).siblings("[name='"+Ni+"']");
  var deg0=nextE.attr("deg");

  if(i==3||!deg0){
    Sv=null;
    return;
  }
  $(div).css("opacity","0");
  nextE.css({"-webkit-transform":"rotate("+deg0+"deg)"});
}
function setaa(de,h){//分数动画
  var s=new Array();
  s.push(h.find(".shan>div:nth-of-type(3)")[0]);
  s.push(h.find(".shan>div:nth-of-type(1)")[0]);
  s.push(h.find(".shan>div:nth-of-type(2)")[0]);
  s.push(h.find(".shan>div:nth-of-type(4)")[0]);

  for (var i=0;i<s.length;i++) {
    s[i].addEventListener("webkitTransitionEnd", function(event){aa(event)});
  };

  h.find("[name='score']").text(de);
  de=de*2.5+55;
  if(de>305)de=305;

  for(var i=0;de>90;i++){
    de-=90;
    s[i].setAttribute("deg",90);
  }
  s[i].setAttribute("deg",de);
  var deg0=s[0].getAttribute("deg");
  s[0].style.webkitTransform='rotate('+deg0+'deg)translateZ(0)';
}
function resetAA(h){
    var htm="<div name='1'></div><div name='2'></div><div name='0'></div><div name='3'></div>";
    h.empty().append(htm);
}

function getLocation(callback){//获取用户地理经纬度
  if(navigator.geolocation){
    //alert("开始获取用户地理位置");
    navigator.geolocation.getCurrentPosition(callback||showPosition,getLocationError);
  }else{tip("您的浏览器不支持我们获取地位位置，可能有些功能无法使用");}
}
function showPosition(position)
{
  alert("Lat:"+position.coords.latitude+"Lon:"+position.coords.longitude);
}

function getLocationError(error){
  switch(error.code){
    case error.PERMISSION_DENIED:
      tip("您拒绝了我们获取您的位置，可能有些功能无法使用");
      break;
    case error.POSITION_UNAVAILABLE:
      tip("抱歉，系统无法获取您的位置，可能有些功能无法使用");
      break;
    case error.TIMEOUT:
      tip("抱歉，系统当前无法获取您的位置，可能有些功能无法使用");
      break;
    case error.UNKNOWN_ERROR:
      tip("抱歉，遭遇未知错误，系统无法获取您的位置，可能有些功能无法使用");
      break;
  }
}

function tip(str){
  var body=C("body");
  try{
    body.removeChild(C("._tip"));
  }catch(err){
    //找不到
  }

  var d=document.createElement("div");
  d.className="alert_tip";
  d.innerHTML="<div>"+(str||"操作成功")+"</div>";
  body.appendChild(d);
}

function viewBack(h){
  C("body").className="";
  if(h.parentElement)
    $(h).parents(".child_view").fadeOut(300);
  else $("#"+h).fadeOut(300);
}
function callView(id){
  C("body").className="callView";
  E(id).style.display="block";
}
function iframeViewBack(id){
  window.parent.$("#"+id).fadeOut(300);
}




Element.prototype.addEvent=function(type,listener){
    this.addEventListener(type,listener);
    return this;
}
Element.prototype.addTouchF=function(start,move,end){
    this.addEventListener("touchstart",start);
    this.addEventListener("touchmove",move);
    this.addEventListener("touchend",end);
    return this;
}
window._alert=window.alert;
window.alert=function(str,cb){//重载浏览器的alert方法，美化alert框
  if(!cb)cb=function(){};
  if(!window.alertArr)window.alertArr=new Array();
  if(E('alert')){//如果当前正在alert,则把str存进一个队列
    window.alertArr.push({text:str,callback:cb});
    return;
  }

  var alert_div=document.createElement("div");
  var alert_c=document.createElement("div");
  var alert_title=document.createElement("div");
  var alert_content=document.createElement("div");
  var alert_suer=document.createElement("div");
  alert_title.className="alert_title";
  alert_content.className="alert_content";
  alert_suer.className="alert_suer";
  alert_div.id="alert";

  alert_content.innerText=str;
  alert_suer.addEvent("touchstart",cleanAlert)

  alert_c.appendChild(alert_title);
  alert_c.appendChild(alert_content);
  alert_c.appendChild(alert_suer);
  alert_div.appendChild(alert_c);
  C("body").appendChild(alert_div);
  __alertCall=cb||function(){};
}
var __alertCall;
function cleanAlert(){
  //点击alert框的确定之后执行的方法
  C('body').removeChild(E('alert'));
  __alertCall();
  if(window.alertArr.length){
    var next=window.alertArr.shift();
    alert(next.text,next.callback);
  }
}
function myConfirm(str,callback,y,n){
  Ccallback=callback;
  var alert_div=document.createElement("div");
  C("body").appendChild(alert_div);
  if(!n){
    y="确定";
    n="取消";
  }
  alert_div.outerHTML='<div id="confirm"><div><div class="alert_title"></div><div class="alert_content">'+str+'</div><div class="confirm_suer"><div onclick="Csuer(false)">'+n+'</div><div onclick="Csuer(true)">'+y+'</div></div></div></div>';
}

var Ccallback;
function Csuer(b){
  C('body').removeChild(E("confirm"));
  Ccallback(b);
}

function logout(){
  localStorage.removeItem('cust_id');
  localStorage.removeItem('auth_code');
  localStorage.removeItem('userName');
  localStorage.removeItem('userPwd');
  self.location='index.html';
}

function noDevice(){
  //新注册用户，没有车辆信息
  myConfirm("您当前没有车辆信息，请至少添加一辆车辆",function(b){
    if(b)self.location='add_car.html';
  });
}

function isEmail(str){
  var exp=new RegExp("^([a-zA-Z0-9_\\-\\.]+)@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.)|(([a-zA-Z0-9\\-]+\\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\\]?)$");
  return exp.test(str);
}

function toMap(h){//启动用户的本地的百度地图应用进行导航
  var po=JSON.parse(localStorage.getItem('addPoint'));
  var addE=$(h).children("span");

  var lat=addE.attr("data-lat");
  var lng=addE.attr("data-lon");
  var add=addE.text();

  var url="bdapp://map/direction?origin=latlng:"+po.lat+","+po.lng+"|name:车辆当前位置&destination=latlng:"+lat+","+lng+"|name:"+add+"&mode=driving&src=微车联";
  self.location=url;
}

function collectAdress(h){//收藏终点
  var shop=$(h).parents("[name='shop']");
  var add=shop.find(".add span");

  var address=add.text();
  var lon=add.attr("data-lon");
  var lat=add.attr("data-lat");
  var name=shop.find(".name").attr("data-tit");
  var tel=shop.find(".tel a").attr("href").slice(4);

  var custId=localStorage.getItem('cust_id');

  name=prompt("请输入收藏的名称",name);
  if (name!=null && name!=""){
    $.ajax({//发送收藏
      url:_apiUrl_+"favorite?auth_code="+_authCode_,
      data:{
            cust_id: custId,
            name:name,
            address:address,
            tel:tel,
            lon:lon,
            lat:lat
          },
      type:"POST",
      async: true,
      timeout: 10000,
      success:function(){
        $(h).addClass("body_icon_collect_press");
      }
    })
  }
}

function changeDate(str){
  //var tem=str.replace(/[A-z]/g," ").replace(/\.\d*/g,"");
  var d=NewDate(str);
  //d.setHours(d.getHours()+8);
  return d.toString();
}

Date.prototype.toString=function(){
  var d=this;
  var j={};
  j.m=d.getMonth()+1;
  j.d=d.getDate();
  j.h=d.getHours();
  j.mi=d.getMinutes();
  j.s=d.getSeconds();
  for(items in j){
    if(j[items]<10)
      j[items]="0"+j[items];
  }
  return d.getFullYear()+"-"+j.m+"-"+j.d+" "+j.h+":"+j.mi+":"+j.s;
}

function NewDate(str) {
    var date = new Date();
    var str_before = str.split('T')[0]; //获取年月日
    var str_after = str.split('T')[1]; //获取时分秒
    var years = str_before.split('-')[0]; //分别截取得到年月日
    var months = str_before.split('-')[1] - 1;
    var days = str_before.split('-')[2];
    var hours = str_after.split(':')[0];
    var mins = str_after.split(':')[1];
    var seces = str_after.split(':')[2].replace("Z", "");
    var secs = seces.split('.')[0];
    var smsecs = seces.split('.')[1];
    date.setUTCFullYear(years, months, days);
    date.setUTCHours(hours, mins, secs, smsecs);
    return date;
}

function Tmove(){event.preventDefault();}

function s0(){
  window.t0=new Date().getTime();
}
function e0(){
  var t1=new Date().getTime();
  alert(t1-t0);
}

function encoded(str){
  var code={
  "000":":",
  "001":"/",
  "002":"_",
  "003":".",
  "004":"?",
  "005":"&",
  "006":"=",
  "007":"\\",
  "008":"+",
  "009":"-",
  "00a":"%",
  "00b":"#",
  "00c":"(",
  "00d":")",
  "00e":"{",
  "00f":"}",
  "00g":"[",
  "00h":"]",
  "00i":"|",
  "00j":";",
  "00k":">",
  "00l":"<",
  "00m":",",
  "00n":"!",
  "00o":"@",
  "00p":"$",
  "00q":"^",
  "00r":"*",
  "00s":"'",
  "00t":'"',
}
  //编码(让微信支持本地回调)本地开发时使用，上线不应该使用
  for (items in code){
    var r=new RegExp("\\"+code[items],"g");
    str=str.replace(r,items)
  }
  return str;
}

function is_weixin(){
  var ua = navigator.userAgent.toLowerCase();
  if(ua.match(/MicroMessenger/i)=="micromessenger") {
    return true;
  } else {
    return false;
  }
}