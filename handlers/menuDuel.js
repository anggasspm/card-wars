import { tanya, tanyaNomor } from "../utils/input.js";
import { ambilKoleksi } from "../data/koleksiStore.js";
import { DECK_MINIMAL } from "../services/koleksiService.js";
import { definisiEfek } from "../services/efekService.js";
import {
  buatDuel,
  mulaiGiliran,
  mainkanKartu,
  floop,
  fasePertarungan,
  giliranLawan,
  cekPemenang,
} from "../services/duelService.js";
import { JUMLAH_LAJUR } from "../services/aksiDasar.js";
import {
  putarPeristiwa,
  tampilkanPapan,
  animasiBanner,
  animasiMulaiDuel,
  animasiAkhir,
} from "../utils/animasiPapan.js";
import { animasiBalikKartu } from "../utils/animasiKartu.js";
import { kotak, cetak, notifikasi, tanyaMenu } from "../utils/panel.js";
import { cariLahan } from "../data/lahan.js";
import { warna, tebal, WARNA } from "../utils/warna.js";
import { pas, ulang, panjangTampil } from "../utils/teks.js";
import { bersihkanLayar } from "../utils/terminal.js";
import { tulis, TINGGI_MINIMAL, LEBAR_MINIMAL } from "../utils/layar.js";

// MENYALIN KEADAAN DUEL SEKARANG. DIPAKAI SEBAGAI TITIK AWAL ANIMASI
const potret = (state) =>
  structuredClone({ giliran: state.giliran, pemain: state.pemain, lawan: state.lawan });

// LEBAR SATU KARTU DI DAFTAR TANGAN (DALAM KARAKTER)
const LEBAR_SEL_TANGAN = 34;
// DAFTAR TANGAN DIBAGI DUA KOLOM, MASING-MASING MAKSIMAL 4 KARTU
const KARTU_PER_KOLOM = 4;

// SATU KARTU DI TANGAN: NOMOR, PENANDA LAHAN, BIAYA, NAMA, DAN ATK/HP. REDUP JIKA MANA TIDAK CUKUP.
const selTangan = (kartu, nomor, mana) => {
  const lahan = cariLahan(kartu.lahan);
  const angka = kartu.tipe === "creature" ? `${kartu.serangan}/${kartu.pertahanan}` : "spell";
  const nama = `${pas(kartu.nama, 19)} ${pas(angka, 5)}`;
  const mampu = kartu.biaya <= mana;

  const isi = mampu
    ? `${tebal(String(nomor))} ${warna("█", lahan.bar)}${warna(`◆${kartu.biaya}`, WARNA.biru)} ${nama}`
    : warna(`${nomor} █◆${kartu.biaya} ${nama}`, WARNA.abu);
  return `${isi}${ulang(" ", LEBAR_SEL_TANGAN - panjangTampil(isi))}`;
};

// KARTU DI TANGAN DISUSUN DUA KOLOM (MAKSIMAL 4 BARIS) AGAR LAYAR TETAP MUAT DI JENDELA BIASA.
const kotakTangan = (state) => {
  const { tangan, mana } = state.pemain;
  const baris = Array.from({ length: Math.min(KARTU_PER_KOLOM, Math.max(1, tangan.length)) }, (_, r) => {
    const kiri = tangan[r] ? selTangan(tangan[r], r + 1, mana) : warna("(kosong)", WARNA.abu);
    const kanan = tangan[r + KARTU_PER_KOLOM] ? selTangan(tangan[r + KARTU_PER_KOLOM], r + KARTU_PER_KOLOM + 1, mana) : "";
    return `${kiri}${ulang(" ", LEBAR_SEL_TANGAN - panjangTampil(kiri))} ${kanan}`;
  });
  return kotak(`TANGANMU (${tangan.length})`, baris);
};

// PAPAN DAN KARTU DI TANGAN DALAM SATU LAYAR.
const tampilkanLayarGiliran = (state, pesan) => {
  tampilkanPapan(state, pesan);
  cetak(kotakTangan(state));
};

// MENGAMBIL POTRET KEADAAN SEBELUM AKSI DIJALANKAN, LALU MEMUTAR PERISTIWA HASILNYA SEBAGAI ANIMASI.
const jalankanDanPutar = async (state, buatPeristiwa) => {
  const awal = potret(state);
  await putarPeristiwa(buatPeristiwa(), awal);
};

// MENJALANKAN SATU AKSI PEMAIN; JIKA BERHASIL, PERISTIWANYA DIPUTAR SEBAGAI ANIMASI.
const jalankanAksi = async (state, aksi, ...argumen) => {
  const awal = potret(state);
  
  // JALANKAN AKSINYA DI MESIN DUEL. KALAU BERHASIL, PUTAR ANIMASI KEJADIANNYA
  const hasil = aksi(state, "pemain", ...argumen);
  if (hasil.berhasil) await putarPeristiwa(hasil.peristiwa, awal);
  return hasil.pesan;
};

// MENANYAKAN NOMOR LAJUR KE PEMAIN. HASILNYA SUDAH DIUBAH KE INDEKS ARRAY (MULAI DARI 0)
const tanyaLajur = (teks) => tanyaNomor(`${teks} (1-${JUMLAH_LAJUR}): `);

// ALUR PEMAIN MEMAINKAN KARTU: PILIH KARTU, LALU PILIH LAJUR ATAU TARGET JIKA PERLU
const menuMainkan = async (state) => {
  const indeks = await tanyaNomor("Nomor kartu di tangan: ");
  const kartu = state.pemain.tangan[indeks];
  if (!kartu) return "Nomor kartu tidak valid.";

  if (kartu.tipe === "creature") {
    const lajur = await tanyaLajur("Taruh di lajur");
    return jalankanAksi(state, mainkanKartu, indeks, { lajur });
  }

  const target = definisiEfek[kartu.efek].target ? await tanyaLajur("Target lajur") : undefined;
  return jalankanAksi(state, mainkanKartu, indeks, { target });
};

// ALUR PEMAIN MENGAKTIFKAN FLOOP: PILIH CREATURE, LALU PILIH TARGET JIKA PERLU
const menuFloop = async (state) => {
  const lajur = await tanyaLajur("FLOOP creature di lajur");
  const creature = state.pemain.lajur[lajur];
  if (!creature) return "Tidak ada creature di lajur itu.";

  const butuhTarget = definisiEfek[creature.efek].target === "pilihSendiri";
  const target = butuhTarget ? await tanyaLajur("Target lajur (creature milikmu)") : undefined;
  return jalankanAksi(state, floop, lajur, { target });
};

// MELIHAT KARTU DI TANGAN DALAM UKURAN BESAR DENGAN ANIMASI MEMBALIK
const menuLihat = async (state) => {
  const indeks = await tanyaNomor("Nomor kartu di tangan yang ingin dilihat: ");
  const kartu = state.pemain.tangan[indeks];
  if (!kartu) return "Nomor kartu tidak valid.";

  bersihkanLayar();
  await animasiBalikKartu(kartu);
  await tanya("\nTekan Enter untuk kembali...");
  return "";
};

// FASE PERTARUNGAN SATU PIHAK, LALU CEK APAKAH ADA PEMENANG.
const pertarungan = async (state, pelaku) => {
  await jalankanDanPutar(state, () => fasePertarungan(state, pelaku));
  return cekPemenang(state);
};

// GILIRAN PEMAIN: MENU AKSI BERULANG SAMPAI PEMAIN MENGAKHIRI GILIRAN ATAU MENYERAH.
const giliranPemain = async (state) => {
  let pesan = "Giliranmu! Mainkan kartu lalu akhiri giliran.";

  // ULANGI MENU AKSI SAMPAI PEMAIN MENGAKHIRI GILIRAN, MENYERAH, ATAU ADA PEMENANG
  while (cekPemenang(state) === null) {
    tampilkanLayarGiliran(state, pesan);
    const pilihan = await tanyaMenu(
      "",
      [
        ["1", "► Mainkan"],
        ["2", "✦ FLOOP"],
        ["3", "◎ Lihat"],
        ["4", "» Akhiri"],
        ["5", "⚑ Menyerah"],
      ],
      "Pilih aksi: ",
      { mendatar: true, masuk: false, tanpaKotak: true }
    );

    switch (pilihan) {
      case "1":
        pesan = await menuMainkan(state);
        break;
      case "2":
        pesan = await menuFloop(state);
        break;
      case "3":
        pesan = await menuLihat(state);
        break;
      case "4":
        return "lanjut";
      case "5": {
        const yakin = await tanya("Yakin menyerah? (y/n): ");
        if (yakin.toLowerCase() === "y") return "menyerah";
        pesan = "Lanjut bertanding!";
        break;
      }
      default:
        pesan = "Pilihan tidak dikenal, pilih 1-5.";
    }
  }

  return "lanjut";
};

// LAYAR PENUTUP SETELAH ADA PEMENANG
const tampilkanAkhir = async (state, pemenang) => {
  tampilkanPapan(state, "");
  console.log("");
  await animasiAkhir(pemenang === "pemain");
  tulis(`Pertandingan berlangsung ${state.giliran} giliran.`);
  console.log("");
};

// PAPAN DUEL BUTUH JENDELA YANG CUKUP BESAR; JIKA TERLALU KECIL, PEMAIN DIMINTA MEMPERBESARNYA.
const pastikanUkuranJendela = async () => {
  const terlaluKecil = () => process.stdout.isTTY === true && (process.stdout.rows < TINGGI_MINIMAL || process.stdout.columns < LEBAR_MINIMAL);

  while (terlaluKecil()) {
    cetak(
      kotak(
        "PERBESAR JENDELA",
        [
          `Duel butuh jendela minimal ${LEBAR_MINIMAL} kolom x ${TINGGI_MINIMAL} baris.`,
          `Ukuran sekarang: ${process.stdout.columns} x ${process.stdout.rows}.`,
          "Maximize jendela (atau kecilkan font dengan Ctrl dan -).",
        ],
        WARNA.merah
      )
    );
    const jawaban = await tanya("Enter = cek lagi, ketik L = lanjut saja: ");
    if (jawaban.toLowerCase() === "l") return;
  }
};

export const menuDuel = async () => {
  const koleksi = ambilKoleksi();
  // DUEL BUTUH KOLEKSI MINIMAL SESUAI BATAS DECK
  if (koleksi.length < DECK_MINIMAL) {
    notifikasi(false, `Koleksi baru ${koleksi.length} kartu. Butuh minimal ${DECK_MINIMAL} kartu untuk duel.`);
    return;
  }

  await pastikanUkuranJendela();
  // BUAT DUEL BARU. DECK PEMAIN DIAMBIL DARI KOLEKSI
  const state = buatDuel(koleksi);
  await animasiMulaiDuel("Kamu", "Lawan");

  let pemenang = null;
  // PERULANGAN UTAMA: GILIRAN PEMAIN, LALU GILIRAN KOMPUTER, SAMPAI ADA PEMENANG
  while (pemenang === null) {
    await animasiBanner("GILIRAN KAMU", WARNA.hijau);
    await jalankanDanPutar(state, () => mulaiGiliran(state, "pemain"));

    if ((await giliranPemain(state)) === "menyerah") {
      pemenang = "lawan";
      break;
    }

    pemenang = cekPemenang(state) ?? (await pertarungan(state, "pemain"));
    if (pemenang !== null) break;

    await animasiBanner("GILIRAN LAWAN", WARNA.merah);
    await jalankanDanPutar(state, () => mulaiGiliran(state, "lawan"));
    await jalankanDanPutar(state, () => giliranLawan(state));

    pemenang = cekPemenang(state) ?? (await pertarungan(state, "lawan"));
    state.giliran += 1;
  }

  await tampilkanAkhir(state, pemenang);
  await tanya("Tekan Enter untuk kembali ke menu utama...");
};
