# Trenova dashboard v2

Kode berfokus pada dashboard pengguna dan admin. `/terminal` mengarah ke dashboard; endpoint AI terminal mengembalikan 410. Endpoint analisis menerima pilihan terstruktur, mengambil candle sesuai timeframe, menghitung indikator lokal, memesan kuota secara atomik, lalu melakukan maksimal satu panggilan Gemini. Kegagalan provider/validasi mengembalikan kuota, sedangkan biaya provider tetap dicatat bila metadata tersedia.

## Urutan pemasangan

1. Cadangkan database dan catat jumlah akun, kuota tersisa, masa aktif, serta riwayat sebelum migrasi.
   Jalankan `src/lib/supabase/preflight_product_v2.sql` dan simpan hasil untuk perbandingan. Ini pemeriksaan baca saja, bukan cadangan. Paket Free tetap dapat menggunakan cadangan manual; ketidaktersediaan backup otomatis tidak berarti data tidak bisa dicadangkan.
2. Terapkan `src/lib/supabase/migration_product_v2.sql` di Supabase terlebih dahulu. Migrasi mengganti role premium dengan user tanpa mengubah kuota/expiry, membatasi riwayat dan profil per pemilik, serta menandai hak tertunda yang belum terbukti untuk verifikasi admin. Riwayat tanpa `user_id` dipertahankan tetapi tidak dibuka ke pengguna; pemilik harus dipulihkan dari bukti terpercaya.
3. Jalankan `src/lib/supabase/verify_product_v2.sql`. Hasilnya satu kolom `verification_report` berisi jumlah data, pemeriksaan RLS/izin efektif, kebijakan akses, RPC, pengaturan AI, dan trigger yang perlu ditinjau. Pastikan anon tidak dapat membaca riwayat; authenticated hanya mendapat SELECT pada profil/riwayat miliknya dan tidak EXECUTE RPC kuota; service_role mendapat akses. Periksa trigger auth yang terpasang: pembuatan profil harus memberi role `user`, tanpa menyalin role/hak dari `raw_user_meta_data`. Penanda `references_user_metadata` merupakan petunjuk untuk review isi fungsi, bukan bukti bahwa trigger tidak aman. Patokan 44 akun Auth, 15 profil, 465 kuota, dan 250 riwayat berasal dari hasil sebelum migrasi yang dikirim pengguna; kenaikan karena aktivitas baru perlu dijelaskan, bukan otomatis dianggap kehilangan data.
4. Nonaktifkan/hapus Supabase Edge Function lama `chatbot` jika masih terpasang. Kode repo tidak lagi memanggilnya, tetapi menghapus pemanggil tidak menutup URL fungsi eksternal. Verifikasi juga tidak ada integrasi Gemini lama lain yang aktif.
5. Pasang konfigurasi aplikasi lalu deploy. Sesuai instruksi pemilik terbaru, instalasi baru membuka analisis untuk semua pengguna aktif. Panel admin → Pemakaian & laporan menyediakan jeda, daftar akun evaluasi, dan persentase rilis. Evaluasi kualitas dicatat secara opsional dan tidak menghalangi akses pelanggan.
6. Terapkan `src/lib/supabase/migration_manual_entitlements.sql` sebelum memasang editor pelanggan terbaru. Pembelian Shopee diatur melalui admin → edit pelanggan: tentukan tanggal/waktu akhir dalam WIB dan jumlah sisa token. Nilai tersebut mengganti hak saat ini; hitungan pemakaian tetap dipertahankan dan perubahan dicatat di audit. Simpan bukti pesanan sesuai proses operasional toko. Menu katalog/preset/aktivasi dihapus; data katalog dan riwayat pesanan lama tetap tersimpan.

Migrasi mengunci perubahan tabel profil dan riwayat selama transaksi, dengan batas tunggu lock 10 detik. Sebelum COMMIT, migrasi memeriksa ID profil, kuota, hitungan pemakaian, masa aktif, pemetaan role premium, ID/pemilik riwayat, serta keberadaan akun Auth lama. Perubahan tak terduga membatalkan seluruh transaksi. Snapshot sementara ini hanya untuk pemeriksaan di dalam transaksi dan otomatis dibuang; bukan cadangan pemulihan setelah COMMIT. Jalankan saat aktivitas rendah karena akses aplikasi dapat menunggu sampai transaksi selesai. Setelah migrasi, jalankan preflight kembali dan bandingkan angka; jumlah premium berubah menjadi nol sesuai rencana, sedangkan akun/riwayat/kuota tetap.

## Hasil verifikasi migrasi produksi — 10 Oktober 2026

Pengguna menjalankan query verifikasi di Supabase dan mengirim hasil pada 06:01:05 UTC. Laporan disimpan di `docs/migration-verification-2026-10-10.json`; ini bukti hasil query yang dikirim pengguna, bukan cadangan database atau pemeriksaan koneksi langsung oleh agen.

- Ketujuh pemeriksaan bernilai `true`: jumlah sesuai baseline, semua tabel dengan RLS, izin tabel sesuai, RPC hanya untuk server, pemilik riwayat valid, profil memiliki akun Auth, dan role premium sudah tidak ada.
- Jumlah tetap 44 akun Auth, 15 profil, 465 kuota tersisa, dan 250 riwayat. Ada 3 profil dengan masa aktif mendatang dan 0 hak tertunda yang perlu ditinjau.
- Sebanyak 29 akun Auth belum memiliki profil; selisih ini sudah ada sebelum migrasi. Laporan tidak menemukan riwayat tanpa pemilik atau pemilik yang tidak dikenal, profil tanpa akun Auth, maupun trigger pada `auth.users`/`public.user_profiles` yang perlu ditinjau.
- AI baru tetap dijeda: `enabled=false`, persentase rilis 0, tanpa akun evaluasi. Deploy aplikasi, penonaktifan Edge Function lama jika masih terpasang, pengujian akun, serta evaluasi kualitas dan biaya AI belum dibuktikan oleh laporan ini.

## Pemulihan akses pelanggan dan admin

Pemilik kemudian meminta akses langsung untuk pelanggan aktif dan menetapkan `sevafarel17@gmail.com` sebagai akun admin. Untuk database yang sudah dimigrasikan, jalankan seluruh `src/lib/supabase/restore_live_access.sql` di SQL Editor, tanpa mengulang migrasi penuh. Script memeriksa tepat satu akun Auth dengan email tersebut, memberi role admin pada profil database, membuka analisis dengan `enabled=true` dan persentase 100, serta mencatat kedua perubahan di jejak admin. Kuota, masa aktif, dan riwayat yang ada dipertahankan. Script tidak menandai evaluasi kualitas selesai; pengaman token/biaya dan pengecekan akun aktif tetap berlaku.

Hasil akhir script harus menampilkan `admin_role=admin`, `enabled=true`, dan `rollout_percent=100`. Keluar lalu masuk lagi untuk melihat dashboard admin. Login kata sandi dan pengalihan sesi yang sudah masuk menggunakan role profil database; metadata yang dapat diubah pengguna tidak memberikan akses admin. Perubahan SQL memulihkan akses pada aplikasi v2 yang sudah terpasang. Push/deploy perubahan kode berikutnya diperlukan untuk pengalihan login langsung dan pengaturan evaluasi opsional di panel admin.

Script pemulihan belum dijalankan oleh agen karena sesi tidak mempunyai akses database. Laporan verifikasi sebelumnya mencatat kondisi sebelum pemulihan ini.

## Konfigurasi aplikasi

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server saja).
- `GEMINI_API_KEY` (server saja); model tetap `gemini-2.5-pro`.
- `APP_BASE_URL` untuk domain aplikasi. Undangan dan pemulihan memakai `/auth/confirm` untuk memverifikasi token satu kali dan membentuk sesi server sebelum membuka pengaturan kata sandi. Email dikirim melalui layanan email aplikasi; tidak ada kata sandi yang dikirim via email. OAuth tetap memakai `/auth/callback` pada daftar redirect Supabase.
- Konfigurasi email yang sudah dipakai aplikasi tetap diperlukan untuk broadcast/pengiriman tautan.
- Node.js 22.18+ untuk tes TypeScript langsung; dependensi `sharp` diperlukan di runtime server.

## Batas biaya

Konstanta mengikuti [tarif standar Gemini 2.5 Pro](https://ai.google.dev/gemini-api/docs/pricing): US$1,25 per juta token input dan US$10 per juta token output, termasuk thinking; kurs pengaman minimal Rp20.000/US$. Input dibatasi 4.000 token setelah [countTokens](https://ai.google.dev/api/tokens) atas `generateContentRequest` lengkap (teks, skema, dan gambar), ditambah cadangan 256 token. Output dialokasikan dinamis 1.700–2.200 token, termasuk thinking 768, berdasarkan batas admin dan kurs. Anggaran menyisakan Rp20 di bawah batas konfigurasi efektif maksimal Rp500. Satu gambar dinormalkan server ke kanvas persegi 768 × 768 px untuk membatasi [tile gambar](https://ai.google.dev/gemini-api/docs/image-understanding). Pemeriksaan token dilakukan sebelum reservasi kuota; jika pemeriksaan gagal, input terlalu besar, atau ruang output tidak memadai, tidak ada panggilan generasi. Maksimal satu generasi analisis, tanpa model pengganti atau retry otomatis. Timeout pemeriksaan token 4 detik dan generasi 40 detik menjaga batas endpoint 60 detik.

Metadata token aktual dicatat pada `analysis_runs`. Respons tanpa metadata biaya atau yang melampaui batas menonaktifkan analisis berikutnya; permintaan saat itu tetap menyimpan laporan teknikal otomatis dan menggunakan satu kuota. Biaya yang belum diketahui disimpan `null`, bukan nol. Biaya panggilan yang sudah terjadi tidak dapat dibatalkan; estimasi dan penghentian berikutnya perlu ditinjau bersama perubahan tarif/provider. Verifikasi tarif sebelum rilis; batas tidak mencakup pajak/hosting.

## Pemeriksaan rilis

Pengambilan snapshot AI memakai `https://data-api.binance.vision` sebagai host utama sesuai [dokumentasi data pasar publik Binance](https://developers.binance.com/en/docs/products/spot/rest-api), lalu host umum dan GCP sebagai fallback. Percobaan wajib dibatasi 2,5 detik per host agar waktu pengambilan data tidak menghabiskan durasi endpoint analisis. Pada 10 Oktober 2026, pengujian lokal dengan endpoint nyata berhasil mengambil snapshot BTC, BNB, dan XRP pada timeframe 1d, sementara akses host umum gagal; ini tidak memverifikasi jaringan hosting produksi. Tes otomatis mencakup ketiga koin pada semua lima timeframe, fallback, penolakan harga kedaluwarsa/candle terputus, dan kegagalan semua provider. Pemeriksaan ini tidak memanggil Gemini. Perbaikan memerlukan deployment kode tanpa migrasi database tambahan.

Jalankan `npm run verify` (typecheck, i18n, lint, unit/alur endpoint). Workflow GitHub menjalankan gate yang sama dan build setiap push/PR. Build memerlukan variabel publik Supabase; placeholder dipakai CI tanpa mengakses produksi. Tes memakai provider palsu dan memeriksa penolakan akun tanpa login/kedaluwarsa, gambar berlebih, JSON rusak tanpa panggilan Gemini kedua, idempotensi, batas token aktual, kanvas gambar, serta verifikasi undangan/pemulihan kata sandi.

Tes database staging memakai variabel terpisah: `TRENOVA_TEST_SUPABASE_URL`, `TRENOVA_TEST_ANON_KEY`, `TRENOVA_TEST_SERVICE_ROLE_KEY`. Gunakan proyek staging sementara yang sudah menerapkan kedua migrasi, karena tes membuat lalu menghapus akun percobaan. `npm test` menguji dua reservasi bersamaan saat kuota satu, metadata admin palsu, RPC browser, riwayat pemilik/orang lain/anon, refund, serta penggantian hak pelanggan bersamaan dengan pemakaian token. Tanpa konfigurasi staging, tes ini dilaporkan skipped; ini tidak membuktikan kebijakan database produksi.

## Editor admin dan parameter analisis terbaru

Migrasi manual hanya menambahkan operasi server `set_user_entitlement`, tanpa menghapus atau menulis ulang data lama. Operasi ini mengunci baris profil yang sama dengan reservasi/refund, menghitung `analysis_limit = current_analysis_count + sisa token`, dan dapat menyelesaikan status hak tertunda. Tanggal kosong berarti akun tidak memiliki masa aktif. Profil diambil ulang setiap modal edit dibuka.

Email akun baru memiliki alamat akun dan penerima terpisah, subjek, serta pesan teks yang dapat diedit. `{{account_email}}` disisipkan sebagai alamat akun dan `{{reset_link}}` wajib ada agar server dapat menyisipkan tautan pengaturan kata sandi sekali pakai untuk akun tersebut. Jangan menyertakan kata sandi di pesan.

Analisis memakai pilihan spot/futures, otomatis/long/short, dan konfirmasi timeframe lebih tinggi. Bawaan tetap futures/otomatis/tanpa konfirmasi. Spot menolak short; rencana server mengikuti pilihan arah, dan AI hanya boleh memilih arah dari rencana tersebut. Konfirmasi mengambil candle tertutup dari timeframe 1h, 4h, 1d, atau 1w sesuai timeframe utama. Jika data wajib tidak tersedia atau kedaluwarsa, permintaan gagal sebelum reservasi token.

Pemeriksaan lokal 10 Oktober 2026: typecheck dan i18n lulus, lint tanpa error (29 warning), 39 tes lulus dan 2 tes Supabase staging dilewati karena konfigurasi belum tersedia. Build produksi berhasil dengan placeholder Supabase seperti CI. Migrasi manual belum dijalankan di database. Landing diperiksa pada desktop 1440 px dan ponsel 390 px, tanpa lebar halaman berlebih atau gambar gagal; 15 harga dan 4 tautan Shopee cocok dengan commit `b6ec3b2`. Pratinjau tersedia di `docs/previews/landing-desktop.jpg` dan `docs/previews/landing-mobile.jpg`. Tidak ada deployment atau pengiriman email nyata dalam pemeriksaan ini.

## Pemantauan AI dan evaluasi opsional

Pengguna aktif dapat langsung melakukan analisis ketika analisis aktif dan persentase 100. Pantau biaya, kegagalan, dan laporan pengguna setelah rilis. Jika dibutuhkan pengujian terbatas, admin dapat menurunkan persentase dan memasukkan akun evaluasi. Siapkan pasangan sampel lama/baru pada kondisi tren naik, turun, ranging, data derivatif hilang, seluruh timeframe, WAIT, dan chart gambar. Nilai dengan manusia: kesesuaian terhadap snapshot, alasan tanpa klaim data palsu, kegunaan setup dan kondisi menunggu, serta pemakaian token. Simpan hasil menggunakan format `tests/quality-samples.example.json`, lalu jalankan `npm run evaluate:quality -- path/to/samples.json`.

Script memeriksa skor baru membaik, token dan biaya setiap contoh memenuhi batas; skor tetap merupakan penilaian reviewer manusia. Pencatatan evaluasi kualitas di panel admin bersifat opsional. Tidak ada evaluasi Gemini otomatis yang menambah panggilan berbayar.

Jika ada masalah, jeda analisis di panel admin. Pertahankan migrasi privasi/kuota; jangan mengembalikan kebijakan baca publik atau endpoint AI lama. Periksa kegagalan dan biaya sebelum mengaktifkan kembali.

Validasi alasan memakai pemeriksaan klaim indikator eksplisit dan data yang tidak tersedia. Pemeriksaan ini tidak membuktikan seluruh makna bahasa alami; klaim kualitas membaik tetap memerlukan penilaian manusia.

## Pengembangan hasil analisis — 11 Oktober 2026

Setiap hasil baru wajib memuat 1–2 rencana numerik: zona Entry, SL, TP1, TP2, status `READY`/`CONDITIONAL`, pemicu, pembatalan sebelum entry, dan alasan level. R:R TP1 serta persentase jarak SL dihitung server dari entry terburuk, sebelum biaya/slippage. WAIT tetap boleh dipilih ketika entry belum layak, tetapi harus disertai rencana bersyarat dengan level dan pemicu; tampilannya menjadi “Rencana LONG/SHORT” di dashboard dan daftar riwayat. Tidak ada pemaksaan masuk langsung. SHORT tetap dilarang pada spot dan semua rencana mengikuti pilihan arah pengguna. Konfirmasi lebih tinggi wajib selaras untuk entry siap; rencana bersyarat menyertakan kebutuhan keselarasan berikutnya.

Konteks bertambah dari 4 menjadi 24 candle tertutup dengan OHLCV, EMA50, support/resistance swing terdekat, rentang 20 candle, perubahan 5 candle, dan ATR terhadap harga. Ringkasan struktur dihitung dari hingga 60 candle yang tersedia. Konteks pengguna diperluas menjadi 1.200 karakter. Output memuat pertimbangan tren, momentum, volume, konteks pasar, skenario naik/turun dan langkah pengelolaan posisi. Data opsional yang hilang harus disebut sebagai keterbatasan; tidak otomatis memaksa WAIT dan tidak boleh diisi dengan klaim palsu.

Kebijakan awal yang mengembalikan kuota saat validasi AI gagal telah diganti dengan kebijakan laporan tersimpan di bawah. Riwayat v2 sebelumnya tetap dapat ditampilkan tanpa perubahan database. Pemeriksaan TP/SL otomatis dibatasi ke setup siap; pemicu bebas-teks pada rencana bersyarat belum dapat dievaluasi dengan sentuhan candle saja.

Validasi lokal memakai provider palsu dan render komponen; pengujian Gemini berbayar, biaya aktual, dan evaluasi mutu sampel pengguna belum dijalankan karena kredensial Gemini/Supabase tidak tersedia. Perubahan membutuhkan deployment aplikasi; tidak ada migrasi database tambahan. Biaya aktual boleh tetap lebih rendah dari Rp500; tujuan anggaran adalah menyediakan konteks dan jawaban lebih lengkap, bukan menghabiskan biaya minimum.

Pemeriksaan lokal: `npm run verify` dan build produksi lulus dengan placeholder publik Supabase. Total 50 tes lulus, 2 tes staging dilewati; lint tanpa error dengan 25 warning yang sudah ada. Pratinjau dari komponen aktual diperiksa pada desktop 1.280 px mode gelap dan ponsel 390 px mode terang; tidak ada lebar halaman berlebih. Pratinjau memakai data simulasi, bukan hasil Gemini nyata.

## Satu kuota untuk satu laporan tersimpan — 11 Oktober 2026

Sebelum reservasi kuota dan generasi berbayar, server menyiapkan serta memvalidasi laporan teknikal lengkap dari snapshot. Zona entry memakai support/resistance candle tertutup dengan lebar 0,12 ATR pada setiap sisi; breakout/retest atau retest dipilih sesuai strategi dan tren. SL memakai buffer ATR sesuai gaya/risiko; TP1/TP2 dihitung dari entry terburuk dan target R:R pengguna. Level positif, urutan harga, jarak terhadap snapshot, serta R:R tetap diperiksa. Data wajib/volatilitas yang tidak memungkinkan rencana layak ditolak sebelum kuota atau generasi. Target perhitungan bukan prediksi harga; hambatan support/resistance, biaya dan slippage dijelaskan kepada pengguna.

AI menerima rencana server dan memilih arah utama serta memperkaya alasan, skenario naik/turun, dan pengelolaan posisi. AI tidak menjadi sumber level, R:R, status eksekusi, pemicu atau aturan pembatalan. Rencana baru bersifat `CONDITIONAL`, dengan pemicu penutupan candle dan retest; kebutuhan keselarasan timeframe lebih tinggi tetap terpasang. Arah utama dapat dipilih AI, tetapi tidak dapat mengubah larangan short pada spot atau pilihan arah pengguna. Hasil tersimpan tetap memakai skema v2 dengan tambahan `provenance` opsional; riwayat lama tetap kompatibel.

Penjelasan yang hilang, terlalu panjang, mengandung klaim indikator yang bertentangan, atau harga transaksi pengganti diperbaiki per kolom dengan teks teknikal yang tersedia. Referensi harga eksplisit dalam skenario juga diperiksa terhadap level snapshot dan rencana server; harga skenario di luar data diganti dengan teks teknikal. Pemendekan hanya mengambil kalimat utuh; pemicu dan pembatalan server tidak dipotong. JSON rusak, respons kosong/terpotong, arah terlarang, HTTP gagal atau timeout menggunakan laporan teknikal yang sudah disiapkan. Maksimal satu generasi Gemini, tanpa perbaikan/retry AI berbayar. Label hasil: “Analisis AI”, “Analisis AI dengan penyesuaian”, atau “Rencana teknikal otomatis”; sumber level selalu teknikal. Pemeriksaan bahasa alami tetap terbatas dan bukan bukti bahwa seluruh penjelasan benar secara semantik.

Reservasi kuota menjadi pemakaian final hanya ketika `finish_analysis` menyimpan laporan beserta metadata token/biaya secara atomik. Laporan teknikal otomatis dihitung sebagai analisis selesai, bukan kegagalan tanpa hasil. Jika penyimpanan tidak berhasil, `fail_analysis` mengembalikan kuota dan tetap mencatat biaya API yang sudah terjadi. Jika respons penyimpanan tidak pasti, endpoint memeriksa hasil yang telah committed sebelum mengembalikan kuota. Membuka riwayat atau mengulang request key yang telah selesai mengembalikan laporan yang sama tanpa generasi/kuota tambahan. Kebijakan satu kuota dan kemungkinan hasil teknikal otomatis ditampilkan sebelum tombol analisis dan pada hasil tersimpan.

Tidak perlu migrasi database tambahan. Deploy aplikasi diperlukan; pengujian Gemini dan Supabase nyata tetap memerlukan kredensial yang belum tersedia pada sesi ini.

Verifikasi revisi: `npm run verify` dan build produksi lulus dengan placeholder publik Supabase. Sebanyak 61 tes lulus dan 2 tes staging dilewati; lint tanpa error dengan 25 warning yang sudah ada. Pengujian mencakup invariansi harga/R:R lintas gaya, risiko, strategi dan skala harga; perbaikan teks dan skenario; kegagalan HTTP/timeout/JSON/finish reason; biaya aktual/metadata hilang; penyimpanan gagal dan respons setelah commit; serta pembukaan ulang laporan cadangan tanpa generasi atau kuota tambahan. Pratinjau komponen aktual dengan data simulasi diperiksa pada desktop 1.280 px mode gelap dan ponsel 390 px mode terang, tanpa lebar halaman berlebih.
