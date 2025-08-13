document.addEventListener('DOMContentLoaded', function() {
  // Durum güncelleme fonksiyonu
  async function guncelleDurum(siparisId, yeniDurum, btnElement) {
    try {
      const response = await fetch(`/admin/siparisler/${siparisId}/durum-guncelle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ durum: yeniDurum })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Durum güncellenemedi');
      }
      
      // Başarılıysa UI'ı güncelle
      const row = btnElement.closest('tr');
      const statusBadge = row.querySelector('.status-badge');
      const actionCell = row.querySelector('.action-buttons');
      
      // Durum metnini güncelle
      const durumMetinleri = {
        'bekliyor': 'Bekliyor',
        'onaylandi': 'Onaylandı',
        'reddedildi': 'Reddedildi',
        'tamamlandi': 'Tamamlandı'
      };
      
      statusBadge.textContent = durumMetinleri[yeniDurum] || yeniDurum;
      statusBadge.className = `status-badge status-${yeniDurum}`;
      
      // Butonları güncelle
      if (yeniDurum === 'onaylandi') {
        actionCell.innerHTML = `
          <button type="button" class="btn btn-sm btn-primary btn-action" 
                  data-action="tamamlandi">
            Tamamla
          </button>
        `;
      } else {
        actionCell.innerHTML = '<span class="no-action">-</span>';
      }
      
    } catch (error) {
      console.error('Hata:', error);
      alert(error.message || 'Bir hata oluştu');
    }
  }

  // Event delegation ile butonlara tıklama olayı ekle
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-action')) {
      const btn = e.target;
      const row = btn.closest('tr');
      const siparisId = row.dataset.orderId;
      const yeniDurum = btn.dataset.action;
      
      guncelleDurum(siparisId, yeniDurum, btn);
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const orderSound = document.getElementById('orderSound');
  const orderTableBody = document.getElementById('orderTableBody');
  let lastOrderId = 0;

  // Mevcut en büyük sipariş id'sini bul
  const rows = orderTableBody.querySelectorAll('tr[data-order-id]');
  rows.forEach(row => {
    const id = parseInt(row.dataset.orderId, 10);
    if (id > lastOrderId) lastOrderId = id;
  });

  async function checkNewOrders() {
    try {
      const response = await fetch(`/admin/api/yeni-siparisler?son_id=${lastOrderId}`);
      if (!response.ok) throw new Error('Sunucu hatası');

      const yeniSiparisler = await response.json();

      if (yeniSiparisler.length > 0) {
        yeniSiparisler.forEach(siparis => {
          const tr = document.createElement('tr');
          tr.dataset.orderId = siparis.siparis_id;
          tr.innerHTML = `
            <td>${siparis.siparis_id}</td>
            <td>
              <div class="order-time">
                <span class="order-date">${new Date(siparis.tarih).toLocaleDateString('tr-TR')}</span>
                <span class="order-hour">${new Date(siparis.tarih).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </td>
            <td class="text-center">${siparis.masa_no}</td>
            <td>
              <div class="order-products">
                ${siparis.urunler.map(urun => `
                  <div class="product-item">
                    <span class="product-name">${urun.urun_ad}</span>
                    <span class="product-quantity">x${urun.adet}</span>
                  </div>
                `).join('')}
              </div>
            </td>
            <td class="text-right">${siparis.toplam_fiyat.toFixed(2)} ₺</td>
            <td>
              <span class="status-badge status-${siparis.durum}">
                ${{
                  'bekliyor': 'Bekliyor',
                  'onaylandi': 'Onaylandı',
                  'reddedildi': 'Reddedildi',
                  'tamamlandi': 'Tamamlandı'
                }[siparis.durum] || siparis.durum}
              </span>
            </td>
            <td class="action-buttons">
              ${siparis.durum === "bekliyor" ? `
                <button type="button" class="btn btn-sm btn-success btn-action" data-action="onaylandi">Onayla</button>
                <button type="button" class="btn btn-sm btn-danger btn-action" data-action="reddedildi">Reddet</button>
              ` : siparis.durum === "onaylandi" ? `
                <button type="button" class="btn btn-sm btn-primary btn-action" data-action="tamamlandi">Tamamla</button>
              ` : `<span class="no-action">-</span>`}
            </td>
          `;
          orderTableBody.prepend(tr);

          if (siparis.siparis_id > lastOrderId) lastOrderId = siparis.siparis_id;

          // Bildirim sesi çal
          orderSound.play();
        });
      }
    } catch (error) {
      console.error("Yeni sipariş kontrol hatası:", error);
    }
  }

  // 5 saniyede bir kontrol et
  setInterval(checkNewOrders, 5000);
});
