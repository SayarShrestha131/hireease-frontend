import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertCircle, Camera, RefreshCw } from 'lucide-react-native';
import { ConfidenceScoreBadge } from './ConfidenceScoreBadge';

interface FaceValidationErrorProps {
  errorMessage: string;
  confidenceScore?: number;
  onRetake?: () => void;
  onDismiss?: () => void;
}

const GUIDANCE_TIPS = [
  'Ensure your face is well-lit and clearly visible',
  'Look directly at the camera',
  'Remove glasses or hats if possible',
  'Avoid blurry or low-quality images',
];

export const FaceValidationError: React.FC<FaceValidationErrorProps> = ({
  errorMessage,
  confidenceScore,
  onRetake,
  onDismiss,
}) => (
  <View
    style={{
      backgroundColor: '#FEF2F2',
      borderWidth: 1,
      borderColor: '#FCA5A5',
      borderRadius: 12,
      padding: 16,
    }}
    accessible
    accessibilityLabel={`Face validation error: ${errorMessage}`}
    accessibilityRole="alert"
  >
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
      <AlertCircle size={20} color="#EF4444" />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#B91C1C', marginBottom: 4 }}>
          Face Validation Failed
        </Text>
        <Text style={{ fontSize: 13, color: '#7F1D1D' }}>{errorMessage}</Text>
        {confidenceScore !== undefined && (
          <View style={{ marginTop: 8 }}>
            <ConfidenceScoreBadge score={confidenceScore} size="sm" />
          </View>
        )}
      </View>
    </View>

    {/* Guidance tips */}
    <View style={{ backgroundColor: '#FFF1F2', borderRadius: 8, padding: 10, marginBottom: 12 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: '#9F1239', marginBottom: 6 }}>
        Tips for a better selfie:
      </Text>
      {GUIDANCE_TIPS.map((tip, i) => (
        <Text key={i} style={{ fontSize: 12, color: '#BE123C', marginBottom: 2 }}>
          • {tip}
        </Text>
      ))}
    </View>

    {/* Action buttons */}
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {onRetake && (
        <TouchableOpacity
          onPress={onRetake}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#EF4444',
            borderRadius: 8,
            paddingVertical: 10,
          }}
          accessible
          accessibilityLabel="Retake selfie"
          accessibilityRole="button"
        >
          <Camera size={16} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14, marginLeft: 6 }}>
            Retake Selfie
          </Text>
        </TouchableOpacity>
      )}
      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FEE2E2',
            borderRadius: 8,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: '#FCA5A5',
          }}
          accessible
          accessibilityLabel="Dismiss error"
          accessibilityRole="button"
        >
          <RefreshCw size={16} color="#B91C1C" />
          <Text style={{ color: '#B91C1C', fontWeight: '600', fontSize: 14, marginLeft: 6 }}>
            Try Again
          </Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);
