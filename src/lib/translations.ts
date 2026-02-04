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
  | 'nav_community'
  | 'nav_feedback'
  | 'nav_login'
  | 'nav_get_started'
  | 'hero_pill'
  | 'hero_title_1'
  | 'hero_title_2'
  | 'hero_desc'
  | 'hero_powered_by'
  | 'btn_try_dashboard'
  | 'btn_see_features'
  | 'how_it_works_title'
  | 'how_it_works_subtitle'
  | 'step_1_title'
  | 'step_1_desc'
  | 'step_2_title'
  | 'step_2_desc'
  | 'step_3_title'
  | 'step_3_desc'
  | 'step_4_title'
  | 'step_4_desc'
  | 'features_pill'
  | 'features_title'
  | 'features_desc'
  | 'features_point_1_title'
  | 'features_point_1_desc'
  | 'features_point_2_title'
  | 'features_point_2_desc'
  | 'features_point_3_title'
  | 'features_point_3_desc'
  | 'mock_ai_report'
  | 'mock_live'
  | 'mock_trend'
  | 'mock_trend_val'
  | 'mock_support'
  | 'mock_rsi'
  | 'mock_comment'
  | 'mock_forecast'
  | 'mock_target'
  | 'section_analysis_title'
  | 'card_forecast_pill'
  | 'card_forecast_title'
  | 'card_forecast_desc'
  | 'card_technical_pill'
  | 'card_technical_title'
  | 'card_technical_desc'
  | 'card_risk_pill'
  | 'card_risk_title'
  | 'card_risk_desc'
  | 'footer_rights'
  | 'footer_privacy'
  | 'footer_terms'
  | 'footer_feedback'
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
  | 'searching_global'
  | 'hero_pill'
  | 'hero_title_1'
  | 'hero_title_2'
  | 'hero_desc'
  | 'hero_powered_by'
  | 'btn_try_dashboard'
  | 'btn_see_features'
  | 'how_it_works_title'
  | 'how_it_works_subtitle'
  | 'step_1_title'
  | 'step_1_desc'
  | 'step_2_title'
  | 'step_2_desc'
  | 'step_3_title'
  | 'step_3_desc'
  | 'step_4_title'
  | 'step_4_desc'
  | 'features_pill'
  | 'features_title'
  | 'features_desc'
  | 'features_point_1_title'
  | 'features_point_1_desc'
  | 'features_point_2_title'
  | 'features_point_2_desc'
  | 'features_point_3_title'
  | 'features_point_3_desc'
  | 'mock_ai_report'
  | 'mock_live'
  | 'mock_trend'
  | 'mock_trend_val'
  | 'mock_support'
  | 'mock_rsi'
  | 'mock_comment'
  | 'mock_forecast'
  | 'mock_target'
  | 'section_analysis_title'
  | 'card_forecast_pill'
  | 'card_forecast_title'
  | 'card_forecast_desc'
  | 'card_technical_pill'
  | 'card_technical_title'
  | 'card_technical_desc'
  | 'card_risk_pill'
  | 'card_risk_title'
  | 'card_risk_desc'
  | 'footer_rights'
  | 'footer_privacy'
  | 'footer_terms'
  | 'footer_feedback'
  | 'btn_back_home'
  | 'feedback_pill'
  | 'feedback_title'
  | 'feedback_desc'
  | 'feedback_name_label'
  | 'feedback_name_placeholder'
  | 'feedback_subject_label'
  | 'feedback_subject_placeholder'
  | 'feedback_message_label'
  | 'feedback_message_placeholder'
  | 'feedback_send_btn'

  | 'admin_console'
  | 'admin_subtitle'
  | 'btn_create_auth'
  | 'btn_refresh'
  | 'card_total_users'
  | 'card_total_users_sub'
  | 'card_active_subs'
  | 'card_active_subs_sub'
  | 'card_total_req'
  | 'card_total_req_sub'
  | 'card_premium_users'
  | 'card_premium_users_sub'
  | 'section_activity_monitoring'
  | 'pill_live_data'
  | 'table_header_user'
  | 'table_header_role'
  | 'table_header_remaining'
  | 'table_header_sub'
  | 'table_header_actions'
  | 'table_empty'
  | 'req_unit'
  | 'limit_unit'
  | 'status_expired'
  | 'status_days_left'
  | 'sub_ends'
  | 'sub_no_active'
  | 'modal_title'
  | 'modal_role'
  | 'modal_add_sub'
  | 'modal_add_sub_desc'
  | 'modal_limit'
  | 'btn_cancel'
  | 'btn_save_changes'
  | 'confirm_delete_user'
  | 'feedback_footer_note'
  | 'search_placeholder_user'
  | 'rows_per_page'
  | 'page_info'
  | 'btn_prev'
  | 'btn_next';

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
    nav_community: 'Community',
    nav_feedback: 'Feedback',
    nav_login: 'Login',
    nav_get_started: 'Get Started',
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
    searching_global: 'Searching Global Database...',
    hero_pill: 'Live Market Intelligence',
    hero_title_1: 'Visual Forecasting &',
    hero_title_2: 'Technical Master Calls.',
    hero_desc: 'Combine AI Image Recognition with real-time market data. Upload charts to detect patterns or get comprehensive price forecasts instantly.',
    hero_powered_by: 'Powered by Advanced Multimodal AI',
    btn_try_dashboard: 'Try Dashboard',
    btn_see_features: 'See Features',
    how_it_works_title: 'How It Works',
    how_it_works_subtitle: 'Complete market dominance in 4 steps',
    step_1_title: '1. Select Coin',
    step_1_desc: 'Choose any cryptocurrency from the dashboard to start analysis.',
    step_2_title: '2. Live Data',
    step_2_desc: 'We fetch real-time Price, Volume, and Cap data automatically.',
    step_3_title: '3. Visual Input',
    step_3_desc: 'Optional: Upload a chart screenshot for pattern recognition.',
    step_4_title: '4. AI Analysis',
    step_4_desc: 'Get a comprehensive Price Forecast, Technical Deep Dive, and Risk Assessment.',
    features_pill: 'Deep Analysis',
    features_title: 'Beyond Simple Signals.\nComplete Market Intelligence.',
    features_desc: 'Most bots just say "Buy". Trenova acts as a Senior Analyst, providing the full reasoning and structure you need to trade with confidence.',
    features_point_1_title: 'Visual + Data Fusion',
    features_point_1_desc: 'Combines technical indicators with optional image recognition of chart patterns.',
    features_point_2_title: 'Structured Intelligence Report',
    features_point_2_desc: 'Get standardized outputs with Price Forecasts, Technical Deep Dives, and Risk Metrics.',
    features_point_3_title: 'History & Tracking',
    features_point_3_desc: 'Automatically save and classify every analysis to track your market performance over time.',
    mock_ai_report: 'AI REPORT',
    mock_live: 'LIVE',
    mock_trend: 'Trend:',
    mock_trend_val: 'Uptrend w/ Volume',
    mock_support: 'Support:',
    mock_rsi: 'RSI:',
    mock_comment: '"Double bottom pattern confirmed on 4H chart. Recommend accumulation..."',
    mock_forecast: 'Forecast',
    mock_target: 'Target: $100k',
    section_analysis_title: 'Comprehensive AI Analysis',
    card_forecast_pill: 'Forecast',
    card_forecast_title: 'Price Prediction',
    card_forecast_desc: 'Determines Trend (Bullish/Bearish), Support & Resistance levels, and short-term targets.',
    card_technical_pill: 'Technical',
    card_technical_title: 'Deep Dive',
    card_technical_desc: 'Analyzes Moving Averages, RSI, Momentum, and chart patterns like Head & Shoulders.',
    card_risk_pill: 'Risk Guard',
    card_risk_title: 'Sentiment & Risk',
    card_risk_desc: 'Evaluates crowd psychology (FOMO vs Panic) and assigns a Volatility Score.',
    footer_rights: 'Trenova Mobile. All rights reserved.',
    footer_privacy: 'Privacy Policy',
    footer_terms: 'Terms of Service',
    footer_feedback: 'Feedback',
    btn_back_home: 'Back to Home',
    feedback_pill: 'We Value Your Input',
    feedback_title: 'Help Us Improve Trenova',
    feedback_desc: 'Have a suggestion, found a bug, or just want to share your thoughts? Send us an email directly.',
    feedback_name_label: 'Your Name',
    feedback_name_placeholder: 'John Doe',
    feedback_subject_label: 'Subject',
    feedback_subject_placeholder: 'Feature Request / Bug Report',
    feedback_message_label: 'Message',
    feedback_message_placeholder: 'Tell us what you think...',
    feedback_send_btn: 'Send Feedback',
    feedback_footer_note: 'This will open your default email client to send your feedback.',
    // Admin translations
    admin_console: 'Admin Console',
    admin_subtitle: 'Manage Authentication & Application Profiles',
    btn_create_auth: 'Create New Auth',
    btn_refresh: 'Refresh',
    card_total_users: 'Total Users',
    card_total_users_sub: 'Registered Accounts',
    card_active_subs: 'Active Subs',
    card_active_subs_sub: 'Premium / Active',
    card_total_req: 'Total Request',
    card_total_req_sub: 'Used / Total Quota Available',
    card_premium_users: 'Premium Users',
    card_premium_users_sub: 'Paid / Admin Accounts',
    section_activity_monitoring: 'User Activity Monitoring',
    pill_live_data: 'Live Data',
    table_header_user: 'User Profile',
    table_header_role: 'Role',
    table_header_remaining: 'Remaining',
    table_header_sub: 'Subscription',
    table_header_actions: 'Actions',
    table_empty: 'No profiles provisioned yet.',
    req_unit: 'req',
    limit_unit: 'of limit',
    status_expired: 'EXPIRED',
    status_days_left: 'Days Left',
    sub_ends: 'Ends:',
    sub_no_active: 'No Active Sub',
    modal_title: 'Manage Subscription',
    modal_role: 'Role',
    modal_add_sub: 'Add Subscription (Days)',
    modal_add_sub_desc: 'Duration will be added from today',
    modal_limit: 'Analysis Limit (Total)',
    btn_cancel: 'Cancel',
    btn_save_changes: 'Save Changes',
    confirm_delete_user: 'Are you sure you want to remove this user from the App Profiles? (Auth account will remain)',
    search_placeholder_user: 'Search by email...',
    rows_per_page: 'Rows per page:',
    page_info: 'Page {current} of {total}',
    btn_prev: 'Previous',
    btn_next: 'Next'
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
    nav_community: 'Komunitas',
    nav_feedback: 'Feedback',
    nav_login: 'Masuk',
    nav_get_started: 'Mulai Sekarang',
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
    searching_global: 'Mencari di Database Global...',
    hero_pill: 'Intelijen Pasar Langsung',
    hero_title_1: 'Prakiraan Visual &',
    hero_title_2: 'Panggilan Master Teknis.',
    hero_desc: 'Gabungkan Pengenalan Gambar AI dengan data pasar waktu nyata. Unggah grafik untuk mendeteksi pola atau dapatkan prakiraan harga komprehensif secara instan.',
    hero_powered_by: 'Ditenagai oleh AI Multimodal Canggih',
    btn_try_dashboard: 'Coba Dasbor',
    btn_see_features: 'Lihat Fitur',
    how_it_works_title: 'Cara Kerja',
    how_it_works_subtitle: 'Dominasi pasar lengkap dalam 4 langkah',
    step_1_title: '1. Pilih Koin',
    step_1_desc: 'Pilih mata uang kripto apa pun dari dasbor untuk memulai analisis.',
    step_2_title: '2. Data Langsung',
    step_2_desc: 'Kami mengambil data Harga, Volume, dan Kapitalisasi secara otomatis.',
    step_3_title: '3. Input Visual',
    step_3_desc: 'Opsional: Unggah tangkapan layar grafik untuk pengenalan pola.',
    step_4_title: '4. Analisis AI',
    step_4_desc: 'Dapatkan Prakiraan Harga, Pendalaman Teknis, dan Penilaian Risiko yang komprehensif.',
    features_pill: 'Analisis Mendalam',
    features_title: 'Lebih dari Sekadar Sinyal.\nIntelijen Pasar Lengkap.',
    features_desc: 'Kebanyakan bot hanya bilang "Beli". Trenova bertindak sebagai Analis Senior, memberikan penalaran penuh dan struktur yang Anda butuhkan untuk trading dengan percaya diri.',
    features_point_1_title: 'Fusi Visual + Data',
    features_point_1_desc: 'Menggabungkan indikator teknis dengan pengenalan gambar pola grafik opsional.',
    features_point_2_title: 'Laporan Intelijen Terstruktur',
    features_point_2_desc: 'Dapatkan output standar dengan Prakiraan Harga, Pendalaman Teknis, dan Metrik Risiko.',
    features_point_3_title: 'Riwayat & Pelacakan',
    features_point_3_desc: 'Simpan dan klasifikasikan setiap analisis secara otomatis untuk melacak kinerja pasar Anda dari waktu ke waktu.',
    mock_ai_report: 'LAPORAN AI',
    mock_live: 'LANGSUNG',
    mock_trend: 'Tren:',
    mock_trend_val: 'Tren Naik dgn Volume',
    mock_support: 'Support:',
    mock_rsi: 'RSI:',
    mock_comment: '"Pola double bottom terkonfirmasi di grafik 4J. Sarankan akumulasi..."',
    mock_forecast: 'Prakiraan',
    mock_target: 'Target: $100k',
    section_analysis_title: 'Analisis AI Komprehensif',
    card_forecast_pill: 'Prakiraan',
    card_forecast_title: 'Prediksi Harga',
    card_forecast_desc: 'Menentukan Tren (Bullish/Bearish), level Support & Resistance, dan target jangka pendek.',
    card_technical_pill: 'Teknis',
    card_technical_title: 'Pendalaman',
    card_technical_desc: 'Menganalisis Moving Average, RSI, Momentum, dan pola grafik seperti Head & Shoulders.',
    card_risk_pill: 'Penjaga Risiko',
    card_risk_title: 'Sentimen & Risiko',
    card_risk_desc: 'Mengevaluasi psikologi massa (FOMO vs Panik) dan memberikan Skor Volatilitas.',
    footer_rights: 'Trenova Mobile. Hak cipta dilindungi.',
    footer_privacy: 'Kebijakan Privasi',
    footer_terms: 'Syarat Layanan',
    footer_feedback: 'Umpan Balik',
    btn_back_home: 'Kembali ke Beranda',
    feedback_pill: 'Masukan Anda Berharga',
    feedback_title: 'Bantu Kami Meningkatkan Trenova',
    feedback_desc: 'Punya saran, menemukan bug, atau hanya ingin berbagi pemikiran? Kirimkan email langsung kepada kami.',
    feedback_name_label: 'Nama Anda',
    feedback_name_placeholder: 'Budi Santoso',
    feedback_subject_label: 'Subjek',
    feedback_subject_placeholder: 'Permintaan Fitur / Laporan Bug',
    feedback_message_label: 'Pesan',
    feedback_message_placeholder: 'Katakan pendapat Anda...',
    feedback_send_btn: 'Kirim Masukan',
    feedback_footer_note: 'Ini akan membuka aplikasi email default Anda untuk mengirim masukan.',
    // Khusus Admin
    admin_console: 'Konsol Admin',
    admin_subtitle: 'Kelola Otentikasi & Profil Aplikasi',
    btn_create_auth: 'Buat Auth Baru',
    btn_refresh: 'Segarkan',
    card_total_users: 'Total Pengguna',
    card_total_users_sub: 'Akun Terdaftar',
    card_active_subs: 'Langganan Aktif',
    card_active_subs_sub: 'Premium / Aktif',
    card_total_req: 'Total Permintaan',
    card_total_req_sub: 'Terpakai / Total Kuota',
    card_premium_users: 'Pengguna Premium',
    card_premium_users_sub: 'Akun Berbayar / Admin',
    section_activity_monitoring: 'Pemantauan Aktivitas Pengguna',
    pill_live_data: 'Data Langsung',
    table_header_user: 'Profil Pengguna',
    table_header_role: 'Peran',
    table_header_remaining: 'Sisa',
    table_header_sub: 'Langganan',
    table_header_actions: 'Aksi',
    table_empty: 'Belum ada profil yang dibuat.',
    req_unit: 'req',
    limit_unit: 'dari batas',
    status_expired: 'KEDALUWARSA',
    status_days_left: 'Hari Tersisa',
    sub_ends: 'Berakhir:',
    sub_no_active: 'Tidak Ada Langganan',
    modal_title: 'Kelola Langganan',
    modal_role: 'Peran',
    modal_add_sub: 'Tambah Langganan (Hari)',
    modal_add_sub_desc: 'Durasi akan ditambahkan dari hari ini',
    modal_limit: 'Batas Analisis (Total)',
    btn_cancel: 'Batal',
    btn_save_changes: 'Simpan Perubahan',
    confirm_delete_user: 'Apakah Anda yakin ingin menghapus pengguna ini dari Profil Aplikasi? (Akun otentikasi akan tetap ada)',
    search_placeholder_user: 'Cari berdasarkan email...',
    rows_per_page: 'Baris per halaman:',
    page_info: 'Halaman {current} dari {total}',
    btn_prev: 'Sebelumnya',
    btn_next: 'Selanjutnya'
  }
};
