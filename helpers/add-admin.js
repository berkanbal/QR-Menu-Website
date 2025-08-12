const bcrypt = require("bcrypt");
const readline = require("readline");
const db = require("../data/db");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Kullanıcı adı: ", (username) => {
    rl.question("Şifre: ", async (password) => {
        try {
            const hash = await bcrypt.hash(password, 10);

            await db.execute(
                "INSERT INTO adminler (kullanici_adi, sifre_hash) VALUES (?, ?)",
                [username, hash]
            );

            console.log(`✅ Admin '${username}' başarıyla eklendi.`);
            rl.close();
            process.exit();
        } catch (err) {
            console.error("❌ Admin eklenirken hata:", err);
            rl.close();
            process.exit(1);
        }
    });
});