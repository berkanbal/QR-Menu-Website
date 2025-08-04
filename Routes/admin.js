const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../data/db")
const imageUpload = require("../helpers/image_upload")




router.get("/admin/siparisler", function(req,res){
    res.render("admin-siparisler");
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


router.get("/admin", function(req,res){
    res.render("admin");
});

module.exports = router ;