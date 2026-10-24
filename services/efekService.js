import {
  JUMLAH_LAJUR,
  catat,
  lawanDari,
  serangEfektif,
  damageCreature,
  sembuhkanCreature,
  damageHero,
  sembuhkanHero,
  tarikKartu,
} from "./aksiDasar.js";

// DAFTAR EFEK KARTU. TIAP EFEK PUNYA BEBERAPA BAGIAN:
//  - TARGET     : NULL KALAU OTOMATIS, "LAJURSAMA" KALAU KENA CREATURE LAWAN DI LAJUR YANG SAMA,
//                 "PILIHLAWAN" ATAU "PILIHSENDIRI" KALAU PEMAIN HARUS MILIH LAJUR
//  - DESKRIPSI  : PENJELASAN SINGKAT, DIPAKAI WAKTU BIKIN KARTU SENDIRI
//  - JALANKAN   : FUNGSI YANG BENERAN MENJALANKAN EFEKNYA
//  - LAYAK      : DIPAKAI KOMPUTER BUAT NENTUIN EFEK INI PERLU DIPAKAI SEKARANG ATAU TIDAK
//  - PILIHTARGETAI : (BOLEH TIDAK ADA) CARA KOMPUTER MILIH TARGET
//
// CTX ITU PAKET DATA YANG DIKIRIM KE FUNGSI EFEK: { STATE, DAFTAR, PELAKU, LAJURSUMBER, SUMBER, TARGET }

const semuaLajur = Array.from({ length: JUMLAH_LAJUR }, (_, indeks) => indeks);

// MENCARI NOMOR LAJUR YANG ADA CREATURE-NYA DI SATU PIHAK
const lajurTerisi = (state, pihak) => semuaLajur.filter((lajur) => state[pihak].lajur[lajur] !== null);

export const definisiEfek = {
  tanpa: {
    target: null,
    deskripsi: "No ability.",
    jalankan: () => {},
    layak: () => false,
  },

  tambahSerang1: {
    target: null,
    deskripsi: "+1 Attack.",
    jalankan: ({ state, daftar, sumber, pelaku, lajurSumber }) => {
      sumber.bonusSerang += 1;
      catat(state, daftar, {
        jenis: "buff",
        teks: `${sumber.nama} mendapat +1 Attack`,
        sasaran: { pihak: pelaku, lajur: lajurSumber },
        nilai: 1,
      });
    },
    layak: () => true,
  },

  serangPerKartuTangan3: {
    target: null,
    deskripsi: "+3 Attack for every card in your hand.",
    jalankan: ({ state, daftar, sumber, pelaku, lajurSumber }) => {
      const tambahan = 3 * state[pelaku].tangan.length;
      sumber.bonusSementara += tambahan;
      catat(state, daftar, {
        jenis: "buff",
        teks: `${sumber.nama} mendapat +${tambahan} Attack giliran ini`,
        sasaran: { pihak: pelaku, lajur: lajurSumber },
        nilai: tambahan,
      });
    },
    layak: ({ state, pelaku }) => state[pelaku].tangan.length >= 2,
  },

  tarik1: {
    target: null,
    deskripsi: "Draw 1 card.",
    jalankan: ({ state, daftar, pelaku }) => tarikKartu(state, daftar, pelaku, 1),
    layak: ({ state, pelaku }) => state[pelaku].tangan.length <= 5,
  },

  tarik2: {
    target: null,
    deskripsi: "Draw 2 cards.",
    jalankan: ({ state, daftar, pelaku }) => tarikKartu(state, daftar, pelaku, 2),
    layak: ({ state, pelaku }) => state[pelaku].tangan.length <= 5,
  },

  tarik3: {
    target: null,
    deskripsi: "Draw 3 cards.",
    jalankan: ({ state, daftar, pelaku }) => tarikKartu(state, daftar, pelaku, 3),
    layak: ({ state, pelaku }) => state[pelaku].tangan.length <= 4,
  },

  damageLajur5: {
    target: "lajurSama",
    deskripsi: "Deal 5 Damage to creature in the opposing lane.",
    jalankan: ({ state, daftar, pelaku, lajurSumber }) =>
      damageCreature(state, daftar, lawanDari(pelaku), lajurSumber, 5),
    layak: ({ state, pelaku, lajurSumber }) => state[lawanDari(pelaku)].lajur[lajurSumber] !== null,
  },

  damageLajur20Sembuh28: {
    target: "lajurSama",
    deskripsi: "Deal 20 Damage to creature in opposing lane and heal this creature 28 points.",
    jalankan: ({ state, daftar, pelaku, lajurSumber }) => {
      damageCreature(state, daftar, lawanDari(pelaku), lajurSumber, 20);
      sembuhkanCreature(state, daftar, pelaku, lajurSumber, 28);
    },
    layak: ({ state, pelaku, lajurSumber }) => state[lawanDari(pelaku)].lajur[lajurSumber] !== null,
  },

  damageSemua5: {
    target: null,
    deskripsi: "Deal 5 Damage to all opposing creatures.",
    jalankan: ({ state, daftar, pelaku }) => {
      const pihakLawan = lawanDari(pelaku);
      lajurTerisi(state, pihakLawan).forEach((lajur) => damageCreature(state, daftar, pihakLawan, lajur, 5));
    },
    layak: ({ state, pelaku }) => lajurTerisi(state, lawanDari(pelaku)).length >= 2,
  },

  sembuhkan3: {
    target: "pilihSendiri",
    deskripsi: "Choose one of your creatures and heal it 3 points.",
    jalankan: ({ state, daftar, pelaku, target }) => sembuhkanCreature(state, daftar, pelaku, target, 3),
    // KOMPUTER MEMILIH CREATURE YANG PALING BANYAK KEHILANGAN HP.
    pilihTargetAI: (state, pelaku) => {
      const rusak = lajurTerisi(state, pelaku)
        .map((lajur) => ({ lajur, hilang: state[pelaku].lajur[lajur].pertahanan - state[pelaku].lajur[lajur].hpSisa }))
        .filter(({ hilang }) => hilang > 0)
        .sort((a, b) => b.hilang - a.hilang);
      return rusak.length > 0 ? rusak[0].lajur : null;
    },
    layak: ({ target }) => target !== null && target !== undefined,
  },

  drain5: {
    target: null,
    deskripsi: "Deal 5 damage to the opposing Leader and heal your Leader by 5 points.",
    jalankan: ({ state, daftar, pelaku }) => {
      damageHero(state, daftar, lawanDari(pelaku), 5);
      sembuhkanHero(state, daftar, pelaku, 5);
    },
    layak: () => true,
  },

  damageSamaDenganSerang: {
    target: "pilihLawan",
    deskripsi: "Choose an opposing creature and deal Damage equal to its own Attack.",
    jalankan: ({ state, daftar, pelaku, target }) => {
      const pihakLawan = lawanDari(pelaku);
      const creature = state[pihakLawan].lajur[target];
      damageCreature(state, daftar, pihakLawan, target, serangEfektif(creature));
    },
    // KOMPUTER MENARGETKAN CREATURE LAWAN DENGAN SERANGAN TERTINGGI.
    pilihTargetAI: (state, pelaku) => {
      const pihakLawan = lawanDari(pelaku);
      const kuat = lajurTerisi(state, pihakLawan).sort(
        (a, b) => serangEfektif(state[pihakLawan].lajur[b]) - serangEfektif(state[pihakLawan].lajur[a])
      );
      return kuat.length > 0 ? kuat[0] : null;
    },
    layak: ({ state, pelaku, target }) =>
      target !== null && target !== undefined && serangEfektif(state[lawanDari(pelaku)].lajur[target]) >= 8,
  },

  kurangiMana2: {
    target: null,
    deskripsi: "Opponent gets 2 less Magic Point next turn.",
    jalankan: ({ state, daftar, pelaku }) => {
      state[lawanDari(pelaku)].penaltiMana += 2;
      catat(state, daftar, {
        jenis: "info",
        teks: `${state[lawanDari(pelaku)].nama} akan kekurangan 2 mana di giliran berikutnya`,
      });
    },
    layak: () => true,
  },
};

// EFEK YANG BOLEH DIPILIH SAAT MEMBUAT KARTU SENDIRI.
export const efekCreatureBuatan = ["tanpa", "tambahSerang1", "tarik1", "damageLajur5", "sembuhkan3"];
// EFEK YANG BOLEH DIPILIH SAAT PEMAIN MEMBUAT SPELL SENDIRI
export const efekSpellBuatan = ["tarik2", "drain5", "kurangiMana2", "damageSamaDenganSerang"];

// MEMERIKSA APAKAH TARGET YANG DIPILIH VALID. MENGEMBALIKAN PESAN ERROR, ATAU NULL JIKA VALID.
export const cekTarget = (state, pelaku, definisi, lajurSumber, target) => {
  const pihakLawan = lawanDari(pelaku);
  const lajurValid = Number.isInteger(target) && target >= 0 && target < JUMLAH_LAJUR;

  switch (definisi.target) {
    case "lajurSama":
      return state[pihakLawan].lajur[lajurSumber] !== null
        ? null
        : "Tidak ada creature lawan di lajur yang sama.";
    case "pilihLawan":
      if (!lajurValid) return `Pilih lajur target 1-${JUMLAH_LAJUR}.`;
      return state[pihakLawan].lajur[target] !== null ? null : "Tidak ada creature lawan di lajur itu.";
    case "pilihSendiri":
      if (!lajurValid) return `Pilih lajur target 1-${JUMLAH_LAJUR}.`;
      return state[pelaku].lajur[target] !== null ? null : "Tidak ada creature milikmu di lajur itu.";
    default:
      return null;
  }
};
