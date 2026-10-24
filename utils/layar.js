import { ulang } from "./teks.js";

// SEMUA TAMPILAN DIBUAT DALAM SATU "KOLOM UTAMA" SELEBAR 72 KARAKTER, LALU KOLOMNYA
// DITARUH DI TENGAH JENDELA TERMINAL. KALAU BUKAN TERMINAL ASLI, MARGINNYA DIKOSONGKAN.
export const LEBAR_KOLOM = 72;
export const TINGGI_MINIMAL = 31;
export const LEBAR_MINIMAL = 74;

// LEBAR JENDELA TERMINAL. KALAU TIDAK TERDETEKSI, ANGGAP 80 KOLOM
const lebarJendela = () => process.stdout.columns ?? 80;
// TINGGI JENDELA TERMINAL. KALAU TIDAK TERDETEKSI, ANGGAP 24 BARIS
export const tinggiJendela = () => process.stdout.rows ?? 24;

// BERAPA SPASI YANG DIBUTUHKAN DI KIRI AGAR KOLOM UTAMA TEPAT DI TENGAH
export const jumlahMargin = () =>
  process.stdout.isTTY === true ? Math.max(0, Math.floor((lebarJendela() - LEBAR_KOLOM) / 2)) : 0;

// SPASI DI SISI KIRI SEBAGAI TEKS, SIAP DITEMPEL DI AWAL BARIS
export const marginKiri = () => ulang(" ", jumlahMargin());

// MENARUH KONTEN YANG LEBIH SEMPIT DARI KOLOM UTAMA DI TENGAH KOLOM ITU.
export const tengahDalamKolom = (baris, lebarKonten) => {
  const sisip = ulang(" ", Math.max(0, Math.floor((LEBAR_KOLOM - lebarKonten) / 2)));
  return baris.map((isi) => `${sisip}${isi}`);
};

// MENCETAK SATU BARIS DI DALAM KOLOM UTAMA (SUDAH DITENGAHKAN).
export const tulis = (teks = "") => console.log(teks === "" ? "" : `${marginKiri()}${teks}`);

// JUMLAH BARIS KOSONG DI ATAS AGAR KONTEN SETINGGI `TINGGIKONTEN` BERADA DI TENGAH JENDELA SECARA VERTIKAL.
export const jumlahPadAtas = (tinggiKonten) =>
  process.stdout.isTTY === true ? Math.max(0, Math.floor((tinggiJendela() - tinggiKonten) / 2)) : 0;
