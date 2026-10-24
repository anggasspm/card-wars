# Card Wars

Game kartu sederhana di terminal yang saya buat dengan Node.js untuk mini project Backend Basic. Konsepnya terinspirasi dari Card Wars (Cartoon Network). Ini project belajar buatan sendiri, bukan produk resmi.

## 1. Judul Proyek

Card Wars: aplikasi CLI untuk mengelola koleksi kartu dan duel melawan komputer.

## 2. Gambaran Umum

Aplikasi ini punya dua bagian utama.

Bagian pertama adalah pengelolaan koleksi kartu. Di sini pemain bisa melihat semua kartu, mencari kartu berdasarkan tipe atau lahan, menambah kartu baru, mengubah data kartu, dan membuang kartu. Semua kartu disimpan dalam array of objects, dan inilah bagian CRUD dari tugas.

Bagian kedua adalah duel. Pemain bertanding melawan komputer memakai kartu dari koleksinya. Tiap pihak punya hero dengan 100 HP dan tiga lajur untuk menaruh creature. Pemenangnya adalah yang berhasil menghabiskan HP hero lawan.

Gambar kartu ditampilkan di terminal dengan pixel-art berwarna, dan ada beberapa animasi supaya tampilannya tidak membosankan. Aplikasi ini tidak memakai library tambahan, jadi tidak perlu `npm install`.

Aturan duel secara singkat:

- Hero punya 100 HP. Mana di giliran ke-n adalah `n + 1`, maksimal 6.
- Di awal tiap pemain mendapat 4 kartu, lalu menarik 1 kartu tiap giliran (maksimal 8 kartu di tangan).
- Kartu creature ditaruh di salah satu dari 3 lajur. Kartu spell langsung dipakai lalu dibuang.
- Creature punya kemampuan FLOOP yang memakai mana dan hanya bisa dipakai sekali per giliran.
- Di akhir giliran, setiap creature menyerang creature lawan di lajur yang sama. Kalau lajur lawan kosong, serangannya mengenai hero.
- Kalau deck habis, tumpukan kartu yang sudah dibuang dikocok lagi menjadi deck baru.

## 3. Cara Menjalankan

Yang dibutuhkan:

- Node.js versi 18 ke atas
- Terminal yang mendukung warna, misalnya Windows Terminal atau terminal di VS Code
- Jendela terminal yang cukup besar untuk duel (minimal sekitar 74 kolom dan 31 baris). Kalau terlalu kecil, nanti ada peringatan sebelum duel dimulai.

Langkahnya:

```bash
git clone https://github.com/USERNAME/card-wars.git
cd card-wars
node app.js
```

Bisa juga dijalankan dengan `npm start`.

Cara pakainya, ketik angka pilihan lalu tekan Enter. Di menu utama pilih `1` untuk duel atau `2` untuk mengelola koleksi. Saat duel, pilihannya adalah mainkan kartu, FLOOP, lihat kartu, akhiri giliran, atau menyerah. Nomor kartu dan nomor lajur dimulai dari 1.

Kalau animasinya terasa terlalu lambat, jalankan dengan `KECEPATAN_ANIMASI=0.5 node app.js` (di PowerShell: `$env:KECEPATAN_ANIMASI=0.5; node app.js`).

## 4. Format Data

Setiap kartu adalah sebuah object dengan key dan value seperti ini:

```js
{
  id: 9,
  nama: "Ghost Bull",
  tipe: "creature",
  lahan: "Nice Lands",
  biaya: 5,
  serangan: 20,
  pertahanan: 28,
  biayaFloop: 6,
  efek: "damageLajur20Sembuh28",
  deskripsi: "Deal 20 Damage to creature in opposing lane and heal this creature 28 points.",
  bintang: 5,
  gambar: "ghost_bull"
}
```

Arti masing-masing key:

| Key | Tipe | Keterangan |
|---|---|---|
| `id` | number | nomor unik kartu, dibuat otomatis |
| `nama` | string | nama kartu, harus unik, maksimal 20 huruf |
| `tipe` | string | `"creature"` atau `"spell"` |
| `lahan` | string | Corn Fields, Blue Plains, Useless Swamp, Nice Lands, atau Rainbow (khusus spell) |
| `biaya` | number | mana yang dibutuhkan untuk memainkan kartu, 0 sampai 6 |
| `serangan` | number | kekuatan serang creature, 0 sampai 30 (spell diisi 0) |
| `pertahanan` | number | HP creature, 1 sampai 40 (spell diisi 0) |
| `biayaFloop` | number | mana untuk memakai FLOOP, 0 sampai 6 (spell diisi 0) |
| `efek` | string | nama efek kartu, daftarnya ada di `services/efekService.js` |
| `deskripsi` | string | penjelasan efek kartu |
| `bintang` | number | tingkat kelangkaan, 1 sampai 5 |
| `gambar` | string | nama gambar di `data/gambarKartu.js` |

Data kartu hanya disimpan di memori. Jadi kalau program ditutup, perubahan yang dibuat lewat CRUD akan kembali ke 12 kartu awal.

## 5. Penjelasan Fungsi CRUD

Semua fungsi CRUD ada di `services/koleksiService.js`. Setiap fungsi mengembalikan object `{ berhasil, pesan, data }` supaya bagian menu tinggal menampilkan pesannya.

**Create: `tambahKartu(dataBaru)`**
Fungsi ini menambah kartu ke koleksi. Pertama dicek dulu apakah koleksi sudah penuh (maksimal 20 kartu). Lalu dibuatkan `id` baru. Kalau tipenya spell, lahan otomatis Rainbow dan serangan, pertahanan, serta biaya FLOOP diisi 0. Data divalidasi dengan `cekKartu`. Kalau lolos, `deskripsi` dan `bintang` dilengkapi, lalu kartu dimasukkan ke array baru memakai spread: `[...ambilKoleksi(), lengkap]`.

**Read: `ambilSemuaKartu()`, `cariKartuById(id)`, `filterKartu({ tipe, lahan })`, `buatStatistik()`**
`ambilSemuaKartu` mengembalikan seluruh koleksi. `cariKartuById` memakai `find` untuk mencari satu kartu. `filterKartu` memakai `filter` untuk menampilkan kartu sesuai tipe atau lahan. `buatStatistik` menghitung jumlah kartu per lahan, rata-rata biaya, dan creature terkuat memakai `reduce`, `some`, dan `every`.

**Update: `ubahKartu(id, perubahan)`**
Fungsi ini mencari kartu berdasarkan `id`, lalu menggabungkan data lama dengan perubahan memakai `{ ...lama, ...perubahan }`. Hasil gabungannya divalidasi lagi (misalnya nama tidak boleh sama dengan kartu lain). Kalau valid, kartu lama diganti memakai `map`.

**Delete: `hapusKartu(id)`**
Fungsi ini mengecek dulu apakah kartunya ada. Kartu tidak boleh dihapus kalau jumlah koleksi akan kurang dari 8, karena duel butuh minimal 8 kartu. Kalau aman, kartu dibuang memakai `filter` sehingga yang tersisa adalah kartu dengan `id` yang berbeda.

Fungsi validasi yang dipakai di atas:

- `cekNama`: nama tidak boleh kosong, tidak boleh lebih dari 20 huruf, dan tidak boleh sama dengan kartu lain.
- `cekRentang`: angka harus bilangan bulat dan ada dalam batas yang ditentukan.
- `cekKartu`: menjalankan semua pengecekan lalu mengembalikan pesan error pertama, atau `null` kalau datanya valid.

## Struktur Folder

```
app.js                  titik masuk program dan menu utama
data/
  kartuAwal.js          12 kartu awal
  koleksiStore.js       tempat koleksi disimpan di memori
  lahan.js              warna tiap lahan
  gambarKartu.js        data gambar kartu
services/
  koleksiService.js     CRUD, validasi, statistik
  duelService.js        aturan duel dan giliran komputer
  efekService.js        daftar efek kartu
  aksiDasar.js          damage, heal, tarik kartu
handlers/
  menuKoleksi.js        menu untuk CRUD
  menuDuel.js           alur duel di terminal
utils/                  bantuan input, warna, tampilan, dan animasi
```