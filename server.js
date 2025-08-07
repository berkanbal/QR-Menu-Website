const express = require("express");

const app = express();
const path = require("path");
app.use(express.static("public"));
const db = require("./data/db");

app.set("view engine", "ejs");
app.set("views", "public/views");
app.get("view engine");

app.use(express.json());

app.use(express.urlencoded({extended: false}));

const userRoutes = require("./Routes/user");
const adminRoutes = require("./Routes/admin");

app.use(adminRoutes);
app.use(userRoutes);






app.listen(3000, function(){
    console.log("listening on port 3000");
})
    
