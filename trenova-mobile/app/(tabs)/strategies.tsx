import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export default function StrategiesScreen() {
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

  // Fetch existing strategy on mount
  React.useEffect(() => {
    fetchStrategy();
  }, []);

  const fetchStrategy = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_strategies')
        .select('*')
        .eq('user_id', user.id)
        .eq('symbol', 'bitcoin') // Assuming single strategy per symbol for now
        .maybeSingle();

      if (data) {
        setBuyPrice(data.buy_price.toString());
        setTakeProfit(data.take_profit.toString());
        setStopLoss(data.stop_loss.toString());
      }
    } catch (e) {
      console.log('Error fetching strategy:', e);
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

      // Check if strategy exists to determine insert vs update
      // For simplicity in this demo, we'll delete and re-insert or just upsert if we had proper constraints.
      // Let's use upsert with a hypothetical constraint or just standard select/update logic.
      // Actually, standard insert might duplicate if no unique constraint on (user_id, symbol).
      // Let's delete old one first for this demo simplicity or use proper upsert logic if ID is known.

      // Better: Upsert based on specific match
       const { error } = await supabase.from('user_strategies').upsert({
          user_id: user.id,
          symbol: 'bitcoin',
          buy_price: parseFloat(buyPrice.replace(/,/g, '')),
          take_profit: parseFloat(takeProfit.replace(/,/g, '')),
          stop_loss: parseFloat(stopLoss.replace(/,/g, '')),
          is_active: true,
          // If we had an ID we put it here, otherwise this might create dupes without a unique index.
          // Assuming user_strategies has a unique constraint on (user_id, symbol) would be best.
          // If not, let's just do a delete-insert transaction pattern essentially, or just standard insert and ignore dupes for now.
       }, { onConflict: 'user_id, symbol' }); // Assuming there is a unique constraint

       // Fallback if no constraint: select -> update or insert
       // For this task, I'll stick to the previous insert logic but modified to be cleaner or upsert-like if possible.
       // Let's stick to the previous logic but improve it to UPDATE if exists.
       
       const { data: existing } = await supabase
         .from('user_strategies')
         .select('id')
         .eq('user_id', user.id)
         .eq('symbol', 'bitcoin')
         .maybeSingle();

       if (existing) {
         await supabase.from('user_strategies').update({
            buy_price: parseFloat(buyPrice.replace(/,/g, '')),
            take_profit: parseFloat(takeProfit.replace(/,/g, '')),
            stop_loss: parseFloat(stopLoss.replace(/,/g, '')),
         }).eq('id', existing.id);
       } else {
         await supabase.from('user_strategies').insert({
            user_id: user.id,
            symbol: 'bitcoin',
            buy_price: parseFloat(buyPrice.replace(/,/g, '')),
            take_profit: parseFloat(takeProfit.replace(/,/g, '')),
            stop_loss: parseFloat(stopLoss.replace(/,/g, '')),
            is_active: true,
         });
       }

      showFeedback('success', 'Strategy configuration saved successfully.');
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
          <Text style={styles.screenSubtitle}>Configure & Analyze Bitcoin (BTC)</Text>

          {/* Feedback Banner */}
          {feedback && (
            <View style={[styles.banner, feedback.type === 'error' ? styles.bannerError : styles.bannerSuccess]}>
                {/* @ts-ignore */}
               <IconSymbol name={feedback.type === 'error' ? 'exclamationmark.circle.fill' : 'checkmark.circle.fill'} size={20} color="#FFF" />
               <Text style={styles.bannerText}>{feedback.message}</Text>
            </View>
          )}

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
                {/* @ts-ignore */}
                <IconSymbol name="gearshape.fill" size={20} color="#888" />
                <Text style={styles.cardTitle}>Parameters (USD)</Text>
            </View>

            <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Buy Price</Text>
                    <TextInput 
                        style={styles.input} 
                        value={buyPrice} 
                        onChangeText={setBuyPrice} 
                        keyboardType="numeric"
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
                    placeholderTextColor="#555"
                />
            </View>

            <TouchableOpacity 
                style={styles.saveBtn}
                onPress={handleSaveStrategy}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Save Configuration</Text>}
            </TouchableOpacity>
          </View>

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
