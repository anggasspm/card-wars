import { gambarKartu } from "../data/gambarKartu.js";
import { warnaAktif } from "./terminal.js";
import { kodeFg, kodeBg, RESET, campur, WARNA } from "./warna.js";
import { acakStabil } from "./teks.js";

// GAMBAR KARTU DISIMPAN DALAM BENTUK TEKS HEX. SATU KARAKTER DI TERMINAL BISA NAMPILIN DUA PIKSEL
// (ATAS DAN BAWAH) PAKAI KARAKTER SETENGAH BLOK "▀": WARNA TULISAN = PIKSEL ATAS, WARNA LATAR = PIKSEL BAWAH.

const BAYANGAN = " ░▒▓█";
const cache = new Map();

const bacaBaris = (baris) =>
  Array.from({ length: baris.length / 6 }, (_, i) =>
    [0, 2, 4].map((geser) => parseInt(baris.slice(i * 6 + geser, i * 6 + geser + 2), 16))
  );

const ambilPiksel = (kunci, ukuran) => {
  const id = `${kunci}/${ukuran}`;
  if (!cache.has(id)) cache.set(id, gambarKartu[kunci][ukuran].map(bacaBaris));
  return cache.get(id);
};

// PARTIKEL YANG NAIK DARI BAWAH KE ATAS GAMBAR (DIPAKAI UNTUK EFEK HEAL, BUFF, FLOOP).
const hitungPartikel = ({ ch, warna: warnaPartikel, jumlah = 6, t }, lebar, tinggi) =>
  new Map(
    Array.from({ length: jumlah }, (_, i) => {
      const mulai = acakStabil(i, 2) * 0.5;
      const kemajuan = (t - mulai) / 0.5;
      if (kemajuan < 0 || kemajuan > 1) return null;
      const x = Math.floor(acakStabil(i, 1) * lebar);
      const y = Math.round((tinggi - 1) * (1 - kemajuan));
      return [`${x},${y}`, { ch, warna: warnaPartikel }];
    }).filter((entri) => entri !== null)
  );

const jumlahTerang = (piksel) => piksel.reduce((total, nilai) => total + nilai, 0);

// MENGUBAH GAMBAR KARTU JADI BARIS-BARIS TEKS.
// MOD.LENYAP   : 0 SAMPAI 1, SEBAGIAN PIKSEL HILANG (EFEK PECAH)
// MOD.TINT     : { WARNA, JUMLAH } MEWARNAI SELURUH GAMBAR (EFEK KILAT)
// MOD.PARTIKEL : { CH, WARNA, JUMLAH, T } PARTIKEL YANG NAIK KE ATAS
export const barisArt = (kunci, ukuran, mod = {}) => {
  const { lenyap = 0, tint = null, partikel = null } = mod;
  const piksel = ambilPiksel(kunci, ukuran);
  const jumlahBaris = piksel.length / 2;
  const lebar = piksel[0].length;
  const posisiPartikel = partikel ? hitungPartikel(partikel, lebar, jumlahBaris) : new Map();

  const warnaPiksel = (x, y) => {
    const dasar = acakStabil(x, y) < lenyap ? WARNA.gelap : piksel[y][x];
    return tint ? campur(dasar, tint.warna, tint.jumlah) : dasar;
  };

  return Array.from({ length: jumlahBaris }, (_, baris) => {
    const sel = Array.from({ length: lebar }, (__, x) => {
      const atas = warnaPiksel(x, baris * 2);
      const bawah = warnaPiksel(x, baris * 2 + 1);
      const p = posisiPartikel.get(`${x},${baris}`);

      if (!warnaAktif()) {
        if (p) return p.ch;
        const terang = (jumlahTerang(atas) + jumlahTerang(bawah)) / 1530;
        return BAYANGAN[Math.min(BAYANGAN.length - 1, Math.floor(terang * BAYANGAN.length))];
      }

      if (p) return `${kodeFg(p.warna)}${kodeBg(bawah)}${p.ch}`;
      return `${kodeFg(atas)}${kodeBg(bawah)}▀`;
    });
    return `${sel.join("")}${warnaAktif() ? RESET : ""}`;
  });
};
