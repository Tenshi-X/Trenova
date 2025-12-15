import { supabase } from '@/lib/supabase';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const signInWithEmail = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Login' }} />
      <View style={styles.form}>
        <View style={styles.header}>
            <View style={styles.logo}>
                <Text style={styles.logoText}>T</Text>
            </View>
            <Text style={styles.title}>TRENOVA</Text>
            <Text style={styles.subtitle}>Mobile Terminal</Text>
        </View>
        
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
            style={styles.input}
            onChangeText={setEmail}
            value={email}
            placeholder="trader@trenova.com"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            keyboardType="email-address"
            />
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
            style={styles.input}
            onChangeText={setPassword}
            value={password}
            secureTextEntry={true}
            placeholder="••••••••"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            />
        </View>

        <TouchableOpacity style={styles.button} onPress={signInWithEmail} disabled={loading}>
          {loading ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Slate 950
    justifyContent: 'center',
    padding: 20,
  },
  form: {
    backgroundColor: '#0f172a', // Slate 900
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    boxShadow: '0px 0px 20px rgba(0, 229, 255, 0.1)',
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    boxShadow: '0px 0px 20px rgba(0, 229, 255, 0.5)',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#020617',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    color: '#94a3b8',
    marginBottom: 10,
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#020617',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#00E5FF', // Neon Cyan
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
    boxShadow: '0px 0px 15px rgba(0, 229, 255, 0.3)',
  },
  buttonText: {
    color: '#020617',
    fontWeight: '800',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
