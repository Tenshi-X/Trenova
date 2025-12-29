
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function MarketScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [coins, setCoins] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', 'Favorites', 'Gainers', 'DeFi', 'Metaverse'];

    useEffect(() => {
        fetchMarketData();
    }, []);

    const fetchMarketData = async () => {
        try {
            const response = await fetch(
                'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false'
            );
            const data = await response.json();
            setCoins(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCoins = coins.filter(coin => 
        coin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item, index }: { item: any, index: number }) => (
        <Link href={`/market/${item.id}`} asChild>
            <TouchableOpacity style={styles.coinCard}>
                <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                </View>

                <View style={styles.coinLeft}>
                    <Image source={{ uri: item.image }} style={styles.coinIcon} />
                    <View>
                        <Text style={styles.coinSymbol}>{item.symbol.toUpperCase()}</Text>
                        <Text style={styles.coinName} numberOfLines={1}>{item.name}</Text>
                    </View>
                </View>

                <View style={styles.coinRight}>
                    <Text style={styles.coinPrice}>${item.current_price.toLocaleString()}</Text>
                    <View style={[
                        styles.changeBadge, 
                        { backgroundColor: (item.price_change_percentage_24h || 0) >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
                    ]}>
                        <Text style={[
                            styles.changeText, 
                            { color: (item.price_change_percentage_24h || 0) >= 0 ? '#10B981' : '#EF4444' }
                        ]}>
                            {(item.price_change_percentage_24h || 0) > 0 ? '+' : ''}
                            {(item.price_change_percentage_24h || 0).toFixed(2)}%
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Link>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={{ flex: 1 }}>
                
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Market</Text>
                    <Text style={styles.headerSubtitle}>Discover trending assets</Text>
                </View>

                {/* Search */}
                <View style={styles.searchWrapper}>
                    <View style={styles.searchContainer}>
                        {/* @ts-ignore */}
                        <IconSymbol name="magnifyingglass" size={20} color="#94A3B8" />
                        <TextInput 
                            style={styles.searchInput}
                            placeholder="Search coins, tokens..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#94A3B8"
                        />
                    </View>
                </View>

                {/* Categories */}
                <View style={styles.categoryWrapper}>
                     <FlatList 
                        horizontal
                        data={categories}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryList}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={[styles.categoryChip, activeCategory === item && styles.categoryChipActive]}
                                onPress={() => setActiveCategory(item)}
                            >
                                <Text style={[styles.categoryText, activeCategory === item && styles.categoryTextActive]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                     />
                </View>
                
                {/* Header Row for List */}
                <View style={styles.tableHeader}>
                    <Text style={styles.tableLabel}>Asset</Text>
                    <Text style={styles.tableLabel}>Price / 24h</Text>
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#047857" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredCoins}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        initialNumToRender={10}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#64748B',
    },
    searchWrapper: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#0F172A',
        marginLeft: 12,
        fontWeight: '500',
    },
    categoryWrapper: {
        marginBottom: 16,
    },
    categoryList: {
        paddingHorizontal: 24,
        gap: 12,
    },
    categoryChip: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 30,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    categoryChipActive: {
        backgroundColor: '#0F172A', // Dark Active
        borderColor: '#0F172A',
    },
    categoryText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
    },
    categoryTextActive: {
        color: '#FFFFFF',
    },
    tableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginBottom: 12,
    },
    tableLabel: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 100, // Account for floating tab bar
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    // Coin Card
    coinCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        marginBottom: 12,
        borderRadius: 20,
        // Soft Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    rankBadge: {
        width: 24,
        alignItems: 'center',
        marginRight: 8,
    },
    rankText: {
        fontSize: 12,
        color: '#CBD5E1',
        fontWeight: '700',
    },
    coinLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    coinIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 16,
        backgroundColor: '#F1F5F9', // Fallback
    },
    coinSymbol: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    coinName: {
        fontSize: 13,
        color: '#64748B',
    },
    coinRight: {
        alignItems: 'flex-end',
    },
    coinPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 6,
    },
    changeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    changeText: {
        fontSize: 12,
        fontWeight: '700',
    },
});
