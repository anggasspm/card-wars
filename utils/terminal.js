import { marginKiri } from "./layar.js";

// WARNA CUMA DIPAKAI KALAU TERMINALNYA MENDUKUNG (TTY) DAN NO_COLOR TIDAK DIISI.
// FORCE_COLOR MEMAKSA WARNA TETAP NYALA WALAU OUTPUT DIALIHKAN (BERGUNA BUAT NGETES).
export const warnaAktif = () =>
  process.env.NO_COLOR === undefined &&
  (process.stdout.isTTY === true || process.env.FORCE_COLOR !== undefined);

// ANIMASI CUMA JALAN DI TERMINAL ASLI. KALAU OUTPUT DIALIHKAN KE FILE,
// PROGRAM LANGSUNG MENAMPILKAN HASIL AKHIRNYA. FORCE_ANIMASI=1 MEMAKSA ANIMASI TETAP JALAN.
export const animasiAktif = () => process.stdout.isTTY === true || process.env.FORCE_ANIMASI === "1";

// KECEPATAN_ANIMASI NGATUR LAMA JEDA: 1 NORMAL, 0.5 DUA KALI LEBIH CEPAT, 2 DUA KALI LEBIH LAMBAT.
const faktorJeda = () => {
  const nilai = Number(process.env.KECEPATAN_ANIMASI);
  return Number.isFinite(nilai) && nilai > 0 ? nilai : 1;
};

export const tunggu = (milidetik) =>
  new Promise((resolve) => setTimeout(resolve, milidetik * faktorJeda()));

// MENYEMBUNYIKAN KEDIPAN KURSOR SUPAYA ANIMASI TERLIHAT BERSIH
export const sembunyikanKursor = () => process.stdout.write("\x1b[?25l");
// MENAMPILKAN KURSOR LAGI SETELAH ANIMASI SELESAI
export const tampilkanKursor = () => process.stdout.write("\x1b[?25h");

// MENJAMIN KURSOR KEMBALI MUNCUL WALAU PROGRAM DIHENTIKAN DI TENGAH ANIMASI.
process.on("exit", tampilkanKursor);

// MENGHAPUS LAYAR DAN MENGEMBALIKAN KURSOR KE POJOK KIRI ATAS
export const bersihkanLayar = () => {
  if (process.stdout.isTTY) process.stdout.write("\x1b[2J\x1b[H");
};

// PEMUTAR MENGGAMBAR ULANG SEKUMPULAN BARIS DI TEMPAT YANG SAMA (LAYAR TIDAK DIHAPUS).
// JUMLAH BARIS BOLEH BERUBAH ANTAR FRAME.
export const buatPemutar = () => {
  let tinggiLama = 0;

  const gambar = (baris) => {
    if (tinggiLama > 0) process.stdout.write(`\x1b[${tinggiLama}A`);
    // SETIAP BARIS DIBERI MARGIN KIRI SUPAYA TAMPILAN BERADA DI TENGAH
    const margin = marginKiri();
    baris.forEach((isi) => process.stdout.write(`\x1b[2K${isi === "" ? "" : margin}${isi}\n`));

    // KALAU FRAME BARU LEBIH PENDEK, SISA BARIS DARI FRAME LAMA DIHAPUS
    const sisa = tinggiLama - baris.length;
    if (sisa > 0) {
      process.stdout.write("\x1b[2K\n".repeat(sisa));
      process.stdout.write(`\x1b[${sisa}A`);
    }
    tinggiLama = baris.length;
  };

  return { gambar };
};
