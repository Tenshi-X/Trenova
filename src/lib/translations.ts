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
  | 'lp_proof_header'
  | 'lp_proof_title'
  | 'lp_proof_title_accent'
  | 'lp_proof_desc'
  | 'lp_proof_more'
  | 'lp_comp_std'
  | 'lp_comp_prem'
  | 'lp_comp_val_1_m'
  | 'lp_comp_val_1_s'
  | 'lp_comp_val_1_t'
  | 'lp_comp_val_2_m'
  | 'lp_comp_val_2_s'
  | 'lp_comp_val_2_t'
  | 'lp_comp_val_2_p'
  | 'lp_comp_val_3_m'
  | 'lp_comp_val_3_s'
  | 'lp_comp_val_3_t'
  | 'lp_comp_val_3_p'
  | 'lp_comp_val_4_m'
  | 'lp_comp_val_4_s'
  | 'lp_comp_val_4_t'
  | 'lp_comp_val_4_p'
  | 'lp_comp_val_5_m'
  | 'lp_comp_val_5_s'
  | 'lp_comp_val_5_t'
  | 'lp_comp_val_5_p'
  | 'lp_comp_val_6_m'
  | 'lp_comp_val_6_s'
  | 'lp_comp_val_6_t'
  | 'lp_comp_val_6_p'
  | 'lp_comp_val_7_m'
  | 'lp_comp_val_7_s'
  | 'lp_comp_val_7_t'
  | 'lp_comp_val_7_p'
  | 'lp_comp_val_8_m'
  | 'lp_comp_val_8_s'
  | 'lp_comp_val_8_t'
  | 'lp_comp_val_8_p'
  | 'lp_comp_terbaik'
  | 'plan_st_label'
  | 'plan_st_desc'
  | 'plan_pr_label'
  | 'plan_pr_desc'
  | 'plan_token_gen'
  | 'plan_period'
  | 'plan_btn_pr'

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
  | 'modal_add_limit'
  | 'modal_add_limit_desc'
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
  | 'plan_prod1_title'
  | 'plan_prod1_sub'
  | 'plan_prod2_title'
  | 'plan_prod2_sub'
  | 'plan_prod3_title'
  | 'plan_prod3_sub'
  | 'plan_prod4_title'
  | 'plan_prod4_sub'
  | 'plan_token'
  | 'plan_masa_aktif'
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
   | 'testimonial_3_text'
   // Terminal Landing Page
   | 'lp_hero_pill'
   | 'lp_hero_title_prefix'
   | 'lp_hero_title_accent'
   | 'lp_hero_subtitle_1'
   | 'lp_hero_subtitle_2'
   | 'lp_hero_desc'
   | 'lp_hero_desc_bold1'
   | 'lp_hero_desc_bold2'
   | 'lp_hero_cmd'
   | 'lp_hero_btn_start'
   | 'lp_hero_btn_how'
   | 'lp_hero_stat1_label'
   | 'lp_hero_stat2_label'
   | 'lp_hero_stat3_label'
   | 'lp_hero_win_rate'
   | 'lp_hero_rr_ratio'
   | 'lp_feat_pill'
   | 'lp_feat_title'
   | 'lp_feat_title_accent'
   | 'lp_feat_desc'
   | 'lp_feat1_title'
   | 'lp_feat1_desc'
   | 'lp_feat2_title'
   | 'lp_feat2_desc'
   | 'lp_feat3_title'
   | 'lp_feat3_desc'
   | 'lp_feat4_title'
   | 'lp_feat4_desc'
   | 'lp_feat5_title'
   | 'lp_feat5_desc'
   | 'lp_feat6_title'
   | 'lp_feat6_desc'
   | 'lp_comp_pill'
   | 'lp_comp_title'
   | 'lp_comp_title_accent'
   | 'lp_comp_desc'
   | 'lp_comp_col_cap'
   | 'lp_comp_col_manual'
   | 'lp_comp_col_signal'
   | 'lp_comp_col_trenova'
   | 'lp_comp_col_trenova_rec'
   | 'lp_comp_r1'
   | 'lp_comp_r2'
   | 'lp_comp_r3'
   | 'lp_comp_r4'
   | 'lp_comp_r5'
   | 'lp_comp_r6'
   | 'lp_comp_r7'
   | 'lp_comp_r8'
   | 'lp_how_pill'
   | 'lp_how_title'
   | 'lp_how_title_accent'
   | 'lp_how_desc'
   | 'lp_how1_title'
   | 'lp_how1_desc'
   | 'lp_how2_title'
   | 'lp_how2_desc'
   | 'lp_how3_title'
   | 'lp_how3_desc'
   | 'lp_how4_title'
   | 'lp_how4_desc'
   | 'lp_proof_pill'
   | 'lp_proof_title'
   | 'lp_proof_title_accent'
   | 'lp_proof_stat1_num'
   | 'lp_proof_stat1_label'
   | 'lp_proof_stat1_sub'
   | 'lp_proof_stat2_num'
   | 'lp_proof_stat2_label'
   | 'lp_proof_stat2_sub'
   | 'lp_proof_stat3_num'
   | 'lp_proof_stat3_label'
   | 'lp_proof_stat3_sub'
   | 'lp_proof_stat4_num'
   | 'lp_proof_stat4_label'
   | 'lp_proof_stat4_sub'
   | 'lp_proof_t1_name'
   | 'lp_proof_t1_role'
   | 'lp_proof_t1_quote'
   | 'lp_proof_t2_name'
   | 'lp_proof_t2_role'
   | 'lp_proof_t2_quote'
   | 'lp_proof_t3_name'
   | 'lp_proof_t3_role'
   | 'lp_proof_t3_quote'
   | 'lp_cred_pill'
   | 'lp_cred_title'
   | 'lp_cred_title_accent'
   | 'lp_cred_brand'
   | 'lp_cred_brand_sub'
   | 'lp_cred_ig_label'
   | 'lp_cred_desc1'
   | 'lp_cred_desc1_bold'
   | 'lp_cred_desc2'
   | 'lp_cred_desc2_bold'
   | 'lp_cred_stat1_label'
   | 'lp_cred_stat2_label'
   | 'lp_cred_stat3_label'
   | 'lp_cred_stat4_label'
   | 'lp_cred_quote'
   | 'lp_cred_quote_author'
   | 'lp_faq_pill'
   | 'lp_faq_title'
   | 'lp_faq_title_accent'
   | 'lp_faq1_q'
   | 'lp_faq1_a'
   | 'lp_faq2_q'
   | 'lp_faq2_a'
   | 'lp_faq3_q'
   | 'lp_faq3_a'
   | 'lp_faq4_q'
   | 'lp_faq4_a'
   | 'lp_faq5_q'
   | 'lp_faq5_a'
   | 'lp_faq6_q'
   | 'lp_faq6_a'
   | 'lp_cta_pill'
   | 'lp_cta_title'
   | 'lp_cta_title_accent'
   | 'lp_cta_desc'
   | 'lp_cta_btn1'
   | 'lp_cta_btn2'
   | 'lp_cta_note'
   | 'lp_footer_brand_desc'
   | 'lp_footer_ig'
   | 'lp_footer_platform'
   | 'lp_footer_features'
   | 'lp_footer_howit'
   | 'lp_footer_pricing'
   | 'lp_footer_support'
   | 'lp_footer_faq'
   | 'lp_footer_discord'
   | 'lp_footer_instagram'
   | 'lp_footer_legal'
   | 'lp_footer_tos'
   | 'lp_footer_privacy'
   | 'lp_footer_refund'
   | 'lp_footer_rights'
   | 'lp_footer_disclaimer';

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
  lp_proof_header: 'REAL TRADE RECORD',
  lp_proof_title: 'Not a Claim.',
  lp_proof_title_accent: 'Here is the Proof.',
  lp_proof_desc: 'Real trade results from the Trenova Intelligence community — long and short, bullish and bearish markets. Original, unedited screenshots.',
  lp_proof_more: 'MORE RESULTS → SWIPE →',
  lp_proof_stat1: 'MAX ROI',
  lp_proof_stat2: 'TOTAL ANALYSIS',
  lp_proof_stat3: 'USER RATING',
  lp_proof_stat4: 'ANALYSIS TIME',
  lp_proof_stat1_desc: 'Highest community record',
  lp_proof_stat2_desc: 'Processed by AI',
  lp_proof_stat3_desc: '100+ verified reviews',
  lp_proof_stat4_desc: 'Average per session',
  lp_comp_std: 'TRENOVA STANDARD',
  lp_comp_prem: 'TRENOVA PREMIUM',
  lp_comp_val_1_m: '45–90 min',
  lp_comp_val_1_s: 'Wait for signal',
  lp_comp_val_1_t: '≤ 60 sec',
  lp_comp_val_2_m: 'Depends on skill',
  lp_comp_val_2_s: '✗',
  lp_comp_val_2_t: '1 Timeframe',
  lp_comp_val_2_p: '✓ Up to 15 TF',
  lp_comp_val_3_m: '✗',
  lp_comp_val_3_s: '✗',
  lp_comp_val_3_t: '✓ Gemini AI',
  lp_comp_val_3_p: '✓ Claude AI',
  lp_comp_val_4_m: 'Manual calculation',
  lp_comp_val_4_s: '✗',
  lp_comp_val_4_t: '✗',
  lp_comp_val_4_p: '✓ Auto SL/TP/R:R',
  lp_comp_val_5_m: '✓',
  lp_comp_val_5_s: '✗ Dependent',
  lp_comp_val_5_t: '✓ + History track',
  lp_comp_val_5_p: '✓ + History track',
  lp_comp_val_6_m: 'Manual',
  lp_comp_val_6_s: '✗',
  lp_comp_val_6_t: '✓ Integrated',
  lp_comp_val_6_p: '✓ Integrated',
  lp_comp_val_7_m: '✗',
  lp_comp_val_7_s: 'Different formats',
  lp_comp_val_7_t: '✓ 1-Click Copy',
  lp_comp_val_7_p: '✓ 1-Click Copy',
  lp_comp_val_8_m: 'Your time',
  lp_comp_val_8_s: 'Rp 200K–1jt+',
  lp_comp_val_8_t: 'Rp 55K–450K',
  lp_comp_val_8_p: 'Rp 99K–579K',
  lp_comp_terbaik: 'BEST',
  plan_st_label: 'Standard Plan',
  plan_st_desc: 'Gemini AI · 1 Timeframe · No Auto Risk Management',
  plan_pr_label: 'Premium Plan',
  plan_pr_desc: 'Claude AI · Up to 15 Timeframes · Auto Risk Management',
  plan_token_gen: 'generate',
  plan_period: 'Validity 30 Days',
  plan_btn_pr: 'Get Premium',
  lp_proof_header: 'REAL TRADE RECORD',
    lp_proof_title: 'Not a Claim.',
    lp_proof_title_accent: 'Here is the Proof.',
    lp_proof_desc: 'Real trade results from the Trenova Intelligence community — long and short, bullish and bearish markets. Original, unedited screenshots.',
    lp_proof_more: 'MORE RESULTS → SWIPE →',
    lp_comp_std: 'TRENOVA STANDARD',
    lp_comp_prem: 'TRENOVA PREMIUM',
    lp_comp_val_1_m: '45–90 min',
    lp_comp_val_1_s: 'Wait for signal',
    lp_comp_val_1_t: '≤ 60 sec',
    lp_comp_val_2_m: 'Depends on skill',
    lp_comp_val_2_s: '✗',
    lp_comp_val_2_t: '1 Timeframe',
    lp_comp_val_2_p: '✓ Up to 15 TF',
    lp_comp_val_3_m: '✗',
    lp_comp_val_3_s: '✗',
    lp_comp_val_3_t: '✓ Gemini AI',
    lp_comp_val_3_p: '✓ Claude AI',
    lp_comp_val_4_m: 'Manual calculation',
    lp_comp_val_4_s: '✗',
    lp_comp_val_4_t: '✗',
    lp_comp_val_4_p: '✓ Auto SL/TP/R:R',
    lp_comp_val_5_m: '✓',
    lp_comp_val_5_s: '✗ Dependent',
    lp_comp_val_5_t: '✓ + History track',
    lp_comp_val_5_p: '✓ + History track',
    lp_comp_val_6_m: 'Manual',
    lp_comp_val_6_s: '✗',
    lp_comp_val_6_t: '✓ Integrated',
    lp_comp_val_6_p: '✓ Integrated',
    lp_comp_val_7_m: '✗',
    lp_comp_val_7_s: 'Different formats',
    lp_comp_val_7_t: '✓ 1-Click Copy',
    lp_comp_val_7_p: '✓ 1-Click Copy',
    lp_comp_val_8_m: 'Your time',
    lp_comp_val_8_s: 'Rp 200K–1jt+',
    lp_comp_val_8_t: 'Rp 55K–450K',
    lp_comp_val_8_p: 'Rp 99K–579K',
    lp_comp_terbaik: 'BEST',
    plan_st_label: 'Standard Plan',
    plan_st_desc: 'Gemini AI · 1 Timeframe · No Auto Risk Management',
    plan_pr_label: 'Premium Plan',
    plan_pr_desc: 'Claude AI · Up to 15 Timeframes · Auto Risk Management',
    plan_token_gen: 'generate',
    plan_period: 'Validity 30 Days',
    plan_btn_pr: 'Get Premium',
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
    modal_add_limit: 'Add Analysis Limit (Current)',
    modal_add_limit_desc: 'Increase the current remaining limit',
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
    
    plan_prod1_title: 'STARTER PLAN',
    plan_prod1_sub: '1 Month Active',
    
    plan_prod2_title: 'PRO PLAN',
    plan_prod2_sub: '2 Months Active',
    
    plan_prod3_title: 'ELITE PLAN',
    plan_prod3_sub: '3 Months Active',
    
    plan_prod4_title: 'EXTEND ACCESS',
    plan_prod4_sub: 'Active Period Only',
    
    plan_token: 'Tokens',
    plan_masa_aktif: 'Active Period',
    
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

    // Terminal Landing Page
    lp_hero_pill: 'PROFESSIONAL TRADING INTELLIGENCE PLATFORM',
    lp_hero_title_prefix: 'TRENOVA',
    lp_hero_title_accent: 'TERMINAL',
    lp_hero_subtitle_1: 'Institutional-level Trading Analysis.',
    lp_hero_subtitle_2: 'Sharper decisions, every session.',
    lp_hero_desc: 'The first AI-based trading analysis platform in Indonesia combining',
    lp_hero_desc_bold1: 'multi-timeframe screenshots',
    lp_hero_desc_bold2: 'structured ready-to-use output',
    lp_hero_cmd: 'trenova --analyze --mode=multi-tf',
    lp_hero_btn_start: 'START NOW',
    lp_hero_btn_how: 'SEE HOW IT WORKS',
    lp_hero_stat1_label: 'Screenshot Slots',
    lp_hero_stat2_label: 'Powered Analysis',
    lp_hero_stat3_label: 'Output Generation',
    lp_hero_win_rate: 'ANALYSIS WIN RATE',
    lp_hero_rr_ratio: 'RISK/REWARD RATIO',
    lp_feat_pill: 'PLATFORM CAPABILITIES',
    lp_feat_title: 'Everything a Serious Trader',
    lp_feat_title_accent: 'Needs.',
    lp_feat_desc: 'Designed not for everyone — but for those who know that precise analysis is a competitive edge.',
    lp_feat1_title: 'MULTI-TIMEFRAME SYSTEM',
    lp_feat1_desc: 'Upload screenshots from up to 15 slots — 1W, 3D, 1D, 4H, 1H, 15M, and more. Multi-timeframe analysis structured like institutional desk trading.',
    lp_feat2_title: 'AI-POWERED ANALYSIS',
    lp_feat2_desc: 'Claude AI reads all screenshots and produces deep technical analysis — EMA confluence, RSI divergence, MACD signal, CVD, funding rate, and open interest in one output.',
    lp_feat3_title: 'RISK MANAGEMENT ENGINE',
    lp_feat3_desc: 'Input leverage and capital — the terminal automatically calculates entry range, stop loss, take profit, and maximum loss precisely based on real-time market conditions.',
    lp_feat4_title: 'STRUCTURED OUTPUT',
    lp_feat4_desc: 'Neatly formatted analysis output — bias, entry, SL, TP, win probability, additional notes — all in one summary that can be copied and used immediately.',
    lp_feat5_title: 'HISTORY & TRACKING',
    lp_feat5_desc: 'Save up to 30 recent analysis sessions with screenshots and summary. Review past trading decisions, measure accuracy, and continuously improve your edge.',
    lp_feat6_title: 'INTEGRATED DATA GUIDE',
    lp_feat6_desc: 'Interactive guide right inside the terminal — how to take correct screenshots, which indicators to enable, and how to read each signal with maximum accuracy.',
    lp_comp_pill: 'WHY TRENOVA TERMINAL',
    lp_comp_title: 'More Than Just Tools.',
    lp_comp_title_accent: 'Different Class.',
    lp_comp_desc: 'Compare for yourself — what you get with Trenova Terminal vs the old methods most traders still use.',
    lp_comp_col_cap: 'CAPABILITY',
    lp_comp_col_manual: 'Manual Analysis',
    lp_comp_col_signal: 'Buy Signal Provider',
    lp_comp_col_trenova: 'TRENOVA TERMINAL',
    lp_comp_col_trenova_rec: 'Recommended',
    lp_comp_r1: '⏱️ Time per analysis session',
    lp_comp_r2: '📊 Multi-timeframe coverage',
    lp_comp_r3: '🤖 AI-powered analysis',
    lp_comp_r4: '🎯 Automatic risk management',
    lp_comp_r5: '🧠 You learn & improve',
    lp_comp_r6: '💡 CVD + Funding rate analysis',
    lp_comp_r7: '📋 Copy-ready output',
    lp_comp_r8: '💰 Monthly cost',
    lp_how_pill: 'WORKFLOW',
    lp_how_title: 'How',
    lp_how_title_accent: 'Trenova Terminal Works',
    lp_how_desc: 'Four steps from screenshot to mature trading decisions — in under 60 seconds.',
    lp_how1_title: 'Take Screenshot & Upload',
    lp_how1_desc: 'Open the chart on TradingView or OKX. Enable required indicators (EMA, RSI, MACD, CVD). Screenshot each timeframe — then drag & drop or paste directly into the terminal slots.',
    lp_how2_title: 'Input Trading Parameters',
    lp_how2_desc: 'Enter the leverage you use and the capital allocated for this trade. The terminal will automatically adjust risk management calculations — entry zone, stop loss, take profit, and maximum drawdown.',
    lp_how3_title: 'AI Analyze & Generate Output',
    lp_how3_desc: 'Click GENERATE. Claude AI will read all screenshots simultaneously — analyzing EMA confluence, RSI divergence, MACD signal, CVD, funding rate, and open interest — then produce a complete structured analysis.',
    lp_how4_title: 'Copy Output & Execute',
    lp_how4_desc: 'Analysis output is one-click copy — complete with entry range, stop loss, take profit, risk/reward ratio, and win probability. Save to history for long-term performance tracking. Execute trades with full confidence.',
    lp_proof_pill: 'SOCIAL PROOF',
    lp_proof_title: 'Used by Serious',
    lp_proof_title_accent: 'Traders',
    lp_proof_stat1_num: '500',
    lp_proof_stat1_label: 'Active Traders',
    lp_proof_stat1_sub: 'Trenova Intelligence Community',
    lp_proof_stat2_num: '12K',
    lp_proof_stat2_label: 'Analyses Generated',
    lp_proof_stat2_sub: 'Since first launch',
    lp_proof_stat3_num: '4.8',
    lp_proof_stat3_label: 'User Rating',
    lp_proof_stat3_sub: 'Based on community feedback',
    lp_proof_stat4_num: '<60',
    lp_proof_stat4_label: 'Average Output Time',
    lp_proof_stat4_sub: 'From screenshot to full analysis',
    lp_proof_t1_name: 'Arief R.',
    lp_proof_t1_role: 'Altcoin Futures Trader • OKX',
    lp_proof_t1_quote: 'Before, just 4H analysis could take over 1 hour. Now in 15 minutes I get complete output. The decision quality is totally different.',
    lp_proof_t2_name: 'Dimas M.',
    lp_proof_t2_role: 'BTC Perp Trader • 50× Leverage',
    lp_proof_t2_quote: 'This terminal isn\'t just a regular tool. The way it reads CVD and funding rate together provides insights that usually only institutional traders have.',
    lp_proof_t3_name: 'Siti F.',
    lp_proof_t3_role: 'Crypto Trader • Trenova Member',
    lp_proof_t3_quote: 'The history feature is the most underrated. Being able to review all trading decisions, know where I went wrong, and improve my own system. This isn\'t just a tool — it\'s a mentor.',
    lp_cred_pill: 'WHO\'S BEHIND THIS',
    lp_cred_title: 'Built by Traders,',
    lp_cred_title_accent: 'for Traders.',
    lp_cred_brand: 'Trenova Intelligence',
    lp_cred_brand_sub: 'CRYPTO TRADING EDUCATION & TOOLS',
    lp_cred_ig_label: 'Instagram:',
    lp_cred_desc1: 'Trenova Intelligence was born from the same trader frustration — too much time spent on analysis setup, too little time for mature execution.',
    lp_cred_desc1_bold: 'We\'re not a big company',
    lp_cred_desc2: 'This terminal is used daily by the founder for BTC and altcoin trading on OKX — not a tool made to sell, but',
    lp_cred_desc2_bold: 'a tool built out of necessity',
    lp_cred_stat1_label: 'Instagram Followers',
    lp_cred_stat2_label: 'Discord Members',
    lp_cred_stat3_label: 'Active in community',
    lp_cred_stat4_label: 'Focus: Indonesian crypto',
    lp_cred_quote: 'I use this terminal myself every day before opening a trade. If it wasn\'t good enough, I wouldn\'t sell it. My money is on the line too.',
    lp_cred_quote_author: 'Founder Trenova Intelligence',
    lp_faq_pill: 'FAQ',
    lp_faq_title: 'Frequently',
    lp_faq_title_accent: 'Asked Questions',
    lp_faq1_q: 'Do I need an API key or special account to use it?',
    lp_faq1_a: 'No. Trenova Terminal is a web-based tool — you just need a browser and an access link. No installation, no API key needed. Just open, upload screenshots, and generate analysis.',
    lp_faq2_q: 'Which exchanges are supported?',
    lp_faq2_a: 'The terminal is optimized for OKX Perpetual Futures, but can be used with screenshots from any exchange — Binance, Bybit, and others. What matters is screenshot quality and active indicators.',
    lp_faq3_q: 'How accurate is the AI analysis?',
    lp_faq3_a: 'Accuracy depends on screenshot quality and input data completeness. The terminal is designed to provide objective and structured analysis — not automatic signals. Final decisions remain with the trader.',
    lp_faq4_q: 'Can it be used on mobile?',
    lp_faq4_a: 'Yes, Trenova Terminal is responsive and accessible from mobile browsers. However, for the best experience — especially when uploading multiple screenshots — desktop or laptop is recommended.',
    lp_faq5_q: 'How to upgrade or downgrade a plan?',
    lp_faq5_a: 'Contact the Trenova Intelligence team via DM on Instagram @trenova.intelligence or the community Discord. Upgrade/downgrade process is usually completed within 1×24 business hours.',
    lp_faq6_q: 'Is my screenshot data stored on the server?',
    lp_faq6_a: 'Screenshots are stored locally in your browser (localStorage) — not on our server. Analysis history data is also stored on your own device, not on external cloud.',
    lp_cta_pill: 'START TODAY — DON\'T DELAY',
    lp_cta_title: 'Traders Who Lose Lack',
    lp_cta_title_accent: 'Analysis.',
    lp_cta_desc: 'Every trade you execute without solid multi-timeframe analysis is money placed on a gambling table — not the market. Trenova Terminal changes that.',
    lp_cta_btn1: 'ACCESS TERMINAL NOW',
    lp_cta_btn2: 'FOLLOW @TRENOVA.INTELLIGENCE',
    lp_cta_note: '7-day money-back guarantee · Instant access · No installation',
    lp_footer_brand_desc: 'Professional trading analysis platform for Indonesian futures traders. Built by traders, for traders.',
    lp_footer_ig: 'IG: @trenova.intelligence',
    lp_footer_platform: 'Platform',
    lp_footer_features: 'Features',
    lp_footer_howit: 'How it Works',
    lp_footer_pricing: 'Pricing',
    lp_footer_support: 'Support',
    lp_footer_faq: 'FAQ',
    lp_footer_discord: 'Discord Community',
    lp_footer_instagram: 'Instagram',
    lp_footer_legal: 'Legal',
    lp_footer_tos: 'Terms of Service',
    lp_footer_privacy: 'Privacy Policy',
    lp_footer_refund: 'Refund Policy',
    lp_footer_rights: 'Trenova Intelligence. All rights reserved.',
    lp_footer_disclaimer: 'Analysis is not financial advice. Trading involves risk of loss.',
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
  lp_proof_header: 'TRACK RECORD NYATA',
  lp_proof_title: 'Bukan Klaim.',
  lp_proof_title_accent: 'Ini Buktinya.',
  lp_proof_desc: 'Hasil trade nyata dari komunitas Trenova Intelligence — long maupun short, market bullish maupun bearish. Screenshot asli, tidak diedit.',
  lp_proof_more: 'LEBIH BANYAK HASIL → GESER →',
  lp_proof_stat1: 'MAX ROI',
  lp_proof_stat2: 'TOTAL ANALISA',
  lp_proof_stat3: 'USER RATING',
  lp_proof_stat4: 'ANALISA TIME',
  lp_proof_stat1_desc: 'Rekor tertinggi komunitas',
  lp_proof_stat2_desc: 'Diproses oleh AI',
  lp_proof_stat3_desc: '100+ ulasan verified',
  lp_proof_stat4_desc: 'Rata-rata per sesi',
  lp_comp_std: 'TRENOVA STANDARD',
  lp_comp_prem: 'TRENOVA PREMIUM',
  lp_comp_val_1_m: '45–90 menit',
  lp_comp_val_1_s: 'Tunggu kiriman',
  lp_comp_val_1_t: '≤ 60 detik',
  lp_comp_val_2_m: 'Tergantung skill',
  lp_comp_val_2_s: '✗',
  lp_comp_val_2_t: '1 Timeframe',
  lp_comp_val_2_p: '✓ Hingga 15 TF',
  lp_comp_val_3_m: '✗',
  lp_comp_val_3_s: '✗',
  lp_comp_val_3_t: '✓ Gemini AI',
  lp_comp_val_3_p: '✓ Claude AI',
  lp_comp_val_4_m: 'Manual hitung',
  lp_comp_val_4_s: '✗',
  lp_comp_val_4_t: '✗',
  lp_comp_val_4_p: '✓ Auto SL/TP/R:R',
  lp_comp_val_5_m: '✓',
  lp_comp_val_5_s: '✗ Dependent',
  lp_comp_val_5_t: '✓ + History track',
  lp_comp_val_5_p: '✓ + History track',
  lp_comp_val_6_m: 'Harus manual',
  lp_comp_val_6_s: '✗',
  lp_comp_val_6_t: '✓ Terintegrasi',
  lp_comp_val_6_p: '✓ Terintegrasi',
  lp_comp_val_7_m: '✗',
  lp_comp_val_7_s: 'Format berbeda',
  lp_comp_val_7_t: '✓ 1-Click Copy',
  lp_comp_val_7_p: '✓ 1-Click Copy',
  lp_comp_val_8_m: 'Waktu kamu',
  lp_comp_val_8_s: 'Rp 200K–1jt+',
  lp_comp_val_8_t: 'Rp 55K–450K',
  lp_comp_val_8_p: 'Rp 99K–579K',
  lp_comp_terbaik: 'TERBAIK',
  plan_st_label: 'Standard Plan',
  plan_st_desc: 'Gemini AI · 1 Timeframe · Tanpa Risk Management Otomatis',
  plan_pr_label: 'Premium Plan',
  plan_pr_desc: 'Claude AI · Hingga 15 Timeframe · Risk Management Otomatis',
  plan_token_gen: 'Generate',
  plan_period: 'Masa Aktif 30 Hari',
  plan_btn_pr: 'Dapatkan Premium',
    lp_proof_header: 'TRACK RECORD NYATA',
    lp_proof_title: 'Bukan Klaim.',
    lp_proof_title_accent: 'Ini Buktinya.',
    lp_proof_desc: 'Hasil trade nyata dari komunitas Trenova Intelligence — long maupun short, market bullish maupun bearish. Screenshot asli, tidak diedit.',
    lp_proof_more: 'LEBIH BANYAK HASIL → GESER →',
    lp_comp_std: 'TRENOVA STANDARD',
    lp_comp_prem: 'TRENOVA PREMIUM',
    lp_comp_val_1_m: '45–90 menit',
    lp_comp_val_1_s: 'Tunggu kiriman',
    lp_comp_val_1_t: '≤ 60 detik',
    lp_comp_val_2_m: 'Tergantung skill',
    lp_comp_val_2_s: '✗',
    lp_comp_val_2_t: '1 Timeframe',
    lp_comp_val_2_p: '✓ Hingga 15 TF',
    lp_comp_val_3_m: '✗',
    lp_comp_val_3_s: '✗',
    lp_comp_val_3_t: '✓ Gemini AI',
    lp_comp_val_3_p: '✓ Claude AI',
    lp_comp_val_4_m: 'Manual hitung',
    lp_comp_val_4_s: '✗',
    lp_comp_val_4_t: '✗',
    lp_comp_val_4_p: '✓ Auto SL/TP/R:R',
    lp_comp_val_5_m: '✓',
    lp_comp_val_5_s: '✗ Dependent',
    lp_comp_val_5_t: '✓ + History track',
    lp_comp_val_5_p: '✓ + History track',
    lp_comp_val_6_m: 'Harus manual',
    lp_comp_val_6_s: '✗',
    lp_comp_val_6_t: '✓ Terintegrasi',
    lp_comp_val_6_p: '✓ Terintegrasi',
    lp_comp_val_7_m: '✗',
    lp_comp_val_7_s: 'Format berbeda',
    lp_comp_val_7_t: '✓ 1-Click Copy',
    lp_comp_val_7_p: '✓ 1-Click Copy',
    lp_comp_val_8_m: 'Waktu kamu',
    lp_comp_val_8_s: 'Rp 200K–1jt+',
    lp_comp_val_8_t: 'Rp 55K–450K',
    lp_comp_val_8_p: 'Rp 99K–579K',
    lp_comp_terbaik: 'TERBAIK',
    plan_st_label: 'Standard Plan',
    plan_st_desc: 'Gemini AI · 1 Timeframe · Tanpa Risk Management Otomatis',
    plan_pr_label: 'Premium Plan',
    plan_pr_desc: 'Claude AI · Hingga 15 Timeframe · Risk Management Otomatis',
    plan_token_gen: 'Generate',
    plan_period: 'Masa Aktif 30 Hari',
    plan_btn_pr: 'Dapatkan Premium',
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
    modal_add_limit: 'Tambah Batas Analisis (Sekarang)',
    modal_add_limit_desc: 'Menambah batas sisa saat ini',
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
    
    plan_prod1_title: 'PAKET STARTER',
    plan_prod1_sub: 'Masa Aktif 1 Bulan',
    
    plan_prod2_title: 'PAKET PRO',
    plan_prod2_sub: 'Masa Aktif 2 Bulan',
    
    plan_prod3_title: 'PAKET ELITE',
    plan_prod3_sub: 'Masa Aktif 3 Bulan',
    
    plan_prod4_title: 'PERPANJANG AKSES',
    plan_prod4_sub: 'Khusus Masa Aktif',
    
    plan_token: 'Token',
    plan_masa_aktif: 'Masa Aktif',
    
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

    // Terminal Landing Page
    lp_hero_pill: 'PLATFORM TRADING INTELLIGENCE PROFESIONAL',
    lp_hero_title_prefix: 'TRENOVA',
    lp_hero_title_accent: 'TERMINAL',
    lp_hero_subtitle_1: 'Analisa Trading seperti Institusional.',
    lp_hero_subtitle_2: 'Keputusan yang lebih tajam, setiap sesi.',
    lp_hero_desc: 'Platform analisa trading berbasis AI pertama di Indonesia yang menggabungkan',
    lp_hero_desc_bold1: 'screenshot multi-timeframe',
    lp_hero_desc_bold2: 'output terstruktur siap pakai',
    lp_hero_cmd: 'trenova --analyze --mode=multi-tf',
    lp_hero_btn_start: 'MULAI SEKARANG',
    lp_hero_btn_how: 'LIHAT CARA KERJA',
    lp_hero_stat1_label: 'Screenshot Slots',
    lp_hero_stat2_label: 'Powered Analysis',
    lp_hero_stat3_label: 'Output Generation',
    lp_hero_win_rate: 'WIN RATE ANALISA',
    lp_hero_rr_ratio: 'RISK/REWARD RATIO',
    lp_feat_pill: 'KAPABILITAS PLATFORM',
    lp_feat_title: 'Semua yang Dibutuhkan Trader',
    lp_feat_title_accent: 'Serius.',
    lp_feat_desc: 'Dirancang bukan untuk semua orang — tapi untuk mereka yang tahu bahwa analisa yang tepat adalah keunggulan kompetitif.',
    lp_feat1_title: 'MULTI-TIMEFRAME SYSTEM',
    lp_feat1_desc: 'Upload screenshot dari hingga 15 slot berbeda — 1W, 3D, 1D, 4H, 1H, 15M, dan lebih. Analisa multi-timeframe yang terstruktur seperti desk trading institusional.',
    lp_feat2_title: 'AI-POWERED ANALYSIS',
    lp_feat2_desc: 'Claude AI membaca seluruh screenshot dan menghasilkan analisa teknikal mendalam — EMA confluence, RSI divergence, MACD signal, CVD, funding rate, dan open interest dalam satu output.',
    lp_feat3_title: 'RISK MANAGEMENT ENGINE',
    lp_feat3_desc: 'Input leverage dan modal — terminal otomatis menghitung entry range, stop loss, take profit, dan maksimum kerugian yang presisi berdasarkan kondisi pasar real-time.',
    lp_feat4_title: 'STRUCTURED OUTPUT',
    lp_feat4_desc: 'Output analisa terformat rapi — bias, entry, SL, TP, win probability, catatan tambahan — semua dalam satu ringkasan yang bisa di-copy dan langsung dipakai.',
    lp_feat5_title: 'HISTORY & TRACKING',
    lp_feat5_desc: 'Simpan hingga 30 sesi analisa terakhir dengan screenshot dan summary. Review keputusan trading masa lalu, ukur akurasi, dan terus improve edge kamu.',
    lp_feat6_title: 'DATA GUIDE TERINTEGRASI',
    lp_feat6_desc: 'Panduan interaktif langsung di dalam terminal — cara mengambil screenshot yang benar, indikator apa yang perlu diaktifkan, dan bagaimana membaca setiap sinyal dengan akurasi tertinggi.',
    lp_comp_pill: 'KENAPA TRENOVA TERMINAL',
    lp_comp_title: 'Bukan Sekadar Tools.',
    lp_comp_title_accent: 'Beda Kelasnya.',
    lp_comp_desc: 'Bandingkan sendiri — apa yang kamu dapatkan dengan Trenova Terminal vs cara lama yang masih banyak trader pakai.',
    lp_comp_col_cap: 'KEMAMPUAN',
    lp_comp_col_manual: 'Analisa Manual',
    lp_comp_col_signal: 'Beli Signal Provider',
    lp_comp_col_trenova: 'TRENOVA TERMINAL',
    lp_comp_col_trenova_rec: 'Direkomendasikan',
    lp_comp_r1: '⏱️ Waktu analisa per sesi',
    lp_comp_r2: '📊 Multi-timeframe coverage',
    lp_comp_r3: '🤖 AI-powered analysis',
    lp_comp_r4: '🎯 Risk management otomatis',
    lp_comp_r5: '🧠 Kamu yang belajar & improve',
    lp_comp_r6: '💡 CVD + Funding rate analysis',
    lp_comp_r7: '📋 Output copy-ready',
    lp_comp_r8: '💰 Biaya per bulan',
    lp_how_pill: 'WORKFLOW',
    lp_how_title: 'Cara Kerja',
    lp_how_title_accent: 'Trenova Terminal',
    lp_how_desc: 'Empat langkah dari screenshot ke keputusan trading yang matang — dalam kurang dari 60 detik.',
    lp_how1_title: 'Ambil Screenshot & Upload',
    lp_how1_desc: 'Buka chart di TradingView atau OKX. Aktifkan indikator yang diperlukan (EMA, RSI, MACD, CVD). Screenshot setiap timeframe — lalu drag & drop atau paste langsung ke slot yang tersedia di terminal.',
    lp_how2_title: 'Input Parameter Trading',
    lp_how2_desc: 'Masukkan leverage yang kamu gunakan dan besarnya modal yang dialokasikan untuk trade ini. Terminal akan menyesuaikan kalkulasi risk management secara otomatis — entry zone, stop loss, take profit, dan maximum drawdown.',
    lp_how3_title: 'AI Analisa & Generate Output',
    lp_how3_desc: 'Klik tombol GENERATE. Claude AI akan membaca seluruh screenshot secara bersamaan — menganalisa confluence EMA, divergence RSI, sinyal MACD, CVD, funding rate, dan open interest — lalu menghasilkan analisa terstruktur lengkap.',
    lp_how4_title: 'Copy Output & Execute',
    lp_how4_desc: 'Output analisa siap satu klik copy — lengkap dengan entry range, stop loss, take profit, risk/reward ratio, dan win probability. Simpan ke history untuk tracking performa jangka panjang. Execute trade dengan konfiden penuh.',
    lp_proof_pill: 'SOCIAL PROOF',
    lp_proof_title: 'Digunakan oleh Trader',
    lp_proof_title_accent: 'Serius',
    lp_proof_stat1_num: '500',
    lp_proof_stat1_label: 'Active Traders',
    lp_proof_stat1_sub: 'Komunitas Trenova Intelligence',
    lp_proof_stat2_num: '12K',
    lp_proof_stat2_label: 'Analisa Dihasilkan',
    lp_proof_stat2_sub: 'Sejak peluncuran pertama',
    lp_proof_stat3_num: '4.8',
    lp_proof_stat3_label: 'Rating Pengguna',
    lp_proof_stat3_sub: 'Berdasarkan feedback komunitas',
    lp_proof_stat4_num: '<60',
    lp_proof_stat4_label: 'Rata-rata Output Time',
    lp_proof_stat4_sub: 'Dari screenshot ke analisa lengkap',
    lp_proof_t1_name: 'Arief R.',
    lp_proof_t1_role: 'Altcoin Futures Trader • OKX',
    lp_proof_t1_quote: 'Sebelumnya analisa 4H saja bisa 1 jam lebih. Sekarang 15 menit sudah dapat output lengkap. Beda banget kualitas decisionnya.',
    lp_proof_t2_name: 'Dimas M.',
    lp_proof_t2_role: 'BTC Perp Trader • 50× Leverage',
    lp_proof_t2_quote: 'Terminal ini bukan tools biasa. Cara dia baca CVD sama funding rate bareng bisa ngasih insight yang biasanya cuma dimiliki trader institusional.',
    lp_proof_t3_name: 'Siti F.',
    lp_proof_t3_role: 'Crypto Trader • Trenova Member',
    lp_proof_t3_quote: 'Fitur history-nya yang paling underrated. Bisa review semua keputusan trading, tahu di mana salah, dan improve sistem sendiri. Ini bukan tools — ini mentor.',
    lp_cred_pill: 'SIAPA DI BALIK INI',
    lp_cred_title: 'Dibangun oleh Trader,',
    lp_cred_title_accent: 'untuk Trader.',
    lp_cred_brand: 'Trenova Intelligence',
    lp_cred_brand_sub: 'CRYPTO TRADING EDUCATION & TOOLS',
    lp_cred_ig_label: 'Instagram:',
    lp_cred_desc1: 'Trenova Intelligence lahir dari frustrasi trader yang sama — terlalu banyak waktu dihabiskan untuk setup analisa, terlalu sedikit waktu untuk eksekusi yang matang.',
    lp_cred_desc1_bold: 'Kami bukan perusahaan besar',
    lp_cred_desc2: 'Terminal ini dipakai langsung oleh founder untuk trading BTC dan altcoin di OKX setiap sesi — bukan tools yang dibuat untuk dijual, tapi',
    lp_cred_desc2_bold: 'tools yang dibuat karena dibutuhkan',
    lp_cred_stat1_label: 'Followers Instagram',
    lp_cred_stat2_label: 'Member Discord',
    lp_cred_stat3_label: 'Aktif di komunitas',
    lp_cred_stat4_label: 'Fokus crypto Indonesia',
    lp_cred_quote: 'Terminal ini saya pakai sendiri setiap hari sebelum open trade. Kalau tidak layak, tidak akan saya jual. Uang saya juga ada di sini.',
    lp_cred_quote_author: 'Founder Trenova Intelligence',
    lp_faq_pill: 'FAQ',
    lp_faq_title: 'Pertanyaan yang',
    lp_faq_title_accent: 'Sering Ditanya',
    lp_faq1_q: 'Apakah perlu punya API key atau akun khusus untuk menggunakannya?',
    lp_faq1_a: 'Tidak. Trenova Terminal adalah web-based tool — kamu hanya perlu browser dan link akses. Tidak ada instalasi, tidak ada API key yang perlu disiapkan. Langsung buka, upload screenshot, dan generate analisa.',
    lp_faq2_q: 'Exchange apa saja yang didukung?',
    lp_faq2_a: 'Terminal dioptimalkan untuk OKX Perpetual Futures, namun bisa digunakan untuk screenshot dari exchange manapun — Binance, Bybit, dan lainnya. Yang penting adalah kualitas screenshot dan indikator yang aktif.',
    lp_faq3_q: 'Seberapa akurat analisa AI-nya?',
    lp_faq3_a: 'Akurasi bergantung pada kualitas screenshot dan kelengkapan data yang diinput. Terminal dirancang untuk memberikan analisa yang objektif dan terstruktur — bukan sinyal otomatis. Keputusan akhir tetap di tangan trader.',
    lp_faq4_q: 'Apakah bisa digunakan di mobile?',
    lp_faq4_a: 'Ya, Trenova Terminal sudah responsive dan bisa diakses dari mobile browser. Namun untuk pengalaman terbaik — terutama saat upload banyak screenshot — disarankan menggunakan desktop atau laptop.',
    lp_faq5_q: 'Bagaimana cara upgrade atau downgrade plan?',
    lp_faq5_a: 'Hubungi tim Trenova Intelligence melalui DM Instagram @trenova.intelligence atau Discord komunitas. Proses upgrade/downgrade biasanya selesai dalam 1×24 jam kerja.',
    lp_faq6_q: 'Apakah data screenshot saya tersimpan di server?',
    lp_faq6_a: 'Screenshot disimpan secara lokal di browser kamu (localStorage) — bukan di server kami. Data history analisa juga tersimpan di perangkat kamu sendiri, bukan di cloud eksternal.',
    lp_cta_pill: 'MULAI HARI INI — JANGAN TUNDA',
    lp_cta_title: 'Trader yang Kalah Kurang',
    lp_cta_title_accent: 'Analisa.',
    lp_cta_desc: 'Setiap trade yang kamu eksekusi tanpa analisa multi-timeframe yang solid adalah uang yang ditaruh di meja judi — bukan pasar. Trenova Terminal mengubah itu.',
    lp_cta_btn1: 'AKSES TERMINAL SEKARANG',
    lp_cta_btn2: 'FOLLOW @TRENOVA.INTELLIGENCE',
    lp_cta_note: 'Garansi 7 hari uang kembali · Akses instan · Tanpa instalasi',
    lp_footer_brand_desc: 'Platform analisa trading profesional untuk futures trader Indonesia. Dibangun oleh trader, untuk trader.',
    lp_footer_ig: 'IG: @trenova.intelligence',
    lp_footer_platform: 'Platform',
    lp_footer_features: 'Fitur',
    lp_footer_howit: 'Cara Kerja',
    lp_footer_pricing: 'Harga',
    lp_footer_support: 'Support',
    lp_footer_faq: 'FAQ',
    lp_footer_discord: 'Discord Komunitas',
    lp_footer_instagram: 'Instagram',
    lp_footer_legal: 'Legal',
    lp_footer_tos: 'Terms of Service',
    lp_footer_privacy: 'Privacy Policy',
    lp_footer_refund: 'Refund Policy',
    lp_footer_rights: 'Trenova Intelligence. All rights reserved.',
    lp_footer_disclaimer: 'Analisa bukan merupakan financial advice. Trading mengandung risiko kerugian.',
  }
};
