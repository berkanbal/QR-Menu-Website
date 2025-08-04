// Navbar Menu
document.addEventListener('DOMContentLoaded', () => {
    const Menu = document.querySelector('.menu');
    const offScreenMenu = document.querySelector('.off-screen-menu');

    Menu.addEventListener('click', () => {
        Menu.classList.toggle('active');
        offScreenMenu.classList.toggle('active');
    });
});

// Silme Uyarı Ekranı
document.addEventListener("DOMContentLoaded", () => {
    const silButonlari = document.querySelectorAll(".sil-btn");
    const silModal = document.getElementById("sil-modal");
    const modalKabul = document.getElementById("modal-kabul");
    const modalIptal = document.getElementById("modal-iptal");

    let seciliUrunId = null;

    silButonlari.forEach(button => {
        button.addEventListener("click", function () {
            // Satırdaki ürün ID'sini al
            const urunId = this.closest("tr").querySelector(".col-id").textContent;
            seciliUrunId = urunId;

            // Modalı göster
            silModal.style.display = "block";
        });
    });

    modalKabul.addEventListener("click", () => {
        if (seciliUrunId) {
            fetch(`/admin/urunayarlari/sil/${seciliUrunId}`, {
                method: "DELETE",
            })
            .then(res => {
                silModal.style.display = "none";
                if (res.ok) {
                    location.reload();
                } else {
                    alert("Silme işlemi başarısız.");
                }
            })
            .catch(err => {
                silModal.style.display = "none";
                console.error('Fetch error:', err);
                alert("İstek sırasında hata oluştu.");
            });
        } else {
            silModal.style.display = "none";
        }
    });

    modalIptal.addEventListener("click", () => {
        silModal.style.display = "none";
    });
});
