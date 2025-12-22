import { StatusCard } from '@/components/StatusCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Link } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const [strategy, setStrategy] = React.useState<any>(null);
  const [marketData, setMarketData] = React.useState({
    bitcoin: { price: 90321, change: 1.82 },
    ethereum: { price: 4820, change: -0.63 }
  });

  React.useEffect(() => {
    fetchActiveStrategy();
    fetchMarketData();

    const intervalId = setInterval(() => {
      console.log('Auto-refreshing data...');
      fetchActiveStrategy();
      fetchMarketData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, []);

  const fetchActiveStrategy = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('user_strategies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }) // Get latest
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
      console.log('Error fetching market data, using cached/fallback:', e);
      // Optional: Update with small random noise to simulate 'live' if api fails (demo purpose) or just keep static
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
            <View>
                <Text style={styles.headerTitle}>Crypto AI</Text>
                <Text style={styles.headerSubtitle}>Market Overview</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
                 {/* @ts-ignore - Dynamic icon name */}
                <IconSymbol name="person.crop.circle" size={32} color="#888" />
            </TouchableOpacity>
        </View>

        {/* Active Strategy Card (New) */}
        {strategy ? (
             <View style={styles.section}>
                <Text style={styles.sectionTitle}>Latest Active Strategy ({strategy.symbol.toUpperCase()})</Text>
                <View style={styles.strategyRow}>
                    <StatusCard 
                        title="Buy" 
                        value={`$${strategy.buy_price.toLocaleString()}`} 
                        icon="arrow.down.circle.fill" 
                        color="#4CAF50" 
                        style={{ flex: 1 }}
                    />
                    <StatusCard 
                        title="Take Profit" 
                        value={`$${strategy.take_profit.toLocaleString()}`} 
                        icon="flag.fill" 
                        color="#2196F3" 
                        style={{ flex: 1 }}
                    />
                     <StatusCard 
                        title="Stop Loss" 
                        value={`$${strategy.stop_loss.toLocaleString()}`} 
                        icon="hand.raised.fill" 
                        color="#F44336" 
                        style={{ flex: 1 }}
                    />
                </View>
             </View>
        ) : (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Strategy</Text>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No active strategies found.</Text>
                    <Link href="/strategies" asChild>
                        <TouchableOpacity>
                            <Text style={styles.linkText}>Create One &rarr;</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        )}

        {/* Market Stats Grid */}
        <View style={styles.grid}>
            <StatusCard 
                title="Bitcoin (BTC)" 
                value={`$${marketData.bitcoin.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
                subValue={`${marketData.bitcoin.change >= 0 ? '+' : ''}${marketData.bitcoin.change.toFixed(2)}%`}
                icon="bitcoinsign.circle.fill" 
                color="#F7931A" 
                style={styles.gridItem}
            />
            <StatusCard 
                title="Ethereum (ETH)" 
                value={`$${marketData.ethereum.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
                subValue={`${marketData.ethereum.change >= 0 ? '+' : ''}${marketData.ethereum.change.toFixed(2)}%`}
                icon="diamond.fill" 
                color="#627EEA" 
                style={styles.gridItem}
            />
        </View>

        {/* AI Insight Teaser */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest AI Insight</Text>
            <View style={styles.insightCard}>
                <View style={[styles.badge, styles.badgeWait]}>
                    <Text style={styles.badgeText}>WAIT</Text>
                </View>
                <Text style={styles.insightText}>
                    "BTC maintains support above $90k. AI suggests waiting for a retest of $88k before a new entry."
                </Text>
                <View style={styles.insightFooter}>
                    <Text style={styles.insightDate}>Today, 10:42 AM</Text>
                    <Link href="/strategies" asChild>
                        <TouchableOpacity>
                            <Text style={styles.linkText}>View Strategy &rarr;</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionRow}>
                <Link href="/strategies" asChild>
                    <TouchableOpacity style={styles.actionButton}>
                        {/* @ts-ignore */}
                        <IconSymbol name="plus.circle.fill" size={24} color="#FFF" />
                        <Text style={styles.actionButtonText}>New Strategy</Text>
                    </TouchableOpacity>
                </Link>
                <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]}>
                    {/* @ts-ignore */}
                    <IconSymbol name="chart.bar.fill" size={24} color="#FFF" />
                    <Text style={styles.actionButtonText}>Market Scan</Text>
                </TouchableOpacity>
            </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
  },
  profileButton: {
    padding: 4,
  },
  grid: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 24,
  },
  gridItem: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  sightCard: { // Typo fix
  },
  insightCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB300', // Wait color
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeWait: {
    backgroundColor: 'rgba(255, 179, 0, 0.2)',
  },
  badgeText: {
    color: '#FFB300',
    fontSize: 12,
    fontWeight: 'bold',
  },
  insightText: {
    fontSize: 15,
    color: '#DDD',
    lineHeight: 22,
    marginBottom: 12,
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightDate: {
    fontSize: 12,
    color: '#666',
  },
  linkText: {
    color: '#0A84FF',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#0A84FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'column',
    gap: 8,
  },
  secondaryAction: {
    backgroundColor: '#333',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  strategyRow: {
    flexDirection: 'column',
    gap: 8,
  },
  emptyState: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  emptyStateText: {
    color: '#888',
  },
});
