import React from 'react';
import { View, Text } from 'react-native';
import { getConfidenceLevel, DEFAULT_CONFIDENCE_THRESHOLDS, ConfidenceThresholds } from '../types/kyc';

interface ConfidenceScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  thresholds?: ConfidenceThresholds;
  accessibilityLabel?: string;
}

const COLOR_MAP = {
  high: { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  medium: { bg: '#FEF9C3', text: '#B45309', border: '#FDE047' },
  low: { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' },
};

const LABEL_MAP = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const SIZE_MAP = {
  sm: { fontSize: 11, paddingH: 6, paddingV: 2 },
  md: { fontSize: 13, paddingH: 8, paddingV: 4 },
  lg: { fontSize: 15, paddingH: 12, paddingV: 6 },
};

export const ConfidenceScoreBadge: React.FC<ConfidenceScoreBadgeProps> = ({
  score,
  size = 'md',
  showLabel = true,
  thresholds = DEFAULT_CONFIDENCE_THRESHOLDS,
  accessibilityLabel,
}) => {
  const clampedScore = Math.max(0, Math.min(100, score));
  const level = getConfidenceLevel(clampedScore, thresholds);
  const colors = COLOR_MAP[level];
  const levelLabel = LABEL_MAP[level];
  const sizing = SIZE_MAP[size];

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel || `Confidence: ${clampedScore}% - ${levelLabel}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 999,
        paddingHorizontal: sizing.paddingH,
        paddingVertical: sizing.paddingV,
        alignSelf: 'flex-start',
      }}
    >
      {/* Dot indicator */}
      <View
        style={{
          width: sizing.fontSize * 0.6,
          height: sizing.fontSize * 0.6,
          borderRadius: 999,
          backgroundColor: colors.text,
          marginRight: 4,
        }}
      />
      <Text style={{ fontSize: sizing.fontSize, color: colors.text, fontWeight: '600' }}>
        {clampedScore}%
        {showLabel && <Text style={{ fontWeight: '400' }}> {levelLabel}</Text>}
      </Text>
    </View>
  );
};
