var user,validCode,accType,account,file;
window.onload=function(){
	if(!user)
		user=LS("userData",1);
	else
		setLS("userData",user,1);
	E("logo").src=user.logo;
	C("[name='name']").value=E("name").innerText=user.cust_name;
	E("mobile").innerText=user.mobile;
	E("email").innerText=user.email;
	C("[name=birthday]").value=E("birthday").innerText=changeDate(user.birth).slice(0,10);
	if(user.sex)
		E("sex").innerText="女";
}

function changeLogo(str){
	//更改头像
	var json,logo=E("logo");
	try{
		json=JSON.parse(str);
	}catch(err){
		alert("上传错误："+str);
		logo.className="";
		return;
	}
	if(json.status_code){
		statusCode(json.status_code);
		logo.className="";
		return;
	}
	user.logo=json.image_file_url;
	update("logo",json.image_file_url,function(json){
		logo.className="";
		if(json.status_code){
			statusCode(json.status_code);
			user.logo=logo.src;
			return;
		}
		tip("修改头像成功");
		onload();
	})
}
function changeMobile(b){
	//更改手机
	accType=b;
	callView("mobile_view");
	var tem=C("[name=mobile]");

	if(accType){
		tem.value=user.email;
		tem.setAttribute("placeholder","请输入新邮箱");
		C("#mobile_view>.nav_top>span").innerText="修改邮箱";
		All("#code_view p>span")[0].innerText="邮箱";
	}else{
		tem.value=user.mobile;
		tem.setAttribute("placeholder","请输入新手机号码");
		C("#mobile_view>.nav_top>span").innerText="修改手机";
		All("#code_view p>span")[0].innerText="号码";
	}
}
function changeName(){
	//更改昵称
	//检测用户名是否存在
	var name=C('[name="name"]').value;
	$.ajax({
		url:_apiUrl_+"exists?query_type=5&value="+name,
		type:"GET",
		dataType:"json",
		success: function(json){
			if(json.status_code){
				statusCode(json.status_code);
				if(json.err_msg){
					alert("发生错误："+json.err_msg+",请重试；错误码:"+json.status_code);
				}
			}else{
				if(json.exist){
					tip("该用户名已存在");
					return;
				}
				update("cust_name",name,function(json){
					if(json.status_code){
						statusCode(json.status_code);
						return;
					}
					tip("修改成功");
					user.cust_name=name;
					onload();
					viewBack("name_view");
				})
			}
		}
	})
}
function changeSex(i){
	//更改性别
	update("sex",i,function(json){
		if(json.status_code){
			statusCode(json.status_code);
			return;
		}
		tip("修改成功");
		user.sex=i;
		onload();
		$('.sex').hide();
	});
}
function changeBirthday(){
	//更改生日
	var date=C("[name='birthday']").value;
	var k=checkD(date);
	if(k){
		if(k<1||k>3){
			tip("日期格式不正确");
			return;
		}else{
			var w=["","年份不正确","月份不正确","日期不正确"];
			tip(w[k]);
			return;
		}
	}
	update("birth",date,function(json){
		if(json.status_code){
			statusCode(json.status_code);
			return;
		}
		tip("修改成功");
		user.birth=date;
		onload();
		$('.birthday').hide();
	});
}
function changePwd(){
	//更改密码
	var oldPwd=$.md5(C("[name=old_pwd]").value);
	var newPwd=$.md5(C("[name=new_pwd]").value);
	var newPwd2=$.md5(C("[name=new_pwd2]").value);

	if(oldPwd!=LS("userPwd")){
		tip("旧密码不正确");
		return
	}
	if(newPwd!=newPwd2){
		tip("两次输入的新密码不一致");
		return
	}

	update("password",newPwd,function(json){
		if(json.status_code){
			statusCode(json.status_code);
			return;
		}
		setLS("userPwd",newPwd);
		tip("修改成功");
		viewBack("pwd_view");
	});
}


function sendCode(){
	//验证手机或邮箱
	account=d_trim(C("[name=mobile]").value);
	All("#code_view p>span")[1].innerText=account;
	if(accType){
		if(!isEmail(account)){
			tip("邮箱格式不正确");
			return;
		}
	}else{
		if(account.length!=11||isNaN(account)){
			tip("手机号码格式不正确");
			return
		}
	}
	$.ajax({//发送注册账号给服务器
		url:_apiUrl_+"exists?query_type=6&value="+account,
		type:"GET",
		dataType:"json",
		success: function(json){
			if(json.exist){
				if(accType)
					tip("该邮箱已经被注册");
				else
					tip("该手机已经被注册");
			}else{
				callView("code_view");
				if(accType){
					url =_apiUrl_+"valid_code/email?email="+account+"&type=1";
				}else{
					url =_apiUrl_+"valid_code?mobile="+account+"&type=1";
				}
				$.ajax({//发送注册账号给服务器
					url:url,
					type:"GET",
					dataType:"json",
					success: function(json){
						//处理返回结果
						if(json.status_code){
							statusCode(json.status_code);
							if(json.err_msg){
								alert("发生错误："+json.err_msg+",请重试；错误码:"+json.status_code);
							}
						}else{
							//发送验证码成功
							validCode=json.valid_code;
						}
					}
				})
			}
		}
	})
}

function checkCode(){
	var code=C("[name='code']").value;
	var pwd=$.md5(C("[name='pwd']").value);
	if(pwd!=LS("userPwd")){
		tip("登录密码不正确");
		return;
	}
	if(code!=validCode){
		tip("验证码不正确");
		return;
	}
	var fieldName="mobile";
	if(accType)
		fieldName="email";
	update(fieldName,account,function(json){
		if(json.status_code){
			statusCode(json.status_code);
			return;
		}
		tip("修改成功");
		if(accType){
			user.mobile=account;
		}else{
			user.email=account;
		}
		onload();
		viewBack("mobile_view");
		viewBack("code_view");
	});
}

function update(name,value,scs){//发送修改
	var temType="String";
	if(name=="sex")
		temType="Number";
	else if(name=="birth")
		temType="Date";

	$.ajax({
		url:_apiUrl_+"customer/"+user.cust_id+"/field?auth_code="+_authCode_,
		type:"PUT",
		data:{
			field_name:name,
			field_type:temType,
			field_value:value
		},
		dataType:"json",
		success:scs,
		error:function(a,b,c){
			alert(c);
		}
	});
}

function checkDate(h){
	//检测是否符合格式，进行纠正
	if(event.keyCode==8||event.keyCode==109||event.keyCode==189)
		return;
	var val=h.value;
	var re = new RegExp("[^0-9|-]");
	if(re.test(val)){
		h.value=val.slice(0,-1);
		checkDate(h);
		return;
	}
	
	if(val.length==4||val.length==7){
		h.value+="-";
	}else if(val.length>10){
		h.value=val.slice(0,10);
	}
}

function checkD(str){
	var tem=str.split("-");
	if(tem.length!=3)
		return -1;
	if(tem[0]<1900||tem[0]>new Date().getFullYear())
		return 1;
	if(tem[1]<1||tem[1]>12)
		return 2;
	if(tem[2]<1||tem[2]>31)
		return 3;
	var t=new Date(str);
	if(isNaN(t.getFullYear()))
		return 4;

	return 0;
}

function fileUpload(h){
	if(!h.files.length){
		tip("未选择文件");
		return;
	}
	var type;
    type=h.value.slice(-3);
	var file =h.files[0];
    if((type!="jpg"&&type!="png")||file.size>512000){
        h.value="";
        h.files=null;
        alert("抱歉，仅支持小于500kb的jpg或png图片");
        return;
    }
	E("logo").className="uploading";
	var oData = new FormData();
	oData.append("image",file,file.name);

	var oReq = new XMLHttpRequest();
	oReq.open("POST",_apiUrl_+"upload_image?auth_code="+_authCode_, true);
	oReq.send(oData);
	oReq.onload = function(oEvent) {
		if (oReq.status == 200) {
			changeLogo(oReq.responseText);
		} else {
		  	alert("Error " + oReq.status + " occurred uploading your file.<br \/>");
		}
	};
}