import {
  animasiAktif,
  tunggu,
  buatPemutar,
  bersihkanLayar,
  sembunyikanKursor,
  tampilkanKursor,
} from "./terminal.js";
import { barisPapan } from "./papanView.js";
import { warna, tebal, pelangi, teksPelangi, WARNA } from "./warna.js";
import { ulang, tengah, acakStabil } from "./teks.js";
import { tulis, LEBAR_KOLOM } from "./layar.js";

// POLA GOYANG LAYAR: JUMLAH SPASI TAMBAHAN DI SISI KIRI PAPAN PADA TIAP FRAME.
const GETAR = [2, 0, 2, 0, 1, 0];
const HURUF_ACAK = "▒░▓#@*?%&";

// MENAMPILKAN PAPAN STATIS (DIPAKAI SAAT MENU AKSI DITAMPILKAN).
export const tampilkanPapan = (keadaan, pesan = "") => {
  bersihkanLayar();
  barisPapan(keadaan, { pesan }).forEach((baris) => tulis(baris));
};

// ---------- ANIMASI PER JENIS PERISTIWA ----------
// SETIAP PENANGANAN MENERIMA { ITEM, GAMBAR, SEBELUMNYA } DAN MENGGAMBAR BEBERAPA FRAME.
// "SNAPSHOT" PADA PERISTIWA ADALAH KEADAAN SETELAH PERISTIWA ITU TERJADI.

const interpolasi = (dari, ke, langkah, total) => Math.round(dari + ((ke - dari) * langkah) / total);

const animasiMulaiGiliran = async ({ item, gambar }) => {
  const mana = item.snapshot[item.pihak].mana;
  for (let isi = 0; isi <= mana; isi++) {
    gambar(item.snapshot, { pesan: tebal(item.teks), manaTampil: { [item.pihak]: isi } });
    await tunggu(110);
  }
  await tunggu(200);
};

const animasiTarik = async ({ item, gambar }) => {
  if (!item.kartu) {
    gambar(item.snapshot, { pesan: tebal(item.teks) });
    await tunggu(90);
    return;
  }

  // HURUF NAMA KARTU "TERBUKA" SATU PER SATU DARI DERETAN KARAKTER ACAK.
  const nama = item.kartu.nama;
  const langkah = 10;
  for (let i = 0; i <= langkah; i++) {
    const terbuka = Math.ceil((i / langkah) * nama.length);
    const acak = [...nama].map((huruf, posisi) =>
      posisi < terbuka || huruf === " " ? huruf : HURUF_ACAK[Math.floor(Math.random() * HURUF_ACAK.length)]
    );
    gambar(item.snapshot, { pesan: `Kamu menarik: ${teksPelangi(acak.join(""), i)}` });
    await tunggu(55);
  }
  await tunggu(180);
};

const animasiMain = async ({ item, gambar }) => {
  const { sasaran } = item;

  if (sasaran && sasaran.lajur !== undefined) {
    // CREATURE DIPANGGIL: KARTU MUNCUL BARIS DEMI BARIS.
    const langkah = 8;
    for (let i = 1; i <= langkah; i++) {
      const efek = [{ pihak: sasaran.pihak, lajur: sasaran.lajur, jenis: "masuk", t: i / langkah }];
      gambar(item.snapshot, { efek, pesan: tebal(item.teks) });
      await tunggu(60);
    }
    await tunggu(150);
    return;
  }

  // SPELL: TULISAN BERKILAU PELANGI.
  for (let i = 0; i < 8; i++) {
    gambar(item.snapshot, { pesan: `✦ ${teksPelangi(item.teks, i * 2)} ✦` });
    await tunggu(75);
  }
};

const animasiFloop = async ({ item, gambar }) => {
  const { sasaran } = item;
  const langkah = 10;
  for (let i = 0; i < langkah; i++) {
    const efek = [
      {
        pihak: sasaran.pihak,
        lajur: sasaran.lajur,
        jenis: "floop",
        warna: WARNA.emas,
        teks: "FLOOP!",
        nyala: i % 4 < 2,
        t: i / (langkah - 1),
        partikel: { ch: "✦", warna: WARNA.emas, jumlah: 7 },
      },
    ];
    gambar(item.snapshot, { efek, pesan: tebal(item.teks) });
    await tunggu(70);
  }
};

const animasiSerang = async ({ item, gambar }) => {
  const { sasaran } = item;
  // ANAK PANAH MEMANJANG LALU MENYUSUT DI LAJUR PENYERANG.
  for (const panjang of [0, 1, 2, 3, 4, 3, 2]) {
    const efek = [
      {
        pihak: sasaran.pihak,
        lajur: sasaran.lajur,
        jenis: "serang",
        warna: WARNA.emas,
        teks: "► SERANG",
        nyala: panjang % 2 === 0,
      },
    ];
    const panah = { pihak: sasaran.pihak, lajur: sasaran.lajur, panjang };
    gambar(item.snapshot, { efek, panah, pesan: tebal(item.teks) });
    await tunggu(65);
  }
};

const animasiHeroBerubah = async ({ item, gambar }, warnaHero, getar) => {
  const { sasaran, sebelum, sesudah, nilai } = item;
  const tanda = getar ? "-" : "+";
  const langkah = 10;

  for (let i = 1; i <= langkah; i++) {
    const hero = {
      pihak: sasaran.pihak,
      hp: interpolasi(sebelum, sesudah, i, langkah),
      teks: `${tanda}${nilai}`,
      warna: warnaHero,
      nyala: i % 2 === 0,
    };
    gambar(item.snapshot, { hero, geser: getar && i <= GETAR.length ? GETAR[i - 1] : 0, pesan: tebal(item.teks) });
    await tunggu(50);
  }
  await tunggu(220);
};

const animasiDamage = async (konteks) => {
  const { item, gambar } = konteks;
  const { sasaran } = item;

  if (sasaran.hero) {
    await animasiHeroBerubah(konteks, WARNA.merah, true);
    return;
  }

  for (let i = 0; i < GETAR.length; i++) {
    const efek = [
      {
        pihak: sasaran.pihak,
        lajur: sasaran.lajur,
        jenis: "kilat",
        warna: WARNA.merah,
        teks: `-${item.nilai}`,
        nyala: i % 2 === 0,
        t: i / GETAR.length,
      },
    ];
    gambar(item.snapshot, { efek, geser: GETAR[i], pesan: tebal(item.teks) });
    await tunggu(80);
  }
  await tunggu(120);
};

const animasiMati = async ({ item, gambar, sebelumnya }) => {
  const { sasaran } = item;
  // KEADAAN SEBELUMNYA MASIH MEMUAT CREATURE ITU, SEHINGGA BISA DIGAMBAR PECAH BERKEPING-KEPING.
  const langkah = 12;
  for (let i = 1; i <= langkah; i++) {
    const efek = [{ pihak: sasaran.pihak, lajur: sasaran.lajur, jenis: "mati", t: i / langkah }];
    gambar(sebelumnya, { efek, geser: i <= GETAR.length ? GETAR[i - 1] : 0, pesan: tebal(item.teks) });
    await tunggu(70);
  }
  gambar(item.snapshot, { pesan: tebal(item.teks) });
  await tunggu(250);
};

const animasiSembuh = async (konteks) => {
  const { item, gambar } = konteks;
  const { sasaran } = item;

  if (sasaran.hero) {
    await animasiHeroBerubah(konteks, WARNA.hijau, false);
    return;
  }

  const langkah = 10;
  for (let i = 0; i < langkah; i++) {
    const efek = [
      {
        pihak: sasaran.pihak,
        lajur: sasaran.lajur,
        jenis: "sembuh",
        warna: WARNA.hijau,
        teks: `+${item.nilai}`,
        nyala: i % 4 < 3,
        t: i / (langkah - 1),
        partikel: { ch: "✚", warna: WARNA.hijau, jumlah: 8 },
      },
    ];
    gambar(item.snapshot, { efek, pesan: tebal(item.teks) });
    await tunggu(65);
  }
};

const animasiBuff = async ({ item, gambar }) => {
  const { sasaran } = item;
  const langkah = 10;
  for (let i = 0; i < langkah; i++) {
    const efek = [
      {
        pihak: sasaran.pihak,
        lajur: sasaran.lajur,
        jenis: "buff",
        warna: WARNA.emas,
        teks: `ATK +${item.nilai}`,
        nyala: i % 4 < 3,
        t: i / (langkah - 1),
        partikel: { ch: "▲", warna: WARNA.emas, jumlah: 6 },
      },
    ];
    gambar(item.snapshot, { efek, pesan: tebal(item.teks) });
    await tunggu(65);
  }
};

const animasiInfo = async ({ item, gambar }) => {
  gambar(item.snapshot, { pesan: tebal(item.teks) });
  await tunggu(420);
};

const penanganan = {
  mulai: animasiMulaiGiliran,
  tarik: animasiTarik,
  main: animasiMain,
  floop: animasiFloop,
  serang: animasiSerang,
  damage: animasiDamage,
  mati: animasiMati,
  sembuh: animasiSembuh,
  buff: animasiBuff,
};

// MEMUTAR ULANG DAFTAR PERISTIWA SEBAGAI ANIMASI DI PAPAN. DI LUAR TERMINAL SUNGGUHAN
// HANYA TEKS PERISTIWANYA YANG DICETAK.
export const putarPeristiwa = async (peristiwa, keadaanAwal) => {
  const berarti = peristiwa.filter((item) => item.teks !== undefined);

  if (!animasiAktif()) {
    berarti
      .filter((item) => item.jenis !== "tarik" || item.kartu)
      .forEach((item) => console.log(`  • ${item.teks}`));
    return;
  }

  bersihkanLayar();
  sembunyikanKursor();
  const pemutar = buatPemutar();
  const gambar = (keadaan, adegan = {}) => pemutar.gambar(barisPapan(keadaan, adegan));

  gambar(keadaanAwal);
  let sebelumnya = keadaanAwal;

  for (const item of berarti) {
    const tangani = penanganan[item.jenis] ?? animasiInfo;
    await tangani({ item, gambar, sebelumnya });
    sebelumnya = item.snapshot;
  }

  gambar(sebelumnya);
  tampilkanKursor();
};

// ---------- ANIMASI LAYAR PENUH ----------

// SPANDUK GILIRAN: KOTAK MELEBAR DARI TENGAH, LALU TULISANNYA BERKILAU.
export const animasiBanner = async (teks, warnaDasar = WARNA.emas) => {
  if (!animasiAktif()) {
    console.log(`\n══ ${teks} ══\n`);
    return;
  }

  bersihkanLayar();
  sembunyikanKursor();
  const pemutar = buatPemutar();
  const lebarPenuh = 40;
  const margin = (lebar) => ulang(" ", Math.floor((LEBAR_KOLOM - lebar) / 2));

  const bingkai = (lebar, isi) => [
    "",
    `${margin(lebar)}${warna(`╔${ulang("═", lebar - 2)}╗`, warnaDasar)}`,
    `${margin(lebar)}${warna("║", warnaDasar)}${isi}${warna("║", warnaDasar)}`,
    `${margin(lebar)}${warna(`╚${ulang("═", lebar - 2)}╝`, warnaDasar)}`,
  ];

  for (let lebar = 4; lebar <= lebarPenuh; lebar += 4) {
    pemutar.gambar(bingkai(lebar, ulang(" ", lebar - 2)));
    await tunggu(35);
  }

  for (let frame = 0; frame < 16; frame++) {
    const isi = tengah(`▶  ${teks}  ◀`, lebarPenuh - 2);
    const berwarna = frame % 2 === 0 ? tebal(warna(isi, warnaDasar)) : tebal(teksPelangi(isi, frame));
    pemutar.gambar(bingkai(lebarPenuh, berwarna));
    await tunggu(60);
  }
  tampilkanKursor();
};

// LAYAR PEMBUKA DUEL: DUA NAMA MELUNCUR DARI KIRI DAN KANAN, LALU "VS" BERKEDIP.
export const animasiMulaiDuel = async (kiri, kanan) => {
  if (!animasiAktif()) {
    console.log(`\n══ ${kiri} VS ${kanan} ══\n`);
    return;
  }

  bersihkanLayar();
  sembunyikanKursor();
  const pemutar = buatPemutar();
  const lebar = LEBAR_KOLOM;
  const total = 22;

  for (let frame = 0; frame <= total + 12; frame++) {
    const kemajuan = Math.min(1, frame / total);
    const gerak = 1 - (1 - kemajuan) ** 3;
    const kanvas = Array.from({ length: lebar }, () => " ");
    const taruh = (x, teks, fg) =>
      [...teks].forEach((huruf, i) => {
        if (x + i >= 0 && x + i < lebar) kanvas[x + i] = warna(huruf, fg);
      });

    taruh(Math.round(-10 + 12 * gerak), [...kiri.toUpperCase()].join(" "), WARNA.hijau);
    taruh(Math.round(lebar - (11 * gerak)), [...kanan.toUpperCase()].join(" "), WARNA.merah);
    if (frame > total) taruh(Math.floor((lebar - 6) / 2), frame % 2 === 0 ? "✦ VS ✦" : "  VS  ", pelangi(frame));

    const garis = warna(ulang("═", lebar), WARNA.emas);
    pemutar.gambar(["", garis, "", kanvas.join(""), "", garis]);
    await tunggu(45);
  }
  tampilkanKursor();
};

// LAYAR AKHIR: KONFETI JATUH SAAT MENANG, BARA MERAH PADAM SAAT KALAH.
export const animasiAkhir = async (menang) => {
  const teks = menang ? "★  KAMU MENANG!  ★" : "✕  KAMU KALAH...  ✕";
  if (!animasiAktif()) {
    console.log(`\n${teks}\n`);
    return;
  }

  sembunyikanKursor();
  const pemutar = buatPemutar();
  const lebar = LEBAR_KOLOM;
  const tinggi = 11;
  const partikel = menang ? ["▪", "✦", "●", "◆", "★"] : ["·", "'", "`", "."];

  for (let frame = 0; frame < 32; frame++) {
    const kanvas = Array.from({ length: tinggi }, () => Array.from({ length: lebar }, () => " "));

    for (let i = 0; i < 46; i++) {
      const x = Math.floor(acakStabil(i, 1) * lebar);
      const kecepatan = (menang ? 0.35 : 0.18) + acakStabil(i, 2) * 0.5;
      const y = Math.floor(acakStabil(i, 3) * tinggi + frame * kecepatan) % tinggi;
      const huruf = partikel[i % partikel.length];
      kanvas[y][x] = menang
        ? warna(huruf, pelangi(i * 1.7 + frame * 0.3))
        : warna(huruf, [255, 90 + Math.floor(acakStabil(i, 4) * 90), 40]);
    }

    const baris = kanvas.map((sel) => sel.join(""));
    const tengahBaris = Math.floor(tinggi / 2);
    const denyut = (Math.sin(frame * 0.5) + 1) / 2;
    const kiri = ulang(" ", Math.floor((lebar - [...teks].length) / 2));
    baris[tengahBaris] = tebal(
      menang
        ? `${kiri}${teksPelangi(teks, frame)}`
        : `${kiri}${warna(teks, [255, 90 + denyut * 80, 90 + denyut * 40])}`
    );
    pemutar.gambar(baris);
    await tunggu(75);
  }
  tampilkanKursor();
};
