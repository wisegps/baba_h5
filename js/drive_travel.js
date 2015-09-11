var car_name=localStorage.getItem('car_name');//设备的昵称
var _deviceCity_=localStorage.getItem('_deviceCity_');//城市
var _deviceGas_=localStorage.getItem('_deviceGas_');//汽油类型

var date,tripJson;//日期和行程数据

window.onload=function(){
  E("car_name").innerText=car_name;
  C(".nav_top>div").onclick=function(){history.back()};
	var nowDate=new Date();
	date=nowDate.getFullYear()+"-"+(nowDate.getMonth()+1)+"-"+nowDate.getDate();

	getDataAndShow();
}

function showData(json){
  tripJson=json;
  $("#main_body>.card").not("#one_card").remove();

	var d=new Date(date.replace(/-/g,"/"));
	var week=["天","一","二","三","四","五","六"];
	$("#date").text(d.getFullYear()+"年"+(d.getMonth()+1)+"月"+d.getDate()+"日 星期"+week[d.getDay()]);

  E("avg_fuel").innerText=json.avg_fuel+"L";
  E("total_distance").innerText=json.total_distance+"KM";
  E("total_fee").innerText=json.total_fee+"元";
  E("total_fuel").innerText=json.total_fuel+"L";

	var htm='<div class="card" id="trip_id" data-num="arr-num">'+E("one_card").innerHTML+'</div>';
  var main=$("#main_body");
  var tem,end_time,start_time,interval_time;

  for(var i=0;i<json.data.length;i++){
    tem=htm;
    tem=tem.replace("arr-num",i);

    if(json.data[i].trip_name){
      tem=tem.replace("trip_class","h4");
      tem=tem.replace("trip_name",json.data[i].trip_name);
    }
    else tem=tem.replace("trip_name","");

    tem=tem.replace("trip_id",json.data[i].trip_id);
    tem=tem.replace("cur_distance",json.data[i].cur_distance);
    tem=tem.replace("avg_fuel",json.data[i].avg_fuel);
    tem=tem.replace("cur_fuel",json.data[i].cur_fuel);
    tem=tem.replace("avg_speed",json.data[i].avg_speed);
    tem=tem.replace("cur_fee",json.data[i].cur_fee);

    end_time=changeTime(json.data[i].end_time);
    start_time=changeTime(json.data[i].start_time);

    end_time.setHours(end_time.getHours()+8);//转8小时时差
    start_time.setHours(start_time.getHours()+8);

    interval_time=(end_time.getTime()-start_time.getTime())/60000;

    tem=tem.replace("endT",json.data[i].end_time);
    tem=tem.replace("starT",json.data[i].start_time);

    tem=tem.replace("interval_time",interval_time);
    tem=tem.replace("end_time",end_time.getHours()+":"+end_time.getMinutes());
    tem=tem.replace("start_time",start_time.getHours()+":"+start_time.getMinutes());

    tem=tem.replace("start_lon",json.data[i].start_lon);
    tem=tem.replace("start_lat",json.data[i].start_lat);
    tem=tem.replace("end_lon",json.data[i].end_lon);
    tem=tem.replace("end_lat",json.data[i].end_lat);
    main.append(tem);
  }
  setAdd();
}

function next(b){
	var d=new Date(date.replace(/-/g,"/"));
	if(b) d.setDate(d.getDate()+1);
	else d.setDate(d.getDate()-1);

	date=d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
	getDataAndShow();
}

function getDataAndShow(){
	$.ajax({//驾驶指数                      
    url:_apiUrl_+"device/"+_deviceId_+"/trip",
    data:{
          auth_code: _authCode_,
          day: date,
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
      showData(json);
    },
    error: function(){alert("获取车辆驾驶指数错误")}
  	})
}

var add_i=2;

function setAdd(result){
  if(result){
    var td=$("[data-add='1']")[add_i];
    td.innerText=result.addressComponents.city+result.addressComponents.district+result.addressComponents.street+result.addressComponents.streetNumber;
    add_i++;
  }
  var lat,lon;
  var td=$("[data-add='1']")[add_i];
  if(td){
    lat=td.getAttribute("data-lat");
    lon=td.getAttribute("data-lon");
    var myGeo = new BMap.Geocoder();//根据坐标得到地址描述
    myGeo.getLocation(new BMap.Point(lon,lat),setAdd);
  }else add_i=2;
}

function changeTime(str){//把服务器返回的时间字符串转换为时间对象
  str=str.replace(/-/g,"/");
  str=str.replace(/[TZ]/g," ");
  var d=new Date(str);
  return d;
}

function showMap(h){//点击展示地图
  var card=$(h).parents(".card");
  var i=card.attr("data-num");
  var top=card[0].offsetTop-10-C("body").scrollTop;
  card.addClass("top").css("top",top+"px");
  var json=tripJson.data[i];
  card.append('<div id="allmap"></div>');
  reloadTimeout(mapInit,1000,json);

  C(".nav_top>div").onclick=clearMap;
}

function mapInit(json){//创建地图,画轨迹线
  var card=$("#allmap").parents(".card");

  var startLat=card.find("[name='start_add']").attr("data-lat");
  var startLon=card.find("[name='start_add']").attr("data-lon");
  window.map = new BMap.Map("allmap");            // 创建Map实例
  var point = new BMap.Point(startLon,startLat); // 创建点坐标

  //map.centerAndZoom(point,15);
  map.addControl(new BMap.NavigationControl());
  map.addEventListener("tilesloaded", function(){$("[_cid='1']span").css("opacity","0");});//隐藏地图底部文字

  var startTime=card.find("[data-starT]").attr("data-starT");
  var endTime=card.find("[data-endT]").attr("data-endT");

  $.ajax({//获取路程
    url:_apiUrl_+"device/"+_deviceId_+"/gps_data",
    data:{
          auth_code: _authCode_,
          start_time: startTime,
          end_time:endTime
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
      var line=[];
      for(var i=0;i<json.length;i++){
        line.push(new BMap.Point(json[i].lon,json[i].lat));
      }
      var size=new BMap.Size(25,25);
      var marker1 = new BMap.Marker(line[i-1]);        // 创建标注    
      var marker2 = new BMap.Marker(line[0]); //起点
      var myIcon2 = new BMap.Icon("img/body_icon_outset.png",size);
      var myIcon1 = new BMap.Icon("img/body_icon_end.png",size);
      myIcon1.imageSize=size;
      myIcon2.imageSize=size;
      marker2.setIcon(myIcon2);
      marker1.setIcon(myIcon1);
      map.addOverlay(marker1);
      map.addOverlay(marker2);
      //map.panTo(line[i-1]);
      var polyline = new BMap.Polyline(line,{strokeColor:"blue", strokeWeight:6, strokeOpacity:0.5});
      map.addOverlay(polyline);
      map.setViewport(line);
    }
  })
}

function clearMap(){//清除地图
  C(".nav_top>div").onclick=function(){history.back()};
  $("#allmap").remove();
  $(".card.top").removeClass("top");
}

function showMove(h){
  var id=$(h).parents(".card").attr("id");
  $('.set_v').fadeIn(300).attr("data-id",id);
}

function collectAdress(){//收藏终点
  var id=$('.set_v').attr("data-id");
  var endTd=$("#"+id).find("[name='end_add']");
  var address=endTd.text();
  var lon=endTd.attr("data-lon");
  var lat=endTd.attr("data-lat");
  var custId=localStorage.getItem('cust_id');

  var name=prompt("请输入收藏的名称",address);
  if (name!=null && name!=""){
    $.ajax({//发送收藏
      url:_apiUrl_+"favorite?auth_code="+_authCode_,
      data:{
            cust_id: custId,
            name:name,
            address:address,
            tel:"",
            lon:lon,
            lat:lat
          },
      type:"POST",
      async: true,
      timeout: 10000,
      success:function(){
        $('.set_v').fadeOut(300);
      }
    })
  }
}

function deleteTravel(){//删除行程
  var id=$('.set_v').attr("data-id");
  $('#'+id).attr("active","true");

  $.ajax({//发送收藏
    url:_apiUrl_+"device/trip/"+id+"?auth_code="+_authCode_,
    type:"DELETE",
    async: true,
    timeout: 10000,
    success:function(){
      $('.set_v').fadeOut(300);
      $("[active='true']").remove();
    }
  })
}

function renameTravel(){//重命名行程
  var id=$('.set_v').attr("data-id");
  $('#'+id).attr("active","true");

  var name=prompt("请输入名称","名称");
  if (name!=null && name!=""){
    $.ajax({
      url:_apiUrl_+"device/trip/"+id+"/name?auth_code="+_authCode_,
      data:{
            trip_name:name
          },
      type:"PUT",
      async: true,
      timeout: 10000,
      success:function(){
        $('.set_v').fadeOut(300);
        $("[active='true']").removeAttr("active").find("h4").text(name).addClass("h4");
      }
    })
  }
}

function actAvgFuel(){//录入油耗
  var id=$('.set_v').attr("data-id");
  var i=$('#'+id).attr("data-num");
  var fuel=tripJson.data[i].act_avg_fuel|"";

  var avgFuel=prompt("请输入实际油耗",fuel);
  if (avgFuel!=null && avgFuel!=""){
    tripJson.data[i].act_avg_fuel=avgFuel;
    $.ajax({//发送收藏
      url:_apiUrl_+"device/trip/"+id+"?auth_code="+_authCode_,
      data:{
            act_avg_fuel:avgFuel
          },
      type:"PUT",
      async: true,
      timeout: 10000,
      success:function(){
        $('.set_v').fadeOut(300);
      }
    })
  }
}

function toMap(h){//启动用户的本地的百度地图应用进行导航
  var addE=$(h).prev();

  var lat=addE.attr("data-lat");
  var lng=addE.attr("data-lon");
  var add=addE.text();

  var url="bdapp://map/direction?origin=我的位置&destination=latlng:"+lat+","+lng+"|name:"+add+"&mode=driving&src=微车联";
  self.location=url;
}