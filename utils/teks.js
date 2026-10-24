// MENGULANG SATU KARAKTER BEBERAPA KALI. JUMLAH NEGATIF DIANGGAP NOL
export const ulang = (karakter, jumlah) => karakter.repeat(Math.max(0, jumlah));

// PANJANG TEKS YANG TERLIHAT (TANPA KODE WARNA ANSI).
export const panjangTampil = (teks) => [...teks.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "")].length;

// MEMOTONG ATAU MENAMBAH SPASI DI KANAN SUPAYA PANJANGNYA PAS
export const pas = (teks, lebar) => {
  const potong = [...teks].slice(0, lebar).join("");
  return `${potong}${ulang(" ", lebar - [...potong].length)}`;
};

// MENARUH TEKS DI TENGAH DENGAN MENAMBAH SPASI DI KIRI DAN KANAN
export const tengah = (teks, lebar) => {
  const potong = [...teks].slice(0, lebar).join("");
  const sisa = lebar - [...potong].length;
  const kiri = Math.floor(sisa / 2);
  return `${ulang(" ", kiri)}${potong}${ulang(" ", sisa - kiri)}`;
};

export const bungkusKata = (teks, lebar) =>
  teks.split(" ").reduce((baris, kata) => {
    const terakhir = baris[baris.length - 1];
    if (terakhir !== undefined && `${terakhir} ${kata}`.length <= lebar) {
      return [...baris.slice(0, -1), `${terakhir} ${kata}`];
    }
    return [...baris, kata];
  }, []);

// ANGKA ACAK YANG SELALU SAMA UNTUK PASANGAN (X, Y) YANG SAMA; HASIL ANTARA 0 DAN 1.
export const acakStabil = (x, y) => {
  const nilai = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return nilai - Math.floor(nilai);
};
