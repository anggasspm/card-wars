import { warnaAktif } from "./terminal.js";

// KODE UNTUK MENGEMBALIKAN WARNA TERMINAL KE NORMAL
export const RESET = "\x1b[0m";

// KUMPULAN WARNA YANG SERING DIPAKAI, DITULIS DALAM BENTUK [MERAH, HIJAU, BIRU]
export const WARNA = {
  emas: [255, 210, 70],
  putih: [255, 255, 255],
  merah: [255, 90, 90],
  hijau: [110, 235, 140],
  biru: [90, 190, 255],
  abu: [140, 140, 150],
  gelap: [26, 22, 38],
  ungu: [70, 60, 90],
  tinta: [30, 20, 40],
};

// WARNA HARUS BILANGAN BULAT 0 SAMPAI 255, JADI DIBULATKAN DAN DIBATASI DULU
const bulat = (rgb) => rgb.map((nilai) => Math.max(0, Math.min(255, Math.round(nilai))));

// MEMBUAT KODE WARNA TULISAN
export const kodeFg = (rgb) => `\x1b[38;2;${bulat(rgb).join(";")}m`;

// MEMBUAT KODE WARNA LATAR
export const kodeBg = (rgb) => `\x1b[48;2;${bulat(rgb).join(";")}m`;

// MEMBUNGKUS TEKS DENGAN WARNA DEPAN/BELAKANG. TANPA DUKUNGAN WARNA, TEKS DIKEMBALIKAN APA ADANYA.
export const warna = (teks, fg = null, bg = null) => {
  if (!warnaAktif()) return teks;
  const awal = `${fg ? kodeFg(fg) : ""}${bg ? kodeBg(bg) : ""}`;
  return awal === "" ? teks : `${awal}${teks}${RESET}`;
};

// MEMBUAT TEKS MENJADI TEBAL
export const tebal = (teks) => (warnaAktif() ? `\x1b[1m${teks}${RESET}` : teks);

// GELOMBANG WARNA PELANGI, DIPAKAI UNTUK BINGKAI SPELL, JUDUL, DAN BANNER.
export const pelangi = (posisi) => {
  const sudut = posisi * 0.35;
  return [0, 2, 4].map((geser) => Math.round(150 + 105 * Math.sin(sudut + geser)));
};

// CAMPURAN DUA WARNA: JUMLAH 0 = WARNA A, JUMLAH 1 = WARNA B.
export const campur = (a, b, jumlah) => a.map((nilai, i) => nilai + (b[i] - nilai) * jumlah);

// MEWARNAI TEKS HURUF DEMI HURUF DENGAN GELOMBANG PELANGI.
export const teksPelangi = (teks, geser = 0) =>
  [...teks].map((huruf, i) => warna(huruf, pelangi(i * 0.7 + geser))).join("");
