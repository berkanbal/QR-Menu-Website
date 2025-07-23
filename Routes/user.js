const express =  require("express");
const router = express.Router();
const path = require("path");

router.use("/urunler", function(req,res){
    res.render("users");
});

module.exports = router ;