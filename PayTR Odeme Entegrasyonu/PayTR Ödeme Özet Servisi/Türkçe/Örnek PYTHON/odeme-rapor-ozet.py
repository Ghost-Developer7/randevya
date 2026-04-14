# Python 3.6+
# Ödeme dökümü servisi için kullanılacak örnek kod

import base64
import hmac
import hashlib
import requests
import json

# API Entegrasyon Bilgilier - Mağaza paneline giriş yaparak BİLGİ sayfasından alabilirsiniz.
merchant_id = 'XXXXXX'
merchant_key = 'XXXXXX'
merchant_salt = 'XXXXXX'


start_date = '2022-09-01'
end_date = '2022-09-31'
#Başlangıç / Bitiş tarihi. En fazla 31 gün aralık tanımlanabilir.

# Bu kısımda herhangi bir değişiklik yapmanıza gerek yoktur.
hash_str = merchant_id + start_date + end_date + merchant_salt
paytr_token = base64.b64encode(hmac.new(merchant_key, hash_str.encode(), hashlib.sha256).digest())

params = {
    'merchant_id': merchant_id,
    'start_date': start_date,
    'end_date': end_date,
    'paytr_token': paytr_token
}

result = requests.post('https://www.paytr.com/rapor/odeme-dokumu', params)
res = json.loads(result.text)

if res['status'] == 'success':
    print(result.text)
elif res['status'] == 'failed':
    print('ilgili tarihte odeme detayi bulunamadi')
else:
    print('PAYTR BIN detail request error. Error: ' + res['err_msg'])
    