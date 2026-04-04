import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { ConfidenceScoreBadge } from './ConfidenceScoreBadge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImageComparisonViewProps {
  leftImage: string | null;
  rightImage: string | null;
  leftLabel?: string;
  rightLabel?: string;
  confidenceScore?: number;
  showConfidence?: boolean;
  accessibilityLabel?: string;
}

export const ImageComparisonView: React.FC<ImageComparisonViewProps> = ({
  leftImage,
  rightImage,
  leftLabel = 'Profile Picture',
  rightLabel = 'Selfie',
  confidenceScore,
  showConfidence = true,
  accessibilityLabel,
}) => {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [leftLoading, setLeftLoading] = useState(true);
  const [rightLoading, setRightLoading] = useState(true);

  const imageSize = (SCREEN_WIDTH - 48 - 16) / 2; // account for padding and gap

  const renderImage = (
    uri: string | null,
    label: string,
    loading: boolean,
    setLoading: (v: boolean) => void
  ) => (
    <TouchableOpacity
      onPress={() => uri && setFullscreenImage(uri)}
      disabled={!uri}
      accessible
      accessibilityLabel={`${label}. Tap to view fullscreen.`}
      accessibilityRole="imagebutton"
      style={{ flex: 1 }}
    >
      <View
        style={{
          width: '100%',
          aspectRatio: 1,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: '#F3F4F6',
          borderWidth: 1,
          borderColor: '#E5E7EB',
        }}
      >
        {uri ? (
          <>
            <Image
              source={{ uri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              onLoadEnd={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
            {loading && (
              <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="#0096c7" />
              </View>
            )}
          </>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>No image</Text>
          </View>
        )}
      </View>
      <Text style={{ textAlign: 'center', fontSize: 12, color: '#6B7280', marginTop: 4 }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View accessible accessibilityLabel={accessibilityLabel || 'Image comparison view'}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {renderImage(leftImage, leftLabel, leftLoading, setLeftLoading)}

        {/* Center confidence score */}
        {showConfidence && confidenceScore !== undefined && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
            <ConfidenceScoreBadge score={confidenceScore} size="sm" />
            <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2, textAlign: 'center' }}>match</Text>
          </View>
        )}

        {renderImage(rightImage, rightLabel, rightLoading, setRightLoading)}
      </View>

      {/* Fullscreen modal */}
      <Modal visible={!!fullscreenImage} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' }}
          onPress={() => setFullscreenImage(null)}
          accessible
          accessibilityLabel="Close fullscreen image"
          accessibilityRole="button"
        >
          {fullscreenImage && (
            <Image
              source={{ uri: fullscreenImage }}
              style={{ width: SCREEN_WIDTH - 32, height: SCREEN_WIDTH - 32 }}
              resizeMode="contain"
            />
          )}
          <Text style={{ color: '#9CA3AF', marginTop: 16, fontSize: 13 }}>Tap to close</Text>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
