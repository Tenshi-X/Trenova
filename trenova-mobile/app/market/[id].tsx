
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function MarketDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [coin, setCoin] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchCoinDetails();
    }, [id]);

    const fetchCoinDetails = async () => {
        try {
            const response = await fetch(
                `https://api.coingecko.com/api/v3/coins/${id}?localization=false&sparkline=true`
            );
            const data = await response.json();
            setCoin(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#047857" />
            </View>
        );
    }

    if (!coin) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Error loading coin data.</Text>
            </View>
        );
    }

    const priceChangeColor = coin.market_data.price_change_percentage_24h >= 0 ? '#10B981' : '#EF4444';
    const isPositive = coin.market_data.price_change_percentage_24h >= 0;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Header Background */}
            <View style={styles.headerBackground}>
                <View style={styles.navBar}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        {/* @ts-ignore */}
                        <IconSymbol name="chevron.left" size={24} color="#FFF" /> 
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{coin.symbol.toUpperCase()}</Text>
                    <TouchableOpacity style={styles.backBtn}>
                         {/* @ts-ignore */}
                        <IconSymbol name="star" size={24} color="#FFF" /> 
                    </TouchableOpacity>
                </View>

                {/* Main Price Display */}
                <View style={styles.priceContainer}>
                    <Image source={{ uri: coin.image.large }} style={styles.coinIcon} />
                    <Text style={styles.priceValue}>${coin.market_data.current_price.usd.toLocaleString()}</Text>
                    <View style={styles.changeBadge}>
                         {/* @ts-ignore */}
                        <IconSymbol name={isPositive ? "arrow.up.right" : "arrow.down.left"} size={16} color={isPositive ? '#A7F3D0' : '#FECACA'} />
                        <Text style={[styles.changeText, { color: isPositive ? '#A7F3D0' : '#FECACA' }]}>
                             {coin.market_data.price_change_percentage_24h.toFixed(2)}%
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Stats Grid */}
                <View style={styles.statsContainer}>
                    <View style={styles.statRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Market Cap</Text>
                            <Text style={styles.statValue}>${(coin.market_data.market_cap.usd / 1e9).toFixed(2)}B</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Volume (24h)</Text>
                            <Text style={styles.statValue}>${(coin.market_data.total_volume.usd / 1e9).toFixed(2)}B</Text>
                        </View>
                    </View>
                    <View style={styles.horizontalDivider} />
                    <View style={styles.statRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Circulating Supply</Text>
                            <Text style={styles.statValue}>{(coin.market_data.circulating_supply / 1e6).toFixed(1)}M</Text>
                        </View>
                         <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>All Time High</Text>
                            <Text style={styles.statValue}>${coin.market_data.ath.usd.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* About Section */}
                <Text style={styles.sectionTitle}>About {coin.name}</Text>
                <Text style={styles.description} numberOfLines={6}>
                    {coin.description.en.replace(/<[^>]*>?/gm, '')}
                </Text>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                   <TouchableOpacity style={[styles.actionBtn, styles.sellBtn]}>
                       <Text style={styles.sellBtnText}>Sell</Text>
                   </TouchableOpacity>
                   <TouchableOpacity style={[styles.actionBtn, styles.buyBtn]}>
                       <Text style={styles.buyBtnText}>Buy {coin.symbol.toUpperCase()}</Text>
                   </TouchableOpacity>
                </View>

                <View style={{height: 40}} />

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    headerBackground: {
        backgroundColor: '#0F172A', // Dark Blue/Slate
        paddingTop: 50,
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 24,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    backBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    priceContainer: {
        alignItems: 'center',
    },
    coinIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginBottom: 16,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    priceValue: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 8,
    },
    changeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    changeText: {
        fontSize: 14,
        fontWeight: '700',
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    statsContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#94A3B8',
        marginBottom: 6,
        fontWeight: '500',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#F1F5F9',
        height: '100%',
    },
    horizontalDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        width: '100%',
        marginVertical: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 24,
        marginBottom: 32,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    buyBtn: {
        backgroundColor: '#0F172A', // Dark Theme
    },
    sellBtn: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    buyBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    sellBtnText: {
        color: '#EF4444', // Red text
        fontSize: 16,
        fontWeight: '700',
    },
});
