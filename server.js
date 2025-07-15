const express = require("express");

const app = express();
const path = require("path");
app.use(express.static("public"));





app.use("/urunler", function(req,res){
    console.log(__dirname);
    console.log(__filename);
    res.sendFile(path.join(__dirname,"public/views","users.html"))
});

app.use("/admin", function(req,res){
    console.log(__dirname);
    console.log(__filename);
    res.sendFile(path.join(__dirname,"public/views","admin.html"))
});

app.listen(3000, function(){
    console.log("listening on port 3000");
})
    
