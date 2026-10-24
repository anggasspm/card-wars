import { tutupInput } from "./utils/input.js";
import { animasiJudul, tampilkanJudul, mulaiJudulHidup, TINGGI_JUDUL } from "./utils/judul.js";
import { bersihkanLayar } from "./utils/terminal.js";
import { jumlahPadAtas, tulis } from "./utils/layar.js";
import { tanyaMenu, notifikasi } from "./utils/panel.js";
import { menuDuel } from "./handlers/menuDuel.js";
import { menuKoleksi } from "./handlers/menuKoleksi.js";

// DAFTAR PILIHAN DI MENU UTAMA. FORMATNYA [KUNCI YANG DIKETIK, TEKS YANG TAMPIL]
const PILIHAN_UTAMA = [
  ["1", "►  Duel melawan komputer"],
  ["2", "▤  Kelola koleksi kartu (CRUD)"],
  ["0", "✕  Keluar"],
];

// LAYAR UTAMA: JUDUL DI TENGAH JENDELA (JUGA SECARA VERTIKAL) DAN TERUS BERKILAU SELAMA MENUNGGU PILIHAN.
const tampilkanLayarUtama = async (denganAnimasiMasuk) => {
  const tinggiKonten = TINGGI_JUDUL + 1 + (PILIHAN_UTAMA.length + 2) + 1;
  bersihkanLayar();
  process.stdout.write("\n".repeat(jumlahPadAtas(tinggiKonten)));

  if (denganAnimasiMasuk) await animasiJudul();
  else tampilkanJudul();
  console.log("");

  return tanyaMenu("MENU UTAMA", PILIHAN_UTAMA, "Pilih menu: ", {
    saatMenunggu: (tinggiKotak) => mulaiJudulHidup(TINGGI_JUDUL + 1 + tinggiKotak),
  });
};

// FUNGSI UTAMA PROGRAM. MENAMPILKAN MENU UTAMA BERULANG-ULANG SAMPAI PEMAIN MEMILIH KELUAR
const main = async () => {
  let berjalan = true;
  let pertama = true;

  while (berjalan) {
    const pilihan = await tampilkanLayarUtama(pertama);
    pertama = false;

    switch (pilihan) {
      case "1":
        await menuDuel();
        break;
      case "2":
        bersihkanLayar();
        await menuKoleksi();
        break;
      case "0":
        berjalan = false;
        break;
      default:
        notifikasi(false, "Pilihan tidak dikenal, pilih 0-2.");
        await new Promise((selesai) => setTimeout(selesai, 900));
    }
  }

  console.log("");
  tulis("Sampai jumpa, Duelist!");
  console.log("");
  tutupInput();
};

main();
