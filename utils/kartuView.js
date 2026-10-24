import { cariLahan } from "../data/lahan.js";
import { serangEfektif } from "../services/aksiDasar.js";
import { barisArt } from "./pikselArt.js";
import { warna, tebal, pelangi, campur, WARNA } from "./warna.js";
import { ulang, pas, tengah, bungkusKata } from "./teks.js";

export const LEBAR_BESAR = 32;
export const LEBAR_KECIL = 18;
export const TINGGI_KECIL = 8;

const EMAS_TUA = [150, 120, 20];

// WARNA TEPI KARTU: SPELL BERKILAU PELANGI, KARTU BINTANG 4-5 BERKILAU EMAS, LAINNYA SESUAI LAHAN.
const warnaTepiKartu = (kartu, posisi) => {
  if (kartu.tipe === "spell") return pelangi(posisi);
  if (kartu.bintang >= 4) return campur(EMAS_TUA, WARNA.emas, (Math.sin(posisi * 0.5) + 1) / 2);
  return cariLahan(kartu.lahan).bingkai;
};

// ---------- KARTU BESAR (32 X 21) ----------

// OPSI BUAT NGUBAH TAMPILAN: POSISI = GESER KILAU TEPI, LENYAP = EFEK PECAH (0 SAMPAI 1), TINT = KILATAN WARNA.
export const barisKartuBesar = (kartu, opsi = {}) => {
  const { posisi = 0, lenyap = 0, tint = null } = opsi;
  const lahan = cariLahan(kartu.lahan);
  const dalam = LEBAR_BESAR - 2;
  const tepi = campur(warnaTepiKartu(kartu, posisi), WARNA.gelap, lenyap);
  const sisi = warna("│", tepi);
  const warnaNama = kartu.tipe === "spell" ? pelangi(posisi) : lahan.bingkai;

  const jenis = kartu.tipe === "spell" ? "SPELL" : "CREATURE";
  const label = `${lahan.label} `;
  const kepala = `${pas(` ${kartu.biaya}◆ ${jenis}`, dalam - label.length)}${label}`;

  const teksFloop =
    kartu.tipe === "creature" && kartu.efek !== "tanpa" ? [`FLOOP (${kartu.biayaFloop} Magic)`] : [];
  const teksDeskripsi = [...teksFloop, ...bungkusKata(kartu.deskripsi, dalam - 2)].slice(0, 4);
  const barisDeskripsi = Array.from({ length: 4 }, (_, i) =>
    warna(tengah(teksDeskripsi[i] ?? "", dalam), WARNA.tinta, lahan.latar)
  );

  const kiri = ` ATK ${kartu.serangan}`;
  const kanan = `HP ${kartu.pertahanan} `;
  const statistik =
    kartu.tipe === "creature"
      ? `${kiri}${ulang(" ", dalam - kiri.length - kanan.length)}${kanan}`
      : tengah("✦ SPELL ✦", dalam);
  const latarStatistik = kartu.tipe === "spell" ? [120, 70, 170] : WARNA.ungu;

  return [
    warna(`╭${ulang("─", dalam)}╮`, tepi),
    `${sisi}${warna(kepala, WARNA.tinta, lahan.bar)}${sisi}`,
    ...barisArt(kartu.gambar, "besar", { lenyap, tint }).map((art) => `${sisi}${art}${sisi}`),
    `${sisi}${tebal(warna(tengah(kartu.nama.toUpperCase(), dalam), WARNA.putih, warnaNama))}${sisi}`,
    `${sisi}${warna(tengah(ulang("★", kartu.bintang), dalam), WARNA.emas, WARNA.tinta)}${sisi}`,
    ...barisDeskripsi.map((baris) => `${sisi}${baris}${sisi}`),
    `${sisi}${warna(statistik, WARNA.putih, latarStatistik)}${sisi}`,
    warna(`╰${ulang("─", dalam)}╯`, tepi),
  ];
};

export const barisKosongBesar = () => Array.from({ length: 21 }, () => ulang(" ", LEBAR_BESAR));

// PUNGGUNG KARTU BERMOTIF, DIPAKAI UNTUK ANIMASI MEMBALIK KARTU.
export const barisPunggungKartu = (posisi = 0) => {
  const dalam = LEBAR_BESAR - 2;
  const tepi = pelangi(posisi);
  const isi = Array.from({ length: 19 }, (_, y) => {
    if (y === 9) return warna(tengah("CARD  WARS", dalam), WARNA.emas, [60, 30, 100]);
    const pola = Array.from({ length: dalam }, (__, x) => {
      const nilai = (x + y) % 4;
      return nilai === 0 ? "◆" : nilai === 2 ? "·" : " ";
    }).join("");
    return warna(pola, [190, 150, 255], [60, 30, 100]);
  });

  return [
    warna(`╭${ulang("─", dalam)}╮`, tepi),
    ...isi.map((baris) => `${warna("│", tepi)}${baris}${warna("│", tepi)}`),
    warna(`╰${ulang("─", dalam)}╯`, tepi),
  ];
};

// ---------- KARTU KECIL (18 X 9, DI PAPAN) ----------

const barisSlotKosong = (nomor) => {
  const dalam = LEBAR_KECIL - 2;
  const sisi = warna("┊", WARNA.abu);
  const titik = (baris) => warna(Array.from({ length: dalam }, (_, x) => ((x + baris) % 4 === 0 ? "·" : " ")).join(""), [70, 72, 90]);
  const isi = [
    titik(0),
    titik(2),
    warna(tengah(`LAJUR ${nomor}`, dalam), [175, 178, 195]),
    warna(tengah("taruh kartu", dalam), [95, 98, 115]),
    titik(1),
    titik(3),
  ];

  return [
    warna(`┌${ulang("┈", dalam)}┐`, WARNA.abu),
    ...isi.map((baris) => `${sisi}${baris}${sisi}`),
    warna(`└${ulang("┈", dalam)}┘`, WARNA.abu),
  ];
};

// EFEK YANG BISA DIKASIH KE SATU KARTU DI PAPAN:
//   JENIS   : "KILAT" | "MASUK" | "MATI" | "SERANG" | "FLOOP" | "SEMBUH" | "BUFF"
//   WARNA   : WARNA KILATAN, TEKS: TULISAN DI BARIS STATISTIK, NYALA: KILATANNYA LAGI NYALA ATAU PADAM
//   T       : SEBERAPA JAUH ANIMASINYA (0 SAMPAI 1), PARTIKEL: { CH, WARNA, JUMLAH }
export const barisKartuKecil = (creature, nomor, efek = null) => {
  if (creature === null) return barisSlotKosong(nomor);

  const dalam = LEBAR_KECIL - 2;
  const lahan = cariLahan(creature.lahan);
  const jenis = efek?.jenis ?? null;
  const t = efek?.t ?? 1;
  const nyala = efek?.nyala !== false;
  const menyala = efek !== null && nyala && efek.warna !== undefined;

  const tepi =
    jenis === "mati"
      ? campur(WARNA.merah, WARNA.abu, t)
      : jenis === "masuk"
        ? campur(WARNA.putih, lahan.bingkai, t)
        : menyala
          ? efek.warna
          : creature.bintang >= 4
            ? campur(EMAS_TUA, WARNA.emas, (Math.sin(Date.now() / 220) + 1) / 2)
            : lahan.bingkai;

  const statNormal = {
    teks: `ATK${serangEfektif(creature)} HP${Math.max(0, creature.hpSisa)}/${creature.pertahanan}`,
    fg: WARNA.putih,
    bg: WARNA.ungu,
  };
  const stat = jenis === "mati"
    ? { teks: "KO!", fg: WARNA.putih, bg: WARNA.merah }
    : menyala && efek.teks
      ? { teks: efek.teks, fg: [20, 20, 20], bg: efek.warna }
      : statNormal;

  const modArt = {
    lenyap: jenis === "mati" ? t : 0,
    tint: menyala && jenis !== "masuk" ? { warna: efek.warna, jumlah: 0.28 } : null,
    partikel: efek?.partikel ? { ...efek.partikel, t } : null,
  };

  const sisi = warna("│", tepi);
  const punyaFloop = creature.efek !== "tanpa";
  const penandaFloop = !punyaFloop ? " " : creature.sudahFloop ? "●" : "○";
  const warnaPenanda = creature.sudahFloop ? WARNA.abu : WARNA.emas;

  // BARIS STATISTIK: ATK/HP DI KIRI, PENANDA FLOOP (○ SIAP, ● SUDAH DIPAKAI) DI KANAN.
  const barisStat = stat === statNormal
    ? `${warna(pas(stat.teks, dalam - 3), stat.fg, stat.bg)}${warna(` ${penandaFloop} `, warnaPenanda, stat.bg)}`
    : warna(tengah(stat.teks, dalam), stat.fg, stat.bg);

  const semua = [
    warna(`╭${tengah(creature.nama, dalam)}╮`, WARNA.putih, tepi),
    ...barisArt(creature.gambar, "kecil", modArt).map((art) => `${sisi}${art}${sisi}`),
    `${sisi}${barisStat}${sisi}`,
    warna(`╰${ulang("─", dalam)}╯`, tepi),
  ];

  // ANIMASI "MASUK": KARTU MUNCUL BARIS DEMI BARIS DARI ATAS.
  if (jenis !== "masuk") return semua;
  const tampil = Math.ceil(t * semua.length);
  return semua.map((baris, i) =>
    i < tampil ? baris : i === semua.length - 1 ? ulang(" ", LEBAR_KECIL) : `${sisi}${ulang(" ", dalam)}${sisi}`
  );
};
