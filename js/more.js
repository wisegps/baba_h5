window.onload=function(){
	$(".group>div").on("touchstart", function(){this.style.background="#efefef"});
	$(".group>div").on("touchend", function(){this.style.background="#fff"});
	var user=LS("user",1);
	$.ajax({
		url:_apiUrl_+"customer/"+user.cust_id+"?auth_code="+_authCode_,
		type:"GET",
		dataType:"json",
		success:function(json){
			if(json.status_code){
				statusCode(json.status_code);
				return;
			}
			C(".icon>img").src=json.logo;
			E("cust_name").innerText=json.cust_name;
			E("noti_count").innerText=json.noti_count;
			if(json.sex)
				E("sex").className="ico icon_woman";

			setLS("userData",json,1);
		}
	});
}



///收藏
function showFavorite(shops){//绘制收藏界面
	var d='<div name="shop" id="favorite_id">'+E("shop_m").innerHTML+"</div>";
	var dd,htm="";
	for(var i=0;i<shops.length;i++){
		dd=d.replace(/title/g,shops[i].name);
		dd=dd.replace(/favorite_id/g,shops[i].favorite_id);
		dd=dd.replace(/address/,shops[i].address);
		dd=dd.replace(/point_lon/,shops[i].lon);
		dd=dd.replace(/point_lat/,shops[i].lat);
		if(shops[i].tel)
			dd=dd.replace(/phoneNumber/g,shops[i].tel);
		else dd=dd.replace(/phoneNumber/g,"未找到联系电话");
		htm+=dd;
	}
	C("#my_favorite>.main").innerHTML=htm;
}
function intoFavorite(){
	//进入我的收藏
	callView('my_favorite');
	var custId=localStorage.getItem('cust_id');
	$.ajax({
		url:_apiUrl_+"customer/"+custId+"/favorite?auth_code="+_authCode_,
		type:"GET",
		dataType:"json",
		success:function(json){
			if(json.status_code){
				statusCode(json.status_code);
				return;
			}
			showFavorite(json);
			var n=All(".name_t");
			for (var i = n.length - 1; i >= 0; i--) {
				n[i].addTouchF(touchCar,Tmove,endCar);
			};
		}
	});
}
function touchCar(){//触摸开始事件
	this._eLeft_=event.touches[0].screenX;
}
function endCar(){//触摸结束事件
	var l=event.changedTouches[0].screenX-this._eLeft_;
	if(l>30){
		this.className="name_t";
	}else if(l<-30){
		this.className="name_t show_q";
	}
}
function del(h){
	//删除收藏
	var id=h.getAttribute("data-id");
	var q=$("#"+id);
	$.ajax({
		url:_apiUrl_+"favorite/"+id+"?auth_code="+_authCode_,
		type:"DELETE",
		dataType:"json",
		success:function(json){
			if(json.status_code){
				statusCode(json.status_code);
				q.show();
				tip("删除失败");
				return;
			}
			$("#"+id).remove();
		},
		error:function(err){
			q.show();
			tip("删除失败");
		}
	});
	q.hide();
}

function makeQRcode(){
	//生成二维码
}
