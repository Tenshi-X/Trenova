
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Link } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [strategy, setStrategy] = React.useState<any>(null);
  const [marketData, setMarketData] = React.useState({
    bitcoin: { price: 90321, change: 1.82 },
    ethereum: { price: 4820, change: -0.63 }
  });

  useEffect(() => {
    fetchActiveStrategy();
    fetchMarketData();
  }, []);

  const fetchActiveStrategy = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('user_strategies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setStrategy(data);
  };

  const fetchMarketData = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true'
      );
      if (!response.ok) throw new Error('Failed to fetch prices');
      const data = await response.json();
      
      setMarketData({
        bitcoin: { 
            price: data.bitcoin.usd, 
            change: data.bitcoin.usd_24h_change 
        },
        ethereum: { 
            price: data.ethereum.usd, 
            change: data.ethereum.usd_24h_change 
        }
      });
    } catch (e) {
      console.log('Error fetching market data:', e);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Decorative Header Background */}
      <View style={styles.headerBackground}>
         <View style={styles.headerContent}>
            <View style={styles.headerTop}>
                <View>
                    <Text style={styles.greeting}>Good Morning,</Text>
                    <Text style={styles.username}>Trader</Text>
                </View>
                <View style={styles.headerActions}>
                     <Link href="/notifications" asChild>
                        <TouchableOpacity style={styles.iconBtn}>
                             {/* @ts-ignore */}
                            <IconSymbol name="bell.fill" size={24} color="#FFF" />
                            <View style={styles.notificationDot} />
                        </TouchableOpacity>
                     </Link>
                     <TouchableOpacity style={[styles.iconBtn, { marginLeft: 12 }]}>
                         {/* @ts-ignore */}
                        <IconSymbol name="person.crop.circle" size={28} color="#FFF" />
                     </TouchableOpacity>
                </View>
            </View>
            
            {/* Quick Stats or Message */}
            <View style={styles.marketSummary}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Global Market Cap</Text>
                    <Text style={styles.summaryValue}>$3.12T</Text>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>24h Volume</Text>
                    <Text style={styles.summaryValue}>$98.4B</Text>
                </View>
            </View>
         </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Main Floating Card - Active Strategy or Offer */}
        <View style={styles.floatingSection}>
            {strategy ? (
                <View style={styles.strategyCard}>
                     <View style={styles.strategyHeader}>
                        <View style={styles.strategyBadge}>
                            <Text style={styles.strategyBadgeText}>ACTIVE STRATEGY</Text>
                        </View>
                        <Link href="/strategies" asChild>
                            <TouchableOpacity>
                                <Text style={styles.seeAll}>See Details &rarr;</Text>
                            </TouchableOpacity>
                        </Link>
                     </View>
                     
                     <View style={styles.strategyMain}>
                         <View style={styles.coinVisual}>
                             <View style={[styles.coinIcon, { backgroundColor: '#F59E0B' }]}>
                                  {/* @ts-ignore */}
                                 <IconSymbol name="bitcoinsign.circle.fill" size={28} color="#FFF" />
                             </View>
                             <Text style={styles.coinSymbol}>{strategy.symbol.toUpperCase()}</Text>
                         </View>
                         <View style={styles.strategyPrices}>
                             <View>
                                 <Text style={styles.priceLabel}>Entry</Text>
                                 <Text style={styles.priceValue}>${strategy.buy_price.toLocaleString()}</Text>
                             </View>
                             <View style={{ alignItems: 'flex-end' }}>
                                 <Text style={styles.priceLabel}>Target</Text>
                                 <Text style={[styles.priceValue, { color: '#10B981' }]}>${strategy.take_profit.toLocaleString()}</Text>
                             </View>
                         </View>
                     </View>
                </View>
            ) : (
                <View style={styles.createStrategyCard}>
                    <View style={styles.createContent}>
                        <Text style={styles.createTitle}>No Active Strategy</Text>
                        <Text style={styles.createSubtitle}>Automate your trading with AI-powered strategies.</Text>
                        <Link href="/strategies" asChild>
                            <TouchableOpacity style={styles.createBtn}>
                                <Text style={styles.createBtnText}>+ Create Strategy</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                     {/* @ts-ignore */}
                    <IconSymbol name="chart.xyaxis.line" size={100} color="rgba(255,255,255,0.1)" style={styles.bgIcon} />
                </View>
            )}
        </View>

        {/* Watchlist Section */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Watchlist</Text>
            <Link href="/market" asChild>
                <TouchableOpacity>
                    <Text style={styles.sectionLink}>View Market</Text>
                </TouchableOpacity>
            </Link>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.watchlistRow}>
            {/* Bitcoin Card */}
            <View style={styles.watchCard}>
                <View style={styles.watchTop}>
                     {/* @ts-ignore */}
                    <IconSymbol name="bitcoinsign.circle.fill" size={40} color="#F59E0B" />
                    <View style={[styles.percentBadge, { backgroundColor: marketData.bitcoin.change >= 0 ? '#ECFDF5' : '#FEF2F2' }]}>
                        <Text style={[styles.percentText, { color: marketData.bitcoin.change >= 0 ? '#10B981' : '#EF4444' }]}>
                            {marketData.bitcoin.change > 0 ? '+' : ''}{marketData.bitcoin.change.toFixed(2)}%
                        </Text>
                    </View>
                </View>
                <View style={styles.watchBottom}>
                    <Text style={styles.watchSymbol}>BTC</Text>
                    <Text style={styles.watchPrice}>${marketData.bitcoin.price.toLocaleString()}</Text>
                </View>
            </View>

            {/* Ethereum Card */}
            <View style={styles.watchCard}>
                <View style={styles.watchTop}>
                     {/* @ts-ignore */}
                    <IconSymbol name="diamond.fill" size={40} color="#6366F1" />
                     <View style={[styles.percentBadge, { backgroundColor: marketData.ethereum.change >= 0 ? '#ECFDF5' : '#FEF2F2' }]}>
                        <Text style={[styles.percentText, { color: marketData.ethereum.change >= 0 ? '#10B981' : '#EF4444' }]}>
                             {marketData.ethereum.change > 0 ? '+' : ''}{marketData.ethereum.change.toFixed(2)}%
                        </Text>
                    </View>
                </View>
                <View style={styles.watchBottom}>
                    <Text style={styles.watchSymbol}>ETH</Text>
                    <Text style={styles.watchPrice}>${marketData.ethereum.price.toLocaleString()}</Text>
                </View>
            </View>

             {/* Solana Card (Mock) */}
             <View style={styles.watchCard}>
                <View style={styles.watchTop}>
                     {/* @ts-ignore */}
                    <IconSymbol name="bolt.fill" size={40} color="#14F195" />
                     <View style={[styles.percentBadge, { backgroundColor: '#ECFDF5' }]}>
                        <Text style={[styles.percentText, { color: '#10B981' }]}>+5.21%</Text>
                    </View>
                </View>
                <View style={styles.watchBottom}>
                    <Text style={styles.watchSymbol}>SOL</Text>
                    <Text style={styles.watchPrice}>$143.50</Text>
                </View>
            </View>
        </ScrollView>

        {/* Quick Tools */}
        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 16 }]}>Tools</Text>
        <View style={styles.toolsGrid}>
            <TouchableOpacity style={styles.toolCard}>
                <View style={[styles.toolIcon, { backgroundColor: '#EFF6FF' }]}>
                     {/* @ts-ignore */}
                    <IconSymbol name="chart.bar.fill" size={24} color="#3B82F6" />
                </View>
                <Text style={styles.toolLabel}>Analysis</Text>
            </TouchableOpacity>

             <TouchableOpacity style={styles.toolCard}>
                <View style={[styles.toolIcon, { backgroundColor: '#FDF4FF' }]}>
                     {/* @ts-ignore */}
                    <IconSymbol name="sparkles" size={24} color="#C026D3" />
                </View>
                <Text style={styles.toolLabel}>AI Insights</Text>
            </TouchableOpacity>

             <TouchableOpacity style={styles.toolCard}>
                <View style={[styles.toolIcon, { backgroundColor: '#FFF7ED' }]}>
                     {/* @ts-ignore */}
                    <IconSymbol name="bell.fill" size={24} color="#EA580C" />
                </View>
                <Text style={styles.toolLabel}>Alerts</Text>
            </TouchableOpacity>

             <Link href="/strategies" asChild>
                <TouchableOpacity style={styles.toolCard}>
                    <View style={[styles.toolIcon, { backgroundColor: '#F0FDFA' }]}>
                         {/* @ts-ignore */}
                        <IconSymbol name="plus" size={24} color="#0D9488" />
                    </View>
                    <Text style={styles.toolLabel}>New Bot</Text>
                </TouchableOpacity>
            </Link>
        </View>

        <View style={{height: 100}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBackground: {
    backgroundColor: '#064E3B', // Dark Green
    paddingTop: 60, // For status bar
    paddingBottom: 80, // Space for floating card
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#A7F3D0',
    fontWeight: '500',
  },
  username: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F87171',
    borderWidth: 1,
    borderColor: '#064E3B',
  },
  marketSummary: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#A7F3D0',
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scrollContent: {
    paddingHorizontal: 24,
    marginTop: -60, // Pull up over header
    paddingBottom: 100, // Account for floating tab bar
  },
  floatingSection: {
    marginBottom: 32,
  },
  createStrategyCard: {
    backgroundColor: '#10B981', // Accent Green
    borderRadius: 24,
    padding: 24,
    minHeight: 160,
    justifyContent: 'center',
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  createContent: {
    zIndex: 1,
  },
  createTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  createSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
    maxWidth: '80%',
  },
  createBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignSelf: 'flex-start',
  },
  createBtnText: {
    color: '#047857',
    fontWeight: '700',
    fontSize: 14,
  },
  bgIcon: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    transform: [{ rotate: '-10deg' }],
  },
  
  // Active Strategy Card Styled
  strategyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  strategyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 16,
  },
  strategyBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  strategyBadgeText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  seeAll: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
  },
  strategyMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coinVisual: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  coinIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  coinSymbol: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  strategyPrices: {
    flexDirection: 'column',
    gap: 8,
  },
  priceLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionLink: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Watchlist
  watchlistRow: {
    paddingRight: 24,
    gap: 16,
    paddingBottom: 24, // room for shadow
  },
  watchCard: {
    backgroundColor: '#FFF',
    width: 150,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  watchTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  percentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    height: 24,
    justifyContent: 'center',
  },
  percentText: {
    fontSize: 10,
    fontWeight: '700',
  },
  watchBottom: {
  },
  watchSymbol: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  watchPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Tools
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  toolCard: {
    width: (width - 48 - 12) / 2, // 2 columns
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toolIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
});
