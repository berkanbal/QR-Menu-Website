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

//Düzenle Modalı
document.addEventListener("DOMContentLoaded", () => {
  const duzenleModal = document.getElementById("duzenle-modal");
  const duzenleForm = document.getElementById("duzenleForm");

  document.querySelectorAll(".duzenle-btn").forEach(button => {
    button.addEventListener("click", (e) => {
      const row = e.target.closest("tr");

      document.getElementById("duzenle-urunid").value = row.querySelector(".col-id").textContent.trim();
      document.getElementById("duzenle-urunAd").value = row.querySelector(".col-isim").textContent.trim();
      document.getElementById("duzenle-fiyat").value = row.querySelector(".col-fiyat").textContent.trim().replace(" TL", "");

      const kategoriAd = row.querySelector(".col-kategori").textContent.trim();
      const kategoriSelect = document.getElementById("duzenle-kategori");
      [...kategoriSelect.options].forEach(opt => {
        opt.selected = opt.text === kategoriAd;
      });

      duzenleModal.style.display = "flex";
    });
  });

  document.getElementById("modal-kapat").addEventListener("click", () => {
    duzenleModal.style.display = "none";
  });

  duzenleForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const urunid = document.getElementById("duzenle-urunid").value;
    const formData = new FormData(duzenleForm);

    const response = await fetch(`/admin/urunayarlari/guncelle/${urunid}`, {
      method: "POST",
      body: formData
    });

    if (response.ok) {
      alert("Ürün başarıyla güncellendi.");
      location.reload();
    } else {
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  });
});

