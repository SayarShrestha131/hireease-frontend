import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { Loader, Camera, FileText, Shield } from 'lucide-react-native';

export type ProcessingStage =
  | 'uploading'
  | 'face-validation'
  | 'ocr-processing'
  | 'face-matching'
  | 'submitting'
  | 'complete';

interface KYCProcessingIndicatorProps {
  stage: ProcessingStage;
  progress?: number; // 0-100 for upload progress
  message?: string;
}

const STAGE_CONFIG: Record<ProcessingStage, { label: string; icon: any; color: string }> = {
  uploading: { label: 'Uploading images...', icon: Loader, color: '#0096c7' },
  'face-validation': { label: 'Validating face...', icon: Camera, color: '#8B5CF6' },
  'ocr-processing': { label: 'Extracting document data...', icon: FileText, color: '#F59E0B' },
  'face-matching': { label: 'Matching identity...', icon: Shield, color: '#10B981' },
  submitting: { label: 'Submitting application...', icon: Loader, color: '#0096c7' },
  complete: { label: 'Complete!', icon: Shield, color: '#22C55E' },
};

export const KYCProcessingIndicator: React.FC<KYCProcessingIndicatorProps> = ({
  stage,
  progress,
  message,
}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const config = STAGE_CONFIG[stage];

  useEffect(() => {
    if (stage === 'complete') return;
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [stage]);

  const rotate = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View
      style={{
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
      }}
      accessible
      accessibilityLabel={message || config.label}
      accessibilityRole="progressbar"
      accessibilityValue={progress !== undefined ? { min: 0, max: 100, now: progress } : undefined}
    >
      <Animated.View style={stage !== 'complete' ? { transform: [{ rotate }] } : undefined}>
        <config.icon size={32} color={config.color} />
      </Animated.View>

      <Text style={{ fontSize: 15, fontWeight: '600', color: '#1F2937', marginTop: 12, textAlign: 'center' }}>
        {message || config.label}
      </Text>

      {/* Upload progress bar */}
      {progress !== undefined && (
        <View style={{ width: '100%', marginTop: 12 }}>
          <View style={{ height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
            <View
              style={{
                height: '100%',
                width: `${Math.min(100, progress)}%`,
                backgroundColor: config.color,
                borderRadius: 3,
              }}
            />
          </View>
          <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'right', marginTop: 4 }}>
            {Math.round(progress)}%
          </Text>
        </View>
      )}

      <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>Please wait...</Text>
    </View>
  );
};
