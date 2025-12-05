import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import ScreenWrapper from '../components/ScreenWrapper';
import { supabase } from '../lib/supabase';

export default function Index() {
    const router = useRouter();
  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus('Testing connection...');
      
      // Show what URL we're using (for debugging)
      const url = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wmlklvlnxftedtylgxsc.supabase.co';
      
      // Simple test: Just check if we can reach Supabase auth
      // This is the most reliable test that doesn't require tables
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        // If auth error, check if it's a connection issue
        if (authError.message?.includes('fetch') || authError.message?.includes('network') || authError.message?.includes('could not find')) {
          throw new Error(`Cannot reach Supabase. Check:\n1. URL is correct: ${url}\n2. Project is not paused\n3. Internet connection`);
        }
        throw authError;
      }

      // If we got here, connection works! Session might be null (no user logged in), which is fine
      setConnectionStatus('✅ Connected! Supabase is reachable.\n(No tables yet - ready to create them)');
      setIsConnected(true);
      
    } catch (error) {
      console.error('Supabase connection error:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      setConnectionStatus(`❌ ${errorMessage}`);
      setIsConnected(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>Bonded</Text>
        
        <View style={styles.testContainer}>
          <Text style={styles.testLabel}>Supabase Connection Test:</Text>
          <Text style={[styles.status, isConnected ? styles.success : styles.error]}>
            {connectionStatus}
          </Text>
          <Button 
            title="Test Again" 
            onPress={testConnection}
            disabled={connectionStatus === 'Testing...'}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button 
            title="Go to Welcome" 
            onPress={() => router.push('/welcome')} 
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  testContainer: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  testLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  status: {
    fontSize: 14,
    textAlign: 'center',
    padding: 10,
  },
  success: {
    color: '#22c55e',
    fontWeight: '600',
  },
  error: {
    color: '#ef4444',
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 20,
  },
});

