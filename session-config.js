const session = require("express-session");

module.exports = session({
    secret: "gizli-gizli-key", 
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false ,
        maxAge: 24 * 60 * 60 * 1000 // 1 gün
    } 
});