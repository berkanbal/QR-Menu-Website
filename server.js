const express = require("express");

const app = express();
const path = require("path");
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", "public/views");
app.get("view engine");

const userRoutes = require("./Routes/user");
const adminRoutes = require("./Routes/admin");

app.use(adminRoutes);
app.use(userRoutes);






app.listen(3000, function(){
    console.log("listening on port 3000");
})
    
