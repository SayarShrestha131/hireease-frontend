/**
 * Accessibility utilities for KYC components
 */
import { AccessibilityInfo, findNodeHandle, RefObject } from 'react-native';

/**
 * Announce a message to screen readers
 */
export function announceForAccessibility(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * Move screen reader focus to a component ref
 */
export function setAccessibilityFocus(ref: RefObject<any>): void {
  if (ref.current) {
    const node = findNodeHandle(ref.current);
    if (node) {
      AccessibilityInfo.setAccessibilityFocus(node);
    }
  }
}

/**
 * Generate accessibility label for confidence scores
 */
export function confidenceAccessibilityLabel(score: number, context: string): string {
  const level = score >= 85 ? 'high' : score >= 60 ? 'medium' : 'low';
  return `${context}: ${score} percent confidence, ${level} confidence level`;
}

/**
 * Generate accessibility label for KYC status
 */
export function kycStatusAccessibilityLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'KYC verification is pending review',
    approved: 'KYC verification has been approved',
    rejected: 'KYC verification has been rejected',
  };
  return labels[status] || `KYC status: ${status}`;
}

/**
 * High contrast color overrides (for users with high contrast preference)
 * These are more accessible alternatives to the default palette
 */
export const HIGH_CONTRAST_COLORS = {
  success: '#006400',   // dark green
  warning: '#8B4513',   // dark orange/brown
  error: '#8B0000',     // dark red
  info: '#00008B',      // dark blue
  text: '#000000',
  background: '#FFFFFF',
  border: '#000000',
};
