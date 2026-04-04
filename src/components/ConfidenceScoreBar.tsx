import React from 'react';
import { View, Text } from 'react-native';
import { getConfidenceLevel, DEFAULT_CONFIDENCE_THRESHOLDS, ConfidenceThresholds } from '../types/kyc';

interface ConfidenceScoreBarProps {
  score: number;
  label?: string;
  showPercentage?: boolean;
  thresholds?: ConfidenceThresholds;
  accessibilityLabel?: string;
}

const COLOR_MAP = {
  high: { bar: '#22C55E', text: '#15803D', bg: '#F0FDF4' },
  medium: { bar: '#F59E0B', text: '#B45309', bg: '#FFFBEB' },
  low: { bar: '#EF4444', text: '#B91C1C', bg: '#FEF2F2' },
};

const LABEL_MAP = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const ConfidenceScoreBar: React.FC<ConfidenceScoreBarProps> = ({
  score,
  label,
  showPercentage = true,
  thresholds = DEFAULT_CONFIDENCE_THRESHOLDS,
  accessibilityLabel,
}) => {
  const clampedScore = Math.max(0, Math.min(100, score));
  const level = getConfidenceLevel(clampedScore, thresholds);
  const colors = COLOR_MAP[level];
  const levelLabel = LABEL_MAP[level];

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel || `${label || 'Confidence'}: ${clampedScore}% - ${levelLabel}`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clampedScore }}
    >
      {label && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>{label}</Text>
          {showPercentage && (
            <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>
              {clampedScore}% <Text style={{ fontWeight: '400' }}>({levelLabel})</Text>
            </Text>
          )}
        </View>
      )}
      <View style={{ height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
        <View
          style={{
            height: '100%',
            width: `${clampedScore}%`,
            backgroundColor: colors.bar,
            borderRadius: 4,
          }}
        />
      </View>
    </View>
  );
};
