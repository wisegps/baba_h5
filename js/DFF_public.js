/**
*油耗里程花费详细里面使用用
*/
var _deviceCity_=localStorage.getItem('_deviceCity_');//当前显示设备的所在城市
var _deviceGas_=localStorage.getItem('_deviceGas_');//当前显示设备的汽油类型
var car_name=localStorage.getItem('car_name');//当前显示设备的昵称

window.onload=function(){//页面加载完之后执行，初始化
  setNowDate();
  try{
    var monthData=LS('carInfo',1).total;
  }catch(err){
    getDataAndShow();
  }
  
  $("#car_name").text(car_name);
  showData(monthData);
}


function next(b){//切换到下个月或者上个月或者星期
  var navId=$(".car_nav .active").attr("id");
  var start=$("#date").attr("data-start");
  var end=$("#date").attr("data-end");

  var day=0,month=0;
  if(navId=="nav_day")day=1;
  else if(navId=="nav_week")day=7;
  else month=1;

  var startDate=new Date(start.replace(/-/g,"/"));
  var endDate=new Date(end.replace(/-/g,"/"));
  if(!b){
    day=-day;
    month=-month;
    $(".btn_jiantou_lvse_zuo").show();
  }
  if(month){
    startDate.setMonth(startDate.getMonth()+month);

    endDate.setDate(1);
    endDate.setMonth(startDate.getMonth()+1);
    endDate.setDate(endDate.getDate()-1);
  }else{
    startDate.setDate(startDate.getDate()+day);
    endDate.setDate(endDate.getDate()+day);
  }
  var toDay=new Date();
  toDay.setDate(toDay.getDate()-1);
  if(endDate>toDay)$(".btn_jiantou_lvse_zuo").hide();

  var start=startDate.getFullYear()+"-"+(startDate.getMonth()+1)+"-"+startDate.getDate();
  var end=endDate.getFullYear()+"-"+(endDate.getMonth()+1)+"-"+endDate.getDate();
  $("#date").attr({"data-start":start,"data-end":end});

  getDataAndShow();
}

function setNowDate(){//load时候用，设置时间间隔为当前月
  var nowDate=new Date();
  var startDay=nowDate.getFullYear()+"-"+(nowDate.getMonth()+1)+"-01";
  nowDate.setMonth(nowDate.getMonth()+1);
  var endDay=nowDate.getFullYear()+"-"+(nowDate.getMonth()+1)+"-"+nowDate.getDate();

  var dateMonth=startDay.slice(0,-3);
  $("#date").text(dateMonth).attr({"data-start":startDay,"data-end":endDay});
}

function showData(json){//展示json里的数据
  $("#distance").text(json.total_distance);
  $("[name='fuel']").text(json.total_fuel);
    $("[name='fee']").text(json.total_fee);
    $("[name='avg_fuel']").text(json.avg_fuel);

    drawLine(json.fuel_data);//画曲线图
    drawDoughnut(json.pie)//画饼图
}


function getDataAndShow(){//从服务器获取数据，成功后调用showData（）
  var start=$("#date").attr("data-start");
  var end=$("#date").attr("data-end");

  var navId=$(".car_nav .active").attr("id");
  if(navId=="nav_month"){
    var date=new Date(start.replace(/-/g,"/"));
    var dateMonth=date.getFullYear()+"-"+(date.getMonth()+1);
    $("#date").text(dateMonth)
  }else if(navId=="nav_day"){
    $("#date").text(start);
  }else{
    $("#date").text(start+"--"+end);
  }

  $.ajax({//油耗花费
      url:_apiUrl_+"device/"+_deviceId_+"/total",
      data:{
        auth_code: _authCode_,
          start_day: start,
          end_day:end,
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
      error: function(){alert("获取车辆信息错误")}
    })
}

function drawLine(json){//画曲线图
  if(json.length<2){
    $("#line").hide();
    return;
  }else $("#line").show();
  var dataLabel=[];
  var dataVal=[];
  var j=0;
  var date,d;
  var week=["周日","周一","周二","周三","周四","周五","周六"];
  if($(".car_nav>.active").attr("id")=="nav_week")d=7;
  else{
    d=Math.abs($("#date").attr("data-end").slice(-2));
  };
  for(var i=0;i<d;i++){
    if(d==7){//周视图
      if(json[i])dataVal.push(json[i][type].toFixed(2));
      else dataVal.push(0);

      dataLabel.push(week[i]);
    }else{//月视图
      if(json[j])date=json[j].rcv_day.slice(8,10);
      if((date-1)==i){
        dataVal.push(json[j][type].toFixed(2));
        j++;
      }else dataVal.push(0);
      dataLabel.push(i+1);
    }
  }

  var ctx = document.getElementById("Line").getContext("2d");
    var data = {
      labels : dataLabel,
      datasets : [
        {
          fillColor : "rgba(151,187,205,0.5)",
          strokeColor : "rgba(151,187,205,1)",
          pointColor : "rgba(151,187,205,1)",
          pointStrokeColor : "#fff",
          data : dataVal
        }
      ]
    }
    var myNewChart = new Chart(ctx).Line(data);
}


function changeView(h){//切换日，周，月视图
  $(h).addClass("active").siblings().removeClass("active");

  var date=new Date();
  var start,end;
  $("#line").show();
  if(h.id=="nav_week"){//切换到周视图
    var weekDay=date.getDay();
    date.setDate(date.getDate()-weekDay);
    start=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
    date.setDate(date.getDate()+6);
    end=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
    $("#Line_title").text(lineTitle+"周曲线");
    $("#date").attr({"data-start":start,"data-end":end});
  }else if(h.id=="nav_day"){//日视图
    start=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
    end=start;
    $("#line").hide();
    $("#date").attr({"data-start":start,"data-end":end});
  }else{//月视图
    setNowDate();
    $("#Line_title").text(lineTitle+"月曲线");
  }
  $(".btn_jiantou_lvse_zuo").hide();
  getDataAndShow();
}

function setTitle(json){//饼图下的说明
  if(json.distance==0)json.distance="0km";
  if(json.fuel==0)json.fuel="0L";
  $("#speed_text").text(json.speed_text);
    $("#title_"+title).text(json[title]);
    $("#title_fuel").text(json.fuel);
}

function drawDoughnut(json){//画饼图
  var fuel=$("[name='fuel']").text();
  if(fuel==0){
    $("#pie").hide();
    return;
  }else $("#pie").show();
  var ctx = document.getElementById("Doughnut").getContext("2d");
  var idle=getVal;
  if(type="avg_fuel")idle=".avg_fuel.slice(0,-4)";
  var data = [
      {
        label: json.idle_range.speed_text,
        value: eval("json.idle_range"+idle),
        color:"#3CBFA0"
      },
      {
        label: json.speed1_range.speed_text,
        value: eval("json.speed1_range"+getVal),
        color : "#FFCC00"
      },
      {
        label: json.speed2_range.speed_text,
        value: eval("json.speed2_range"+getVal),
        color : "#EF7E4D"
      },
      {
        label: json.speed3_range.speed_text,
        value: eval("json.speed3_range"+getVal),
        color : "#5DB9E5"
      },
      {
        label: json.speed4_range.speed_text,
        value: eval("json.speed4_range"+getVal),
        color : "#3382CD"
      }
  ]
  var myNewChart = new Chart(ctx).Doughnut(data);

  setTitle(json.idle_range);

  document.getElementById("Doughnut").onclick = function(evt){
    var colorArr={"#3382CD":"speed4_range","#5DB9E5":"speed3_range","#EF7E4D":"speed2_range","#FFCC00":"speed1_range","#3CBFA0":"idle_range"};
      var activePoints = myNewChart.getSegmentsAtEvent(evt);
      var color=activePoints[0]["fillColor"];
      var taget=json[colorArr[color]];
      setTitle(taget);
  };
}