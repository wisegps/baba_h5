var carJson;

window.onload=function(){
	try{
		carJson=JSON.parse(localStorage.getItem('carJson'));
	}catch(err){
		alert("数据出错");
	}
	mapInit()
}

var map,marker;

function mapInit(){//创建地图
	var po=JSON.parse(localStorage.getItem('addPoint'));
	map = new BMap.Map("map");            // 创建Map实例
	var point = new BMap.Point(po.lng,po.lat); // 创建点坐标
	map.centerAndZoom(point,16);

	marker = new BMap.Marker(point);
	map.addOverlay(marker);              // 将标注添加到地图中
	map.addControl(new BMap.NavigationControl()); 

	map.addEventListener("tilesloaded", function(){$("[_cid='1']span").css("opacity","0");});//隐藏地图底部文字

	var local = new BMap.LocalSearch(map,   
              { renderOptions:{map: map}});
    local.disableFirstResultSelection();
    local.setPageCapacity(5);
    local.setSearchCompleteCallback(showCarShop);

    var wd=getHttp().wd||"汽修";
    local.searchNearby(wd,point);
    E("car_name").innerText=wd;
    C("title").innerText=wd;
}

function showCarShop(a){
	var shops=a.Oq||a.Nq;;
	var d='<div name="shop">'+E("shop_m").innerHTML+"</div>";
	var dd,htm="";
	var A=["A","B","C","D","E","F","G","H"];
	for(var i=0;i<shops.length;i++){
		dd=d.replace(/number/,A[i]);
		dd=dd.replace(/title/g,shops[i].title);
		dd=dd.replace(/address/,shops[i].address);
		dd=dd.replace(/point_lon/,shops[i].point.lng);
		dd=dd.replace(/point_lat/,shops[i].point.lat);
		if(shops[i].phoneNumber)
			dd=dd.replace(/phoneNumber/g,shops[i].phoneNumber);
		else dd=dd.replace(/phoneNumber/g,"未找到联系电话");
		htm+=dd;
	}
  E("detailed").innerHTML=htm;
}