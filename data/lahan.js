// WARNA DAN LABEL SETIAP JENIS LAHAN (LANDSCAPE). DIPAKAI UNTUK BINGKAI DAN LATAR KARTU.
export const daftarLahan = [
  { nama: "Corn Fields", label: "CORN", latar: [238, 216, 96], bingkai: [140, 112, 28], bar: [214, 186, 66] },
  { nama: "Blue Plains", label: "PLAINS", latar: [128, 190, 232], bingkai: [40, 104, 156], bar: [92, 156, 206] },
  { nama: "Useless Swamp", label: "SWAMP", latar: [122, 168, 90], bingkai: [44, 84, 44], bar: [88, 134, 64] },
  { nama: "Nice Lands", label: "NICE", latar: [238, 156, 190], bingkai: [156, 62, 104], bar: [214, 120, 160] },
  { nama: "Rainbow", label: "RAINBOW", latar: [218, 200, 248], bingkai: [150, 90, 200], bar: [190, 168, 232] },
];

// LAHAN YANG BOLEH DIPILIH UNTUK CREATURE BUATAN SENDIRI (SPELL SELALU RAINBOW).
export const lahanCreature = daftarLahan.filter(({ nama }) => nama !== "Rainbow").map(({ nama }) => nama);

// MENCARI DATA LAHAN BERDASARKAN NAMA. KALAU TIDAK KETEMU, PAKAI RAINBOW SEBAGAI CADANGAN
export const cariLahan = (nama) => daftarLahan.find((lahan) => lahan.nama === nama) ?? daftarLahan[4];
