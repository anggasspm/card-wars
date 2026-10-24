import readline from "node:readline";
import { marginKiri } from "./layar.js";
import { warna, WARNA } from "./warna.js";

// ANTARMUKA UNTUK MEMBACA INPUT DARI TERMINAL DAN MENAMPILKAN OUTPUT.
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// MENAMPILKAN PERTANYAAN LALU MENGEMBALIKAN JAWABAN (TEKS) DARI PENGGUNA.
// BARIS KOSONG DI AWAL PERTANYAAN DICETAK DULU, LALU PERTANYAANNYA DITARUH DI DALAM KOLOM UTAMA (TENGAH LAYAR).
export const tanya = (pertanyaan) =>
  new Promise((resolve) => {
    // AMBIL BARIS KOSONG DI AWAL PERTANYAAN (KALAU ADA) UNTUK DICETAK TERPISAH
    const [awal] = pertanyaan.match(/^\n*/);
    process.stdout.write(awal);
    rl.question(`${marginKiri()}${warna("› ", WARNA.emas)}${pertanyaan.slice(awal.length)}`, (jawaban) => resolve(jawaban.trim()));
  });

// SAMA SEPERTI TANYA(), TETAPI JAWABAN DIUBAH MENJADI ANGKA.
// JIKA KOSONG ATAU BUKAN ANGKA, HASILNYA NAN (AKAN DITOLAK OLEH VALIDASI).
export const tanyaAngka = async (pertanyaan) => {
  const jawaban = await tanya(pertanyaan);
  // JAWABAN KOSONG DIANGGAP BUKAN ANGKA
  if (jawaban === "") return NaN;
  return Number(jawaban);
};

// MENANYAKAN NOMOR YANG TAMPIL DIMULAI DARI 1, LALU MENGUBAHNYA KE INDEKS ARRAY (MULAI 0).
// JIKA BUKAN ANGKA BULAT, HASILNYA NAN.
export const tanyaNomor = async (pertanyaan) => {
  const angka = await tanyaAngka(pertanyaan);
  // PEMAIN MENGETIK MULAI DARI 1, SEDANGKAN ARRAY MULAI DARI 0, JADI DIKURANGI 1
  return Number.isInteger(angka) ? angka - 1 : NaN;
};

export const tutupInput = () => rl.close();
