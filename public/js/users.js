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

//Wifi Modal İşlemleri
document.addEventListener('DOMContentLoaded', () => {
    try {
        const wifiIcon = document.querySelector('.wifi-icon');
        const wifiModal = document.getElementById('wifiModal');
        const wifiCloseModal = document.querySelector('.wifi-close-modal');
        const wifiPasswordInput = document.getElementById('wifiPassword');
        const wifiShowPasswordBtn = document.getElementById('wifiShowPasswordBtn');

        if(wifiIcon) {
            wifiIcon.addEventListener('click', () => {
                if(wifiModal) wifiModal.style.display = 'block';
            });
        }

        // Modal kapatma fonksiyonu - butonları aktif hale getir
        function closeModal() {
            if(wifiModal) wifiModal.style.display = 'none';

            document.querySelectorAll('.wifi-copy-btn').forEach(btn => {
                btn.textContent = btn.getAttribute('data-original-text') || 'Kopyala';
                btn.style.backgroundColor = '#ac001d';
                btn.disabled = false;
            });

            if(wifiShowPasswordBtn) {
                wifiShowPasswordBtn.textContent = (wifiPasswordInput.type === 'password') ? 'Göster' : 'Gizle';
                wifiShowPasswordBtn.disabled = false;
            }

            if (wifiPasswordInput) {
                wifiPasswordInput.type = 'password';
            }
        }

        if(wifiCloseModal) {
            wifiCloseModal.addEventListener('click', closeModal);
        }

        window.addEventListener('click', (e) => {
            if (e.target === wifiModal) {
                closeModal();
            }
        });

        // Orijinal buton metnini sakla
        document.querySelectorAll('.wifi-copy-btn').forEach(btn => {
            if (!btn.getAttribute('data-original-text')) {
                btn.setAttribute('data-original-text', btn.textContent);
            }
        });

        function copyText(text) {
          if (navigator.clipboard) {
            return navigator.clipboard.writeText(text);
          } else {
            // Fallback yöntem
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';  // sayfayı kaydırmaz
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();

            return new Promise((resolve, reject) => {
              try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textarea);
                if (successful) resolve();
                else reject();
              } catch (err) {
                document.body.removeChild(textarea);
                reject(err);
              }
            });
          }
        }


       document.addEventListener('click', function(e) {
        if(e.target.classList.contains('wifi-copy-btn')) {
          const btn = e.target;
          const targetId = btn.getAttribute('data-target');
          const input = document.getElementById(targetId);

          if(input) {
            copyText(input.value).then(() => {
              const originalText = btn.textContent;
              btn.textContent = 'Kopyalandı';
              btn.style.backgroundColor = '#4CAF50';
              btn.disabled = true;
              btn.style.cursor = 'default';

              // Modal kapandığında reset işlemleri buraya
              const wifiModal = document.getElementById('wifiModal');

              function resetBtn() {
                btn.textContent = originalText;
                btn.style.backgroundColor = '#ac001d';
                btn.disabled = false;
                btn.style.cursor = 'pointer';

                wifiModal.removeEventListener('click', modalClickHandler);
                document.querySelector('.wifi-close-modal').removeEventListener('click', resetBtn);
              }

              function modalClickHandler(event) {
                if(event.target === wifiModal) {
                  resetBtn();
                }
              }

              document.querySelector('.wifi-close-modal').addEventListener('click', resetBtn);
              wifiModal.addEventListener('click', modalClickHandler);

            }).catch(err => {
              console.error('Kopyalama hatası:', err);
            });
          }
        }
      });

        if (wifiShowPasswordBtn && wifiPasswordInput) {
            wifiShowPasswordBtn.addEventListener('click', () => {
                if (wifiPasswordInput.type === 'password') {
                    wifiPasswordInput.type = 'text';
                    wifiShowPasswordBtn.textContent = 'Gizle';
                } else {
                    wifiPasswordInput.type = 'password';
                    wifiShowPasswordBtn.textContent = 'Göster';
                }
            });
        }

    } catch (error) {
        console.error('WiFi modal işlemlerinde hata:', error);
    }
});

// Modal gösterme fonksiyonu
function modalGoster(mesaj) {
  document.getElementById("modalMesaj").innerText = mesaj;
  document.getElementById("siparisModal").style.display = "block";
}

// Modal kapatma fonksiyonu
document.getElementById("modalKapat").addEventListener("click", function() {
  document.getElementById("siparisModal").style.display = "none";
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
          modalGoster("Sipariş başarıyla gönderildi!");
          sepet = [];
          sepetiGuncelle();
        } else {
          modalGoster("Sipariş gönderilemedi: " + data.message);
        }
      })
      .catch(err => {
        console.error("İstek hatası:", err);
        modalGoster("Bir hata oluştu.");
      });
  });
});
