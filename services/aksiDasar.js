// AKSI-AKSI DASAR BUAT EFEK KARTU DAN MESIN DUEL: DAMAGE, HEAL, TARIK KARTU, DAN PENCATAT KEJADIAN.
// TIAP AKSI MENCATAT "PERISTIWA" DAN SALINAN (SNAPSHOT) KEADAAN PAPAN, SUPAYA TAMPILAN
// BISA MEMUTAR ULANG KEJADIANNYA SATU PER SATU SEBAGAI ANIMASI.

export const HP_AWAL = 100;
// JUMLAH LAJUR (BARIS PERTARUNGAN) DI SETIAP SISI PAPAN
export const JUMLAH_LAJUR = 3;
// KARTU DI TANGAN MAKSIMAL 8, KELEBIHANNYA LANGSUNG DIBUANG
export const MAKS_TANGAN = 8;

// PENGHITUNG UNTUK MEMBERI KODE UNIK PADA SETIAP CREATURE YANG DIPANGGIL
let penghitungUid = 0;

// KALAU PELAKUNYA PEMAIN, LAWANNYA KOMPUTER. BEGITU JUGA SEBALIKNYA
export const lawanDari = (pelaku) => (pelaku === "pemain" ? "lawan" : "pemain");

// MENGACAK URUTAN DAFTAR (FISHER-YATES) TANPA MENGUBAH DAFTAR ASLINYA.
export const acak = (daftar) => {
  // SALIN DULU ARRAY-NYA SUPAYA DAFTAR ASLI TIDAK BERUBAH
  const salinan = [...daftar];
  for (let i = salinan.length - 1; i > 0; i--) {
    // TUKAR POSISI SECARA ACAK, DARI BELAKANG KE DEPAN (ALGORITMA FISHER-YATES)
    const j = Math.floor(Math.random() * (i + 1));
    [salinan[i], salinan[j]] = [salinan[j], salinan[i]];
  }
  return salinan;
};

// KARTU YANG SEDANG BERADA DI LAJUR PUNYA DATA TAMBAHAN (SISA HP, BONUS SERANGAN, STATUS FLOOP).
export const buatInstance = (kartu) => {
  // SETIAP CREATURE YANG DIPANGGIL DAPAT KODE UNIK
  penghitungUid += 1;
  return {
    ...kartu,
    uid: penghitungUid,
    hpSisa: kartu.pertahanan,
    bonusSerang: 0,
    bonusSementara: 0,
    sudahFloop: false,
  };
};

// MENGEMBALIKAN INSTANCE MENJADI KARTU BIASA (MEMBUANG DATA TAMBAHAN) SAAT MASUK KE TUMPUKAN BUANG.
export const kartuAsli = (instance) => {
  // AMBIL SEMUA DATA KECUALI DATA TAMBAHAN SELAMA DI PAPAN (REST DESTRUCTURING)
  const { uid, hpSisa, bonusSerang, bonusSementara, sudahFloop, ...kartu } = instance;
  return kartu;
};

// SERANGAN YANG BENAR-BENAR DIPAKAI: SERANGAN DASAR DITAMBAH SEMUA BONUS
export const serangEfektif = ({ serangan, bonusSerang, bonusSementara }) =>
  serangan + bonusSerang + bonusSementara;

// MEMOTRET KEADAAN PAPAN SEKARANG. DIPAKAI ANIMASI UNTUK MEMUTAR ULANG KEJADIAN
const ambilSnapshot = (state) =>
  structuredClone({ giliran: state.giliran, pemain: state.pemain, lawan: state.lawan });

// MENAMBAH SATU PERISTIWA KE DAFTAR, LENGKAP DENGAN SNAPSHOT KEADAAN SETELAH PERISTIWA ITU.
export const catat = (state, daftar, data) => {
  daftar.push({ ...data, snapshot: ambilSnapshot(state) });
};

// ---------- DAMAGE DAN HEAL ----------

export const damageCreature = (state, daftar, pihak, lajur, nilai) => {
  const creature = state[pihak].lajur[lajur];
  if (!creature) return;

  // KURANGI HP CREATURE LALU CATAT KEJADIANNYA
  creature.hpSisa -= nilai;
  catat(state, daftar, {
    jenis: "damage",
    teks: `${creature.nama} menerima ${nilai} damage`,
    sasaran: { pihak, lajur },
    nilai,
  });

  // HP HABIS: CREATURE DIKELUARKAN DARI PAPAN DAN MASUK TUMPUKAN BUANG
  if (creature.hpSisa <= 0) {
    state[pihak].lajur[lajur] = null;
    state[pihak].buang.push(kartuAsli(creature));
    catat(state, daftar, {
      jenis: "mati",
      teks: `${creature.nama} dikalahkan!`,
      sasaran: { pihak, lajur },
      nilai: 0,
    });
  }
};

export const sembuhkanCreature = (state, daftar, pihak, lajur, nilai) => {
  const creature = state[pihak].lajur[lajur];
  if (!creature) return;

  // PEMULIHAN TIDAK BOLEH MELEBIHI HP MAKSIMAL CREATURE
  const pulih = Math.max(0, Math.min(nilai, creature.pertahanan - creature.hpSisa));
  creature.hpSisa += pulih;
  catat(state, daftar, {
    jenis: "sembuh",
    teks: `${creature.nama} pulih ${pulih} HP`,
    sasaran: { pihak, lajur },
    nilai: pulih,
  });
};

// MENGURANGI HP HERO. HP TIDAK BOLEH DI BAWAH NOL
export const damageHero = (state, daftar, pihak, nilai) => {
  const sebelum = state[pihak].hp;
  state[pihak].hp = Math.max(0, sebelum - nilai);
  catat(state, daftar, {
    jenis: "damage",
    teks: `${state[pihak].nama} menerima ${nilai} damage`,
    sasaran: { pihak, hero: true },
    nilai,
    sebelum,
    sesudah: state[pihak].hp,
  });
};

// MENAMBAH HP HERO. HP TIDAK BOLEH LEBIH DARI HP MAKSIMAL
export const sembuhkanHero = (state, daftar, pihak, nilai) => {
  const sebelum = state[pihak].hp;
  state[pihak].hp = Math.min(state[pihak].hpMaks, sebelum + nilai);
  catat(state, daftar, {
    jenis: "sembuh",
    teks: `${state[pihak].nama} pulih ${state[pihak].hp - sebelum} HP`,
    sasaran: { pihak, hero: true },
    nilai: state[pihak].hp - sebelum,
    sebelum,
    sesudah: state[pihak].hp,
  });
};

// ---------- TARIK KARTU ----------

export const tarikKartu = (state, daftar, pihak, jumlah) => {
  const pemilik = state[pihak];

  for (let i = 0; i < jumlah; i++) {
    // DECK HABIS: KOCOK ULANG TUMPUKAN BUANG MENJADI DECK BARU.
    if (pemilik.deck.length === 0 && pemilik.buang.length > 0) {
      pemilik.deck = acak(pemilik.buang);
      pemilik.buang = [];
    }

    if (pemilik.deck.length === 0) {
      catat(state, daftar, { jenis: "info", teks: `${pemilik.nama} kehabisan kartu!` });
      return;
    }

    // AMBIL KARTU TERATAS DARI DECK
    const kartu = pemilik.deck.pop();

    // TANGAN SUDAH PENUH, KARTU LANGSUNG DIBUANG
    if (pemilik.tangan.length >= MAKS_TANGAN) {
      pemilik.buang.push(kartu);
      catat(state, daftar, { jenis: "info", teks: `Tangan ${pemilik.nama} penuh, ${kartu.nama} dibuang` });
      continue;
    }

    pemilik.tangan.push(kartu);
    catat(state, daftar, {
      jenis: "tarik",
      teks: `${pemilik.nama} menarik kartu`,
      sasaran: { pihak },
      // KARTU LAWAN DIRAHASIAKAN.
      kartu: pihak === "pemain" ? { ...kartu } : null,
    });
  }
};
