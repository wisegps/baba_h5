var _type={"dpdy":1,"jqmkd":2,"fdjzs":3,"sw":4,"chqwd":5}
var type;

function showData(name){
	type=name;
	var title={
		"dpdy":{"title1":"电源系统","title2":"蓄电池电压","lineTitle":"最近30天每日均值曲线","lineUnit":"V"},
		"jqmkd":{"title1":"进气系统","title2":"节气门开度","lineTitle":"最近30天每日均值曲线","lineUnit":"%"},
		"fdjzs":{"title1":"怠速控制系统","title2":"怠速状态","lineTitle":"最后行程怠速曲线","lineUnit":"rpm"},
		"sw":{"title1":"冷却系统","title2":"水温状态","lineTitle":"最近30天每日均值曲线","lineUnit":"°C"},
		"chqwd":{"title1":"排放系统","title2":"三元催化器状态","lineTitle":"最近30天每日均值曲线","lineUnit":"°C"},
	}
	$("#type_name").text(title[type].title1);
	$("#title").text(title[type].title2);
	$("#line_title").text(title[type].lineTitle);
	$("#line_unit").text(title[type].lineUnit);



	$.ajax({
		url:_apiUrl_+"device/"+_deviceId_+"/obd_data",
		data:{
			auth_code:_authCode_,
			type:_type[type]
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

	      	$("#range").text(json.range);

			var temp="状态良好";
			var t_class="";
			if(json.if_err){
				temp="状态异常";
				t_class="err";
			}
			$("#err").text(temp).addClass(t_class);
			

			if(json.if_lt_err){
				temp="状态异常";
				t_class="err";
			}else{
				temp="状态良好";
				t_class="";
			}
			$("#lt_err").text(temp).addClass(t_class);;


			if(!json.long_term_value)temp="未检测到数据";
			else temp=json.long_term_value.toFixed(2);
			$("#val").text(temp);

			if(!json.last_trip_value)temp="未检测到数据";
			else temp=json.last_trip_value.toFixed(2);
			$("#lt_val").text(temp);

			getTip(json.url);

			if(type=="chqwd")$('[name="line"]').hide();
			else getChartData();
	    },
	    error: function(){alert("获取详细数据发生错误")}
	})
}

function getTip(url){
	$.ajax({                     
	    url:url,
	    type:"GET",
	    dataType:"text",
	    async: true,
	    timeout: 10000,
	    success: function(text){    	
	    	var start=text.indexOf('<p');
	    	var end=text.indexOf("</p>");
	    	var content=text.slice(start,end);
	    	$("[name='tip']").html(content+"</p>");
	    },
	    error: function(){alert("小贴士获取错误")}
  	})
}

function getChartData(){
	$.ajax({
		url:_apiUrl_+"device/"+_deviceId_+"/obd_data_chart",
		data:{
			auth_code:_authCode_,
			type:_type[type]
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
	      	if(!json.length){
	      		$("[name='line']").hide();
	      		return;
	      	}else
	      		$("[name='line']").show();

			var dataVal=[];
			var dataLabel=[];
			var temp;
			for(var i=0;i<31;i++){//构造数据
				temp=getChartJson(json,i+1)
				if(temp!=-1){
					dataVal.push(temp);
					dataLabel.push(" ");
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
	    },
	    error: function(){alert("获取最近一个月数据发生错误")}
	})
}

function getChartJson(json,index){
	for(var i=0;i<json.length;i++){
		if(json[i]._id==index){
			return json[i].avg_value;
		}
	}
	return -1;
}