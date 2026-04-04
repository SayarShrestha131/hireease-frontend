import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { OCRData, DataVerification } from '../types/kyc';
import { ConfidenceScoreBadge } from './ConfidenceScoreBadge';

interface OCRField {
  label: string;
  userValue?: string;
  ocrValue?: string;
  confidenceScore?: number;
  isMatch?: boolean;
}

interface OCRDataComparisonProps {
  userInput: {
    licenseNumber?: string;
    fullName?: string;
    fatherName?: string;
    dateOfBirth?: string;
    licenseExpiryDate?: string;
    licenseIssueDate?: string;
    issuedBy?: string;
    address?: string;
  };
  ocrData?: OCRData | null;
  dataVerification?: DataVerification | null;
}

export const OCRDataComparison: React.FC<OCRDataComparisonProps> = ({
  userInput,
  ocrData,
  dataVerification,
}) => {
  const ocr = ocrData?.frontImage;
  const fieldConf = ocrData?.fieldConfidence;

  const fields: OCRField[] = [
    {
      label: 'License Number',
      userValue: userInput.licenseNumber,
      ocrValue: ocr?.licenseNumber,
      confidenceScore: fieldConf?.licenseNumber,
      isMatch: dataVerification?.licenseNumberMatch,
    },
    {
      label: 'Full Name',
      userValue: userInput.fullName,
      ocrValue: ocr?.fullName,
      confidenceScore: fieldConf?.fullName,
      isMatch: dataVerification?.nameMatch,
    },
    {
      label: 'Father Name',
      userValue: userInput.fatherName,
      ocrValue: ocr?.fatherName,
      confidenceScore: fieldConf?.fatherName,
    },
    {
      label: 'Date of Birth',
      userValue: userInput.dateOfBirth,
      ocrValue: ocr?.dateOfBirth,
      confidenceScore: fieldConf?.dateOfBirth,
      isMatch: dataVerification?.dobMatch,
    },
    {
      label: 'Expiry Date',
      userValue: userInput.licenseExpiryDate,
      ocrValue: ocr?.expiryDate,
      confidenceScore: fieldConf?.expiryDate,
      isMatch: dataVerification?.expiryDateMatch,
    },
    {
      label: 'Issue Date',
      userValue: userInput.licenseIssueDate,
      ocrValue: ocr?.issueDate,
      confidenceScore: fieldConf?.issueDate,
    },
    {
      label: 'Issued By',
      userValue: userInput.issuedBy,
      ocrValue: ocr?.issuingAuthority,
      confidenceScore: fieldConf?.issuingAuthority,
    },
    {
      label: 'Address',
      userValue: userInput.address,
      ocrValue: ocr?.address,
      confidenceScore: fieldConf?.address,
    },
  ].filter(f => f.userValue || f.ocrValue);

  const matchScore = dataVerification?.matchScore;

  return (
    <View>
      {/* Match score header */}
      {matchScore !== undefined && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F9FAFB',
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: '#E5E7EB',
          }}
          accessible
          accessibilityLabel={`Overall data match score: ${matchScore}%`}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>Data Match Score</Text>
          <ConfidenceScoreBadge score={matchScore} size="md" />
        </View>
      )}

      {/* Column headers */}
      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
        <View style={{ flex: 1, marginRight: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>
            User Input
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>
            OCR Extracted
          </Text>
        </View>
      </View>

      {/* Field rows */}
      {fields.map((field, index) => {
        const hasMatch = field.isMatch !== undefined;
        const rowBg = hasMatch
          ? field.isMatch
            ? '#F0FDF4'
            : '#FEF2F2'
          : '#FFFFFF';
        const borderColor = hasMatch
          ? field.isMatch
            ? '#86EFAC'
            : '#FCA5A5'
          : '#E5E7EB';

        return (
          <View
            key={index}
            style={{
              backgroundColor: rowBg,
              borderWidth: 1,
              borderColor,
              borderRadius: 8,
              padding: 10,
              marginBottom: 8,
            }}
            accessible
            accessibilityLabel={`${field.label}: User entered ${field.userValue || 'not provided'}, OCR extracted ${field.ocrValue || 'not detected'}${hasMatch ? `, ${field.isMatch ? 'matching' : 'mismatch'}` : ''}`}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', flex: 1 }}>
                {field.label}
              </Text>
              {field.confidenceScore !== undefined && (
                <ConfidenceScoreBadge score={field.confidenceScore} size="sm" showLabel={false} />
              )}
              {hasMatch && (
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: field.isMatch ? '#15803D' : '#B91C1C',
                    marginLeft: 6,
                  }}
                >
                  {field.isMatch ? '✓ Match' : '✗ Mismatch'}
                </Text>
              )}
            </View>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, marginRight: 4 }}>
                <Text style={{ fontSize: 13, color: '#1F2937' }} numberOfLines={2}>
                  {field.userValue || <Text style={{ color: '#9CA3AF', fontStyle: 'italic' }}>—</Text>}
                </Text>
              </View>
              <View style={{ width: 1, backgroundColor: borderColor, marginHorizontal: 4 }} />
              <View style={{ flex: 1, marginLeft: 4 }}>
                <Text style={{ fontSize: 13, color: '#1F2937' }} numberOfLines={2}>
                  {field.ocrValue || <Text style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Not detected</Text>}
                </Text>
              </View>
            </View>
          </View>
        );
      })}

      {fields.length === 0 && (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <Text style={{ color: '#9CA3AF', fontSize: 13 }}>No OCR data available for comparison</Text>
        </View>
      )}
    </View>
  );
};
