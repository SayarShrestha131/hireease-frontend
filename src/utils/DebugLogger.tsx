import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

const logs: LogEntry[] = [];
let logUpdateCallback: (() => void) | null = null;

export const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
  const timestamp = new Date().toLocaleTimeString();
  logs.push({ timestamp, message, type });
  
  // Keep only last 50 logs
  if (logs.length > 50) {
    logs.shift();
  }
  
  // Trigger update
  if (logUpdateCallback) {
    logUpdateCallback();
  }
  
  // Also log to console
  const emoji = type === 'success' ? '🟢' : type === 'error' ? '🔴' : '🔵';
  console.log(`${emoji} [${timestamp}] ${message}`);
};

export const DebugLogger: React.FC = () => {
  const [, setUpdateTrigger] = useState(0);
  
  useEffect(() => {
    logUpdateCallback = () => setUpdateTrigger(prev => prev + 1);
    return () => {
      logUpdateCallback = null;
    };
  }, []);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Logs</Text>
      <ScrollView style={styles.scrollView}>
        {logs.map((log, index) => (
          <Text
            key={index}
            style={[
              styles.logText,
              log.type === 'error' && styles.errorText,
              log.type === 'success' && styles.successText,
            ]}
          >
            {log.timestamp} - {log.message}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopWidth: 2,
    borderTopColor: '#00ff00',
  },
  title: {
    color: '#00ff00',
    fontSize: 14,
    fontWeight: 'bold',
    padding: 5,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
    padding: 5,
  },
  logText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  errorText: {
    color: '#ff0000',
  },
  successText: {
    color: '#00ff00',
  },
});
