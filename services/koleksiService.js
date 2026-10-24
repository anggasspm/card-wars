import { ambilKoleksi, simpanKoleksi, buatIdKartu } from "../data/koleksiStore.js";
import { lahanCreature } from "../data/lahan.js";
import { gambarKartu } from "../data/gambarKartu.js";
import { definisiEfek, efekCreatureBuatan, efekSpellBuatan } from "./efekService.js";

// BATAS JUMLAH KARTU: MINIMAL 8 SUPAYA BISA DUEL, MAKSIMAL 20 SUPAYA KOLEKSI TIDAK KEBANYAKAN
export const DECK_MINIMAL = 8;
export const KOLEKSI_MAKSIMAL = 20;

// RENTANG ANGKA YANG BOLEH DIPAKAI UNTUK TIAP DATA KARTU. FORMATNYA [MINIMAL, MAKSIMAL]
const BATAS = {
  biaya: [0, 6],
  serangan: [0, 30],
  pertahanan: [1, 40],
  biayaFloop: [0, 6],
};

// DUA FUNGSI KECIL INI DIPAKAI SUPAYA SEMUA HASIL CRUD BENTUKNYA SAMA: { BERHASIL, PESAN, DATA }
const sukses = (pesan, data = null) => ({ berhasil: true, pesan, data });
const gagal = (pesan) => ({ berhasil: false, pesan, data: null });

// DAFTAR NAMA GAMBAR YANG TERSEDIA, DIAMBIL DARI KEY OBJECT GAMBARKARTU
export const daftarGambar = Object.keys(gambarKartu);

// ---------- VALIDASI ----------

// SETIAP PENGECEKAN MENGEMBALIKAN PESAN ERROR (STRING) JIKA TIDAK VALID, ATAU NULL JIKA VALID.
const cekNama = (nama, idDiabaikan = null) => {
  // NAMA TIDAK BOLEH KOSONG
  if (typeof nama !== "string" || nama === "") return "Nama kartu tidak boleh kosong.";
  if (nama.length > 20) return "Nama kartu maksimal 20 karakter.";

  // CEK APAKAH ADA KARTU LAIN DENGAN NAMA YANG SAMA (HURUF BESAR DAN KECIL DIANGGAP SAMA). KARTU YANG SEDANG DIUBAH DIABAIKAN
  const kembar = ambilKoleksi().some(
    (kartu) => kartu.nama.toLowerCase() === nama.toLowerCase() && kartu.id !== idDiabaikan
  );
  return kembar ? `Nama "${nama}" sudah dipakai kartu lain.` : null;
};

const cekRentang = (nilai, namaField) => {
  // AMBIL BATAS BAWAH DAN ATAS DARI OBJECT BATAS (DESTRUCTURING ARRAY)
  const [minimal, maksimal] = BATAS[namaField];
  return Number.isInteger(nilai) && nilai >= minimal && nilai <= maksimal
    ? null
    : `${namaField} harus bilangan bulat ${minimal} sampai ${maksimal}.`;
};

const cekKartu = (kartu, idDiabaikan = null) => {
  // PECAH OBJECT KARTU MENJADI VARIABEL TERPISAH (DESTRUCTURING) SUPAYA GAMPANG DIPAKAI DI BAWAH
  const { nama, tipe, lahan, biaya, serangan, pertahanan, biayaFloop, efek, gambar } = kartu;

  if (tipe !== "creature" && tipe !== "spell") return "Tipe kartu harus creature atau spell.";

  // KUMPULKAN SEMUA HASIL PENGECEKAN DI DALAM ARRAY. NULL BERARTI AMAN, STRING BERARTI ADA ERROR
  const pengecekan = [cekNama(nama, idDiabaikan), cekRentang(biaya, "biaya")];

  // CREATURE PUNYA STATISTIK SENDIRI, SPELL TIDAK PUNYA
  if (tipe === "creature") {
    pengecekan.push(
      lahanCreature.includes(lahan) ? null : `Lahan harus salah satu dari: ${lahanCreature.join(", ")}.`,
      cekRentang(serangan, "serangan"),
      cekRentang(pertahanan, "pertahanan"),
      cekRentang(biayaFloop, "biayaFloop"),
      efekCreatureBuatan.includes(efek) || efek === kartu.efekBawaan ? null : "Efek creature tidak dikenal."
    );
  } else {
    pengecekan.push(
      efekSpellBuatan.includes(efek) || efek === kartu.efekBawaan ? null : "Efek spell tidak dikenal."
    );
  }

  pengecekan.push(daftarGambar.includes(gambar) ? null : "Gambar kartu tidak ditemukan.");
  // AMBIL ERROR PERTAMA YANG KETEMU. KALAU TIDAK ADA, BERARTI KARTU VALID
  return pengecekan.find((pesan) => pesan !== null) ?? null;
};

// ---------- READ ----------

export const ambilSemuaKartu = () => ambilKoleksi();

export const cariKartuById = (id) => ambilKoleksi().find((kartu) => kartu.id === id);

export const filterKartu = ({ tipe = "", lahan = "" } = {}) =>
  ambilKoleksi().filter(
    (kartu) => (tipe === "" || kartu.tipe === tipe) && (lahan === "" || kartu.lahan === lahan)
  );

// ---------- CREATE ----------

export const tambahKartu = (dataBaru) => {
  // TOLAK KALAU KOLEKSI SUDAH PENUH
  if (ambilKoleksi().length >= KOLEKSI_MAKSIMAL) {
    return gagal(`Koleksi penuh (maksimal ${KOLEKSI_MAKSIMAL} kartu). Hapus kartu dulu.`);
  }

  // AMBIL TIPE KARTU DULU KARENA MENENTUKAN ISI DATA YANG LAIN
  const { tipe } = dataBaru;
  // SPELL SELALU BERLAHAN RAINBOW DAN TIDAK PUNYA SERANGAN/PERTAHANAN/FLOOP.
  const kartuBaru = {
    id: buatIdKartu(),
    ...dataBaru,
    lahan: tipe === "spell" ? "Rainbow" : dataBaru.lahan,
    serangan: tipe === "spell" ? 0 : dataBaru.serangan,
    pertahanan: tipe === "spell" ? 0 : dataBaru.pertahanan,
    biayaFloop: tipe === "spell" ? 0 : dataBaru.biayaFloop,
  };

  // VALIDASI DULU SEBELUM DISIMPAN
  const pesanError = cekKartu(kartuBaru);
  if (pesanError !== null) return gagal(pesanError);

  // LENGKAPI DATA: DESKRIPSI DIAMBIL DARI EFEK, BINTANG DIHITUNG DARI BIAYA (MINIMAL 1, MAKSIMAL 5)
  const lengkap = {
    ...kartuBaru,
    deskripsi: definisiEfek[kartuBaru.efek].deskripsi,
    bintang: Math.max(1, Math.min(5, kartuBaru.biaya)),
  };

  // SPREAD OPERATOR: MEMBUAT ARRAY BARU TANPA MENGUBAH ARRAY LAMA.
  simpanKoleksi([...ambilKoleksi(), lengkap]);
  return sukses(`Kartu "${lengkap.nama}" ditambahkan ke koleksi.`, lengkap);
};

// ---------- UPDATE ----------

export const ubahKartu = (id, perubahan) => {
  // CARI KARTU YANG MAU DIUBAH. KALAU TIDAK ADA, LANGSUNG BERHENTI
  const lama = cariKartuById(id);
  if (!lama) return gagal(`Kartu dengan ID ${id} tidak ditemukan.`);

  // SPREAD OPERATOR: SALIN DATA LAMA, LALU TIMPA DENGAN PERUBAHAN.
  const baru = { ...lama, ...perubahan, efekBawaan: lama.efek };
  // KALAU EFEKNYA DIGANTI, DESKRIPSINYA IKUT DIGANTI
  if (perubahan.efek !== undefined) baru.deskripsi = definisiEfek[perubahan.efek]?.deskripsi ?? lama.deskripsi;

  // VALIDASI HASIL GABUNGAN. ID DIKIRIM SUPAYA NAMA KARTU INI SENDIRI TIDAK DIANGGAP KEMBAR
  const pesanError = cekKartu(baru, id);
  if (pesanError !== null) return gagal(pesanError);

  // BUANG FIELD SEMENTARA EFEKBAWAAN SEBELUM DISIMPAN (REST DESTRUCTURING)
  const { efekBawaan, ...bersih } = baru;
  // GANTI HANYA KARTU YANG ID-NYA COCOK. KARTU LAIN DIBIARKAN
  simpanKoleksi(ambilKoleksi().map((kartu) => (kartu.id === id ? bersih : kartu)));
  return sukses(`Kartu "${bersih.nama}" berhasil diperbarui.`, bersih);
};

// ---------- DELETE ----------

export const hapusKartu = (id) => {
  // PASTIKAN KARTUNYA ADA SEBELUM DIHAPUS
  const kartu = cariKartuById(id);
  if (!kartu) return gagal(`Kartu dengan ID ${id} tidak ditemukan, tidak ada yang dihapus.`);

  // JANGAN SAMPAI KOLEKSI KURANG DARI MINIMAL, NANTI TIDAK BISA DUEL
  if (ambilKoleksi().length <= DECK_MINIMAL) {
    return gagal(`Deck minimal ${DECK_MINIMAL} kartu agar bisa bertanding. Tambah kartu dulu sebelum menghapus.`);
  }

  // FILTER: SIMPAN SEMUA KARTU KECUALI YANG DIHAPUS
  simpanKoleksi(ambilKoleksi().filter((item) => item.id !== id));
  return sukses(`Kartu "${kartu.nama}" dibuang dari koleksi.`, kartu);
};

// ---------- STATISTIK ----------

export const buatStatistik = () => {
  const semua = ambilKoleksi();

  // HITUNG JUMLAH KARTU PER LAHAN PAKAI REDUCE
  const perLahan = semua.reduce((hitung, { lahan }) => ({ ...hitung, [lahan]: (hitung[lahan] ?? 0) + 1 }), {});
  // JUMLAHKAN SEMUA BIAYA UNTUK MENCARI RATA-RATA
  const totalBiaya = semua.reduce((total, { biaya }) => total + biaya, 0);
  // CARI CREATURE DENGAN SERANGAN TERTINGGI (FILTER DULU, LALU REDUCE)
  const creatureTerkuat = semua
    .filter(({ tipe }) => tipe === "creature")
    .reduce((juara, kartu) => (juara === null || kartu.serangan > juara.serangan ? kartu : juara), null);

  return {
    jumlahKartu: semua.length,
    perLahan,
    rataBiaya: semua.length > 0 ? totalBiaya / semua.length : 0,
    creatureTerkuat,
    // SOME: ADA MINIMAL SATU SPELL? EVERY: SEMUA KARTU BIAYANYA TIDAK MELEBIHI 6?
    adaSpell: semua.some(({ tipe }) => tipe === "spell"),
    semuaBisaDimainkan: semua.every(({ biaya }) => biaya <= 6),
    siapBertanding: semua.length >= DECK_MINIMAL,
    daftarNama: semua.map(({ nama, tipe }) => `${nama} (${tipe})`),
  };
};
