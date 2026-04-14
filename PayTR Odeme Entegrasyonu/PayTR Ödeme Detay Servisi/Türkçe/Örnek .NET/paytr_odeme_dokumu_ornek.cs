using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Collections.Specialized;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Web.Script.Serialization;
using System.Web.UI;
using System.Web.UI.WebControls;


using System.Web.Routing;

namespace WebApplication1.Controllers
{
    public class TransactionDetailController : Controller
    {
        public ActionResult TransactionDetail()
        {
            // ########################### İŞLEM DÖKÜMÜ ALMAK  İÇİN ÖRNEK KODLAR #######################
            //
            // API Entegrasyon Bilgileri - Mağaza paneline giriş yaparak BİLGİ sayfasından alabilirsiniz.
            string merchant_id = "AAAAAA";
            string merchant_key = "XXXXXXXXXXXXXXXX";
            string merchant_salt = "XXXXXXXXXXXXXXXX";
            //
            string date = "2022-02-07";
            
            
            //
            //   ################ Bu kısımda herhangi bir değişiklik yapmanıza gerek yoktur. ################
            string Birlestir = string.Concat(merchant_id, date, merchant_salt);
            HMACSHA256 hmac = new HMACSHA256(Encoding.UTF8.GetBytes(merchant_key));
            byte[] b = hmac.ComputeHash(Encoding.UTF8.GetBytes(Birlestir));
            string paytr_token = Convert.ToBase64String(b);
            //
            NameValueCollection data = new NameValueCollection();
            data["merchant_id"] = merchant_id;
            data["date"] = date;
            data["paytr_token"] = paytr_token;
            //
            using (WebClient client = new WebClient())
            {
                client.Headers.Add("Content-Type", "application/x-www-form-urlencoded");
                byte[] result = client.UploadValues("https://www.paytr.com/rapor/odeme-detayi", "POST", data);
                string ResultAuthTicket = Encoding.UTF8.GetString(result);
                dynamic json = JValue.Parse(ResultAuthTicket);

                if (json.status == "success")
                {
                    // VT işlemleri vs.
                    Response.Write(json);

                }
                else if (json.status == "failed")
                {
                    // sonuç bulunamadı
                    Response.Write("ilgili tarihte odeme detayi bulunamadi");

                }
                else
                {
                    // Hata durumu
                    Response.Write(json.err_no + "-" + json.err_msg);
                }
            }
            return View();
        }
    }
}