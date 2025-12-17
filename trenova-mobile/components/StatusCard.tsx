import { IconSymbol } from '@/components/ui/icon-symbol';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface StatusCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: string;
  color?: string;
  style?: ViewStyle;
}

export function StatusCard({ title, value, subValue, icon, color = '#4A90E2', style }: StatusCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
         {/* @ts-ignore - Dynamic icon name */}
        <IconSymbol name={icon} size={24} color={color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
        {subValue && <Text style={[styles.subValue, { color: subValue.startsWith('+') ? '#4CAF50' : '#F44336' }]}>{subValue}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subValue: {
    fontSize: 12,
    marginTop: 2,
  },
});
