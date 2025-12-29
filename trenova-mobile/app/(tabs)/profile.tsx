
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        getUser();
    }, []);

    const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            Alert.alert('Error', error.message);
        } else {
            router.replace('/login');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={{ flex: 1 }}>
                
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* Header Title */}
                    <Text style={styles.screenTitle}>Profile</Text>

                    {/* Profile Header */}
                    <View style={styles.profileHeader}>
                        <View style={styles.avatarRing}>
                            <View style={styles.avatarContainer}>
                                 {/* @ts-ignore */}
                                <IconSymbol name="person.crop.circle" size={80} color="#CBD5E1" />
                            </View>
                            <TouchableOpacity style={styles.editBadge}>
                                 {/* @ts-ignore */}
                                <IconSymbol name="pencil" size={12} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        
                        <Text style={styles.userName}>{user?.email?.split('@')[0] || 'Trader'}</Text>
                        <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
                        
                        <View style={styles.proTag}>
                            {/* @ts-ignore */}
                            <IconSymbol name="crown.fill" size={14} color="#F59E0B" />
                            <Text style={styles.proText}>PRO MEMBER</Text>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>12</Text>
                            <Text style={styles.statLabel}>Strategies</Text>
                        </View>
                        <View style={styles.verticalline} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>89%</Text>
                            <Text style={styles.statLabel}>Win Rate</Text>
                        </View>
                        <View style={styles.verticalline} />
                         <View style={styles.statItem}>
                            <Text style={styles.statValue}>$4.2k</Text>
                            <Text style={styles.statLabel}>Profit</Text>
                        </View>
                    </View>

                    {/* Settings Menu */}
                    <View style={styles.menuContainer}>
                        <Link href="/strategies" asChild>
                            <TouchableOpacity style={styles.menuItem}>
                                <View style={[styles.menuIconBox, { backgroundColor: '#ECFDF5' }]}>
                                     {/* @ts-ignore */}
                                    <IconSymbol name="chart.xyaxis.line" size={20} color="#059669" />
                                </View>
                                <Text style={styles.menuText}>Active Strategies</Text>
                                 {/* @ts-ignore */}
                                <IconSymbol name="chevron.right" size={20} color="#CBD5E1" />
                            </TouchableOpacity>
                        </Link>
                         
                         {/* Setting Mockups */}
                        <TouchableOpacity style={styles.menuItem}>
                            <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
                                 {/* @ts-ignore */}
                                <IconSymbol name="gearshape.fill" size={20} color="#3B82F6" />
                            </View>
                            <Text style={styles.menuText}>Account Settings</Text>
                             {/* @ts-ignore */}
                            <IconSymbol name="chevron.right" size={20} color="#CBD5E1" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem}>
                            <View style={[styles.menuIconBox, { backgroundColor: '#FFF7ED' }]}>
                                 {/* @ts-ignore */}
                                <IconSymbol name="bell.fill" size={20} color="#EA580C" />
                            </View>
                            <Text style={styles.menuText}>Notifications</Text>
                             {/* @ts-ignore */}
                            <IconSymbol name="chevron.right" size={20} color="#CBD5E1" />
                        </TouchableOpacity>

                         <TouchableOpacity style={styles.menuItem}>
                            <View style={[styles.menuIconBox, { backgroundColor: '#F5F3FF' }]}>
                                 {/* @ts-ignore */}
                                <IconSymbol name="lock.fill" size={20} color="#7C3AED" />
                            </View>
                            <Text style={styles.menuText}>Privacy & Security</Text>
                             {/* @ts-ignore */}
                            <IconSymbol name="chevron.right" size={20} color="#CBD5E1" />
                        </TouchableOpacity>
                    </View>

                    {/* Logout */}
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>

                    <Text style={styles.versionText}>Version 1.0.0</Text>

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
        paddingBottom: 100, // Account for floating tab bar
    },
    screenTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 32,
        marginTop: 16,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarRing: {
        padding: 4,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        position: 'relative',
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F1F5F9', // Fallback color
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#F8FAFC',
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 16,
    },
    proTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    proText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#D97706',
        letterSpacing: 0.5,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 32,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
    },
    verticalline: {
        width: 1,
        height: '80%',
        backgroundColor: '#F1F5F9',
        alignSelf: 'center',
    },
    menuContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 8,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    menuIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuText: {
        flex: 1,
        marginLeft: 16,
        fontSize: 16,
        color: '#334155',
        fontWeight: '500',
    },
    logoutBtn: {
        backgroundColor: '#FEF2F2',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 24,
    },
    logoutText: {
        color: '#EF4444',
        fontWeight: '700',
        fontSize: 16,
    },
    versionText: {
        textAlign: 'center',
        color: '#CBD5E1',
        fontSize: 12,
        marginBottom: 20,
    },
});
