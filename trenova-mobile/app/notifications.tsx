
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NotificationsScreen() {
    const router = useRouter();

    const notifications = [
        { id: 1, title: 'Price Alert', message: 'Bitcoin is up 5% today!', time: '2h ago', read: false },
        { id: 2, title: 'Strategy Update', message: 'Your BTC strategy has reached TP1.', time: '5h ago', read: true },
        { id: 3, title: 'System', message: 'Maintenance scheduled for tonight.', time: '1d ago', read: true },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    {/* @ts-ignore */}
                    <IconSymbol name="chevron.left" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {notifications.map((notif) => (
                    <View key={notif.id} style={[styles.notifCard, !notif.read && styles.unreadCard]}>
                        <View style={styles.iconContainer}>
                             {/* @ts-ignore */}
                            <IconSymbol name="bell.fill" size={20} color={notif.read ? '#9CA3AF' : '#047857'} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.title, !notif.read && styles.unreadTitle]}>{notif.title}</Text>
                            <Text style={styles.message}>{notif.message}</Text>
                            <Text style={styles.time}>{notif.time}</Text>
                        </View>
                        {!notif.read && <View style={styles.dot} />}
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    backBtn: {
        padding: 8,
    },
    content: {
        padding: 20,
    },
    notifCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    unreadCard: {
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0',
    },
    iconContainer: {
        marginRight: 16,
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    unreadTitle: {
        color: '#065F46',
        fontWeight: '700',
    },
    message: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4,
    },
    time: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
        alignSelf: 'center',
        marginLeft: 8,
    },
});
