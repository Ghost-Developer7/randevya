var request = require('request');
var crypto = require('crypto');
var express = require('express');
var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

var merchant_id = '';
var merchant_key = '';
var merchant_salt = '';



app.get("/", function (req, res) {


    var date = '2022-02-07';


    var paytr_token = crypto.createHmac('sha256', merchant_key).update(merchant_id + date + merchant_salt).digest('base64');

    var options = {
        'method': 'POST',
        'url': 'https://www.paytr.com/rapor/odeme-detayi',
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            'merchant_id': merchant_id,
            'date': date,
            'paytr_token': paytr_token,
        }
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        var res_data = JSON.parse(body);

        if (res_data.status == 'success') {
            res.send(res_data);

        } else {
            res.end(response.body);
        }

    });


});


var port = 3200;
app.listen(port, function () {
    console.log("Server is running. Port:" + port);
});
