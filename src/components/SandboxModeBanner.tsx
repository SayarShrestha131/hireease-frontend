import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { paymentService } from '../services/paymentService';

/**
 * SandboxModeBanner Component
 * 
 * Displays a prominent banner when the payment system is in sandbox mode.
 * Shows test credentials in development environment.
 * 
 * Requirements: 19.4
 */
export const SandboxModeBanner: React.FC = () => {
  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkSandboxMode();
  }, []);

  const checkSandboxMode = async () => {
    try {
      const health = await paymentService.getPaymentHealth();
      setIsSandboxMode(health.mode === 'sandbox');
    } catch (error) {
      console.error('Failed to check payment mode:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !isSandboxMode) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.title}>⚠️ SANDBOX MODE</Text>
        <Text style={styles.subtitle}>Test Environment - No Real Payments</Text>
      </View>
      
      {__DEV__ && (
        <View style={styles.credentialsContainer}>
          <Text style={styles.credentialsTitle}>Test Credentials:</Text>
          <Text style={styles.credentialItem}>
            • Khalti: Use test phone number and OTP
          </Text>
          <Text style={styles.credentialItem}>
            • Stripe: 4242 4242 4242 4242 (any future date, any CVC)
          </Text>
          <Text style={styles.credentialItem}>
            • PayPal: Use sandbox account credentials
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3CD',
    borderBottomWidth: 2,
    borderBottomColor: '#FFC107',
  },
  banner: {
    padding: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#856404',
  },
  credentialsContainer: {
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFE69C',
  },
  credentialsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  credentialItem: {
    fontSize: 11,
    color: '#856404',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default SandboxModeBanner;
