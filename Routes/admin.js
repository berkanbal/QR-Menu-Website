const express = require("express");
const app = express();
const router = express.Router();
const path = require("path");
const db = require("../data/db")
const imageUpload = require("../helpers/image_upload")
const ExcelJS = require('exceljs');
const { createGunsonuReportExcel } = require('../helpers/excel-helper');
const bcrypt = require("bcrypt");
const adminAuth = require("../middlewares/admin-auth");



// Login formu
router.get("/admin/login", (req, res) => {
    res.render("admin-login");
});

// Login işlemi
router.post("/admin/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await db.execute(
            "SELECT * FROM adminler WHERE kullanici_adi = ?",
            [username]
        );

        if (rows.length === 0) {
            return res.render("admin-login", { error: "Kullanıcı bulunamadı" });
        }

        const admin = rows[0];

        const match = await bcrypt.compare(password, admin.sifre_hash);
        if (!match) {
            return res.render("admin-login", { error: "Şifre hatalı" });
        }

        req.session.admin = { id: admin.id, kullanici_adi: admin.kullanici_adi };
        res.redirect("/admin");
    } catch (err) {
        console.error(err);
        res.render("admin-login", { error: "Sunucu hatası" });
    }
});

// Logout işlemi
router.get("/admin/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/admin/login");
    });
});



// Admin paneli ana sayfa (Wi-Fi dahil)
router.get("/admin", adminAuth, async function (req, res) {
  try {
    const [wifiRows] = await db.execute('SELECT * FROM wifi_settings ORDER BY id DESC LIMIT 1');
    const wifi = wifiRows[0] || { ssid: '', password: '' };

    // Diğer verileri de çekin (siparişler vs.)
    res.render("admin", { 
      admin: req.session.admin,
      wifi: wifi,
      message: null
      // diğer veriler...
    });
  } catch (err) {
    console.error(err);
    res.render("admin", { 
      admin: req.session.admin,
      wifi: { ssid: '', password: '' },
      message: 'Veri alınırken hata oluştu'
    });
  }
});

// Admin WiFi güncelleme
router.post('/admin/wifi', adminAuth, async (req, res) => {
  const { ssid, password } = req.body;
  try {
    // Veritabanı işlemleri aynı
    const [rows] = await db.execute('SELECT COUNT(*) as cnt FROM wifi_settings');
    if (rows[0].cnt > 0) {
      await db.execute('UPDATE wifi_settings SET ssid = ?, password = ? ORDER BY id DESC LIMIT 1', [ssid, password]);
    } else {
      await db.execute('INSERT INTO wifi_settings (ssid, password) VALUES (?, ?)', [ssid, password]);
    }

    // Burada ÖNEMLİ DEĞİŞİKLİK: admin template'ine yönlendir
    const [newRows] = await db.execute('SELECT * FROM wifi_settings ORDER BY id DESC LIMIT 1');
    res.render('admin', { 
      admin: req.session.admin,
      wifi: newRows[0], 
      message: 'WiFi bilgisi kaydedildi.'
    });
    
  } catch (err) {
    console.error(err);
    res.render('admin', { 
      admin: req.session.admin,
      wifi: { ssid, password }, 
      message: 'Kaydetme sırasında hata oluştu.'
    });
  }
});

//ADMIN SIPARISLER
router.get("/admin/siparisler", adminAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        s.siparis_id,
        s.tarih,
        s.masa_no,
        CAST(s.toplam_fiyat AS DECIMAL(10,2)) as toplam_fiyat,
        s.durum,
        sd.adet,
        u.urunAd as urun_ad
      FROM siparisler s
      JOIN siparis_detaylari sd ON s.siparis_id = sd.siparis_id
      JOIN urunler u ON sd.urun_id = u.urunid
      ORDER BY s.tarih DESC
    `);

    // Siparişleri grupla
    const siparisler = rows.reduce((acc, row) => {
      const existing = acc.find(s => s.siparis_id === row.siparis_id);
      if (existing) {
        existing.urunler.push({
          urun_ad: row.urun_ad,
          adet: row.adet
        });
      } else {
        acc.push({
          siparis_id: row.siparis_id,
          tarih: row.tarih,
          masa_no: row.masa_no,
          toplam_fiyat: Number(row.toplam_fiyat),
          durum: row.durum,
          urunler: [{
            urun_ad: row.urun_ad,
            adet: row.adet
          }]
        });
      }
      return acc;
    }, []);

    res.render("admin-siparisler", { siparisler });
  } catch (err) {
    console.error("Siparişler alınırken hata:", err);
    res.status(500).render("hata", { hataMesaji: "Sipariş bilgileri alınamadı" });
  }
});

router.post("/admin/siparisler/:id/durum-guncelle", adminAuth, async (req, res) => {
  try {
    const siparisId = parseInt(req.params.id);
    const { durum } = req.body;

    // Geçerli durum kontrolü
    if (!['bekliyor', 'onaylandi', 'reddedildi', 'tamamlandi'].includes(durum)) {
      return res.status(400).json({ 
        success: false, 
        message: "Geçersiz durum değeri" 
      });
    }

    const [result] = await db.execute(
      "UPDATE siparisler SET durum = ? WHERE siparis_id = ?",
      [durum, siparisId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Sipariş bulunamadı" 
      });
    }
    
    res.json({ 
      success: true,
      newStatus: durum
    });
  } catch (err) {
    console.error("Durum güncelleme hatası:", err);
    res.status(500).json({ 
      success: false, 
      message: "Sunucu hatası" 
    });
  }
});

// ADMIN-GUNSONU
router.get("/admin/gunsonu", adminAuth, async (req, res) => {
  try {
    // Tamamlanmış siparişleri çek
    const [siparislerRows] = await db.query(`
      SELECT siparis_id, masa_no, tarih, toplam_fiyat
      FROM siparisler
      WHERE durum = 'tamamlandi'
      ORDER BY tarih DESC
    `);

    // Eğer sipariş yoksa direkt render yap
    if (siparislerRows.length === 0) {
      return res.render("admin-gunsonu", {
        siparisler: [],
        toplamSiparisSayisi: 0,
        toplamFiyat: 0,
        urunToplamlari: [],
        genelToplamAdet: 0,
        genelToplamTutar: 0,
      });
    }

    // Sipariş idlerini al (detayları çekmek için)
    const siparisIdler = siparislerRows.map(s => s.siparis_id);

    // Sipariş detayları ve ürün bilgilerini çek
    const [detaylarRows] = await db.query(`
      SELECT sd.siparis_id, u.urunAd AS urun_adi, sd.adet, sd.birim_fiyat
      FROM siparis_detaylari sd
      JOIN urunler u ON sd.urun_id = u.urunid
      WHERE sd.siparis_id IN (?)
    `, [siparisIdler]);

    // Siparişlerin içine ürünleri ekle
    const siparisMap = {};
    siparislerRows.forEach(siparis => {
      siparis.urunler = [];
      siparisMap[siparis.siparis_id] = siparis;
    });
    detaylarRows.forEach(d => {
      if (siparisMap[d.siparis_id]) {
        siparisMap[d.siparis_id].urunler.push({
          urun_adi: d.urun_adi,
          adet: d.adet,
          birim_fiyat: d.birim_fiyat,
          toplam_tutar: d.adet * d.birim_fiyat,
        });
      }
    });

    // Ürün bazında toplam adet ve tutarları hesapla
    const urunToplamMap = {};
    detaylarRows.forEach(d => {
      if (!urunToplamMap[d.urun_adi]) {
        urunToplamMap[d.urun_adi] = { toplam_adet: 0, toplam_tutar: 0 };
      }
      urunToplamMap[d.urun_adi].toplam_adet += d.adet;
      urunToplamMap[d.urun_adi].toplam_tutar += d.adet * d.birim_fiyat;
    });
    const urunToplamlari = Object.entries(urunToplamMap).map(([urun_adi, val]) => ({
      urun_adi,
      toplam_adet: val.toplam_adet,
      toplam_tutar: val.toplam_tutar,
    }));

    // Genel toplamlar
    const toplamSiparisSayisi = siparislerRows.length;
    const toplamFiyat = siparislerRows.reduce((sum, s) => sum + Number(s.toplam_fiyat), 0);
    const genelToplamAdet = urunToplamlari.reduce((sum, u) => sum + u.toplam_adet, 0);
    const genelToplamTutar = urunToplamlari.reduce((sum, u) => sum + u.toplam_tutar, 0);

    // Render et
    res.render("admin-gunsonu", {
      siparisler: siparislerRows,
      toplamSiparisSayisi,
      toplamFiyat,
      urunToplamlari,
      genelToplamAdet,
      genelToplamTutar,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Sunucu hatası");
  }
});

router.get('/admin/gunsonu/excel', adminAuth, async (req, res) => {
  try {
    const [siparislerRows] = await db.query(`
      SELECT siparis_id, masa_no, tarih, toplam_fiyat
      FROM siparisler
      WHERE durum = 'tamamlandi'
      ORDER BY tarih DESC
    `);

    if (siparislerRows.length === 0) {
      return res.status(404).send("Tamamlanmış sipariş bulunamadı.");
    }

    const siparisIdler = siparislerRows.map(s => s.siparis_id);

    const [detaylarRows] = await db.query(`
      SELECT sd.siparis_id, u.urunAd AS urun_adi, sd.adet, sd.birim_fiyat
      FROM siparis_detaylari sd
      JOIN urunler u ON sd.urun_id = u.urunid
      WHERE sd.siparis_id IN (?)
    `, [siparisIdler]);

    const workbook = await createGunsonuReportExcel(siparislerRows, detaylarRows);

    // Tarih formatı
    const tarih = new Date();
    const gun = tarih.getDate().toString().padStart(2, '0');
    const ay = (tarih.getMonth() + 1).toString().padStart(2, '0');
    const yil = tarih.getFullYear();
    const dosyaAdi = `Burgercim-Gunsonu-${gun}.${ay}.${yil}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${dosyaAdi}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("Excel dosyası oluşturulurken hata oluştu.");
  }
});

router.delete('/admin/gunsonu/siparisleri-sil', adminAuth, async (req, res) => {
  try {
    // Tüm sipariş ID'lerini al
    const [siparisler] = await db.query("SELECT siparis_id FROM siparisler");

    if (siparisler.length === 0) {
      return res.status(200).json({ message: 'Silinecek sipariş yok' });
    }

    const siparisIdler = siparisler.map(s => s.siparis_id);

    // Sipariş detaylarını sil
    await db.query("DELETE FROM siparis_detaylari WHERE siparis_id IN (?)", [siparisIdler]);

    // Ardından siparişleri sil
    await db.query("DELETE FROM siparisler");

    res.status(200).json({ message: 'Tüm siparişler başarıyla silindi' });
  } catch (error) {
    console.error("Sipariş silme hatası:", error);
    res.status(500).json({ error: "Sipariş silme sırasında hata oluştu" });
  }
});



router.get("/admin/gunsonu", adminAuth, function(req,res){
    res.render("admin-gunsonu");
});

//ADMIN URUN AYARLARI
router.get("/admin/urunayarlari", adminAuth, async function(req, res) {
    try {
        
         const [urunler] = await db.execute(`
             SELECT urunler.*, kategoriler.kategoriAd 
             FROM urunler
            JOIN kategoriler ON urunler.kategori = kategoriler.kategoriId`);

         const [kategoriler] = await db.execute("SELECT * FROM kategoriler");
        

        res.render("admin-urunayarlari", {
            categories: kategoriler,
            urunler: urunler
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Sunucu hatası");
    }
});



router.post("/admin/urunayarlari", adminAuth, imageUpload.upload.single("resim") ,async function (req,res){
    const urunAd = req.body.urunAd;
    const kategori = req.body.kategori;
    const fiyat = req.body.fiyat;
    const resim = req.file.filename;

    console.log("Form verileri:", urunAd, kategori, fiyat, resim);
    
    try{
        await db.execute( "INSERT INTO urunler( urunAd, kategori, fiyat, resim) VALUES (?, ?, ?, ?)",[urunAd,kategori,fiyat,resim]);
        res.redirect("/admin/urunayarlari");
    }
    
    catch(err){
        console.log(err);
    }
});

router.delete("/admin/urunayarlari/sil/:id", adminAuth, async function(req, res) {
    const urunId = req.params.id;
    try {
        await db.query("DELETE FROM urunler WHERE urunid = ?", [urunId]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
});

router.post("/admin/urunayarlari/guncelle/:id", adminAuth, imageUpload.upload.single("resim"), async function(req, res) {
    const urunId = req.params.id;
    const { urunAd, fiyat, kategori } = req.body;

    try {
        if (req.file) {
            const resim = req.file.filename;
            await db.execute(
                "UPDATE urunler SET urunAd = ?, fiyat = ?, kategori = ?, resim = ? WHERE urunid = ?",
                [urunAd, fiyat, kategori, resim, urunId]
            );
        } else {
            await db.execute(
                "UPDATE urunler SET urunAd = ?, fiyat = ?, kategori = ? WHERE urunid = ?",
                [urunAd, fiyat, kategori, urunId]
            );
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Güncelleme hatası:", err);
        res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
});





module.exports = router ;