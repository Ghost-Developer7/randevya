# Python 3.6+


import base64
import hmac
import hashlib
import requests
import json


merchant_id = 'XXXXXX'
merchant_key = 'XXXXXX'
merchant_salt = 'XXXXXX'


date = '2021-07-01'


hash_str = merchant_id + date + merchant_salt
paytr_token = base64.b64encode(hmac.new(merchant_key, hash_str.encode(), hashlib.sha256).digest())

params = {
    'merchant_id': merchant_id,
    'date': date,
    'paytr_token': paytr_token
}

result = requests.post('https://www.paytr.com/rapor/odeme-detayi', params)
res = json.loads(result.text)

if res['status'] == 'success':
    print(result.text)
elif res['status'] == 'failed':
    print('ilgili tarihte odeme detayi bulunamadi')
else:
    print('PAYTR BIN detail request error. Error: ' + res['err_msg'])
    