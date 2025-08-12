const ExcelJS = require('exceljs');

async function createGunsonuReportExcel(siparislerRows, detaylarRows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Gün Sonu Raporu');

  // Enhanced styles with wider cells
  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFAC001D' } },
    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
    border: {
      top: { style: 'medium' },
      left: { style: 'medium' },
      bottom: { style: 'medium' },
      right: { style: 'medium' }
    }
  };

  const normalCellStyle = {
    font: { size: 11 },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    },
    alignment: { vertical: 'top' }
  };

  const productCellStyle = {
    font: { size: 11 },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    },
    alignment: { vertical: 'top', indent: 1 }
  };

  const totalRowStyle = {
    font: { bold: true, size: 12 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } },
    border: {
      top: { style: 'medium' },
      left: { style: 'medium' },
      bottom: { style: 'medium' },
      right: { style: 'medium' }
    }
  };

  // Set wider default row height
  sheet.properties.defaultRowHeight = 25;

  // Sipariş listesi tablosu - WIDER FORMAT
  sheet.addRow(['SİPARİŞ LİSTESİ']);
  sheet.mergeCells('A1:E1');
  const titleCell = sheet.getCell('A1');
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Sipariş başlıkları - WIDER COLUMNS
  sheet.addRow(['Sipariş No', 'Tarih/Saat', 'Masa', 'Ürünler', 'Tutar']);
  const siparisHeaderRow = sheet.lastRow;
  siparisHeaderRow.height = 28; // Taller header row
  siparisHeaderRow.eachCell(cell => {
    cell.style = headerStyle;
  });

  // Sipariş verileri - WIDER CELLS
  siparislerRows.forEach(siparis => {
    const tarihObj = new Date(siparis.tarih);
    const tarihStr = tarihObj.toLocaleDateString('tr-TR');
    const saatStr = tarihObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    // Main order row - taller and wider
    const mainRow = sheet.addRow([
      siparis.siparis_id,
      `${tarihStr} ${saatStr}`,
      siparis.masa_no,
      '', // Empty for products
      Number(siparis.toplam_fiyat)
    ]);
    mainRow.height = 22; // Slightly taller rows
    mainRow.eachCell(cell => {
      cell.style = normalCellStyle;
    });

    // Product rows - indented and aligned
    detaylarRows
      .filter(d => d.siparis_id === siparis.siparis_id)
      .forEach((urun, index) => {
        const urunRow = sheet.addRow([
          '', '', '',
          `  ${urun.urun_adi} x${urun.adet}`, // Indented product name
          ''
        ]);
        urunRow.height = 20;
        urunRow.eachCell(cell => {
          cell.style = productCellStyle;
          if (index === 0) cell.border = { top: { style: 'thin' } };
        });
      });

    // Add small gap after each order
    sheet.addRow([]);
  });

  // Toplam satırları - WIDER AND BOLDER
  const toplamSiparisSayisi = siparislerRows.length;
  const toplamFiyat = siparislerRows.reduce((sum, s) => sum + Number(s.toplam_fiyat), 0);

  const toplamRow1 = sheet.addRow([
    '', '', '',
    'Toplam Sipariş Sayısı:',
    toplamSiparisSayisi
  ]);
  toplamRow1.height = 26;
  toplamRow1.eachCell(cell => {
    cell.style = { ...totalRowStyle, ...normalCellStyle };
  });

  const toplamRow2 = sheet.addRow([
    '', '', '',
    'Toplam Tutar:',
    toplamFiyat
  ]);
  toplamRow2.height = 26;
  toplamRow2.eachCell(cell => {
    cell.style = { ...totalRowStyle, ...normalCellStyle };
    if (cell.col === 5) {
      cell.numFmt = '#,##0.00" ₺"';
    }
  });

  sheet.addRow([]); // Boş satır

  // Ürün toplamları tablosu - WIDER FORMAT
  sheet.addRow(['ÜRÜN TOPLAMLARI']);
  sheet.mergeCells('A' + sheet.lastRow.number + ':C' + sheet.lastRow.number);
  const productTitleCell = sheet.getCell('A' + sheet.lastRow.number);
  productTitleCell.font = { bold: true, size: 14 };
  productTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Ürün başlıkları - WIDER
  sheet.addRow(['Ürün', 'Adet', 'Toplam Tutar']);
  const urunHeaderRow = sheet.lastRow;
  urunHeaderRow.height = 28;
  urunHeaderRow.eachCell(cell => {
    cell.style = headerStyle;
  });

  // Ürün toplamlarını hesapla
  const urunToplamMap = {};
  detaylarRows.forEach(d => {
    if (!urunToplamMap[d.urun_adi]) {
      urunToplamMap[d.urun_adi] = { toplam_adet: 0, toplam_tutar: 0 };
    }
    urunToplamMap[d.urun_adi].toplam_adet += d.adet;
    urunToplamMap[d.urun_adi].toplam_tutar += d.adet * d.birim_fiyat;
  });

  // Ürün verileri - WIDER CELLS
  Object.entries(urunToplamMap).forEach(([urun_adi, val]) => {
    const urunRow = sheet.addRow([
      urun_adi,
      val.toplam_adet,
      val.toplam_tutar
    ]);
    urunRow.height = 22;
    urunRow.eachCell(cell => {
      cell.style = normalCellStyle;
      if (cell.col === 3) { // Price column
        cell.numFmt = '#,##0.00" ₺"';
      }
    });
  });

  // Genel toplam satırı - WIDER AND BOLDER
  const genelToplamAdet = Object.values(urunToplamMap).reduce((sum, u) => sum + u.toplam_adet, 0);
  const genelToplamTutar = Object.values(urunToplamMap).reduce((sum, u) => sum + u.toplam_tutar, 0);

  const genelToplamRow = sheet.addRow([
    'GENEL TOPLAM',
    genelToplamAdet,
    genelToplamTutar
  ]);
  genelToplamRow.height = 28;
  genelToplamRow.eachCell(cell => {
    cell.style = { ...totalRowStyle, ...normalCellStyle };
    if (cell.col === 3) {
      cell.numFmt = '#,##0.00" ₺"';
    }
  });

  // Sütun genişlikleri - WIDER COLUMNS
  sheet.columns = [
    { width: 18 }, // Sipariş No (wider)
    { width: 24 }, // Tarih/Saat (wider)
    { width: 14 }, // Masa (wider)
    { width: 50 }, // Ürünler (much wider)
    { width: 18 }, // Tutar (wider)
  ];

  // Sayı formatları
  sheet.getColumn(5).numFmt = '#,##0.00" ₺"';
  sheet.getColumn(2).numFmt = '@'; // Masa no text olarak
  sheet.getColumn(3).numFmt = '@'; // Ürün adet text olarak

  return workbook;
}

module.exports = { createGunsonuReportExcel };