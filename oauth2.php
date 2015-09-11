<?php
/**
 * Created by PhpStorm.
 * User: 1
 * Date: 14-7-12
 * Time: 下午1:55
 */
if(isset($_GET['code'])){
    //echo $_GET['code'];
    $code = $_GET['code'];
    $userinfo = getUserInfo($code);
    //echo "nickname:".$userinfo["nickname"];
}else{
    echo 'No code';
    exit();
}

function getUserInfo($code){
    $appid = "wxa5c196f7ec4b5df9";
    $appsecret = "e89542d7376fc479aac35706305fc23f";
    $access_token = "";

    // 根据code获取access_token
    $access_token_url = "https://api.weixin.qq.com/sns/oauth2/access_token?appid=$appid&secret=$appsecret&code=$code&grant_type=authorization_code";
//    echo $access_token_url;
    $access_token_json = https_request($access_token_url);
    $access_token_array = json_decode($access_token_json, true);
    $access_token = $access_token_array['access_token'];
//    echo "access_token:$access_token";
    $openid = $access_token_array['openid'];

    // 根据access token获取用户信息
    $userinfo_url = "https://api.weixin.qq.com/sns/userinfo?access_token=$access_token&openid=$openid";
    $userinfo_json = https_request($userinfo_url);
    $userinfo_array = json_decode($userinfo_json, true);
    return $userinfo_array;
}

function https_request($url){
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, FALSE);
    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, FALSE);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    $data = curl_exec($curl);
    if(curl_errno($curl)){
        return 'ERROR'.curl_error($curl);
    }
    curl_close($curl);
    return $data;
}
echo "<script>self.location='index.html?open_id=".$userinfo["openid"]."&headimgurl=".$userinfo["headimgurl"]."'</script>";
exit;
?>

<!DOCTYPE html>
<html class="um landscape min-width-240px min-width-320px min-width-480px min-width-768px min-width-1024px">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="initial-scale=1, width=device-width, maximum-scale=1, user-scalable=no"  />
    <meta name="viewport" content="initial-scale=1.0,user-scalable=no,maximum-scale=1" media="(device-height: 568px)" />
    <title>用户信息</title>
</head>

<body class="um-vp c-wh" ontouchstart>
<div class="container">
    <!-- 内容 -->
    <p class="content">
        昵称：<?php echo $userinfo["nickname"]; ?><br>
        性别：<?php echo $userinfo["sex"]; ?><br>
        省份：<?php echo $userinfo["province"]; ?><br>
        城市：<?php echo $userinfo["city"]; ?><br>
        特权：<?php echo $userinfo["privilege"]; ?><br>
        <?php print_r($userinfo); ?>
    </p>
</div>
</body>
</html>