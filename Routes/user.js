const express = require("express");
const router = express.Router();
const db = require("../data/db");

// Ürünleri listeleme
router.get("/urunler", async function (req, res) {
  try {
    const masaNo = req.query.masa;

    const [urunler] = await db.execute("SELECT * FROM urunler");
    const [hamburgerler] = await db.execute("SELECT * FROM urunler WHERE kategori = '1'");
    const [kizartmalar] = await db.execute("SELECT * FROM urunler WHERE kategori = '2'");
    const [icecekler] = await db.execute("SELECT * FROM urunler WHERE kategori = '3'");

    res.render("users", {
      masa: masaNo,
      urunler,
      hamburgerler,
      kizartmalar,
      icecekler
    });

  } catch (err) {
    console.log(err);
    res.status(500).send("Sunucu Hatasi");
  }
});

// Sipariş gönderme
router.post("/siparis-gonder", async (req, res) => {
  const { masa_no, sepet } = req.body;

  if (!masa_no || !sepet || sepet.length === 0) {
    return res.status(400).json({ success: false, message: "Eksik veri gönderildi." });
  }

  const tarih = new Date();
  const durum = "hazırlanıyor";

  try {
    // Gönderilen ürün id'lerini al
    const urunIdListesi = sepet.map(u => u.urun_id);

    // Ürünlerin fiyatlarını veritabanından çek
    const [urunler] = await db.execute(
      `SELECT urunid, fiyat FROM urunler WHERE urunid IN (${urunIdListesi.map(() => '?').join(',')})`,
      urunIdListesi
    );

    // ID -> fiyat map
    const fiyatMap = {};
    urunler.forEach(u => {
      fiyatMap[u.urunid] = parseFloat(u.fiyat);
    });

    // Toplam fiyat ve sipariş detaylarını hazırla
    let toplamFiyat = 0;
    const siparisDetaylari = [];

    for (const urun of sepet) {
      const birimFiyat = fiyatMap[urun.urun_id];
      if (!birimFiyat) {
        return res.status(400).json({ success: false, message: `Ürün bulunamadı: ${urun.urun_id}` });
      }
      toplamFiyat += birimFiyat * urun.adet;
      siparisDetaylari.push({
        urun_id: urun.urun_id,
        adet: urun.adet,
        birim_fiyat: birimFiyat
      });
    }

    // siparisler tablosuna ekle
    const [siparisResult] = await db.execute(
      "INSERT INTO siparisler (masa_no, tarih, toplam_fiyat, durum) VALUES (?, ?, ?, ?)",
      [masa_no, tarih, toplamFiyat.toFixed(2), durum]
    );

    const siparisId = siparisResult.insertId;

    // siparis_detaylari tablosuna ekle
    for (const detay of siparisDetaylari) {
      await db.execute(
        "INSERT INTO siparis_detaylari (siparis_id, urun_id, adet, birim_fiyat) VALUES (?, ?, ?, ?)",
        [siparisId, detay.urun_id, detay.adet, detay.birim_fiyat]
      );
    }

    res.json({ success: true, message: "Sipariş başarıyla kaydedildi." });
  } catch (err) {
    console.error("Sipariş gönderilemedi:", err);
    res.status(500).json({ success: false, message: "Sipariş gönderilemedi." });
  }
});

module.exports = router;
