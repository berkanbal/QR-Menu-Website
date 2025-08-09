const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../data/db")
const imageUpload = require("../helpers/image_upload")




router.get("/admin/siparisler", async (req, res) => {
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

router.post("/admin/siparisler/:id/durum-guncelle", async (req, res) => {
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



router.get("/admin/gunsonu", function(req,res){
    res.render("admin-gunsonu");
});

router.get("/admin/urunayarlari", async function(req, res) {
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



router.post("/admin/urunayarlari", imageUpload.upload.single("resim") ,async function (req,res){
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

router.delete("/admin/urunayarlari/sil/:id", async function(req, res) {
    const urunId = req.params.id;
    try {
        await db.query("DELETE FROM urunler WHERE urunid = ?", [urunId]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
});

router.post("/admin/urunayarlari/guncelle/:id", imageUpload.upload.single("resim"), async function(req, res) {
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



router.get("/admin", function(req,res){
    res.render("admin");
});

module.exports = router ;