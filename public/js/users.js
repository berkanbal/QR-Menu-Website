// Navbar Menu
document.addEventListener('DOMContentLoaded', () => {
  const sepetIcon = document.querySelector('.cart-icon');
  const offScreenSepet = document.querySelector('.off-screen-sepet');

  sepetIcon.addEventListener('click', () => {
    sepetIcon.classList.toggle('active');
    offScreenSepet.classList.toggle('active');
  });

  document.querySelector('.cart-icon').addEventListener('click', function () {
    document.body.classList.toggle('sepet-acik');
  });
});

//***** Sepete Ürün Ekleme *****
document.addEventListener("DOMContentLoaded", () => {
  const sepeteEkleButonlari = document.querySelectorAll(".sepete-ekle-buton");
  const sepetIcerikKutusu = document.querySelector(".sepet-icerik-kutusu");
  const toplamTutarGoster = document.querySelector(".sepet-onay-tutar p");
  const sepetBosaltButon = document.querySelector(".sepet-bosalt-buton");

  let sepet = [];

  // Ürün sepete ekleme
  sepeteEkleButonlari.forEach(buton => {
    buton.addEventListener("click", () => {
      const menuItem = buton.closest(".menu-item");
      const urunId = menuItem.getAttribute("data-id");
      const urunAd = menuItem.querySelector("p").innerText;
      const fiyat = parseInt(menuItem.querySelector(".price").innerText); // Sadece görüntü için
      const resim = menuItem.querySelector("img").src;

      const varOlanUrun = sepet.find(u => u.id === urunId);

      if (varOlanUrun) {
        varOlanUrun.adet += 1;
      } else {
        sepet.push({ id: urunId, ad: urunAd, fiyat, adet: 1, resim });
      }

      sepetiGuncelle();
    });
  });

  // Sepeti güncelle
  function sepetiGuncelle() {
    sepetIcerikKutusu.innerHTML = "";

    sepet.forEach((urun, index) => {
      const urunHTML = document.createElement("div");
      urunHTML.classList.add("sepet-icerikler");
      urunHTML.innerHTML = `
        <div class="sepet-urun-resim"><img src="${urun.resim}" alt=""></div>
        <div class="sepet-urun-bilgiler" data-id="${urun.id}">
          <div class="sepet-urun-isim"><p>${urun.ad}</p></div>
          <div class="sepet-urun-altbilgi">
            <div class="sepet-urun-adet">
              <button class="urun-adet-buton-eksi" data-index="${index}">-</button>
              <div class="urun-adet-sayi"><p>${urun.adet} Adet</p></div>
              <button class="urun-adet-buton-arti" data-index="${index}">+</button>
            </div>
            <div class="sepet-urun-fiyat"><p>${urun.fiyat * urun.adet} ₺</p></div>
          </div>
        </div>
      `;
      sepetIcerikKutusu.appendChild(urunHTML);
    });

    adetButonlarinaOlayEkle();
    toplamTutarGuncelle();
  }

  // + / - butonlarına olay ekle
  function adetButonlarinaOlayEkle() {
    document.querySelectorAll(".urun-adet-buton-arti").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = btn.getAttribute("data-index");
        sepet[index].adet++;
        sepetiGuncelle();
      });
    });

    document.querySelectorAll(".urun-adet-buton-eksi").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = btn.getAttribute("data-index");
        if (sepet[index].adet > 1) {
          sepet[index].adet--;
        } else {
          sepet.splice(index, 1);
        }
        sepetiGuncelle();
      });
    });
  }

  // Toplam tutarı hesapla (sadece ekranda gösterim için)
  function toplamTutarGuncelle() {
    const toplam = sepet.reduce((acc, urun) => acc + (urun.fiyat * urun.adet), 0);
    toplamTutarGoster.innerText = `Toplam Tutar : ${toplam} ₺`;
  }

  // Sepeti boşalt
  sepetBosaltButon.addEventListener("click", () => {
    if (confirm("Sepeti boşaltmak istediğinize emin misiniz?")) {
      sepet = [];
      sepetiGuncelle();
    }
  });

  // Masa numarasını URL'den al
  const urlParams = new URLSearchParams(window.location.search);
  const masaNo = urlParams.get("masa");

  // Siparişi gönder
  document.querySelector(".sepet-siparis-buton").addEventListener("click", () => {
    if (sepet.length === 0) {
      alert("Sepet boş!");
      return;
    }

    // Güvenlik için sadece urun_id ve adet gönderiyoruz
    const siparisVerisi = {
      masa_no: masaNo,
      sepet: sepet.map(item => ({
        urun_id: item.id,
        adet: item.adet
      }))
    };

    fetch("/siparis-gonder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(siparisVerisi)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("Sipariş başarıyla gönderildi!");
          sepet = [];
          sepetiGuncelle();
        } else {
          alert("Sipariş gönderilemedi: " + data.message);
        }
      })
      .catch(err => {
        console.error("İstek hatası:", err);
        alert("Bir hata oluştu.");
      });
  });
});
