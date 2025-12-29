
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import { supabase } from '../lib/supabase';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

// Extended list of coins for demonstration of scalability
const COINS_DB = [
    { id: ' bitcoin', label: 'Bitcoin', symbol: 'BTC', icon: 'bitcoinsign.circle.fill', color: '#F7931A' },
    { id: 'ethereum', label: 'Ethereum', symbol: 'ETH', icon: 'diamond.fill', color: '#627EEA' },
    { id: 'solana', label: 'Solana', symbol: 'SOL', icon: 'bolt.fill', color: '#14F195' },
    { id: 'cardano', label: 'Cardano', symbol: 'ADA', icon: 'circle.grid.cross.fill', color: '#0033AD' },
    { id: 'ripple', label: 'XRP', symbol: 'XRP', icon: 'location.circle.fill', color: '#23292F' },
];

export default function StrategiesScreen() {
    // AI State
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Strategy State
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCoin, setExpandedCoin] = useState<string | null>(null);
    const [userStrategies, setUserStrategies] = useState<Record<string, any>>({});
    const [loadingStrategies, setLoadingStrategies] = useState(false);

    // Form State (temp storage before save)
    const [formData, setFormData] = useState({ buy: '', tp: '', sl: '' });
    const [saving, setSaving] = useState(false);

    // --- AI AUTO-FETCH LOGIC ---
    useEffect(() => {
        fetchAIAnalysis(); // Initial fetch
        const interval = setInterval(fetchAIAnalysis, 5 * 60 * 1000); // Every 5 mins
        return () => clearInterval(interval);
    }, []);

    const fetchAIAnalysis = async () => {
        try {
            setAiLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(
                'https://qhbebrgrtvjwoqobafot.supabase.co/functions/v1/crypto_alert_ai',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) throw new Error('AI Service Unavailable');
            
            const contentType = response.headers.get('content-type');
            let result;
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                result = { message: await response.text() };
            }

            setAiAnalysis(result);
            setLastUpdated(new Date());
        } catch (error) {
            console.log('AI Fetch Error:', error);
        } finally {
            setAiLoading(false);
        }
    };

    // --- STRATEGY MANAGEMENT LOGIC ---
    useEffect(() => {
        fetchUserStrategies();
    }, []);

    const fetchUserStrategies = async () => {
        setLoadingStrategies(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('user_strategies')
            .select('*')
            .eq('user_id', user.id);

        if (data) {
            const strategyMap: Record<string, any> = {};
            data.forEach((s: any) => {
                strategyMap[s.symbol.toLowerCase()] = s; // Key by symbol lowercase: 'bitcoin', 'btc' - adjusting to match coin ID logic
                // Actually supabase stores 'symbol'. let's assume we store coin ID 'bitcoin' or symbol 'bitcoin'
                // For simplicity, let's map COINS_DB 'id' to stored 'symbol' in DB
            });
            setUserStrategies(strategyMap);
        }
        setLoadingStrategies(false);
    };

    const handleExpand = (coinId: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (expandedCoin === coinId) {
            setExpandedCoin(null);
        } else {
            setExpandedCoin(coinId);
            // Pre-fill form if strategy exists
            const existing = userStrategies[coinId]; // Assuming DB stores coinId
            if (existing) {
                setFormData({
                    buy: existing.buy_price.toString(),
                    tp: existing.take_profit.toString(),
                    sl: existing.stop_loss.toString(),
                });
            } else {
                setFormData({ buy: '', tp: '', sl: '' });
            }
        }
    };

    const handleSave = async (coinId: string) => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user');

            const payload = {
                user_id: user.id,
                symbol: coinId, // Storing coin ID as symbol
                buy_price: parseFloat(formData.buy),
                take_profit: parseFloat(formData.tp),
                stop_loss: parseFloat(formData.sl),
                is_active: true,
                updated_at: new Date(),
            };

            // Upsert mechanism manually
            const existing = userStrategies[coinId];
            let error;
            
            if (existing) {
                const { error: updateErr } = await supabase
                    .from('user_strategies')
                    .update(payload)
                    .eq('id', existing.id);
                error = updateErr;
            } else {
                const { error: insertErr } = await supabase
                    .from('user_strategies')
                    .insert(payload);
                error = insertErr;
            }

            if (error) throw error;
            
            Alert.alert('Success', 'Strategy configuration saved.');
            fetchUserStrategies(); // Refresh
            setExpandedCoin(null); // Close
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (coinId: string) => {
         const existing = userStrategies[coinId];
         if (!existing) return;

         const { error } = await supabase.from('user_strategies').delete().eq('id', existing.id);
         if (!error) {
             fetchUserStrategies();
         }
    };

    const filteredCoins = COINS_DB.filter(c => 
        c.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={{flex: 1}}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    <Text style={styles.headerTitle}>Strategy Inspector</Text>
                    <Text style={styles.headerSubtitle}>Manage your bots & view AI insights</Text>

                    {/* 1. AI Intelligence Section (Auto-updating) */}
                    <View style={styles.aiCard}>
                        <View style={styles.aiHeader}>
                            <View style={styles.aiLabelRow}>
                                {/* @ts-ignore */}
                                <IconSymbol name="sparkles" size={20} color="#7C3AED" />
                                <Text style={styles.aiTitle}>AI Market Pulse</Text>
                            </View>
                            {aiLoading && <ActivityIndicator size="small" color="#7C3AED" />}
                        </View>
                        
                        {aiAnalysis ? (
                            <View>
                                <Text style={styles.aiText}>
                                    {typeof aiAnalysis.message === 'string' 
                                        ? aiAnalysis.message 
                                        : JSON.stringify(aiAnalysis, null, 2)}
                                </Text>
                                <Text style={styles.lastUpdated}>
                                    Updated: {lastUpdated?.toLocaleTimeString()}
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.aiPlaceholder}>Gathering market intelligence...</Text>
                        )}
                        <View style={styles.pulseBar} />
                    </View>

                    {/* 2. Strategy List Section */}
                    <View style={styles.listSection}>
                        <Text style={styles.sectionTitle}>Configurations</Text>
                        
                        {/* Search Bar */}
                        <View style={styles.searchBar}>
                             {/* @ts-ignore */}
                            <IconSymbol name="magnifyingglass" size={18} color="#94A3B8" />
                            <TextInput 
                                style={styles.searchInput}
                                placeholder="Search coin..."
                                placeholderTextColor="#94A3B8"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        {/* List */}
                        <View style={{ gap: 12 }}>
                            {filteredCoins.map((coin) => {
                                const strategy = userStrategies[coin.id];
                                const isActive = !!strategy;
                                const isExpanded = expandedCoin === coin.id;

                                return (
                                    <View key={coin.id} style={[styles.coinCard, isExpanded && styles.coinCardExpanded]}>
                                        {/* Header / Summary Row */}
                                        <TouchableOpacity 
                                            activeOpacity={0.7}
                                            style={styles.coinHeader} 
                                            onPress={() => handleExpand(coin.id)}
                                        >
                                            <View style={styles.coinLeft}>
                                                {/* @ts-ignore */}
                                                <IconSymbol name={coin.icon} size={32} color={coin.color} />
                                                <View>
                                                    <Text style={styles.coinName}>{coin.label} <Text style={{color:'#94A3B8'}}>({coin.symbol})</Text></Text>
                                                    <Text style={styles.coinPrice}>
                                                        {isActive 
                                                            ? `Target: $${strategy.take_profit.toLocaleString()}` 
                                                            : 'No active strategy'}
                                                    </Text>
                                                </View>
                                            </View>
                                            
                                            <View style={styles.coinRight}>
                                                 <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusInactive]}>
                                                     <Text style={[styles.statusText, isActive ? {color:'#059669'} : {color:'#64748B'}]}>
                                                         {isActive ? 'Active' : 'Idle'}
                                                     </Text>
                                                 </View>
                                                 {/* @ts-ignore */}
                                                 <IconSymbol 
                                                    name={isExpanded ? "chevron.up" : "chevron.down"} 
                                                    size={16} 
                                                    color="#94A3B8" 
                                                 />
                                            </View>
                                        </TouchableOpacity>

                                        {/* Expanded Form Body */}
                                        {isExpanded && (
                                            <View style={styles.formBody}>
                                                <View style={styles.inputRow}>
                                                    <View style={styles.inputGroup}>
                                                        <Text style={styles.label}>Buy Price</Text>
                                                        <TextInput 
                                                            style={styles.input}
                                                            placeholder="0.00"
                                                            keyboardType="numeric"
                                                            value={formData.buy}
                                                            onChangeText={(t) => setFormData({...formData, buy: t})} 
                                                        />
                                                    </View>
                                                    <View style={styles.inputGroup}>
                                                        <Text style={styles.label}>Take Profit</Text>
                                                        <TextInput 
                                                            style={[styles.input, {color: '#059669'}]}
                                                            placeholder="0.00"
                                                            keyboardType="numeric"
                                                            value={formData.tp}
                                                            onChangeText={(t) => setFormData({...formData, tp: t})} 
                                                        />
                                                    </View>
                                                    <View style={styles.inputGroup}>
                                                        <Text style={styles.label}>Stop Loss</Text>
                                                        <TextInput 
                                                            style={[styles.input, {color: '#DC2626'}]}
                                                            placeholder="0.00"
                                                            keyboardType="numeric"
                                                            value={formData.sl}
                                                            onChangeText={(t) => setFormData({...formData, sl: t})} 
                                                        />
                                                    </View>
                                                </View>

                                                <View style={styles.actionRow}>
                                                    {isActive && (
                                                        <TouchableOpacity 
                                                            style={styles.deleteBtn}
                                                            onPress={() => handleDelete(coin.id)}
                                                        >
                                                            <Text style={styles.deleteText}>Delete</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                    <TouchableOpacity 
                                                        style={styles.saveBtn}
                                                        onPress={() => handleSave(coin.id)}
                                                        disabled={saving}
                                                    >
                                                        {saving ? (
                                                            <ActivityIndicator color="#FFF" size="small" /> 
                                                        ) : (
                                                            <Text style={styles.saveText}>
                                                                {isActive ? 'Update Strategy' : 'Activate Strategy'}
                                                            </Text>
                                                        )}
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                    
                    <View style={{height: 100}} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 100,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 24,
    },
    
    // AI Card
    aiCard: {
        backgroundColor: '#F5F3FF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#E9D5FF',
        overflow: 'hidden',
    },
    aiHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    aiLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    aiTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#7C3AED',
    },
    aiText: {
        fontSize: 14,
        color: '#4C1D95',
        lineHeight: 22,
        marginBottom: 8,
    },
    aiPlaceholder: {
        fontSize: 14,
        color: '#8B5CF6',
        fontStyle: 'italic',
    },
    lastUpdated: {
        fontSize: 10,
        color: '#8B5CF6',
        textAlign: 'right',
        marginTop: 4,
    },
    pulseBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: '#7C3AED',
        opacity: 0.1,
    },

    // List Section
    listSection: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#0F172A',
    },

    // Coin Card (Accordion)
    coinCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    coinCardExpanded: {
        borderColor: '#CBD5E1',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    coinHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    coinLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    coinName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    coinPrice: {
        fontSize: 12,
        color: '#64748B',
    },
    coinRight: {
        alignItems: 'flex-end',
        gap: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusActive: {
        backgroundColor: '#ECFDF5',
    },
    statusInactive: {
        backgroundColor: '#F1F5F9',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },

    // Expanded Form
    formBody: {
        padding: 16,
        paddingTop: 0,
        backgroundColor: '#FAFAFA',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    inputRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
    },
    inputGroup: {
        flex: 1,
    },
    label: {
        fontSize: 11,
        color: '#64748B',
        marginBottom: 6,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 20,
        justifyContent: 'flex-end',
        gap: 12,
    },
    saveBtn: {
        backgroundColor: '#047857',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    saveText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
    deleteBtn: {
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    deleteText: {
        color: '#EF4444',
        fontWeight: '600',
        fontSize: 14,
    },
});
