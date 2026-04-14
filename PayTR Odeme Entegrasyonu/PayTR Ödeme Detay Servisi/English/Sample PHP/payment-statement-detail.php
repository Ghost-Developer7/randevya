<?php

   

    $merchant_id    = 'XXXXX';
    $merchant_key   = 'YYYYYYYYYYYYY';
    $merchant_salt  = 'YYYYYYYYYYYYY';

   
    #
    //$date     = "2022-02-07";
    $date     = "2021-07-01";
    #
    ############################################################################################

    ################ You do not need to make any changes in this part. ################

    $paytr_token = base64_encode(hash_hmac('sha256', $merchant_id . $date . $merchant_salt, $merchant_key, true));

    $post_vals = array('merchant_id' => $merchant_id,
        'date' => $date,
        'paytr_token' => $paytr_token
    );
    #
    ############################################################################################

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://www.paytr.com/rapor/odeme-detayi/");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post_vals);
    curl_setopt($ch, CURLOPT_FRESH_CONNECT, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 90);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 90);

    $result = @curl_exec($ch);
    //print_r($result);

    if (curl_errno($ch)) {
        echo curl_error($ch);
        curl_close($ch);
        exit;
    }

    curl_close($ch);

    echo "<pre>";
    $result = json_decode($result, 1);

    if ($result[status] == 'success')
    {
        
        print_r($result);
    }
    elseif ($result[status] == 'failed')
    {
       
	    echo "ilgili tarihte odeme detayi bulunamadi";
    }
    else
    {
        
        echo $result[err_no] . " - " . $result[err_msg];
    }