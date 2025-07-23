const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../data/db")



router.use("/admin/siparisler", function(req,res){
    res.render("admin-siparisler");
});

router.use("/admin/gunsonu", function(req,res){
    res.render("admin-gunsonu");
});

router.use("/admin/urunayarlari", async function(req, res) {
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

router.use("/admin", function(req,res){
    res.render("admin");
});

module.exports = router ;