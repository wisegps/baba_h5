<?php
session_start();
$apiUrl="http://api.bibibaba.cn/";
$action=$_POST["action"];
switch ($action) {
	case -1:
		sendSMS();//发送验证信息
		break;
	case 2:
		//重置密码
		resetPwd();
		break;
	case 4://注册
		register();
		break;
	default://单纯验证验证码
		checkCode();
		$json=array("status_code"=>0,"msg"=>"验证码正确");
		echo json_encode($json);
		break;
}

function sendSMS(){
	if($_POST["type"]==0){
		$url =$GLOBALS["apiUrl"]."valid_code?mobile=".$_POST["account"]."&type=1";
	}else{
		$url =$GLOBALS["apiUrl"]."valid_code/email?email=".$_POST["account"]."&type=1";
	}
	$str=http_json($url,"","GET");
	$json=json_decode($str,true);
	if($json["status_code"]){
		echo $str;
		exit;
	}
	$_SESSION['valid_code']=$json["valid_code"];
	//unset($json["valid_code"]);
	$json["msg"]="已发送";
	echo json_encode($json);
}

function resetPwd(){//忘记密码重设密码
	checkCode();
	unset($_SESSION['valid_code']);
	$url=$GLOBALS["apiUrl"]."customer/password/reset?account=".$_POST["account"]."&password=".md5($_POST["pwd"]);
	echo http_json($url,"","PUT");
}

function checkCode(){//检测验证码
	if($_POST["valid_code"]!=$_SESSION['valid_code']){
		$json=array("status_code"=>"-1","msg"=>"验证码不正确");
		echo json_encode($json);
		exit;
	}
}

function register(){//注册
	checkCode();
	unset($_SESSION['valid_code']);
	$url=$GLOBALS["apiUrl"]."customer/register?auth_code=127a154df2d7850c4232542b4faa2c3d";

	$data="password=".$_POST["password"];
	foreach($_POST as $key=>$val){
		$data.="&".$key."=".$val;
	}
	echo http_json($url,$_POST,"POST");
}





function http_json($url,$data,$type){//发送http请求
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $type);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    /*curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Content-Type: application/json',
            'Content-Length: '.strlen($data))
    );*/
    return curl_exec($ch);
}