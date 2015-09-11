var openId=getHttp().open_id;

if(_authCode_){
	_custId_=LS("cust_id");
	getCusCar();
}else{
	if(is_weixin()){
		if(openId){
			C(".loading_back").style.display="block";
			$.ajax({
				url:_apiUrl_+"sso_login?login_id="+openId,
				type:"GET",
				dataType:"json",
				success:function(json){
					if(json.status_code){
						if(json.status_code==1){
							alert("您当前是第一次授权，请进行普通登录绑定账号，或注册一个新账号");
							C(".nav_top").innerText="绑定账号";
							C("#mainCard [type='submit']").value="绑定叭叭账号";
							C(".loading_back").style.display="none";
							return;
						}
					}else{
						//登录成功
						loginSuccess(json);
					}
				}
			})
		}else{//微信下跳转授权页面
			var url=location.href.replace("index.html","oauth2.php");//测试使用
			url=url.replace(/\?\S*/,"");
			url=encoded(url);
			self.location="https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxa5c196f7ec4b5df9&redirect_uri=http://php.bibibaba.cn/jump.html&response_type=code&scope=snsapi_userinfo&state="+url+"#wechat_redirect";

			//上线写死
			//self.location="https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxa5c196f7ec4b5df9&redirect_uri=http://php.bibibaba.cn/oauth2.php&response_type=code&scope=snsapi_userinfo&state=1#wechat_redirect";
		}
	}
}




function login(){//登录
	C(".loading_back").style.display="block";
	var userName=d_trim($("[name='account']").val());
	var userPwd=$("[name='password']").val();
	if(!userPwd||!userName||userName==""||userPwd==""){
	alert("请填写用户名和密码");
	C(".loading_back").style.display="none";
	return;
	}
	setLS('userName',userName);
	setLS('userPwd',$.md5(userPwd));
	setLS('userPwdA',userPwd);
	if(openId){
		//绑定第三方账号
		loginSuccess=function(json){
			C(".loading_back").style.display="none";
			C(".loading_back>span").innerText="绑定中……";
			$.ajax({
				url:_apiUrl_+"customer/"+json.cust_id+"/bind_qq?auth_code="+json.auth_code,
				type:"PUT",
				dataType:"json",
				data:{qq_login_id:openId},
				success:function(json){
					if(json.status_code){
						alert("绑定失败，请重试");
						C(".loading_back").style.display="none";
						return;
					}
					alert("绑定成功，可以正式使用了",function(){self.location='main.html'});
				}
			});
		}
	}
	ajaxLogin();
}

function register(){
	//开始注册
	var account=d_trim(E("register_account").value);
	var type=2;
	if(account.length==11&&!isNaN(account)){
		type=0;
	}else if(isEmail(account)){
		type=1;
	}else{
		alert("该手机或者邮箱格式不正确，请确认");
		return;
	}
	$.ajax({//发送注册账号给服务器
		url:_apiUrl_+"exists?query_type=6&value="+account,
		type:"GET",
		dataType:"json",
		success: function(json){
			//处理返回结果
			if(json.exist){
				alert("该手机或者邮箱已注册，您可以进行登录");
			}else{
				self.location='register.html?account='+account;
			}
		}
	})
}

function callSMS(h,code){//进入验证环节
	getIframe("#SMS iframe").preset({"code":code});
	callView("SMS");
}

function iframeSuccess(code,account){//验证结束后调用
	switch(code){
		case 2:
			tip("重置密码成功，您现在可以使用新密码登录了");
			viewBack("SMS");
		    break;
	}
}

window.onload=function(){
    C("[name='account']").value=LS('userName');
	C("[name='password']").value=LS('userPwdA');
}