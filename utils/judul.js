import { animasiAktif, tunggu, buatPemutar, sembunyikanKursor, tampilkanKursor } from "./terminal.js";
import { tulis, marginKiri, LEBAR_KOLOM } from "./layar.js";
import { warna, pelangi, campur, WARNA } from "./warna.js";
import { ulang, tengah, acakStabil } from "./teks.js";

// HURUF BLOK 5X5 UNTUK JUDUL BESAR.
const HURUF = {
  D: ["####.", "#...#", "#...#", "#...#", "####."],
  U: ["#...#", "#...#", "#...#", "#...#", ".###."],
  E: ["#####", "#....", "####.", "#....", "#####"],
  L: ["#....", "#....", "#....", "#....", "#####"],
  K: ["#...#", "#..#.", "###..", "#..#.", "#...#"],
  A: [".###.", "#...#", "#####", "#...#", "#...#"],
  R: ["####.", "#...#", "####.", "#..#.", "#...#"],
  T: ["#####", "..#..", "..#..", "..#..", "..#.."],
  C: [".####", "#....", "#....", "#....", ".####"],
  W: ["#...#", "#...#", "#.#.#", "##.##", "#...#"],
  S: [".####", "#....", ".###.", "....#", "####."],
};

const LEBAR_JUDUL = LEBAR_KOLOM;

const TIPS = [
  "Mana naik tiap giliran, maksimal 6.",
  "FLOOP hanya sekali per giliran untuk tiap creature.",
  "Falling Star mengurangi mana lawan di giliran berikutnya.",
  "Creature tanpa lawan di lajurnya menyerang hero langsung.",
  "Koleksi minimal 8 kartu agar bisa duel.",
  "Pilih Lihat untuk memeriksa kartu di tanganmu.",
];

// MENGUBAH SEBUAH KATA MENJADI 5 BARIS BITMAP (SATU PIKSEL = DUA KARAKTER LEBAR).
const bitmapKata = (kata) =>
  Array.from({ length: 5 }, (_, baris) =>
    [...kata].map((huruf) => HURUF[huruf][baris]).join(".")
  );

const KATA_ATAS = bitmapKata("CARD");
const KATA_BAWAH = bitmapKata("WARS");

// SATU FRAME JUDUL: HURUF BERWARNA PELANGI BERGELOMBANG, DENGAN KILAU PUTIH YANG MENYAPU DAN BINTANG BERKELIP.
export const barisJudul = (frame) => {
  const sapuan = (frame * 2.5) % 90 - 15;

  const gambarKata = (bitmap, geserBaris) =>
    bitmap.map((baris, y) => {
      const lebar = baris.length * 2;
      const mulai = Math.floor((LEBAR_JUDUL - lebar) / 2);
      const sel = [...baris].map((piksel, x) => {
        if (piksel !== "#") return "  ";
        const dasar = pelangi(x * 0.35 + (y + geserBaris) * 0.4 - frame * 0.45);
        const jarak = Math.abs(x * 2 + y * 3 - sapuan);
        const warnaAkhir = jarak < 6 ? campur(dasar, WARNA.putih, 0.7 - jarak * 0.1) : dasar;
        return warna("██", warnaAkhir);
      });
      return `${ulang(" ", mulai)}${sel.join("")}`;
    });

  const bintang = (offset) =>
    Array.from({ length: LEBAR_JUDUL }, (_, i) => {
      const kedip = acakStabil(i + offset, Math.floor(frame / 2));
      return kedip > 0.93 ? warna("✦", WARNA.emas) : " ";
    }).join("");

  const subjudul = warna(
    tengah("✦  duel kartu di terminal  ✦", LEBAR_JUDUL),
    campur(WARNA.abu, WARNA.emas, (Math.sin(frame * 0.4) + 1) / 2)
  );

  // GARIS PELANGI YANG BERDENYUT DI BAWAH SUBJUDUL.
  const garis = `${ulang(" ", Math.floor((LEBAR_JUDUL - 40) / 2))}${Array.from({ length: 40 }, (_, i) =>
    warna("━", pelangi(i * 0.45 - frame * 0.6))
  ).join("")}`;

  // TIPS BERMAIN YANG BERGANTI-GANTI.
  const tips = TIPS[Math.floor(frame / 50) % TIPS.length];
  const barisTips = warna(tengah(`✦ TIPS: ${tips} ✦`, LEBAR_JUDUL), campur(WARNA.abu, WARNA.putih, 0.3));

  return [bintang(1), ...gambarKata(KATA_ATAS, 0), "", ...gambarKata(KATA_BAWAH, 6), bintang(7), subjudul, garis, barisTips];
};

export const TINGGI_JUDUL = barisJudul(0).length;

export const tampilkanJudul = () => barisJudul(10).forEach((baris) => tulis(baris));

export const animasiJudul = async () => {
  if (!animasiAktif()) {
    tampilkanJudul();
    return;
  }

  sembunyikanKursor();
  const pemutar = buatPemutar();
  for (let frame = 0; frame < 32; frame++) {
    pemutar.gambar(barisJudul(frame));
    await tunggu(55);
  }
  tampilkanKursor();
};

// JUDUL TERUS BERKILAU SELAMA NUNGGU PEMAIN MILIH MENU. JUDUL DIGAMBAR ULANG DARI POSISI KURSOR
// (DISIMPAN LALU DIKEMBALIKAN) JADI KETIKAN PEMAIN TIDAK TERGANGGU. HASILNYA FUNGSI PENGHENTI.
// JARAKKEPROMPT = BERAPA BARIS DARI ATAS JUDUL SAMPAI BARIS TEMPAT MENGETIK.
export const mulaiJudulHidup = (jarakKePrompt) => {
  const muat = process.stdout.rows === undefined || process.stdout.rows > jarakKePrompt + 1;
  if (!animasiAktif() || process.stdin.isTTY !== true || !muat) return () => {};

  let frame = 40;
  const timer = setInterval(() => {
    frame += 1;
    const margin = marginKiri();
    const isi = barisJudul(frame)
      .map((baris) => `\x1b[2K${baris === "" ? "" : margin}${baris}`)
      .join("\n");
    process.stdout.write(`\x1b7\x1b[${jarakKePrompt}A\r${isi}\x1b8`);
  }, 70);

  return () => clearInterval(timer);
};
