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