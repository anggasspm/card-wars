import { barisKartuKecil, LEBAR_KECIL, TINGGI_KECIL } from "./kartuView.js";
import { warna, tebal, campur, pelangi, WARNA, RESET, kodeBg } from "./warna.js";
import { warnaAktif } from "./terminal.js";
import { ulang, pas, panjangTampil } from "./teks.js";

const LEBAR_PAPAN = LEBAR_KECIL * 3 + 2;
const MANA_MAKS = 6;

// BAR HP MODEL GRADASI: UJUNG KIRI LEBIH GELAP, UJUNG KANAN LEBIH TERANG. WARNA DASARNYA
// BERUBAH DARI HIJAU KE KUNING KE MERAH TERGANTUNG SISA HP.
const barHp = (hp, hpMaks, nyala, panjang = 20) => {
  const isi = Math.round((Math.max(0, hp) / hpMaks) * panjang);
  const rasio = hp / hpMaks;
  const terang = rasio > 0.5 ? WARNA.hijau : rasio > 0.25 ? WARNA.emas : WARNA.merah;
  const gelap = campur(terang, [10, 40, 30], 0.6);

  const sel = Array.from({ length: panjang }, (_, i) =>
    i < isi
      ? warna("█", nyala ? WARNA.putih : campur(gelap, terang, i / Math.max(1, panjang - 1)))
      : warna("▒", [60, 60, 72])
  );
  return sel.join("");
};

// BARIS INFO HERO: LAMBANG, NAMA, BAR HP, MANA, DAN JUMLAH KARTU DI DECK DAN TANGAN.
// HERO (BOLEH KOSONG): { HP, TEKS, WARNA, NYALA } DIPAKAI BUAT ANIMASI KENA DAMAGE ATAU HEAL.
const barisInfo = (pihak, label, hero, manaTampil) => {
  const hp = hero?.hp ?? pihak.hp;
  const mana = manaTampil ?? pihak.mana;
  const warnaPihak = label === "pemain" ? WARNA.hijau : WARNA.merah;
  const lambang = warna(label === "pemain" ? "◉" : "◈", warnaPihak);
  const angkaHp = warna(pas(`${hp}/${pihak.hpMaks}`, 8), hero?.nyala ? hero.warna : WARNA.putih);
  const pipMana = `${warna(ulang("◆", mana), WARNA.biru)}${warna(ulang("◇", MANA_MAKS - mana), WARNA.abu)}`;
  const popup = hero?.teks ? ` ${tebal(warna(hero.teks, hero.warna))}` : "";
  const hitungan = warna(`  ▤${pihak.deck.length}  ❖${pihak.tangan.length}`, WARNA.abu);

  return `${lambang} ${tebal(warna(pas(pihak.nama, 6), warnaPihak))}${warna("♥ ", WARNA.merah)}${barHp(hp, pihak.hpMaks, hero?.nyala === true, 16)} ${angkaHp}${pipMana}${hitungan}${popup}`;
};

const gabungKartu = (pihak, label, efek) => {
  const kolom = pihak.lajur.map((creature, lajur) =>
    barisKartuKecil(
      creature,
      lajur + 1,
      efek.find((item) => item.pihak === label && item.lajur === lajur) ?? null
    )
  );
  return Array.from({ length: TINGGI_KECIL }, (_, baris) => kolom.map((k) => k[baris]).join(" "));
};

// GARIS PEMBATAS TENGAH DENGAN TULISAN GILIRAN. PAS ADA SERANGAN, TANDA PANAH (▲ PEMAIN, ▼ LAWAN)
// MUNCUL DI LAJUR YANG MENYERANG DAN MEMANJANG.
const barisPemisah = (giliran, panah) => {
  const label = ` ✦ GILIRAN ${giliran} ✦ `;
  const mulaiLabel = Math.floor((LEBAR_PAPAN - label.length) / 2);
  const sel = Array.from({ length: LEBAR_PAPAN }, (_, i) =>
    i >= mulaiLabel && i < mulaiLabel + label.length
      ? { ch: label[i - mulaiLabel], fg: WARNA.emas }
      : { ch: "═", fg: campur(WARNA.emas, WARNA.abu, 0.5) }
  );

  if (panah) {
    const pusat = panah.lajur * (LEBAR_KECIL + 1) + LEBAR_KECIL / 2;
    for (let i = pusat - panah.panjang; i <= pusat + panah.panjang; i++) {
      if (i >= 0 && i < LEBAR_PAPAN) sel[i] = { ch: panah.pihak === "pemain" ? "▲" : "▼", fg: WARNA.merah };
    }
  }

  return sel.map(({ ch, fg }) => warna(ch, fg)).join("");
};

// REL ARENA DI KIRI DAN KANAN PAPAN: MERAH UNTUK SISI LAWAN, HIJAU UNTUK SISI PEMAIN, EMAS DI TENGAH.
const REL_KIRI = ["┏", "┃", "┃", "┃", "┃", "┃", "┃", "┃", "┃", "╋", "┃", "┃", "┃", "┃", "┃", "┃", "┃", "┃", "┗"];
const REL_KANAN = ["┓", "┃", "┃", "┃", "┃", "┃", "┃", "┃", "┃", "╋", "┃", "┃", "┃", "┃", "┃", "┃", "┃", "┃", "┛"];
const warnaRel = (indeks) =>
  indeks === TINGGI_KECIL + 1 ? WARNA.emas : indeks < TINGGI_KECIL + 1 ? [200, 80, 80] : [80, 190, 120];

const GUTTER = 5;
const LATAR_LAWAN = [38, 17, 24];
const LATAR_PEMAIN = [14, 36, 26];

// KASIH WARNA LATAR KE SATU BARIS. SETIAP ADA KODE RESET, KODE LATAR DITULIS LAGI
// BIAR WARNA LATARNYA TIDAK PUTUS KENA WARNA KARTU.
const denganLatar = (baris, latar) => {
  if (!warnaAktif()) return baris;
  const kode = kodeBg(latar);
  return `${kode}${baris.replaceAll(RESET, `${RESET}${kode}`)}${RESET}`;
};

// SPANDUK TIPIS DI ATAS PAPAN: GARIS PELANGI DENGAN NAMA GAME DI TENGAH.
// WARNANYA GESER MENGIKUTI WAKTU, JADI IKUT BERGERAK SELAMA ANIMASI.
const barisJudulPapan = () => {
  const label = " ✦ CARD WARS ✦ ";
  const lebar = LEBAR_PAPAN + 2 * GUTTER;
  const mulai = Math.floor((lebar - label.length) / 2);
  const geser = Date.now() / 120;
  const isi = Array.from({ length: lebar }, (_, i) =>
    i >= mulai && i < mulai + label.length
      ? tebal(warna(label[i - mulai], WARNA.putih))
      : warna("━", pelangi(i * 0.35 - geser))
  ).join("");
  return `  ${isi}`;
};

// MENYUSUN SELURUH PAPAN DUEL JADI DAFTAR BARIS TEKS DARI SATU KEADAAN (SNAPSHOT).
// ADEGAN = DETAIL ANIMASI YANG LAGI JALAN: EFEK, HERO, GESER, PANAH, PESAN, DAN MANATAMPIL
export const barisPapan = (keadaan, adegan = {}) => {
  const { efek = [], hero = null, geser = 0, panah = null, pesan = "", manaTampil = {} } = adegan;
  const heroUntuk = (label) => (hero && hero.pihak === label ? hero : null);

  const isi = [
    barisInfo(keadaan.lawan, "lawan", heroUntuk("lawan"), manaTampil.lawan),
    ...gabungKartu(keadaan.lawan, "lawan", efek),
    barisPemisah(keadaan.giliran, panah),
    ...gabungKartu(keadaan.pemain, "pemain", efek),
    barisInfo(keadaan.pemain, "pemain", heroUntuk("pemain"), manaTampil.pemain),
  ];

  const papan = isi.map((baris, i) => {
    const rel = (karakter) => warna(karakter, warnaRel(i));
    const sisa = Math.max(0, LEBAR_PAPAN - panjangTampil(baris));
    const zona = `${ulang(" ", GUTTER + geser)}${baris}${ulang(" ", sisa + GUTTER - geser)}`;
    const latar = i < TINGGI_KECIL + 1 ? LATAR_LAWAN : i === TINGGI_KECIL + 1 ? null : LATAR_PEMAIN;
    return `  ${rel(REL_KIRI[i])}${latar ? denganLatar(zona, latar) : zona}${rel(REL_KANAN[i])}`;
  });

  return [barisJudulPapan(), ...papan, `  ${ulang(" ", GUTTER + 1)}${pesan}`];
};

export const tinggiPapan = TINGGI_KECIL * 2 + 5;
