document.addEventListener("DOMContentLoaded", () => {
  const gunuBitirBtn = document.getElementById("gunuBitirBtn");
  const modal = document.getElementById("confirmModal");
  const modalYes = document.getElementById("modalYes");
  const modalNo = document.getElementById("modalNo");

  gunuBitirBtn.addEventListener("click", () => {
    modal.style.display = "flex";  // Modal göster
  });

  modalNo.addEventListener("click", () => {
    modal.style.display = "none";  // Modal kapat
  });

  modalYes.addEventListener("click", async () => {
    modal.style.display = "none";

    try {
      // 1. Excel dosyasını indir
      const response = await fetch('/admin/gunsonu/excel');
      if (!response.ok) throw new Error("Excel indirilemedi");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const tarih = new Date();
      const gun = String(tarih.getDate()).padStart(2, '0');
      const ay = String(tarih.getMonth() + 1).padStart(2, '0');
      const yil = tarih.getFullYear();
      a.download = `Burgercim-Gunsonu-${gun}.${ay}.${yil}.xlsx`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // 2. Siparişleri sil
      const deleteResponse = await fetch('/admin/gunsonu/siparisleri-sil', {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) throw new Error("Siparişler silinemedi");

      alert("Gün sonu raporu indirildi ve siparişler silindi.");

      // 3. Sayfayı yenile
      window.location.reload();

    } catch (error) {
      console.error(error);
      // İstersen burada kullanıcıya hata mesajı gösterebilirsin
    }
  });
});
