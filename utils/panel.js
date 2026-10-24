import { cariLahan } from "../data/lahan.js";
import { warna, tebal, WARNA } from "./warna.js";
import { ulang, pas, panjangTampil } from "./teks.js";

// MENARUH TEKS (BOLEH BERWARNA) DI TENGAH SELEBAR `LEBAR` KARAKTER.
const tengahTampil = (teks, lebar) => {
  const sisa = Math.max(0, lebar - panjangTampil(teks));
  return `${ulang(" ", Math.floor(sisa / 2))}${teks}`;
};
import {
  bersihkanLayar,
  animasiAktif,
  tunggu,
  buatPemutar,
  sembunyikanKursor,
  tampilkanKursor,
} from "./terminal.js";
import { tanya } from "./input.js";
import { tulis, marginKiri, LEBAR_KOLOM } from "./layar.js";

// LEBAR SEMUA KOTAK SAMA DENGAN LEBAR KOLOM UTAMA
export const LEBAR_PANEL = LEBAR_KOLOM;

// KOTAK BERJUDUL DENGAN SUDUT MEMBULAT. ISI (BARIS) BOLEH MENGANDUNG WARNA.
export const kotak = (judul, baris, warnaTepi = WARNA.abu, lebar = LEBAR_PANEL) => {
  const dalam = lebar - 2;
  const kepala = judul === "" ? ulang("─", dalam) : `─ ${judul} ${ulang("─", dalam - judul.length - 3)}`;
  const isi = baris.map((teks) => {
    const sisa = dalam - 1 - panjangTampil(teks);
    return `${warna("│", warnaTepi)} ${teks}${ulang(" ", sisa)}${warna("│", warnaTepi)}`;
  });

  return [
    warna(`╭${tebal(kepala)}╮`, warnaTepi),
    ...isi,
    warna(`╰${ulang("─", dalam)}╯`, warnaTepi),
  ];
};

// MENCETAK BANYAK BARIS SEKALIGUS DI TENGAH LAYAR
export const cetak = (baris) => baris.forEach((isi) => tulis(isi));

// PEMBERITAHUAN HASIL AKSI: HIJAU JIKA BERHASIL, MERAH JIKA GAGAL.
export const notifikasi = (berhasil, pesan) => {
  const tanda = berhasil ? "✓" : "✕";
  cetak(kotak("", [`${tanda}  ${pesan}`], berhasil ? WARNA.hijau : WARNA.merah));
};

// SATU BARIS RINGKASAN KARTU: LAHAN, NAMA, BIAYA, ATK/HP, DAN BINTANG
export const ringkasKartu = (kartu) => {
  const lahan = cariLahan(kartu.lahan);
  const angka = kartu.tipe === "creature" ? `${kartu.serangan}/${kartu.pertahanan}` : "spell";
  return `${warna(` ${pas(lahan.label, 7)}`, WARNA.tinta, lahan.bar)} ${pas(kartu.nama, 20)} ◆${kartu.biaya}  ${pas(angka, 6)} ${ulang("★", kartu.bintang)}`;
};

// TABEL KARTU BERNOMOR DI DALAM KOTAK.
export const tabelKartu = (judul, daftar) => {
  const kepala = tebal(`${pas("No", 2)} ${pas("Lahan", 7)} ${pas("Nama", 20)} ${pas("Mana", 4)} ${pas("ATK/HP", 6)} ★`);
  const isi =
    daftar.length === 0
      ? [warna("(tidak ada kartu)", WARNA.abu)]
      : daftar.map((kartu, i) => `${pas(String(i + 1), 2)}${ringkasKartu(kartu)}`);
  return kotak(judul, [kepala, ...isi]);
};

export const menuKotak = (judul, pilihan) =>
  kotak(judul, pilihan.map(([kunci, teks]) => `${tebal(warna(` ${kunci} `, WARNA.tinta, WARNA.emas))} ${teks}`));

export const tampilkanLayarBaru = () => bersihkanLayar();

// ---------- MENU BERANIMASI ----------

// ISI MENU BERUPA DAFTAR BARIS. ADA BEBERAPA KEADAAN BUAT ANIMASINYA:
//   TAMPIL   : BERAPA PILIHAN YANG SUDAH MUNCUL, GESERBARU: SEBERAPA JAUH PILIHAN BARU MASIH GESER
//   TERPILIH : KUNCI YANG DIPILIH PEMAIN, NYALA: PILIHAN ITU LAGI NYALA ATAU PADAM (BERKEDIP)
const isiMenu = (pilihan, { tampil, geserBaru, terpilih, nyala, mendatar }) => {
  const item = pilihan.map(([kunci, teks], i) => {
    if (i >= tampil) return null;
    const dipilih = terpilih === kunci;
    const baru = i === tampil - 1 && geserBaru > 0;
    const lencana = warna(` ${kunci} `, WARNA.tinta, dipilih && nyala ? WARNA.putih : baru ? WARNA.putih : WARNA.emas);
    const isiTeks = dipilih ? tebal(warna(teks, nyala ? WARNA.putih : WARNA.emas)) : terpilih !== null ? warna(teks, WARNA.abu) : teks;
    return `${ulang(" ", baru ? geserBaru : 0)}${tebal(lencana)} ${isiTeks}`;
  });

  return mendatar ? [item.filter((isi) => isi !== null).join("  ")] : item.map((isi) => isi ?? "");
};

// MENAMPILKAN MENU LALU BACA PILIHAN PEMAIN. KALAU DI TERMINAL ASLI, PILIHAN MUNCUL SATU-SATU
// (MELUNCUR DARI KANAN) DAN PILIHAN YANG DIPILIH BERKEDIP DULU SEBELUM DIJALANKAN.
// PILIHAN: [[KUNCI, TEKS], ...]; OPSI: { MENDATAR, MASUK, WARNATEPI, JEDA }
export const tanyaMenu = async (judul, pilihan, prompt, opsi = {}) => {
  const { mendatar = false, masuk = true, warnaTepi = WARNA.abu, jeda = 70, saatMenunggu = null, tanpaKotak = false } = opsi;
  const buat = (keadaan = {}) => {
    const isi = isiMenu(pilihan, { tampil: pilihan.length, geserBaru: 0, terpilih: null, nyala: false, mendatar, ...keadaan });
    // TANPA KOTAK: SATU BARIS PILIHAN YANG DITARUH DI TENGAH KOLOM UTAMA.
    return tanpaKotak ? isi.map((baris) => tengahTampil(baris, LEBAR_KOLOM)) : kotak(judul, isi, warnaTepi);
  };

  const bisaAnimasi = animasiAktif() && process.stdin.isTTY === true;
  if (!bisaAnimasi) {
    cetak(buat());
    return tanya(prompt);
  }

  sembunyikanKursor();
  const pemutar = buatPemutar();
  if (masuk && !mendatar) {
    for (let i = 1; i <= pilihan.length; i++) {
      for (const geserBaru of [8, 4, 0]) {
        pemutar.gambar(buat({ tampil: i, geserBaru }));
        await tunggu(jeda / 3);
      }
    }
  } else if (masuk) {
    for (let i = 1; i <= pilihan.length; i++) {
      pemutar.gambar(buat({ tampil: i, geserBaru: 4 }));
      await tunggu(jeda);
    }
  }
  pemutar.gambar(buat());
  tampilkanKursor();

  const hentikan = saatMenunggu ? saatMenunggu(buat().length) : null;
  const jawaban = await tanya(prompt);
  if (hentikan) hentikan();
  if (!pilihan.some(([kunci]) => kunci === jawaban)) return jawaban;

  // KURSOR KINI BERADA DI BAWAH BARIS ISIAN; NAIK KE ATAS KOTAK, KEDIPKAN PILIHAN, LALU TURUN LAGI.
  sembunyikanKursor();
  const tinggi = buat().length;
  for (let frame = 0; frame < 8; frame++) {
    process.stdout.write(`\x1b[${tinggi + 1}A\r`);
    buat({ terpilih: jawaban, nyala: frame % 2 === 0 }).forEach((baris) => process.stdout.write(`\x1b[2K${marginKiri()}${baris}\n`));
    process.stdout.write("\x1b[1B\r");
    await tunggu(55);
  }
  tampilkanKursor();
  return jawaban;
};
