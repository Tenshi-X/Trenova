# Trenova dashboard v2

Kode berfokus pada dashboard pengguna dan admin. `/terminal` mengarah ke dashboard; endpoint AI terminal mengembalikan 410. Endpoint analisis menerima pilihan terstruktur, mengambil candle sesuai timeframe, menghitung indikator lokal, memesan kuota secara atomik, lalu melakukan maksimal satu panggilan Gemini. Kegagalan provider/validasi mengembalikan kuota, sedangkan biaya provider tetap dicatat bila metadata tersedia.

## Urutan pemasangan

1. Cadangkan database dan catat jumlah akun, kuota tersisa, masa aktif, serta riwayat sebelum migrasi.
   Jalankan `src/lib/supabase/preflight_product_v2.sql` dan simpan hasil untuk perbandingan. Ini pemeriksaan baca saja, bukan cadangan. Paket Free tetap dapat menggunakan cadangan manual; ketidaktersediaan backup otomatis tidak berarti data tidak bisa dicadangkan.
2. Terapkan `src/lib/supabase/migration_product_v2.sql` di Supabase terlebih dahulu. Migrasi mengganti role premium dengan user tanpa mengubah kuota/expiry, membatasi riwayat dan profil per pemilik, serta menandai hak tertunda yang belum terbukti untuk verifikasi admin. Riwayat tanpa `user_id` dipertahankan tetapi tidak dibuka ke pengguna; pemilik harus dipulihkan dari bukti terpercaya.
3. Jalankan `src/lib/supabase/verify_product_v2.sql`. Hasilnya satu kolom `verification_report` berisi jumlah data, pemeriksaan RLS/izin efektif, kebijakan akses, RPC, pengaturan AI, dan trigger yang perlu ditinjau. Pastikan anon tidak dapat membaca riwayat; authenticated hanya mendapat SELECT pada profil/riwayat miliknya dan tidak EXECUTE RPC kuota; service_role mendapat akses. Periksa trigger auth yang terpasang: pembuatan profil harus memberi role `user`, tanpa menyalin role/hak dari `raw_user_meta_data`. Penanda `references_user_metadata` merupakan petunjuk untuk review isi fungsi, bukan bukti bahwa trigger tidak aman. Patokan 44 akun Auth, 15 profil, 465 kuota, dan 250 riwayat berasal dari hasil sebelum migrasi yang dikirim pengguna; kenaikan karena aktivitas baru perlu dijelaskan, bukan otomatis dianggap kehilangan data.
4. Nonaktifkan/hapus Supabase Edge Function lama `chatbot` jika masih terpasang. Kode repo tidak lagi memanggilnya, tetapi menghapus pemanggil tidak menutup URL fungsi eksternal. Verifikasi juga tidak ada integrasi Gemini lama lain yang aktif.
5. Pasang konfigurasi aplikasi lalu deploy. Alur AI baru dimulai dijeda. Panel admin → Biaya & laporan menyediakan daftar akun evaluasi dan persentase rilis. Keamanan dan migrasi tidak menunggu persetujuan kualitas AI.
6. Verifikasi akun lama yang tertunda melalui katalog admin menggunakan nomor pesanan asli. Proses ini mempertahankan kuota lama dan menyimpan bukti verifikasi. Pembelian baru memakai aktivasi pesanan; nomor pesanan unik mencegah kuota diberikan dua kali. Perubahan katalog tidak mengubah snapshot hak akun yang sudah diaktifkan.

Migrasi mengunci perubahan tabel profil dan riwayat selama transaksi, dengan batas tunggu lock 10 detik. Sebelum COMMIT, migrasi memeriksa ID profil, kuota, hitungan pemakaian, masa aktif, pemetaan role premium, ID/pemilik riwayat, serta keberadaan akun Auth lama. Perubahan tak terduga membatalkan seluruh transaksi. Snapshot sementara ini hanya untuk pemeriksaan di dalam transaksi dan otomatis dibuang; bukan cadangan pemulihan setelah COMMIT. Jalankan saat aktivitas rendah karena akses aplikasi dapat menunggu sampai transaksi selesai. Setelah migrasi, jalankan preflight kembali dan bandingkan angka; jumlah premium berubah menjadi nol sesuai rencana, sedangkan akun/riwayat/kuota tetap.

## Hasil verifikasi migrasi produksi — 10 Oktober 2026

Pengguna menjalankan query verifikasi di Supabase dan mengirim hasil pada 06:01:05 UTC. Laporan disimpan di `docs/migration-verification-2026-10-10.json`; ini bukti hasil query yang dikirim pengguna, bukan cadangan database atau pemeriksaan koneksi langsung oleh agen.

- Ketujuh pemeriksaan bernilai `true`: jumlah sesuai baseline, semua tabel dengan RLS, izin tabel sesuai, RPC hanya untuk server, pemilik riwayat valid, profil memiliki akun Auth, dan role premium sudah tidak ada.
- Jumlah tetap 44 akun Auth, 15 profil, 465 kuota tersisa, dan 250 riwayat. Ada 3 profil dengan masa aktif mendatang dan 0 hak tertunda yang perlu ditinjau.
- Sebanyak 29 akun Auth belum memiliki profil; selisih ini sudah ada sebelum migrasi. Laporan tidak menemukan riwayat tanpa pemilik atau pemilik yang tidak dikenal, profil tanpa akun Auth, maupun trigger pada `auth.users`/`public.user_profiles` yang perlu ditinjau.
- AI baru tetap dijeda: `enabled=false`, persentase rilis 0, tanpa akun evaluasi. Deploy aplikasi, penonaktifan Edge Function lama jika masih terpasang, pengujian akun, serta evaluasi kualitas dan biaya AI belum dibuktikan oleh laporan ini.

## Konfigurasi aplikasi

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server saja).
- `GEMINI_API_KEY` (server saja); model tetap `gemini-2.5-pro`.
- `APP_BASE_URL` untuk domain aplikasi. Undangan dan pemulihan memakai `/auth/confirm` untuk memverifikasi token satu kali dan membentuk sesi server sebelum membuka pengaturan kata sandi. Email dikirim melalui layanan email aplikasi; tidak ada kata sandi yang dikirim via email. OAuth tetap memakai `/auth/callback` pada daftar redirect Supabase.
- Konfigurasi email yang sudah dipakai aplikasi tetap diperlukan untuk broadcast/pengiriman tautan.
- Node.js 22.18+ untuk tes TypeScript langsung; dependensi `sharp` diperlukan di runtime server.

## Batas biaya

Konstanta mengikuti [tarif standar Gemini 2.5 Pro](https://ai.google.dev/gemini-api/docs/pricing): US$1,25 per juta token input dan US$10 per juta token output, termasuk thinking; kurs pengaman minimal Rp20.000/US$. Input dibatasi estimasi konservatif 4.000 token, output maksimal 1.900 token termasuk thinking (512). Batas rencana Rp480, maksimum konfigurasi efektif Rp500. Satu gambar dinormalkan server ke kanvas persegi 768 × 768 px untuk membatasi [tile gambar](https://ai.google.dev/gemini-api/docs/image-understanding) sekalipun chart sangat lebar. Teks, skema, framing, dan tile gambar dihitung sebelum ada panggilan berbayar. Input yang terlalu besar ditolak; tidak ada model pengganti atau retry otomatis.

Metadata token aktual dicatat pada `analysis_runs`. Respons tanpa metadata biaya atau yang melampaui batas menonaktifkan analisis dan mengembalikan kuota. Biaya panggilan yang sudah terjadi tidak dapat dibatalkan; estimasi dan penghentian berikutnya perlu ditinjau bersama perubahan tarif/provider. Verifikasi tarif sebelum rilis; batas tidak mencakup pajak/hosting.

## Pemeriksaan rilis

Jalankan `npm run verify` (typecheck, i18n, lint, unit/alur endpoint). Workflow GitHub menjalankan gate yang sama dan build setiap push/PR. Build memerlukan variabel publik Supabase; placeholder dipakai CI tanpa mengakses produksi. Tes memakai provider palsu dan memeriksa penolakan akun tanpa login/kedaluwarsa, gambar berlebih, JSON rusak tanpa panggilan Gemini kedua, idempotensi, batas token aktual, kanvas gambar, serta verifikasi undangan/pemulihan kata sandi.

Tes database staging memakai variabel terpisah: `TRENOVA_TEST_SUPABASE_URL`, `TRENOVA_TEST_ANON_KEY`, `TRENOVA_TEST_SERVICE_ROLE_KEY`. Gunakan proyek staging sementara yang sudah dimigrasikan, karena tes membuat lalu menghapus akun percobaan. `npm test` menguji dua reservasi bersamaan saat kuota satu, metadata admin palsu, RPC browser, riwayat pemilik/orang lain/anon, dan refund. Tanpa konfigurasi staging, tes ini dilaporkan skipped; ini tidak membuktikan kebijakan database produksi.

## Evaluasi AI dan rilis bertahap

Aktifkan analisis untuk akun evaluasi, persentase pengguna 0. Siapkan pasangan sampel lama/baru pada kondisi tren naik, turun, ranging, data derivatif hilang, seluruh timeframe, WAIT, dan chart gambar. Nilai dengan manusia: kesesuaian terhadap snapshot, alasan tanpa klaim data palsu, kegunaan setup dan kondisi menunggu, serta pemakaian token. Simpan hasil menggunakan format `tests/quality-samples.example.json`, lalu jalankan `npm run evaluate:quality -- path/to/samples.json`.

Script memeriksa skor baru membaik, token dan biaya setiap contoh memenuhi batas; skor tetap merupakan penilaian reviewer manusia. Persetujuan kualitas di panel admin wajib sebelum persentase rilis >0. Buka bertahap (misalnya 5%, 25%, 100%) sambil meninjau biaya/kegagalan/laporan. Tidak ada evaluasi Gemini otomatis yang menambah panggilan berbayar.

Jika ada masalah, jeda analisis di panel admin. Pertahankan migrasi privasi/kuota; jangan mengembalikan kebijakan baca publik atau endpoint AI lama. Periksa kegagalan dan biaya sebelum mengaktifkan kembali.

Validasi alasan memakai pemeriksaan klaim indikator eksplisit dan data yang tidak tersedia. Pemeriksaan ini tidak membuktikan seluruh makna bahasa alami; penilaian manusia tetap menjadi syarat rilis kualitas AI.
