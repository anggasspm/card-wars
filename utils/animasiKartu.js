import { animasiAktif, tunggu, buatPemutar, sembunyikanKursor, tampilkanKursor } from "./terminal.js";
import { barisKartuBesar, barisPunggungKartu, barisKosongBesar, LEBAR_BESAR } from "./kartuView.js";
import { warna, WARNA } from "./warna.js";
import { ulang } from "./teks.js";
import { tulis, tengahDalamKolom } from "./layar.js";

const cetakStatis = (kartu) => tengahDalamKolom(barisKartuBesar(kartu), LEBAR_BESAR).forEach((baris) => tulis(baris));

// MEMBUNGKUS ANIMASI: KURSOR DISEMBUNYIKAN SELAMA ANIMASI, DAN TANPA TERMINAL SUNGGUHAN
// KARTU LANGSUNG DITAMPILKAN APA ADANYA.
const jalankan = async (kartu, animasi) => {
  if (!animasiAktif()) {
    cetakStatis(kartu);
    return;
  }
  sembunyikanKursor();
  const pemutar = buatPemutar();
  await animasi((baris) => pemutar.gambar(tengahDalamKolom(baris, LEBAR_BESAR)));
  tampilkanKursor();
};

// MEMBALIK KARTU: KARTU TERLIHAT DARI PUNGGUNGNYA, LALU TERBUKA DARI TENGAH KE ATAS DAN BAWAH,
// KEMUDIAN BINGKAINYA BERKILAU.
export const animasiBalikKartu = (kartu) =>
  jalankan(kartu, async (gambar) => {
    const depan = barisKartuBesar(kartu);
    const tengahBaris = Math.floor(depan.length / 2);

    for (let langkah = 0; langkah <= tengahBaris + 1; langkah++) {
      const punggung = barisPunggungKartu(langkah);
      gambar(depan.map((baris, i) => (Math.abs(i - tengahBaris) < langkah ? baris : punggung[i])));
      await tunggu(55);
    }

    for (let putaran = 0; putaran < 16; putaran++) {
      gambar(barisKartuBesar(kartu, { posisi: putaran * 2 }));
      await tunggu(60);
    }
  });

// KARTU "DICETAK" DARI ATAS KE BAWAH DENGAN GARIS PEMINDAI PUTIH (DIPAKAI SAAT KARTU BARU DIBUAT).
export const animasiLahirKartu = (kartu) =>
  jalankan(kartu, async (gambar) => {
    const penuh = barisKartuBesar(kartu);
    const garisPindai = warna(ulang("═", LEBAR_BESAR), WARNA.putih);
    const kosong = barisKosongBesar();

    for (let baris = 0; baris <= penuh.length; baris++) {
      gambar(penuh.map((isi, i) => (i < baris ? isi : i === baris ? garisPindai : kosong[i])));
      await tunggu(60);
    }

    for (let putaran = 0; putaran < 12; putaran++) {
      gambar(barisKartuBesar(kartu, { posisi: putaran * 2 }));
      await tunggu(60);
    }
  });

// KILATAN PUTIH BERGANTIAN BEBERAPA KALI (DIPAKAI SAAT KARTU DIUBAH).
export const animasiKilauKartu = (kartu) =>
  jalankan(kartu, async (gambar) => {
    for (let putaran = 0; putaran < 12; putaran++) {
      const tint = putaran % 2 === 0 ? { warna: WARNA.putih, jumlah: 0.45 } : null;
      gambar(barisKartuBesar(kartu, { posisi: putaran * 3, tint }));
      await tunggu(80);
    }
    gambar(barisKartuBesar(kartu));
  });

// GAMBAR KARTU PECAH MENJADI SERPIHAN, LALU KARTU MENYUSUT DAN HILANG (DIPAKAI SAAT KARTU DIBUANG).
export const animasiHapusKartu = (kartu) =>
  jalankan(kartu, async (gambar) => {
    for (let langkah = 1; langkah <= 14; langkah++) {
      gambar(barisKartuBesar(kartu, { lenyap: langkah / 14, posisi: 0 }));
      await tunggu(70);
    }

    const sisa = barisKartuBesar(kartu, { lenyap: 1 });
    for (let tinggi = sisa.length; tinggi >= 0; tinggi--) {
      gambar(sisa.slice(0, tinggi));
      await tunggu(35);
    }
  });
