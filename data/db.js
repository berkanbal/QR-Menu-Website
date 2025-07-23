const mysql = require("mysql2");
const config = require ("../config");

let connection = mysql.createConnection(config.db);

connection.connect(function(err){
    if(err){
        return console.log.apply(err);
    }

    console.log("Mysql Server basariyla baglandi.");
});

module.exports = connection.promise();