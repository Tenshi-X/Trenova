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
  | 'authenticating'
  | 'loading'
  | 'coin_search_disclaimer'
  | 'searching_global'

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
  | 'btn_next'
  | 'history_title'
  | 'history_subtitle'
  | 'history_search_placeholder'
  | 'history_showing_results'
  | 'history_show'
  | 'history_no_analysis'
  | 'history_try_search'
  | 'history_no_analysis_desc'
  | 'history_go_dashboard'
  | 'history_loading'
  | 'filter_from'
  | 'filter_to'
  | 'filter_start_date'

  | 'filter_end_date'
  | 'filter_select_date'
  
  // Problem
  | 'problem_pill'
  | 'problem_title'
  | 'problem_desc'
  
  // Feature (Updated)
  | 'feature_main_pill'
  | 'feature_main_title'
  | 'feature_main_desc'
  
  // Demo
  | 'demo_pill'
  | 'demo_title'
  | 'demo_desc'
  | 'demo_btn_try'
  
  // Pricing
  | 'pricing_pill'
  | 'pricing_title'
  | 'pricing_desc'
  | 'plan_name'
  | 'plan_subtitle'
  | 'plan_150_title'
  | 'plan_150_price'
  | 'plan_150_desc'
  | 'plan_300_title'
  | 'plan_300_price'
  | 'plan_300_desc'
  | 'plan_450_title'
  | 'plan_450_price'
  | 'plan_450_desc'
  | 'plan_feature_1'
  | 'plan_feature_2'
  | 'plan_feature_3'
  | 'plan_feature_4'

  | 'plan_btn'
  | 'faq_pill'
  | 'faq_title'
  | 'faq_q1'
  | 'faq_a1'
  | 'faq_q2'
  | 'faq_a2'
  | 'faq_q3'
  | 'faq_a3'
  | 'faq_q4'
  | 'faq_a4'
  | 'faq_q5'
  | 'faq_a5'
  | 'testimonial_title'
  | 'testimonial_1_name'
  | 'testimonial_1_text'
  | 'testimonial_2_name'
  | 'testimonial_2_text'
  | 'testimonial_3_name'
  | 'testimonial_3_text';

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
    login_title: 'Welcome',
    login_subtitle: 'Access your Trenova terminal',
    email_label: 'Email Address',
    password_label: 'Password',
    login_btn: 'Login',
    authenticating: 'Authenticating...',
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
    footer_rights: 'Trenova Intelligence. All rights reserved.',
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
    btn_next: 'Next',
    history_title: 'Analysis History',
    history_subtitle: 'Your recent market intelligence reports',
    history_search_placeholder: 'Search coin...',
    history_showing_results: 'Showing {count} results',
    history_show: 'Show:',
    history_no_analysis: 'No Analysis Found',
    history_try_search: 'Try adjusting your search term.',
    history_no_analysis_desc: 'You haven\'t run any market analysis recently.',
    history_go_dashboard: 'Go to Dashboard',
    history_loading: 'Loading history...',
    filter_from: 'From',
    filter_to: 'To',
    filter_start_date: 'Start Date',
    filter_end_date: 'End Date',
    filter_select_date: 'Select date',
    // Problem Section
    problem_pill: 'THE PROBLEM',
    problem_title: 'Why Do 90% of Retail Traders Fail?',
    problem_desc: 'Trading without data = gambling. Most traders are still stuck in this pattern: relying on rumors, emotional decisions, and ignoring market structure.',

    // Feature Section (Updated)
    feature_main_pill: 'FEATURES',
    feature_main_title: 'Not Just Signals. This is Market Intelligence.',
    feature_main_desc: 'Trenova acts as your personal senior analyst — providing structured reports, not just "BUY" or "SELL".',

    // How it Works (Updated)
    step_1_title: '1. Select Coin',
    step_1_desc: 'Pick any crypto from the dashboard to start.',
    step_2_title: '2. Live Data',
    step_2_desc: 'Price, volume, and market cap fetched automatically in real-time.',
    step_3_title: '3. Visual Input',
    step_3_desc: 'Upload chart screenshot for AI pattern recognition (optional).',
    step_4_title: '4. AI Report',
    step_4_desc: 'Get price forecasts, technicals, & full risk assessment.',

    // Demo Section
    demo_pill: 'DEMO',
    demo_title: 'See the Results Yourself.',
    demo_desc: 'Here is the Trenova AI analysis output when analyzing Bitcoin. Structured, clear, and ready for execution.',
    demo_btn_try: 'Try Now ->',

    // Pricing Section
    pricing_pill: 'PRICING',
    pricing_title: 'Invest for Smarter Trading',
    pricing_desc: 'Select the token package that suits your trading frequency. All packages include full access for 1 month.',
    
    plan_name: 'AI Market Intelligence',
    plan_subtitle: 'Full Access + Token Quota',
    
    plan_150_title: '150 Tokens',
    plan_150_price: 'Rp150.000',
    plan_150_desc: 'Perfect for casual traders. ~5 analyses per day.',
    
    plan_300_title: '300 Tokens',
    plan_300_price: 'Rp300.000',
    plan_300_desc: 'Ideal for active daily traders. ~10 analyses per day.',
    
    plan_450_title: '450 Tokens',
    plan_450_price: 'Rp450.000',
    plan_450_desc: 'For power users who need constant market updates.',
    
    plan_feature_1: '1 Month Active Subscription',
    plan_feature_2: 'Full AI Analysis Access',
    plan_feature_3: 'Real-time Market Data',
    plan_feature_4: 'Chart Pattern Recognition',
    
    plan_btn: 'Get Access',

    // FAQ Section
    faq_pill: 'FAQ',
    faq_title: 'Frequently Asked Questions',
    faq_q1: 'Does Trenova guarantee profit?',
    faq_a1: 'While no financial tool can ethically guarantee 100% profit due to market volatility, Trenova significantly tilts the odds in your favor by using advanced AI to filter out noise and identify high-probability setups. Our users consistently report that by following our data-driven signals and disciplined risk management, they have transformed their trading consistency and profitability, moving from guessing to executing with professional confidence.',
    faq_q2: 'What AI model do you use?',
    faq_a2: 'We leverage a cutting-edge ensemble of proprietary deep learning models including advanced Vision Transformers found in top-tier tech to recognize complex chart patterns instantly. By combining these with LSTM networks for price forecasting, our engine doesn\'t just "see" the chart—it understands the underlying market sentiment and momentum, giving you an analysis that rivals seasoned institutional traders.',
    faq_q3: 'Can it analyze any coin?',
    faq_a3: 'Absolutely! Trenova is integrated with the massive global CoinGecko database, granting you the power to analyze thousands of cryptocurrencies, from established giants like Bitcoin to emerging altcoins with high potential. Whether you are scalping a meme coin or swing trading a major asset, our AI adapts instantly to provide precise market intelligence.',
    faq_q4: 'How do I upload a chart?',
    faq_a4: 'It is incredibly seamless; simply take a screenshot of your chart from TradingView or any exchange, paste or upload it into our dashboard, and let our Vision AI do the heavy lifting. Within seconds, the system will scan every candle to detect hidden patterns like Bull Flags or Head and Shoulders, delivering a comprehensive technical breakdown that would normally take hours.',
    faq_q5: 'Is my data safe?',
    faq_a5: 'Your security and privacy are our absolute top priorities, which is why we employ enterprise-grade encryption and strictly ensure that we never store sensitive trading keys or wallet seed phrases. You can focus entirely on your trading performance with peace of mind, knowing that your chart data is processed securely and your personal identity remains heavily protected.',

    // Testimonial Section
    testimonial_title: 'MEMBER TESTIMONIES',
    testimonial_1_name: 'Agussetiono123_',
    testimonial_1_text: '"Admin is super fast response... I just joined 2 weeks ago and already 80% profit from capital..."',
    testimonial_2_name: 'Fikrilukman',
    testimonial_2_text: '"At first I didn\'t understand, but there are friends to discuss with, finally got profit too, awesome 👍"',
    testimonial_3_name: 'Sellytya_45',
    testimonial_3_text: '"Wow, first time finding signals with such high winrate!!!! If I calculate it\'s above 80%, even if there is a loss the SL is very thin and TP is huge so overall after joining for 3 months profit is multiple times the initial capital, awesome team!!!! Keep it up!!"',
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
    login_title: 'Selamat Datang',
    login_subtitle: 'Akses terminal Trenova Anda',
    email_label: 'Alamat Email',
    password_label: 'Kata Sandi',
    login_btn: 'Masuk',
    authenticating: 'Mengautentikasi...',
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
    how_it_works_title: '4 Langkah Menuju',
    how_it_works_subtitle: 'Keputusan Cerdas',
    step_1_title: '1. Pilih Koin',
    step_1_desc: 'Crypto apa pun dari dashboard untuk memulai.',
    step_2_title: '2. Data Langsung',
    step_2_desc: 'Harga, volume, dan market cap diambil otomatis secara real-time.',
    step_3_title: '3. Input Visual',
    step_3_desc: 'Upload screenshot chart untuk pengenalan pola AI (opsional).',
    step_4_title: '4. Laporan AI',
    step_4_desc: 'Dapatkan prakiraan harga, teknikal, & risk assessment lengkap.',
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
    footer_rights: 'Trenova Intelligence. Hak cipta dilindungi.',
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
    btn_next: 'Selanjutnya',
    history_title: 'Riwayat Analisis',
    history_subtitle: 'Laporan intelijen pasar terbaru Anda',
    history_search_placeholder: 'Cari koin...',
    history_showing_results: 'Menampilkan {count} hasil',
    history_show: 'Tampilkan:',
    history_no_analysis: 'Tidak Ada Analisis',
    history_try_search: 'Coba ubah kata kunci pencarian.',
    history_no_analysis_desc: 'Anda belum menjalankan analisis pasar baru-baru ini.',
    history_go_dashboard: 'Ke Dasbor',
    history_loading: 'Memuat riwayat...',
    filter_from: 'Dari',
    filter_to: 'Sampai',
    filter_start_date: 'Tanggal Mulai',
    filter_end_date: 'Tanggal Selesai',
    filter_select_date: 'Pilih tanggal',

    // Problem Section
    problem_pill: 'MASALAH',
    problem_title: 'Kenapa 90% Trader Retail Rugi?',
    problem_desc: 'Trading tanpa data = gambling. Kebanyakan trader masih terjebak pola ini: mengandalkan rumor, keputusan emosional, dan tidak melihat struktur pasar.',

    // Feature Section (Updated)
    feature_main_pill: 'FITUR',
    feature_main_title: 'Bukan Sekadar Sinyal. Ini Intelijen Pasar.',
    feature_main_desc: 'Trenova bertindak sebagai analis senior pribadi kamu — memberikan laporan terstruktur, bukan cuma "BUY" atau "SELL".',

    // Demo Section
    demo_pill: 'DEMO',
    demo_title: 'Lihat Hasilnya Sendiri.',
    demo_desc: 'Begini output analisis AI Trenova saat menganalisis Bitcoin. Terstruktur, jelas, dan langsung bisa kamu eksekusi.',
    demo_btn_try: 'Coba Sekarang ->',

    // Pricing Section
    pricing_pill: 'HARGA',
    pricing_title: 'Investasi untuk Trading Lebih Cerdas',
    pricing_desc: 'Pilih paket token yang sesuai dengan frekuensi trading Anda. Semua paket termasuk akses penuh selama 1 bulan.',
    
    plan_name: 'Intelijen Pasar AI',
    plan_subtitle: 'Akses Penuh + Kuota Token',
    
    plan_150_title: '150 Token',
    plan_150_price: 'Rp150.000',
    plan_150_desc: 'Cocok untuk trader santai. ~5 analisis per hari.',
    
    plan_300_title: '300 Token',
    plan_300_price: 'Rp300.000',
    plan_300_desc: 'Ideal untuk trader harian aktif. ~10 analisis per hari.',
    
    plan_450_title: '450 Token',
    plan_450_price: 'Rp450.000',
    plan_450_desc: 'Untuk pengguna pro yang butuh update pasar konstan.',
    
    plan_feature_1: 'Langganan Aktif 1 Bulan',
    plan_feature_2: 'Akses Analisis AI Penuh',
    plan_feature_3: 'Data Pasar Real-time',
    plan_feature_4: 'Pengenalan Pola Grafik',
    
    plan_btn: 'Dapatkan Akses',

    // FAQ Section
    faq_pill: 'FAQ',
    faq_title: 'Pertanyaan Umum',
    faq_q1: 'Apakah Trenova menjamin profit?',
    faq_a1: 'Meskipun tidak ada alat keuangan yang dapat menjamin keuntungan 100% karena volatilitas pasar, Trenova secara signifikan meningkatkan peluang kemenangan Anda dengan menggunakan AI canggih untuk menyaring kebisingan pasar dan mengidentifikasi peluang berprobabilitas tinggi. Pengguna kami secara konsisten melaporkan bahwa dengan mengikuti sinyal berbasis data kami, mereka telah mengubah konsistensi trading menjadi profitabilitas yang nyata, beralih dari sekadar menebak menjadi eksekusi dengan keyakinan profesional.',
    faq_q2: 'AI model apa yang digunakan?',
    faq_a2: 'Kami memanfaatkan ansambel model deep learning eksklusif yang mutakhir, termasuk Vision Transformers canggih untuk mengenali pola grafik yang kompleks secara instan. Dengan menggabungkan teknologi ini dengan jaringan LSTM untuk peramalan harga, mesin kami tidak hanya "melihat" grafik tetapi memahami sentimen pasar dan momentum yang mendasarinya, memberikan Anda analisis setara dengan trader institusional berpengalaman.',
    faq_q3: 'Bisa analisis koin apa saja?',
    faq_a3: 'Tentu saja! Trenova terintegrasi langsung dengan basis data global CoinGecko yang masif, memberikan Anda kekuatan untuk menganalisis ribuan kripto, dari raksasa seperti Bitcoin hingga altcoin baru yang berpotensi tinggi. Baik Anda scalping koin meme atau swing trading aset utama, AI kami mampu memberikan intelijen support, resistance, dan tren yang presisi untuk hampir semua aset.',
    faq_q4: 'Bagaimana cara upload chart?',
    faq_a4: 'Prosesnya sangat mulus dan instan; cukup ambil tangkapan layar grafik Anda dari TradingView atau bursa mana pun, tempel atau unggah ke dasbor kami, dan biarkan Vision AI kami bekerja keras untuk Anda. Dalam hitungan detik, sistem akan memindai setiap candle untuk mendeteksi pola tersembunyi seperti Bull Flags atau Head and Shoulders, menyajikan rincian teknis komprehensif yang biasanya memakan waktu berjam-jam.',
    faq_q5: 'Apakah data saya aman?',
    faq_a5: 'Keamanan dan privasi Anda adalah prioritas mutlak kami, itulah sebabnya kami menerapkan enkripsi tingkat perusahaan dan menjamin bahwa kami tidak pernah menyimpan kunci trading sensitif atau frasa sandi dompet Anda. Anda dapat fokus sepenuhnya pada performa trading Anda dengan tenang, mengetahui bahwa data grafik Anda diproses secara aman dan identitas pribadi Anda tetap terlindungi dengan ketat.',

    // Testimonial Section
    testimonial_title: 'TESTIMONI MEMBER',
    testimonial_1_name: 'Agussetiono123_',
    testimonial_1_text: '"Admin nya fast resp banget... gua baru join 2 mingguan sdh profit 80% dari modal sih...."',
    testimonial_2_name: 'Fikrilukman',
    testimonial_2_text: '"Awale aku ora ngerti, nanging ono kanca-kanca diskusi bareng, pungkasane entuk cuan uga, mantap pokoke 👍"',
    testimonial_3_name: 'Sellytya_45',
    testimonial_3_text: '"Wah baru kali ini nemu sinyal yang winratenya tinggi banget!!!! kalau aku itung itung sih 80% keatas ada ini, ada loss itupun pasang SL nya tipis banget dan TP nya besar jadi overall setelah join 3 bulanan ini profit berkali2 lipat dari modal awal, keren banget tim DEX!!!! semangattttt!!"',
  }
};
