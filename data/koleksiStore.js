import { kartuAwal } from "./kartuAwal.js";

// DATABASE SEMENTARA DI MEMORI: KOLEKSI KARTU MILIK PEMAIN (ARRAY OF OBJECTS).
// KOLEKSI INI SEKALIGUS MENJADI DECK SAAT DUEL. DATA HILANG SAAT PROGRAM DITUTUP.
let koleksi = kartuAwal.map((kartu) => ({ ...kartu }));

// PENGHITUNG ID. DIMULAI DARI ID TERBESAR YANG ADA SUPAYA ID KARTU BARU TIDAK PERNAH KEMBAR
let idTerakhir = kartuAwal.reduce((tertinggi, { id }) => Math.max(tertinggi, id), 0);

// MEMBERIKAN ISI KOLEKSI SAAT INI KE FILE LAIN
export const ambilKoleksi = () => koleksi;

// MENGGANTI ISI KOLEKSI DENGAN ARRAY BARU. DIPAKAI SETELAH TAMBAH, UBAH, DAN HAPUS
export const simpanKoleksi = (koleksiBaru) => {
  koleksi = koleksiBaru;
};

// MEMBUAT ID BARU DENGAN MENAMBAH PENGHITUNG SATU DEMI SATU
export const buatIdKartu = () => {
  idTerakhir += 1;
  return idTerakhir;
};
