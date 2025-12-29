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

export function StatusCard({ title, value, subValue, icon, color = '#047857', style }: StatusCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
         {/* @ts-ignore - Dynamic icon name */}
        <IconSymbol name={icon} size={24} color={color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
        {subValue && <Text style={[styles.subValue, { color: subValue.startsWith('+') ? '#059669' : '#DC2626' }]}>{subValue}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  subValue: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
});
