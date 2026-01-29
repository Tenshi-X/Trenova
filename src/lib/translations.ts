export type TranslationKey = 
  | 'nav_dashboard'
  | 'nav_market'
  | 'nav_news'
  | 'nav_history'
  | 'nav_admin'
  | 'nav_profile'
  | 'nav_signout'
  | 'header_title'
  | 'header_subtitle'
  | 'app_title'
  | 'app_subtitle'
  | 'version_status'
  | 'coin_search_placeholder'
  | 'coin_loading'
  | 'coin_no_match'
  | 'tab_chart'
  | 'tab_analysis'
  | 'search_tv_placeholder'
  | 'search_tv_subtext'
  | 'search_btn'
  | 'ai_instr_title'
  | 'ai_instr_1'
  | 'ai_instr_2'
  | 'ai_instr_3'
  | 'upload_label'
  | 'upload_text'
  | 'upload_subtext'
  | 'context_label'
  | 'context_placeholder'
  | 'style_label'
  | 'style_scalping'
  | 'style_intraday'
  | 'style_swing'
  | 'lang_label'
  | 'generate_btn'
  | 'analyzing_msg'
  | 'result_title'
  | 'select_coin_msg'
  | 'select_coin_submsg'
  | 'login_title'
  | 'login_subtitle'
  | 'email_label'
  | 'password_label'
  | 'login_btn'
  | 'loading'
  | 'coin_search_disclaimer'
  | 'searching_global';

export const translations = {
  en: {
    nav_dashboard: 'Dashboard',
    nav_market: 'Market',
    nav_news: 'News',
    nav_history: 'History',
    nav_admin: 'Admin',
    nav_profile: 'Profile',
    nav_signout: 'Sign Out',
    header_title: 'Market Intelligence',
    header_subtitle: 'AI-Powered Forecasting & Technical Analysis',
    app_title: 'TRENOVA',
    app_subtitle: 'Intelligence',
    version_status: 'Stable',
    coin_search_placeholder: 'Search coins (e.g. BTC)...',
    coin_loading: 'Loading Market Data...',
    coin_no_match: 'No coins found matching',
    tab_chart: 'Chart',
    tab_analysis: 'AI Analysis',
    search_tv_placeholder: 'Enter Symbol (e.g., BTC)',
    search_tv_subtext: 'Search for any market symbol to view real-time charts.',
    search_btn: 'Search Chart',
    ai_instr_title: 'How to use AI Analysis',
    ai_instr_1: '1. Select a coin from the list to get basic market data.',
    ai_instr_2: '2. (Optional) Upload a chart screenshot for visual pattern analysis. This will override the text data.',
    ai_instr_3: '3. Choose your trading style and click "Generate Analysis".',
    upload_label: 'Chart Image (Optional)',
    upload_text: 'Upload Chart',
    upload_subtext: 'For enhanced visual analysis',
    context_label: 'Custom Context (Optional)',
    context_placeholder: 'E.g., Focus on support levels at $90k...',
    style_label: 'Trading Style',
    style_scalping: 'Scalping',
    style_intraday: 'Intraday',
    style_swing: 'Swing',
    lang_label: 'Language',
    generate_btn: 'Generate Analysis',
    analyzing_msg: 'AI is thinking...',
    result_title: 'Market Intelligence Report',
    select_coin_msg: 'Select a Coin to Analyze',
    select_coin_submsg: 'Choose a cryptocurrency from the list above to unlock AI price forecasting and technical analysis.',
    login_title: 'Welcome Back',
    login_subtitle: 'Sign in to access your dashboard',
    email_label: 'Email',
    password_label: 'Password',
    login_btn: 'Sign In',
    loading: 'Loading...',
    coin_search_disclaimer: 'Showing Top 100 coins by default. Use the search bar to find any other coin from the global database.',
    searching_global: 'Searching Global Database...'
  },
  id: {
    nav_dashboard: 'Dasbor',
    nav_market: 'Pasar',
    nav_news: 'Berita',
    nav_history: 'Riwayat',
    nav_admin: 'Admin',
    nav_profile: 'Profil',
    nav_signout: 'Keluar',
    header_title: 'Intelijen Pasar',
    header_subtitle: 'Prakiraan & Analisis Teknis Berbasis AI',
    app_title: 'TRENOVA',
    app_subtitle: 'Intelijen',
    version_status: 'Stabil',
    coin_search_placeholder: 'Cari koin (cth. BTC)...',
    coin_loading: 'Memuat Data Pasar...',
    coin_no_match: 'Tidak ditemukan koin yang cocok dengan',
    tab_chart: 'Grafik',
    tab_analysis: 'Analisis AI',
    search_tv_placeholder: 'Masukkan Simbol (cth. BTC)',
    search_tv_subtext: 'Cari simbol pasar apa pun untuk melihat grafik waktu nyata.',
    search_btn: 'Cari Grafik',
    ai_instr_title: 'Cara Menggunakan Analisis AI',
    ai_instr_1: '1. Pilih koin dari daftar untuk mendapatkan data pasar dasar.',
    ai_instr_2: '2. (Opsional) Unggah tangkapan layar grafik untuk analisis pola visual. Data ini akan diprioritaskan.',
    ai_instr_3: '3. Pilih gaya trading Anda dan klik "Buat Analisis".',
    upload_label: 'Gambar Grafik (Opsional)',
    upload_text: 'Unggah Grafik',
    upload_subtext: 'Untuk analisis visual yang lebih baik',
    context_label: 'Konteks Tambahan (Opsional)',
    context_placeholder: 'Cth., Fokus pada level support di $90k...',
    style_label: 'Gaya Trading',
    style_scalping: 'Scalping',
    style_intraday: 'Intraday',
    style_swing: 'Swing',
    lang_label: 'Bahasa',
    generate_btn: 'Buat Analisis',
    analyzing_msg: 'AI sedang berpikir...',
    result_title: 'Laporan Intelijen Pasar',
    select_coin_msg: 'Pilih Koin untuk Dianalisis',
    select_coin_submsg: 'Pilih mata uang kripto dari daftar di atas untuk membuka prakiraan harga AI dan analisis teknis.',
    login_title: 'Selamat Datang Kembali',
    login_subtitle: 'Masuk untuk mengakses dasbor Anda',
    email_label: 'Email',
    password_label: 'Kata Sandi',
    login_btn: 'Masuk',
    loading: 'Memuat...',
    coin_search_disclaimer: 'Menampilkan 100 koin teratas secara default. Gunakan pencarian untuk menemukan koin apa pun dari database global.',
    searching_global: 'Mencari di Database Global...'
  }
};
