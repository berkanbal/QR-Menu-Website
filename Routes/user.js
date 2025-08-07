const express =  require("express");
const router = express.Router();
const path = require("path");
const db = require("../data/db")


router.get("/urunler", async function(req,res){
    try {
        const masaNo = req.query.masa; // URL'deki masa parametresi alınır

        const [urunler] = await db.execute("SELECT *FROM urunler");
        const [hamburgerler] = await db.execute("SELECT *FROM urunler Where kategori = '1' ");
        const [kizartmalar] = await db.execute("SELECT *FROM urunler Where kategori = '2' ");
        const [icecekler] = await db.execute("SELECT *FROM urunler Where kategori = '3' ");

        res.render("users",{
            masa: masaNo,
            urunler: urunler ,
            hamburgerler: hamburgerler ,
            kizartmalar: kizartmalar ,
            icecekler: icecekler
        });

    } 
    
    catch (err) {
        console.log(err);
        res.status(500).send("Sunucu Hatasi");
    }
});

// Sipariş gönderme endpoint'i
router.post("/siparis-gonder", async (req, res) => {
  const { masa_no, sepet, toplam_fiyat } = req.body;

  if (!masa_no || !sepet || sepet.length === 0) {
    return res.status(400).json({ success: false, message: "Eksik veri gönderildi." });
  }

  const tarih = new Date();
  const durum = "hazırlanıyor";

  try {
    // 1. siparisler tablosuna ekle
    const [siparisResult] = await db
      .execute(
        "INSERT INTO siparisler (masa_no, tarih, toplam_fiyat, durum) VALUES (?, ?, ?, ?)",
        [masa_no, tarih, toplam_fiyat, durum]
      );

    const siparisId = siparisResult.insertId;

    // 2. Her ürün için siparis_detaylari tablosuna ekle
    for (const urun of sepet) {
      const { urun_id, adet, birim_fiyat } = urun;
      await db
        .execute(
          "INSERT INTO siparis_detaylari (siparis_id, urun_id, adet, birim_fiyat) VALUES (?, ?, ?, ?)",
          [siparisId, urun_id, adet, birim_fiyat]
        );
    }

    res.json({ success: true, message: "Sipariş başarıyla kaydedildi." });
  } catch (err) {
    console.error("Sipariş gönderilemedi:", err);
    res.status(500).json({ success: false, message: "Sipariş gönderilemedi." });
  }
});

module.exports = router ;