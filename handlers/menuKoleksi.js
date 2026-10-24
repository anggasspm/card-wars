import { tanya, tanyaAngka, tanyaNomor } from "../utils/input.js";
import { lahanCreature } from "../data/lahan.js";
import {
  ambilSemuaKartu,
  filterKartu,
  tambahKartu,
  ubahKartu,
  hapusKartu,
  buatStatistik,
  daftarGambar,
  DECK_MINIMAL,
  KOLEKSI_MAKSIMAL,
} from "../services/koleksiService.js";
import { definisiEfek, efekCreatureBuatan, efekSpellBuatan } from "../services/efekService.js";
import {
  animasiBalikKartu,
  animasiLahirKartu,
  animasiKilauKartu,
  animasiHapusKartu,
} from "../utils/animasiKartu.js";
import { kotak, cetak, tabelKartu, tanyaMenu, notifikasi } from "../utils/panel.js";
import { warna, WARNA } from "../utils/warna.js";
import { ulang, pas } from "../utils/teks.js";
import { animasiAktif, tunggu, bersihkanLayar } from "../utils/terminal.js";

// MENAMPILKAN PILIHAN BERNOMOR (MUNCUL BERANIMASI) LALU MENGEMBALIKAN ITEM YANG DIPILIH,
// ATAU UNDEFINED JIKA NOMORNYA TIDAK VALID.
const pilihDariDaftar = async (judul, daftar, teksItem = (item) => item) => {
  const jawaban = await tanyaMenu(
    judul,
    daftar.map((item, i) => [String(i + 1), teksItem(item)]),
    "Pilihan: ",
    { jeda: 30 }
  );
  return daftar[Number(jawaban) - 1];
};

// MEMOTONG TEKS YANG TERLALU PANJANG DAN MENGGANTI UJUNGNYA DENGAN TITIK-TITIK
const potongTeks = (teks, panjang) => (teks.length > panjang ? `${teks.slice(0, panjang - 1)}…` : teks);
// TEKS PENDEK UNTUK DAFTAR PILIHAN EFEK
const teksEfek = (kunci) => potongTeks(definisiEfek[kunci].deskripsi, 52);

const pilihKartu = async (judul, pesanBatal = "Nomor kartu tidak valid.") => {
  const daftar = ambilSemuaKartu();
  cetak(tabelKartu(judul, daftar));
  const kartu = daftar[await tanyaNomor("Nomor kartu: ")];
  if (!kartu) notifikasi(false, pesanBatal);
  return kartu;
};

// ---------- READ ----------

const lihatSemua = () => {
  const semua = ambilSemuaKartu();
  cetak(tabelKartu(`KOLEKSI (${semua.length}/${KOLEKSI_MAKSIMAL} kartu)`, semua));
};

// READ: MENAMPILKAN SATU KARTU DALAM UKURAN BESAR
const lihatDetail = async () => {
  const kartu = await pilihKartu("LIHAT DETAIL KARTU");
  if (!kartu) return;
  bersihkanLayar();
  await animasiBalikKartu(kartu);
};

// READ: MENAMPILKAN KARTU YANG LOLOS FILTER (BERDASARKAN TIPE ATAU LAHAN)
const lihatFilter = async () => {
  const jenis = await pilihDariDaftar("FILTER BERDASARKAN", ["Tipe", "Lahan"]);
  if (jenis === undefined) return notifikasi(false, "Pilihan tidak valid.");

  const pilihan =
    jenis === "Tipe"
      ? await pilihDariDaftar("TIPE KARTU", ["creature", "spell"])
      : await pilihDariDaftar("LAHAN", [...lahanCreature, "Rainbow"]);
  if (pilihan === undefined) return notifikasi(false, "Pilihan tidak valid.");

  const hasil = filterKartu(jenis === "Tipe" ? { tipe: pilihan } : { lahan: pilihan });
  cetak(tabelKartu(`HASIL FILTER: ${pilihan} (${hasil.length} kartu)`, hasil));
};

// ---------- CREATE ----------

const tambah = async () => {
  cetak(kotak("TAMBAH KARTU BARU", ["Isi data kartu satu per satu."], WARNA.emas));
  // TANYAKAN DATA KARTU SATU PER SATU
  const nama = await tanya("Nama kartu (maks 20 huruf): ");
  const tipe = await pilihDariDaftar("TIPE KARTU", ["creature", "spell"]);
  if (tipe === undefined) return notifikasi(false, "Tipe tidak valid, pembuatan dibatalkan.");

  const biaya = await tanyaAngka("Biaya mana (0-6): ");
  const adaStatistik = tipe === "creature";
  const lahan = adaStatistik ? await pilihDariDaftar("LAHAN", lahanCreature) : "Rainbow";
  const serangan = adaStatistik ? await tanyaAngka("Serangan / ATK (0-30): ") : 0;
  const pertahanan = adaStatistik ? await tanyaAngka("Pertahanan / HP (1-40): ") : 0;
  const biayaFloop = adaStatistik ? await tanyaAngka("Biaya FLOOP (0-6): ") : 0;
  const efek = await pilihDariDaftar(
    "EFEK KARTU",
    adaStatistik ? efekCreatureBuatan : efekSpellBuatan,
    teksEfek
  );
  const gambar = await pilihDariDaftar("GAMBAR KARTU", daftarGambar);

  // KIRIM SEMUA DATA KE SERVICE. VALIDASI DILAKUKAN DI SANA, BUKAN DI SINI
  const hasil = tambahKartu({ nama, tipe, lahan, biaya, serangan, pertahanan, biayaFloop, efek, gambar });
  if (!hasil.berhasil) return notifikasi(false, hasil.pesan);

  bersihkanLayar();
  await animasiLahirKartu(hasil.data);
  notifikasi(true, hasil.pesan);
};

// ---------- UPDATE ----------

const KOLOM_UBAH = ["nama", "biaya", "serangan", "pertahanan", "biayaFloop", "efek", "gambar"];
// DATA YANG BERUPA ANGKA, JADI INPUTNYA PERLU DIUBAH DARI TEKS KE ANGKA
const KOLOM_ANGKA = ["biaya", "serangan", "pertahanan", "biayaFloop"];
// DATA YANG HANYA ADA PADA CREATURE, TIDAK ADA PADA SPELL
const KOLOM_KHUSUS_CREATURE = ["serangan", "pertahanan", "biayaFloop"];

const bacaNilaiBaru = async (kartu, kolom) => {
  if (KOLOM_ANGKA.includes(kolom)) return tanyaAngka(`${kolom} baru: `);
  if (kolom === "nama") return tanya("Nama baru: ");
  if (kolom === "gambar") return pilihDariDaftar("GAMBAR BARU", daftarGambar);
  return pilihDariDaftar(
    "EFEK BARU",
    kartu.tipe === "creature" ? efekCreatureBuatan : efekSpellBuatan,
    teksEfek
  );
};

const ubah = async () => {
  const kartu = await pilihKartu("UBAH KARTU");
  if (!kartu) return;

  const kolom = await pilihDariDaftar(`BAGIAN ${kartu.nama.toUpperCase()} YANG DIUBAH`, KOLOM_UBAH);
  if (kolom === undefined) return notifikasi(false, "Pilihan tidak valid.");
  if (kartu.tipe === "spell" && KOLOM_KHUSUS_CREATURE.includes(kolom)) {
    return notifikasi(false, `Spell tidak punya ${kolom}.`);
  }

  // KIRIM HANYA DATA YANG BERUBAH, SERVICE YANG MENGGABUNGKANNYA
  const hasil = ubahKartu(kartu.id, { [kolom]: await bacaNilaiBaru(kartu, kolom) });
  if (!hasil.berhasil) return notifikasi(false, hasil.pesan);

  bersihkanLayar();
  await animasiKilauKartu(hasil.data);
  notifikasi(true, hasil.pesan);
};

// ---------- DELETE ----------

const hapus = async () => {
  const kartu = await pilihKartu("BUANG KARTU");
  if (!kartu) return;

  // MINTA KONFIRMASI DULU SEBELUM MENGHAPUS
  const yakin = await tanya(`Yakin membuang "${kartu.nama}"? (y/n): `);
  if (yakin.toLowerCase() !== "y") return notifikasi(false, "Dibatalkan, tidak ada kartu yang dibuang.");

  const hasil = hapusKartu(kartu.id);
  if (!hasil.berhasil) return notifikasi(false, hasil.pesan);

  bersihkanLayar();
  await animasiHapusKartu(kartu);
  notifikasi(true, hasil.pesan);
};

// ---------- STATISTIK ----------

const barisStatistik = (data, kemajuan) => [
  `Jumlah kartu          : ${data.jumlahKartu}/${KOLEKSI_MAKSIMAL}`,
  `Rata-rata biaya       : ${data.rataBiaya.toFixed(2)} mana`,
  `Creature terkuat      : ${data.creatureTerkuat ? `${data.creatureTerkuat.nama} (ATK ${data.creatureTerkuat.serangan})` : "-"}`,
  `Punya spell           : ${data.adaSpell ? "ya" : "tidak"}`,
  `Semua bisa dimainkan  : ${data.semuaBisaDimainkan ? "ya" : "tidak"}`,
  `Siap duel (min ${DECK_MINIMAL})     : ${data.siapBertanding ? "ya" : "belum"}`,
  "",
  "Kartu per lahan:",
  ...Object.entries(data.perLahan).map(([lahan, jumlah]) => {
    const panjang = Math.round(jumlah * kemajuan);
    return `  ${pas(lahan, 14)} ${warna(ulang("█", panjang), WARNA.hijau)}${ulang(" ", jumlah - panjang)} ${jumlah}`;
  }),
];

// BAR STATISTIK TUMBUH DARI KOSONG KE NILAI AKHIRNYA.
const statistik = async () => {
  const data = buatStatistik();
  if (!animasiAktif()) return cetak(kotak("STATISTIK KOLEKSI", barisStatistik(data, 1)));

  const tinggi = barisStatistik(data, 1).length + 2;
  for (let langkah = 0; langkah <= 10; langkah++) {
    if (langkah > 0) process.stdout.write(`\x1b[${tinggi}A`);
    cetak(kotak("STATISTIK KOLEKSI", barisStatistik(data, langkah / 10)));
    await tunggu(50);
  }
};

// ---------- MENU ----------

export const menuKoleksi = async () => {
  let selesai = false;

  while (!selesai) {
    const pilihan = await tanyaMenu(
      "MENU KOLEKSI",
      [
        ["1", "▤  Lihat semua kartu"],
        ["2", "◎  Lihat detail kartu (animasi)"],
        ["3", "▽  Filter kartu"],
        ["4", "✚  Tambah kartu"],
        ["5", "◈  Ubah kartu"],
        ["6", "✕  Buang kartu"],
        ["7", "▥  Statistik"],
        ["0", "◂  Kembali"],
      ],
      "Pilih menu: "
    );
    console.log("");

    // PILIH AKSI BERDASARKAN MENU YANG DIKETIK PEMAIN
    switch (pilihan) {
      case "1":
        lihatSemua();
        break;
      case "2":
        await lihatDetail();
        break;
      case "3":
        await lihatFilter();
        break;
      case "4":
        await tambah();
        break;
      case "5":
        await ubah();
        break;
      case "6":
        await hapus();
        break;
      case "7":
        await statistik();
        break;
      case "0":
        selesai = true;
        break;
      default:
        notifikasi(false, "Pilihan tidak dikenal.");
    }
    console.log("");
  }
};
