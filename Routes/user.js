const express =  require("express");
const router = express.Router();
const path = require("path");
const db = require("../data/db")


router.get("/urunler", async function(req,res){
    try {
        const [urunler] = await db.execute("SELECT *FROM urunler");
        const [hamburgerler] = await db.execute("SELECT *FROM urunler Where kategori = '1' ");
        const [kizartmalar] = await db.execute("SELECT *FROM urunler Where kategori = '2' ");
        const [icecekler] = await db.execute("SELECT *FROM urunler Where kategori = '3' ");

        res.render("users",{
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

router.use("/urunler", function(req,res){
    res.render("users");
});

module.exports = router ;