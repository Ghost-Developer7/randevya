/**
 * Randevya — Yasal Sözleşme İçerikleri
 * Türk hukuku (KVKK, 6502 sayılı TKHK, Mesafeli Sözleşmeler Yönetmeliği) uyumlu
 *
 * ÖNEMLİ: Aşağıdaki [XXX] ile işaretli alanları gerçek şirket bilgilerinizle güncelleyin.
 */

export const COMPANY = {
  name: "Randevya Yazılım Hizmetleri",
  tradeTitle: "Randevya Yazılım Hizmetleri Tic. Ltd. Şti.",
  address: "Örnek Mah. Test Cad. No:1 Daire:1, Kadıköy / İstanbul",
  mersisNo: "0000000000000001",
  vergiDairesi: "Kadıköy",
  vergiNo: "0000000001",
  email: "destek@randevya.com",
  phone: "+90 (212) 000 00 00",
  kvkkEmail: "kvkk@randevya.com",
  website: "https://randevya.com",
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. KVKK AYDINLATMA METNİ
// Dayanak: 6698 sayılı KVKK m.10 — Veri sorumlusunun aydınlatma yükümlülüğü
// ─────────────────────────────────────────────────────────────────────────────
export const KVKK_CONTENT = `
<h1>KİŞİSEL VERİLERİN KORUNMASI KANUNU (KVKK) KAPSAMINDA AYDINLATMA METNİ</h1>
<p><strong>Son Güncelleme:</strong> ${new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</p>

<h2>1. Veri Sorumlusunun Kimliği</h2>
<p>6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz; veri sorumlusu sıfatıyla <strong>${COMPANY.tradeTitle}</strong> ("Randevya" veya "Şirket") tarafından aşağıda açıklanan kapsamda işlenebilecektir.</p>

<h2>2. İşlenen Kişisel Veriler ve İşleme Amaçları</h2>
<p>Randevya olarak aşağıdaki kişisel verilerinizi, belirtilen amaçlar doğrultusunda işlemekteyiz:</p>

<h3>2.1. Kimlik ve İletişim Bilgileri</h3>
<ul>
  <li><strong>Veriler:</strong> Ad-soyad, e-posta adresi, telefon numarası, IP adresi</li>
  <li><strong>Amaçlar:</strong> Hesap oluşturma ve doğrulama; sözleşmenin kurulması ve ifası; müşteri hizmetleri; yasal bildirimler; güvenlik ve dolandırıcılık önleme</li>
  <li><strong>Hukuki Sebep:</strong> KVKK m.5/2-c (sözleşmenin ifası), m.5/2-ç (hukuki yükümlülük), m.5/2-f (meşru menfaat)</li>
</ul>

<h3>2.2. İşlem ve Finansal Bilgiler</h3>
<ul>
  <li><strong>Veriler:</strong> Abonelik planı, ödeme tarihleri, fatura bilgileri (kart bilgileri Randevya'da saklanmaz; ödeme aracısı PayTR tarafından işlenir)</li>
  <li><strong>Amaçlar:</strong> Abonelik yönetimi; fatura düzenleme; muhasebe ve vergi yükümlülüklerinin yerine getirilmesi</li>
  <li><strong>Hukuki Sebep:</strong> KVKK m.5/2-ç (hukuki yükümlülük), m.5/2-c (sözleşmenin ifası)</li>
</ul>

<h3>2.3. Kullanım ve Log Verileri</h3>
<ul>
  <li><strong>Veriler:</strong> Oturum bilgileri, erişim logları, işlem geçmişi, tarayıcı/cihaz bilgileri</li>
  <li><strong>Amaçlar:</strong> Hizmet güvenliğinin sağlanması; sistem performansının izlenmesi; hata ayıklama; suistimal tespiti</li>
  <li><strong>Hukuki Sebep:</strong> KVKK m.5/2-f (meşru menfaat)</li>
</ul>

<h3>2.4. Sözleşme Onay Verileri</h3>
<ul>
  <li><strong>Veriler:</strong> Sözleşme kabul tarihi/saati, IP adresi, tarayıcı bilgisi</li>
  <li><strong>Amaçlar:</strong> Sözleşme onayının ispatı; yasal yükümlülüklerin yerine getirilmesi</li>
  <li><strong>Hukuki Sebep:</strong> KVKK m.5/2-ç (hukuki yükümlülük)</li>
</ul>

<h2>3. Kişisel Verilerin Aktarılması</h2>
<p>Kişisel verileriniz, KVKK'nın 8. ve 9. maddeleri çerçevesinde aşağıdaki taraflara aktarılabilir:</p>
<ul>
  <li><strong>Ödeme Kuruluşları:</strong> PayTR Bilgi Teknolojileri A.Ş. — ödeme işlemlerinin gerçekleştirilmesi amacıyla</li>
  <li><strong>E-posta Hizmet Sağlayıcısı:</strong> Resend Inc. — bildirim e-postalarının iletilmesi amacıyla</li>
  <li><strong>Bulut Altyapısı:</strong> Vercel Inc. ve Upstash Inc. — uygulama barındırma ve önbellekleme amacıyla (sunucular AB/ABD'de olup gerekli güvenceler sağlanmıştır)</li>
  <li><strong>Yetkili Kamu Kurum/Kuruluşları:</strong> Yasal zorunluluk halinde ilgili kamu kurumlarıyla paylaşılabilir</li>
</ul>

<h2>4. Kişisel Verilerin Saklanma Süresi</h2>
<p>Kişisel verileriniz, işlenme amacının gerektirdiği süre boyunca ve ilgili mevzuatta öngörülen süreler dikkate alınarak saklanır. Sözleşme kapsamındaki veriler sözleşme sona erdikten sonra 10 yıl, log verileri 2 yıl süreyle muhafaza edilir. Bu sürelerin dolması halinde veriler silinir, yok edilir veya anonim hale getirilir.</p>

<h2>5. Veri Sahibinin Hakları (KVKK m.11)</h2>
<p>KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
<ul>
  <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
  <li>İşlenmişse buna ilişkin bilgi talep etme</li>
  <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
  <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
  <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
  <li>KVKK m.7'de öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme</li>
  <li>Düzeltme ve silme işlemlerinin aktarılan üçüncü kişilere bildirilmesini isteme</li>
  <li>Otomatik sistemler vasıtasıyla aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
  <li>Kanuna aykırı işleme nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme</li>
</ul>
<p>Başvurularınızı <strong>${COMPANY.kvkkEmail}</strong> adresine e-posta yoluyla veya yazılı olarak <strong>${COMPANY.address}</strong> adresine iletebilirsiniz. Başvurunuz 30 gün içinde yanıtlanacaktır. Taleplerinize ilişkin Kişisel Verileri Koruma Kurumu'na şikayette bulunma hakkınız saklıdır (www.kvkk.gov.tr).</p>

<h2>6. Veri Güvenliği</h2>
<p>Randevya, kişisel verilerinizi yetkisiz erişim, ifşa, değiştirme veya imhaya karşı korumak amacıyla SSL/TLS şifrelemesi, erişim kontrolü, güvenlik duvarı ve düzenli güvenlik denetimleri gibi teknik ve idari tedbirler uygulamaktadır.</p>

<h2>7. İletişim</h2>
<p>Bu Aydınlatma Metni'ne ilişkin sorularınız için: <strong>${COMPANY.kvkkEmail}</strong></p>
`

// ─────────────────────────────────────────────────────────────────────────────
// 2. GİZLİLİK POLİTİKASI
// ─────────────────────────────────────────────────────────────────────────────
export const PRIVACY_POLICY_CONTENT = `
<h1>GİZLİLİK POLİTİKASI</h1>
<p><strong>Son Güncelleme:</strong> ${new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</p>
<p>${COMPANY.tradeTitle} ("Randevya", "biz" veya "şirket") olarak gizliliğinize saygı duyuyor ve kişisel verilerinizi korumayı taahhüt ediyoruz. Bu Gizlilik Politikası; <strong>${COMPANY.website}</strong> web sitesi ve Randevya uygulaması ("Platform") aracılığıyla toplanan verilerin nasıl kullanıldığını açıklar.</p>

<h2>1. Topladığımız Bilgiler</h2>
<h3>1.1. Bize Doğrudan Sağladığınız Bilgiler</h3>
<ul>
  <li>Hesap oluşturma: Ad-soyad, e-posta, telefon, işletme adı, sektör</li>
  <li>Ödeme: Fatura bilgileri (kart numarası gibi hassas finansal veriler ödeme aracımız PayTR tarafından işlenir, bizde saklanmaz)</li>
  <li>Destek talepleri: İletişim geçmişi, mesaj içerikleri</li>
</ul>

<h3>1.2. Otomatik Toplanan Bilgiler</h3>
<ul>
  <li>Bağlantı bilgileri: IP adresi, tarayıcı türü ve versiyonu, işletim sistemi</li>
  <li>Kullanım verileri: Sayfa görüntülemeleri, tıklamalar, oturum süresi</li>
  <li>Çerezler ve benzer teknolojiler: Bkz. Çerez Politikamız</li>
</ul>

<h2>2. Bilgileri Nasıl Kullanıyoruz</h2>
<ul>
  <li>Hizmetlerimizi sunmak, işletmek ve geliştirmek</li>
  <li>Hesabınızı oluşturmak ve yönetmek</li>
  <li>Abonelik ve ödemelerinizi işlemek</li>
  <li>Teknik destek sağlamak</li>
  <li>Hizmet güncellemeleri ve güvenlik uyarıları göndermek</li>
  <li>Yasal yükümlülüklerimizi yerine getirmek</li>
  <li>Dolandırıcılık ve kötüye kullanımı önlemek</li>
</ul>

<h2>3. Bilgilerin Paylaşımı</h2>
<p>Kişisel bilgilerinizi üçüncü taraflara satmıyor, kiralamıyor veya pazarlama amacıyla paylaşmıyoruz. Verilerinizi yalnızca şu durumlarda paylaşabiliriz:</p>
<ul>
  <li><strong>Hizmet sağlayıcılar:</strong> Ödeme (PayTR), e-posta (Resend), altyapı (Vercel, Upstash) gibi hizmetleri sunan iş ortaklarımız — yalnızca hizmeti sunmak için gerekli ölçüde</li>
  <li><strong>Yasal zorunluluklar:</strong> Mahkeme kararı, yasal düzenleme veya yetkili kamu kurumu talebi halinde</li>
  <li><strong>Şirket işlemleri:</strong> Birleşme, devralma veya varlık satışı durumunda — kullanıcılar önceden bilgilendirilir</li>
</ul>

<h2>4. Veri Güvenliği</h2>
<p>Verilerinizi korumak için endüstri standardı güvenlik önlemleri uyguluyoruz:</p>
<ul>
  <li>Tüm veri iletişimi SSL/TLS şifrelemesiyle korunur</li>
  <li>Şifreler bcrypt algoritmasıyla karma (hash) olarak saklanır — düz metin olarak hiçbir zaman saklanmaz</li>
  <li>Erişim kontrolü: Verilerinize yalnızca yetkili personel erişebilir</li>
  <li>Düzenli güvenlik denetimleri yapılmaktadır</li>
</ul>

<h2>5. Veri Saklama</h2>
<p>Hesabınız aktif olduğu sürece verilerinizi saklarız. Hesabı silmeniz durumunda, yasal zorunluluklar (vergi, ticaret kanunu vb.) saklamamızı gerektirmediği sürece verileriniz 30 gün içinde silinir veya anonim hale getirilir.</p>

<h2>6. Çocukların Gizliliği</h2>
<p>Randevya hizmetleri 18 yaş altı kişilere yönelik değildir. 18 yaş altı bireylerden bilerek veri toplamıyoruz.</p>

<h2>7. Politika Değişiklikleri</h2>
<p>Bu politikayı zaman zaman güncelleyebiliriz. Önemli değişiklikler e-posta yoluyla bildirilir. Güncel politika her zaman ${COMPANY.website}/gizlilik adresinde yayınlanır.</p>

<h2>8. İletişim</h2>
<p>Gizlilik politikamıza ilişkin sorularınız için: <strong>${COMPANY.email}</strong></p>
`

// ─────────────────────────────────────────────────────────────────────────────
// 3. KULLANIM KOŞULLARI
// ─────────────────────────────────────────────────────────────────────────────
export const TERMS_OF_USE_CONTENT = `
<h1>KULLANIM KOŞULLARI</h1>
<p><strong>Son Güncelleme:</strong> ${new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</p>
<p>Bu Kullanım Koşulları ("Koşullar"), ${COMPANY.tradeTitle} ("Randevya") tarafından sunulan randevu yönetim platformunun ("Hizmet") kullanımını düzenler. Hizmet'i kullanarak bu Koşulları kabul etmiş sayılırsınız.</p>

<h2>1. Taraflar ve Tanımlar</h2>
<ul>
  <li><strong>Randevya:</strong> ${COMPANY.tradeTitle}</li>
  <li><strong>Kullanıcı / İşletme:</strong> Hizmet'e abone olan ve platform üzerinden randevu hizmeti sunan gerçek veya tüzel kişi</li>
  <li><strong>Son Kullanıcı / Müşteri:</strong> İşletmenin platformu üzerinden randevu alan kişi</li>
  <li><strong>Hizmet:</strong> Randevya'nın sunduğu yazılım hizmetleri (SaaS)</li>
</ul>

<h2>2. Hesap Oluşturma ve Güvenlik</h2>
<ul>
  <li>Kayıt sırasında doğru, güncel ve eksiksiz bilgi vermeniz zorunludur. Yanlış bilgi sunulması Randevya'ya hesabı derhal askıya alma veya kapatma hakkı verir.</li>
  <li>Hesap güvenliğiniz sizin sorumluluğunuzdadır. Şifrenizin yetkisiz kullanımını fark ettiğinizde derhal ${COMPANY.email} adresine bildirmeniz gerekmektedir.</li>
  <li>Her işletme yalnızca bir hesap açabilir. Birden fazla hesap açılması yasaktır.</li>
</ul>

<h2>3. Hizmet Kullanımı ve Kısıtlamalar</h2>
<p>Hizmet'i aşağıdaki amaçlarla kullanamazsınız:</p>
<ul>
  <li>Yasadışı faaliyetlerde bulunmak veya yasadışı içerik barındırmak</li>
  <li>Başka kullanıcıların hesaplarına yetkisiz erişim sağlamak</li>
  <li>Hizmet'in altyapısına zarar verecek işlemler (DoS saldırısı, spam vb.) gerçekleştirmek</li>
  <li>Randevya'nın yazılımını kopyalamak, decompile etmek veya tersine mühendislik uygulamak</li>
  <li>Platformu başka bir hizmet için aracı olarak kullanmak (reseller olmak) — aksi Randevya ile yazılı anlaşma gerektirmektedir</li>
  <li>Otomatik araçlarla (bot, scraper) sistemi taramak veya veri toplamak</li>
</ul>

<h2>4. Abonelik ve Ödeme</h2>
<ul>
  <li>Abonelik ücretleri aylık olarak peşin tahsil edilir. Seçilen plana göre fiyatlandırma geçerlidir.</li>
  <li>Ödemeler PayTR aracılığıyla gerçekleştirilir. Ödeme bilgileriniz Randevya'da saklanmaz.</li>
  <li>Aboneliği iptal etmeniz durumunda mevcut dönem sonuna kadar hizmet devam eder; erken iptal halinde kalan süreye ilişkin ücret iadesi yapılmaz.</li>
  <li>Randevya, abonelik ücretlerini 30 gün önceden bildirimle değiştirme hakkını saklı tutar.</li>
</ul>

<h2>5. İçerik ve Veri</h2>
<ul>
  <li>Randevya platformu üzerinden girdiğiniz veriler (müşteri bilgileri, randevular vb.) size aittir. Randevya bu verileri yalnızca hizmet sunmak amacıyla kullanır.</li>
  <li>Hizmet'e yüklediğiniz içeriklerden (logo, görsel vb.) doğan hukuki sorumluluk size aittir.</li>
  <li>Hesap kapatıldığında verilerinizi 30 gün içinde dışa aktarmanız gerekir. Bu süre sonunda veriler kalıcı olarak silinir.</li>
</ul>

<h2>6. Hizmet Seviyesi ve Kesintiler</h2>
<ul>
  <li>Randevya, hizmetin %99,5 oranında erişilebilir olmasını hedefler; ancak bakım, güncelleme veya beklenmedik teknik sorunlar nedeniyle hizmet kesintileri yaşanabilir.</li>
  <li>Planlı bakım çalışmaları en az 24 saat önceden bildirilir.</li>
</ul>

<h2>7. Fikri Mülkiyet</h2>
<p>Randevya platformu, yazılımı, tasarımları ve markaları ${COMPANY.tradeTitle}'na aittir ve fikri mülkiyet mevzuatıyla korunmaktadır. Bu Koşullar size yalnızca Hizmet'i kullanma hakkı tanır; hiçbir fikri mülkiyet hakkı devredilmez.</p>

<h2>8. Sorumluluğun Sınırlandırılması</h2>
<p>Randevya'nın herhangi bir nedenle doğabilecek zararlardan sorumluluğu, zararın gerçekleştiği aydaki ödediğiniz abonelik ücretiyle sınırlıdır. Randevya, dolaylı, tesadüfi veya sonuç olarak doğan zararlardan (gelir kaybı, veri kaybı vb.) sorumlu tutulamaz.</p>

<h2>9. Fesih</h2>
<ul>
  <li>Bu Koşulları ihlal etmeniz halinde Randevya hesabınızı önceden bildirim yapmaksızın askıya alabilir veya kapatabilir.</li>
  <li>Siz de istediğiniz zaman hesabınızı kapatarak Hizmet'i kullanmayı sonlandırabilirsiniz.</li>
</ul>

<h2>10. Uygulanacak Hukuk ve Yetki</h2>
<p>Bu Koşullar Türk Hukuku'na tabidir. Anlaşmazlıklarda İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri yetkilidir.</p>

<h2>11. Değişiklikler</h2>
<p>Randevya, bu Koşulları önceden bildirimde bulunarak değiştirebilir. Değişiklikler yayınlandıktan sonra Hizmet'i kullanmaya devam etmeniz, güncellenmiş Koşulları kabul ettiğiniz anlamına gelir.</p>

<h2>12. İletişim</h2>
<p>${COMPANY.name} — ${COMPANY.address} — ${COMPANY.email}</p>
`

// ─────────────────────────────────────────────────────────────────────────────
// 4. ÇEREZ POLİTİKASI
// ─────────────────────────────────────────────────────────────────────────────
export const COOKIE_POLICY_CONTENT = `
<h1>ÇEREZ POLİTİKASI</h1>
<p><strong>Son Güncelleme:</strong> ${new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</p>
<p>${COMPANY.tradeTitle} ("Randevya") olarak, ${COMPANY.website} adresindeki web sitemizi ve uygulamamızı ziyaret ettiğinizde çerez (cookie) ve benzer teknolojiler kullanmaktayız. Bu politika, hangi çerezleri kullandığımızı ve bunları nasıl yönetebileceğinizi açıklamaktadır.</p>

<h2>1. Çerez Nedir?</h2>
<p>Çerezler, web siteleri tarafından tarayıcınıza kaydedilen küçük metin dosyalarıdır. Sizi tanımak, tercihlerinizi hatırlamak ve deneyiminizi kişiselleştirmek amacıyla kullanılırlar.</p>

<h2>2. Kullandığımız Çerez Türleri</h2>

<h3>2.1. Zorunlu Çerezler</h3>
<p>Bu çerezler, web sitesinin temel işlevlerinin çalışması için gereklidir. Oturum yönetimi ve güvenlik amacıyla kullanılırlar. Bu çerezler olmadan hizmet düzgün çalışmaz.</p>
<table>
  <tr><th>Çerez Adı</th><th>Amaç</th><th>Süre</th></tr>
  <tr><td>next-auth.session-token</td><td>Kullanıcı oturumu</td><td>Oturum süresi / 30 gün</td></tr>
  <tr><td>next-auth.csrf-token</td><td>CSRF saldırılarına karşı koruma</td><td>Oturum süresi</td></tr>
  <tr><td>next-auth.callback-url</td><td>Yönlendirme adresi</td><td>Oturum süresi</td></tr>
</table>

<h3>2.2. İşlevsel Çerezler</h3>
<p>Tercihlerinizi ve ayarlarınızı hatırlamak amacıyla kullanılır. Bu çerezleri reddedebilirsiniz; ancak bazı özellikler düzgün çalışmayabilir.</p>

<h3>2.3. Analitik Çerezler</h3>
<p>Web sitemizin nasıl kullanıldığını anlamak ve hizmetlerimizi geliştirmek amacıyla kullanılabilir. Bu çerezleri aşağıdaki yöntemlerle reddedebilirsiniz.</p>

<h2>3. Çerezleri Nasıl Kontrol Edebilirsiniz?</h2>
<p>Tarayıcı ayarlarınızdan çerezleri yönetebilir, silebilir veya engelleyebilirsiniz:</p>
<ul>
  <li><strong>Chrome:</strong> Ayarlar → Gizlilik ve Güvenlik → Çerezler</li>
  <li><strong>Firefox:</strong> Seçenekler → Gizlilik ve Güvenlik → Çerezler</li>
  <li><strong>Safari:</strong> Tercihler → Gizlilik → Çerezleri Yönet</li>
  <li><strong>Edge:</strong> Ayarlar → Çerezler ve Site İzinleri</li>
</ul>
<p>Tüm çerezleri engellemek bazı site özelliklerinin çalışmamasına neden olabilir.</p>

<h2>4. Üçüncü Taraf Çerezler</h2>
<p>Randevya, üçüncü taraf analitik veya reklam çerezi kullanmamaktadır. Ödeme işlemleri için yönlendirildiğiniz PayTR'ın kendi çerez politikası PayTR'ın web sitesinde yer almaktadır.</p>

<h2>5. Politika Değişiklikleri</h2>
<p>Bu politikayı zaman zaman güncelleyebiliriz. Değişiklikler bu sayfada yayınlanacaktır.</p>

<h2>6. İletişim</h2>
<p>Çerez kullanımına ilişkin sorularınız için: <strong>${COMPANY.email}</strong></p>
`

// ─────────────────────────────────────────────────────────────────────────────
// 5. MESAFELİ SATIŞ SÖZLEŞMESİ
// Dayanak: 6502 sayılı TKHK m.48-54 ve Mesafeli Sözleşmeler Yönetmeliği (27.11.2014)
// ─────────────────────────────────────────────────────────────────────────────
export const DISTANCE_SALES_CONTENT = `
<h1>MESAFELİ HİZMET SÖZLEŞMESİ</h1>
<p><strong>Son Güncelleme:</strong> ${new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</p>

<h2>MADDE 1 — TARAFLAR</h2>
<p><strong>SATICI (HİZMET SAĞLAYICI):</strong></p>
<ul>
  <li>Unvan: ${COMPANY.tradeTitle}</li>
  <li>Adres: ${COMPANY.address}</li>
  <li>E-posta: ${COMPANY.email}</li>
  <li>Telefon: ${COMPANY.phone}</li>
  <li>MERSİS No: ${COMPANY.mersisNo}</li>
  <li>Vergi Dairesi / No: ${COMPANY.vergiDairesi} / ${COMPANY.vergiNo}</li>
</ul>
<p><strong>ALICI (ABONE):</strong> Platforma üye olan ve ödeme yapan kişi veya işletme</p>

<h2>MADDE 2 — KONU VE KAPSAM</h2>
<p>Bu Sözleşme, SATICI'nın internet ortamında sunduğu "Randevya" SaaS randevu yönetim platformuna aylık abonelik hizmetinin ("Hizmet") satışına ilişkin tarafların hak ve yükümlülüklerini 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği çerçevesinde düzenlemektedir.</p>

<h2>MADDE 3 — HİZMET BİLGİLERİ</h2>
<p>ALICI tarafından seçilen abonelik planına göre aşağıdaki hizmetler sunulur:</p>
<ul>
  <li>Çok kiracılı (multi-tenant) online randevu yönetim sistemi</li>
  <li>İşletmeye özel alt alan adı (subdomain) veya özel alan adı desteği</li>
  <li>Personel, hizmet ve takvim yönetimi</li>
  <li>Müşteri bildirimleri (e-posta / WhatsApp — plana bağlı)</li>
  <li>Bekleme listesi yönetimi</li>
  <li>Analitik ve raporlama (plana bağlı)</li>
</ul>
<p>Hizmet detayları ve plan özellikleri ${COMPANY.website}/fiyatlar adresinde güncel olarak yayınlanmaktadır.</p>

<h2>MADDE 4 — FİYAT VE ÖDEME KOŞULLARI</h2>
<ul>
  <li>Abonelik ücreti, ALICI'nın seçtiği plan fiyatında aylık olarak peşin tahsil edilir.</li>
  <li>Ödemeler, güvenli ödeme kuruluşu PayTR aracılığıyla kredi kartı ile gerçekleştirilir. Kart bilgileri SATICI'da saklanmaz.</li>
  <li>Fiyatlara KDV dahildir. Fatura, kayıtlı e-posta adresine iletilir.</li>
  <li>Ödemenin tamamlanması hizmetin başlamasının ön koşuludur.</li>
</ul>

<h2>MADDE 5 — CAYMA HAKKI</h2>
<p>6502 sayılı TKHK m.49/5 ve Mesafeli Sözleşmeler Yönetmeliği m.15/1-(ğ) uyarınca; dijital içerik veya hizmetin ifasına tüketicinin onayıyla başlanmış olması halinde cayma hakkı kullanılamaz.</p>
<p><strong>Buna göre:</strong> ALICI'nın aboneliği aktifleştirmesi (ödeme onayı ve platforma ilk erişim) ile birlikte hizmetin ifasına başlandığından, bu tarihten itibaren 14 günlük cayma hakkı kullanılamaz. ALICI, işbu sözleşmeyi kabul etmekle bu hususu açıkça beyan ve kabul etmektedir.</p>
<p>Hizmetin hiç başlatılmadığı kanıtlanabilir durumlarda cayma hakkı ödeme tarihinden itibaren 14 gün içinde kullanılabilir. Cayma bildirimi ${COMPANY.email} adresine yapılmalıdır.</p>

<h2>MADDE 6 — ABONELIK İPTALİ VE İADE</h2>
<ul>
  <li>ALICI, aboneliğini istediği zaman iptal edebilir. İptal, mevcut ödeme döneminin sonunda geçerli olur; dönem içinde ücret iadesi yapılmaz.</li>
  <li>SATICI'nın hizmeti tamamen ve kalıcı olarak sonlandırması durumunda, kalan abonelik süresi oranında ücret iadesi yapılır.</li>
  <li>Hatalı veya çift ödeme gibi teknik hatalarda tam iade yapılır.</li>
  <li>İade talepleri ${COMPANY.email} adresine yapılır; 10 iş günü içinde incelenerek sonuçlandırılır.</li>
</ul>

<h2>MADDE 7 — HİZMETİN İFASI VE SÜRESİ</h2>
<ul>
  <li>Hizmet, ödemenin onaylanmasından itibaren en geç 24 saat içinde aktifleştirilir.</li>
  <li>Abonelik, iptal edilmediği sürece aylık olarak otomatik yenilenir.</li>
  <li>SATICI, hizmetin %99,5 oranında erişilebilir olmasını taahhüt eder; planlı bakım çalışmaları önceden bildirilir.</li>
</ul>

<h2>MADDE 8 — GİZLİLİK</h2>
<p>Taraflar, bu Sözleşme kapsamında edindikleri gizli bilgileri üçüncü şahıslara açıklamayacaklarını taahhüt eder. Kişisel veriler KVKK hükümleri çerçevesinde işlenir.</p>

<h2>MADDE 9 — UYGULANACAK HUKUK VE YETKİLİ MAHKEME</h2>
<p>Bu Sözleşme Türk Hukuku'na tabidir. 6502 sayılı TKHK kapsamındaki uyuşmazlıklar için tüketicinin yerleşim yerindeki Tüketici Hakem Heyetleri veya Tüketici Mahkemeleri yetkilidir. Ticari nitelikteki uyuşmazlıklar için İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.</p>

<h2>MADDE 10 — YÜRÜRLÜK</h2>
<p>ALICI, ödeme işlemini tamamlayarak bu Sözleşme'nin tüm hükümlerini okuduğunu, anladığını ve kabul ettiğini beyan eder. Sözleşme, taraflarca elektronik ortamda kurulmuş olup ödeme onayı anında yürürlüğe girer.</p>
`

// ─────────────────────────────────────────────────────────────────────────────
// Tüm sözleşmeler — seed'de kullanılacak
// ─────────────────────────────────────────────────────────────────────────────
export const LEGAL_DOCUMENTS = [
  {
    id: "legal-kvkk",
    type: "KVKK",
    title: "KVKK Aydınlatma Metni",
    content: KVKK_CONTENT,
    version: "1.0",
  },
  {
    id: "legal-privacy",
    type: "PRIVACY_POLICY",
    title: "Gizlilik Politikası",
    content: PRIVACY_POLICY_CONTENT,
    version: "1.0",
  },
  {
    id: "legal-terms",
    type: "TERMS_OF_USE",
    title: "Kullanım Koşulları",
    content: TERMS_OF_USE_CONTENT,
    version: "1.0",
  },
  {
    id: "legal-cookie",
    type: "COOKIE_POLICY",
    title: "Çerez Politikası",
    content: COOKIE_POLICY_CONTENT,
    version: "1.0",
  },
  {
    id: "legal-distance-sales",
    type: "DISTANCE_SALES",
    title: "Mesafeli Hizmet Sözleşmesi",
    content: DISTANCE_SALES_CONTENT,
    version: "1.0",
  },
]

// Tenant kaydı için zorunlu onay türleri
export const REQUIRED_CONSENTS_TENANT = ["KVKK", "PRIVACY_POLICY", "TERMS_OF_USE", "DISTANCE_SALES"] as const

// Personel kaydı için zorunlu onay türleri
export const REQUIRED_CONSENTS_STAFF = ["KVKK", "TERMS_OF_USE"] as const
