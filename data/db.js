const mysql = require("mysql2");
const config = require("../config");

const pool = mysql.createPool(config.db);

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Mysql bağlantı hatası:", err);
  } else {
    console.log("Mysql server başarıyla bağlandı.");
    if (connection) connection.release();
  }
});

module.exports = pool.promise();
