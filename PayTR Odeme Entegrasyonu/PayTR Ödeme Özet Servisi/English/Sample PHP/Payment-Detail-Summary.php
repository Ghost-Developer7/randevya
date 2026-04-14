<?php


    $merchant_id    = 'XXXXXX';
    $merchant_key   = 'XXXXXX';
    $merchant_salt  = 'XXXXXX';

    ## Gerekli Bilgiler
    #
    $start_date     = "2022-09-01";
    $end_date       = "2022-09-31";
    

    $paytr_token = base64_encode(hash_hmac('sha256', $merchant_id . $start_date . $end_date . $merchant_salt, $merchant_key, true));

    $post_vals = array('merchant_id' => $merchant_id,
        'start_date' => $start_date,
        'end_date' => $end_date,
        'paytr_token' => $paytr_token
    );
    #
    ############################################################################################

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://www.paytr.com/rapor/odeme-dokumu/");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post_vals);
    curl_setopt($ch, CURLOPT_FRESH_CONNECT, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 90);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 90);

    $result = @curl_exec($ch);

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
        
        echo "ilgili tarih araliginda odeme bulunamadi";
    }
    else
    {
        
        echo $result[err_no] . " - " . $result[err_msg];
    }