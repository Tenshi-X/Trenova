import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

const COINS = [
  { label: 'Bitcoin', symbol: 'BTC', value: 'bitcoin', icon: 'bitcoinsign.circle.fill', color: '#F7931A' },
  { label: 'Ethereum', symbol: 'ETH', value: 'ethereum', icon: 'diamond.fill', color: '#627EEA' },
  { label: 'Solana', symbol: 'SOL', value: 'solana', icon: 'circle.grid.cross.fill', color: '#14F195' },
];

export default function StrategiesScreen() {
  const [selectedCoin, setSelectedCoin] = useState(COINS[0]);
  const [existingStrategy, setExistingStrategy] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [buyPrice, setBuyPrice] = useState('88000');
  const [takeProfit, setTakeProfit] = useState('100000');
  const [stopLoss, setStopLoss] = useState('84000');
  
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Fetch existing strategy when coin changes
  React.useEffect(() => {
    fetchStrategy(selectedCoin.value);
  }, [selectedCoin]);

  const fetchStrategy = async (coinValue: string) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_strategies')
        .select('*')
        .eq('user_id', user.id)
        .eq('symbol', coinValue)
        .maybeSingle();

      if (data) {
        setExistingStrategy(data);
        setBuyPrice(data.buy_price.toString());
        setTakeProfit(data.take_profit.toString());
        setStopLoss(data.stop_loss.toString());
        setIsEditing(false); // Default to view mode if exists
      } else {
        setExistingStrategy(null);
        // Reset to defaults or keep previous? Resetting is safer for new entry
        setBuyPrice('');
        setTakeProfit('');
        setStopLoss('');
        setIsEditing(true); // Default to create mode
      }
    } catch (e) {
      console.log('Error fetching strategy:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStrategy = async () => {
    if (!buyPrice || !takeProfit || !stopLoss) {
      showFeedback('error', 'Please fill in all price fields.');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

       const payload = {
          user_id: user.id,
          symbol: selectedCoin.value,
          buy_price: parseFloat(buyPrice.replace(/,/g, '')),
          take_profit: parseFloat(takeProfit.replace(/,/g, '')),
          stop_loss: parseFloat(stopLoss.replace(/,/g, '')),
          is_active: true,
       };

       // Check if we are updating an existing one found during fetch
       if (existingStrategy) {
         const { error } = await supabase
           .from('user_strategies')
           .update(payload)
           .eq('id', existingStrategy.id);
          if (error) throw error;
       } else {
         // Insert new
         const { error } = await supabase
          .from('user_strategies')
          .insert(payload);
         if (error) throw error;
       }

      showFeedback('success', `Strategy for ${selectedCoin.label} saved.`);
      fetchStrategy(selectedCoin.value); // Refresh state
    } catch (error: any) {
      showFeedback('error', error.message || 'Failed to save strategy.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

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

      if (!response.ok) {
        throw new Error(`AI Service Error: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      let result;
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        result = { message: await response.text() }; // Wrap text
      }
      
      setAnalysisResult(result);
      showFeedback('success', 'AI Analysis completed.');

    } catch (error: any) {
      showFeedback('error', error.message || 'Analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <Text style={styles.screenTitle}>Strategy Inspector</Text>
          <Text style={styles.screenSubtitle}>Configure & Analyze Market Strategies</Text>

          {/* Coin Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coinSelector} contentContainerStyle={{ gap: 12 }}>
            {COINS.map((coin) => (
              <TouchableOpacity 
                key={coin.value}
                style={[
                  styles.coinChip, 
                  selectedCoin.value === coin.value && styles.coinChipActive,
                  { borderColor: selectedCoin.value === coin.value ? coin.color : '#333' }
                ]}
                onPress={() => setSelectedCoin(coin)}
              >
                 {/* @ts-ignore */}
                <IconSymbol name={coin.icon} size={16} color={selectedCoin.value === coin.value ? '#FFF' : '#888'} />
                <Text style={[styles.coinChipText, selectedCoin.value === coin.value && styles.coinChipTextActive]}>
                  {coin.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Feedback Banner */}
          {feedback && (
            <View style={[styles.banner, feedback.type === 'error' ? styles.bannerError : styles.bannerSuccess]}>
                {/* @ts-ignore */}
               <IconSymbol name={feedback.type === 'error' ? 'exclamationmark.circle.fill' : 'checkmark.circle.fill'} size={20} color="#FFF" />
               <Text style={styles.bannerText}>{feedback.message}</Text>
            </View>
          )}

          {/* View Mode: Display Existing Strategy */}
          {!isEditing && existingStrategy && (
             <View style={styles.card}>
                <View style={styles.cardHeader}>
                    {/* @ts-ignore */}
                    <IconSymbol name="eye.fill" size={20} color={selectedCoin.color} />
                    <Text style={[styles.cardTitle, { color: selectedCoin.color }]}>Active {selectedCoin.symbol} Strategy</Text>
                </View>
                
                <View style={styles.viewRow}>
                   <View style={styles.viewItem}>
                      <Text style={styles.viewLabel}>Buy Price</Text>
                      <Text style={styles.viewValue}>${existingStrategy.buy_price.toLocaleString()}</Text>
                   </View>
                   <View style={styles.viewItem}>
                      <Text style={styles.viewLabel}>Take Profit</Text>
                      <Text style={[styles.viewValue, { color: '#4CAF50' }]}>${existingStrategy.take_profit.toLocaleString()}</Text>
                   </View>
                   <View style={styles.viewItem}>
                      <Text style={styles.viewLabel}>Stop Loss</Text>
                      <Text style={[styles.viewValue, { color: '#F44336' }]}>${existingStrategy.stop_loss.toLocaleString()}</Text>
                   </View>
                </View>

                <TouchableOpacity style={styles.updateBtn} onPress={() => setIsEditing(true)}>
                    <Text style={styles.btnText}>Edit Configuration</Text>
                </TouchableOpacity>
             </View>
          )}

          {/* Edit/Create Mode: Form */}
          {isEditing && (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    {/* @ts-ignore */}
                    <IconSymbol name="gearshape.fill" size={20} color="#888" />
                    <Text style={styles.cardTitle}>
                        {existingStrategy ? `Edit ${selectedCoin.symbol} Strategy` : `New ${selectedCoin.symbol} Strategy`}
                    </Text>
                </View>

                <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Buy Price</Text>
                        <TextInput 
                            style={styles.input} 
                            value={buyPrice} 
                            onChangeText={setBuyPrice} 
                            keyboardType="numeric"
                            placeholder="0.00"
                            placeholderTextColor="#555"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Take Profit</Text>
                        <TextInput 
                            style={[styles.input, { color: '#4CAF50' }]} 
                            value={takeProfit} 
                            onChangeText={setTakeProfit} 
                            keyboardType="numeric"
                            placeholder="0.00"
                            placeholderTextColor="#555"
                        />
                    </View>
                </View>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Stop Loss</Text>
                    <TextInput 
                        style={[styles.input, { color: '#F44336' }]} 
                        value={stopLoss} 
                        onChangeText={setStopLoss} 
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor="#555"
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.saveBtn, { backgroundColor: selectedCoin.color }]}
                    onPress={handleSaveStrategy}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Save Configuration</Text>}
                </TouchableOpacity>

                {existingStrategy && (
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => { setIsEditing(false); setBuyPrice(existingStrategy.buy_price.toString()); setTakeProfit(existingStrategy.take_profit.toString()); setStopLoss(existingStrategy.stop_loss.toString()); }}> 
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                )}
            </View>
          )}

          {/* Analysis Action */}
          <View style={styles.actionSection}>
            <Text style={styles.sectionHeader}>AI Intelligence</Text>
            <TouchableOpacity 
                style={styles.analyzeBtn}
                onPress={handleRunAnalysis}
                disabled={analyzing}
            >
                {analyzing ? (
                     <View style={{ flexDirection: 'row', gap: 8 }}>
                        <ActivityIndicator color="#FFF" />
                        <Text style={styles.btnText}>Analyzing Market...</Text>
                     </View>
                ) : (
                    <>
                        {/* @ts-ignore */}
                        <IconSymbol name="sparkles" size={20} color="#FFF" />
                        <Text style={styles.btnText}>Run AI Analysis</Text>
                    </>
                )}
            </TouchableOpacity>
          </View>

          {/* Results Display */}
          {analysisResult && (
            <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>Analysis Insight</Text>
                <Text style={styles.resultJson}>
                    {JSON.stringify(analysisResult, null, 2)}
                </Text>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  coinSelector: {
    marginBottom: 24,
    maxHeight: 50,
  },
  coinChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#1E1E1E',
  },
  coinChipActive: {
    backgroundColor: '#333',
  },
  coinChipText: {
    color: '#888',
    fontWeight: '600',
  },
  coinChipTextActive: {
    color: '#FFF',
  },
  banner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerSuccess: { backgroundColor: '#1B5E20' }, // Dark Green
  bannerError: { backgroundColor: '#B71C1C' }, // Dark Red
  bannerText: { color: '#FFF', fontWeight: 'bold' },

  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    color: '#AAA',
    fontWeight: '600',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  viewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  viewItem: {
    flex: 1,
  },
  viewLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  viewValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  updateBtn: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnText: {
    color: '#888',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    color: '#888',
    marginBottom: 8,
    fontSize: 12,
  },
  input: {
    backgroundColor: '#121212',
    color: '#FFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    fontSize: 16,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  actionSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  analyzeBtn: {
    backgroundColor: '#6200EA', // Deep Purple
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#6200EA',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },

  resultCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  resultTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 8,
  },
  resultJson: {
    color: '#00E676',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
});
