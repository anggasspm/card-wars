import { kartuAwal } from "../data/kartuAwal.js";
import {
  HP_AWAL,
  JUMLAH_LAJUR,
  acak,
  lawanDari,
  buatInstance,
  serangEfektif,
  catat,
  damageCreature,
  damageHero,
  tarikKartu,
} from "./aksiDasar.js";
import { definisiEfek, cekTarget } from "./efekService.js";

// MANA PER GILIRAN MAKSIMAL 6
const MANA_MAKS = 6;
// SETIAP PIHAK MULAI DENGAN 4 KARTU DI TANGAN
const JUMLAH_KARTU_AWAL = 4;

// DUA FUNGSI KECIL INI MEMBUAT HASIL AKSI YANG BENTUKNYA SERAGAM: BERHASIL ATAU GAGAL
const gagal = (pesan) => ({ berhasil: false, pesan, peristiwa: [] });
const sukses = (pesan, peristiwa) => ({ berhasil: true, pesan, peristiwa });

// ---------- PERSIAPAN DUEL ----------
const buatPihak = (nama, deck) => ({
  nama,
  hp: HP_AWAL,
  hpMaks: HP_AWAL,
  mana: 0,
  penaltiMana: 0,
  deck: acak(deck.map((kartu) => ({ ...kartu }))),
  tangan: [],
  buang: [],
  lajur: Array.from({ length: JUMLAH_LAJUR }, () => null),
});

// MEMBUAT KEADAAN DUEL BARU. DECK PEMAIN BERASAL DARI KOLEKSI; LAWAN MEMAKAI 12 KARTU AWAL.
// KOLEKSI ASLI TIDAK BERUBAH KARENA SETIAP KARTU DISALIN.
export const buatDuel = (koleksiPemain) => {
  const state = {
    giliran: 1,
    pemain: buatPihak("Kamu", koleksiPemain),
    lawan: buatPihak("Lawan", kartuAwal),
  };

  // PERISTIWA TARIK KARTU AWAL TIDAK PERLU DIANIMASIKAN, JADI DITAMPUNG DI ARRAY KOSONG
  const abaikan = [];
  ["pemain", "lawan"].forEach((pihak) => tarikKartu(state, abaikan, pihak, JUMLAH_KARTU_AWAL));
  return state;
};

export const cekPemenang = (state) => {
  if (state.lawan.hp <= 0) return "pemain";
  if (state.pemain.hp <= 0) return "lawan";
  return null;
};

// ---------- GILIRAN ----------

export const mulaiGiliran = (state, pelaku) => {
  const pihak = state[pelaku];
  const daftar = [];

  // MANA NAIK TIAP GILIRAN, DIKURANGI PENALTI (MISALNYA DARI FALLING STAR)
  const manaDasar = Math.min(state.giliran + 1, MANA_MAKS);
  pihak.mana = Math.max(0, manaDasar - pihak.penaltiMana);

  if (pihak.penaltiMana > 0) {
    catat(state, daftar, { jenis: "info", teks: `${pihak.nama} kehilangan ${pihak.penaltiMana} mana (Falling Star)` });
  }
  pihak.penaltiMana = 0;

  // SEMUA CREATURE BOLEH FLOOP LAGI DI GILIRAN BARU
  pihak.lajur.forEach((creature) => {
    if (creature) creature.sudahFloop = false;
  });

  catat(state, daftar, { jenis: "mulai", pihak: pelaku, teks: `Giliran ${pihak.nama} dimulai. Mana: ${pihak.mana}` });
  tarikKartu(state, daftar, pelaku, 1);
  return daftar;
};

// MEMAINKAN KARTU DARI TANGAN. OPSI.LAJUR UNTUK CREATURE, OPSI.TARGET UNTUK SPELL YANG BUTUH TARGET.
export const mainkanKartu = (state, pelaku, indeksTangan, opsi = {}) => {
  const pihak = state[pelaku];
  const kartu = pihak.tangan[indeksTangan];
  const daftar = [];

  // CEK DULU: KARTU ADA, DAN MANA CUKUP
  if (!kartu) return gagal("Kartu itu tidak ada di tanganmu.");
  if (kartu.biaya > pihak.mana) {
    return gagal(`Mana kurang (butuh ${kartu.biaya}, kamu punya ${pihak.mana}).`);
  }

  // CREATURE: HARUS DITARUH DI LAJUR YANG KOSONG
  if (kartu.tipe === "creature") {
    const { lajur } = opsi;
    if (!Number.isInteger(lajur) || lajur < 0 || lajur >= JUMLAH_LAJUR) {
      return gagal(`Pilih lajur 1-${JUMLAH_LAJUR}.`);
    }
    if (pihak.lajur[lajur] !== null) return gagal("Lajur itu sudah terisi.");

    pihak.mana -= kartu.biaya;
    pihak.tangan.splice(indeksTangan, 1);
    pihak.lajur[lajur] = buatInstance(kartu);
    catat(state, daftar, {
      jenis: "main",
      teks: `${pihak.nama} memanggil ${kartu.nama} ke lajur ${lajur + 1}`,
      sasaran: { pihak: pelaku, lajur },
    });
    return sukses(`${kartu.nama} dipanggil.`, daftar);
  }

  // SPELL: JALANKAN EFEKNYA, LALU KARTU MASUK TUMPUKAN BUANG
  const efek = definisiEfek[kartu.efek];
  if (!efek) return gagal("Efek kartu ini tidak dikenal.");

  // PASTIKAN TARGET SPELL VALID SEBELUM MANA DIPOTONG
  const pesanTarget = cekTarget(state, pelaku, efek, null, opsi.target);
  if (pesanTarget !== null) return gagal(pesanTarget);

  pihak.mana -= kartu.biaya;
  pihak.tangan.splice(indeksTangan, 1);
  catat(state, daftar, { jenis: "main", teks: `${pihak.nama} memakai spell ${kartu.nama}` });
  efek.jalankan({ state, daftar, pelaku, sumber: kartu, lajurSumber: null, target: opsi.target });
  pihak.buang.push(kartu);
  return sukses(`${kartu.nama} dimainkan.`, daftar);
};

// MENGAKTIFKAN KEMAMPUAN FLOOP CREATURE DI LAJUR TERTENTU (SEKALI PER GILIRAN, MEMAKAI MANA).
export const floop = (state, pelaku, lajur, opsi = {}) => {
  const pihak = state[pelaku];
  const creature = pihak.lajur[lajur];
  const daftar = [];

  if (!creature) return gagal("Tidak ada creature di lajur itu.");

  const efek = definisiEfek[creature.efek];
  if (!efek || creature.efek === "tanpa") return gagal(`${creature.nama} tidak punya kemampuan FLOOP.`);
  // SETIAP CREATURE HANYA BOLEH FLOOP SEKALI PER GILIRAN
  if (creature.sudahFloop) return gagal(`${creature.nama} sudah FLOOP di giliran ini.`);
  if (creature.biayaFloop > pihak.mana) {
    return gagal(`Mana kurang untuk FLOOP (butuh ${creature.biayaFloop}, kamu punya ${pihak.mana}).`);
  }

  const pesanTarget = cekTarget(state, pelaku, efek, lajur, opsi.target);
  if (pesanTarget !== null) return gagal(pesanTarget);

  pihak.mana -= creature.biayaFloop;
  creature.sudahFloop = true;
  catat(state, daftar, {
    jenis: "floop",
    teks: `${creature.nama} FLOOP!`,
    sasaran: { pihak: pelaku, lajur },
  });
  efek.jalankan({ state, daftar, pelaku, sumber: creature, lajurSumber: lajur, target: opsi.target });
  return sukses(`${creature.nama} FLOOP.`, daftar);
};

// FASE PERTARUNGAN: SETIAP CREATURE MENYERANG LAWAN DI LAJUR YANG SAMA, ATAU LANGSUNG KE HERO JIKA KOSONG.
export const fasePertarungan = (state, pelaku) => {
  const pihakLawan = lawanDari(pelaku);
  const daftar = [];

  for (let lajur = 0; lajur < JUMLAH_LAJUR; lajur++) {
    const penyerang = state[pelaku].lajur[lajur];
    if (!penyerang) continue;

    // HITUNG KEKUATAN SERANGAN TERMASUK BONUS
    const kekuatan = serangEfektif(penyerang);
    catat(state, daftar, {
      jenis: "serang",
      teks: `${penyerang.nama} menyerang dengan ${kekuatan} Attack`,
      sasaran: { pihak: pelaku, lajur },
    });

    // ADA LAWAN DI LAJUR YANG SAMA? SERANG CREATURE-NYA. KALAU KOSONG, SERANG LANGSUNG HERO-NYA
    if (state[pihakLawan].lajur[lajur] !== null) {
      damageCreature(state, daftar, pihakLawan, lajur, kekuatan);
    } else {
      damageHero(state, daftar, pihakLawan, kekuatan);
      if (cekPemenang(state) !== null) break;
    }
  }

  // BONUS SEMENTARA (MISALNYA DARI CORN RONIN) HANYA BERLAKU SAMPAI PERTARUNGAN SELESAI.
  state[pelaku].lajur.forEach((creature) => {
    if (creature) creature.bonusSementara = 0;
  });

  return daftar;
};

// ---------- KOMPUTER (LAWAN) ----------

const pilihAksiKartu = (state) => {
  const pihak = state.lawan;

  // DAFTAR KARTU YANG MANA-NYA CUKUP, DIURUTKAN DARI YANG TERMAHAL
  const kandidat = pihak.tangan
    .map((kartu, indeks) => ({ kartu, indeks }))
    .filter(({ kartu }) => kartu.biaya <= pihak.mana)
    .sort((a, b) => b.kartu.biaya - a.kartu.biaya);

  for (const { kartu, indeks } of kandidat) {
    if (kartu.tipe === "creature") {
      const lajur = pihak.lajur.findIndex((creature) => creature === null);
      if (lajur !== -1) return { indeks, opsi: { lajur } };
      continue;
    }

    const efek = definisiEfek[kartu.efek];
    const target = efek.pilihTargetAI ? efek.pilihTargetAI(state, "lawan") : null;
    if (efek.layak({ state, pelaku: "lawan", lajurSumber: null, target })) {
      return { indeks, opsi: { target } };
    }
  }

  return null;
};

// GILIRAN KOMPUTER: MEMAINKAN KARTU SEBANYAK MUNGKIN, LALU MEMAKAI FLOOP YANG BERGUNA.
export const giliranLawan = (state) => {
  const daftar = [];

  // KOMPUTER MEMAINKAN KARTU SEBANYAK MUNGKIN. BATAS 12 KALI SUPAYA TIDAK TERJEBAK PERULANGAN TAK BERHENTI
  for (let percobaan = 0; percobaan < 12; percobaan++) {
    const aksi = pilihAksiKartu(state);
    if (aksi === null) break;

    const hasil = mainkanKartu(state, "lawan", aksi.indeks, aksi.opsi);
    daftar.push(...hasil.peristiwa);
    if (!hasil.berhasil || cekPemenang(state) !== null) break;
  }

  // SETELAH ITU, KOMPUTER MEMAKAI FLOOP KALAU EFEKNYA BERGUNA
  for (let lajur = 0; lajur < JUMLAH_LAJUR; lajur++) {
    const creature = state.lawan.lajur[lajur];
    if (!creature || creature.sudahFloop) continue;

    const efek = definisiEfek[creature.efek];
    if (!efek || creature.efek === "tanpa") continue;

    const target = efek.pilihTargetAI ? efek.pilihTargetAI(state, "lawan") : null;
    if (!efek.layak({ state, pelaku: "lawan", lajurSumber: lajur, target })) continue;

    const hasil = floop(state, "lawan", lajur, { target });
    daftar.push(...hasil.peristiwa);
    if (cekPemenang(state) !== null) break;
  }

  return daftar;
};
