/**
 * Password Strength Indicator Component
 * 
 * Displays a visual indicator of password strength with colored bars and text label
 */

import React from 'react';
import { View, Text } from 'react-native';

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'medium' | 'strong';

/**
 * Props for PasswordStrengthIndicator component
 */
interface PasswordStrengthIndicatorProps {
  password: string;
}

/**
 * Calculate password strength based on length and character variety
 * @param password - The password to evaluate
 * @returns The strength level: weak, medium, or strong
 */
export const calculatePasswordStrength = (password: string): PasswordStrength => {
  if (password.length < 6) {
    return 'weak';
  }
  
  if (password.length < 10) {
    return 'medium';
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const varietyCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
    .filter(Boolean).length;
  
  return varietyCount >= 3 ? 'strong' : 'medium';
};

/**
 * Get the number of bars to fill based on strength level
 * @param strength - The password strength level
 * @returns Number of bars to fill (1-4)
 */
const getStrengthLevel = (strength: PasswordStrength): number => {
  switch (strength) {
    case 'weak':
      return 1;
    case 'medium':
      return 3;
    case 'strong':
      return 4;
    default:
      return 0;
  }
};

/**
 * Get the color class for the strength level
 * @param strength - The password strength level
 * @returns Tailwind color class
 */
const getStrengthColor = (strength: PasswordStrength): string => {
  switch (strength) {
    case 'weak':
      return 'bg-red-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'strong':
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
};

/**
 * Get the text color class for the strength level
 * @param strength - The password strength level
 * @returns Tailwind text color class
 */
const getStrengthTextColor = (strength: PasswordStrength): string => {
  switch (strength) {
    case 'weak':
      return 'text-red-500';
    case 'medium':
      return 'text-yellow-600';
    case 'strong':
      return 'text-green-600';
    default:
      return 'text-gray-500';
  }
};

/**
 * PasswordStrengthIndicator Component
 * Shows visual feedback on password strength with colored bars and label
 */
export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  // Don't show indicator if password is empty
  if (!password) {
    return null;
  }

  const strength = calculatePasswordStrength(password);
  const strengthLevel = getStrengthLevel(strength);
  const colorClass = getStrengthColor(strength);
  const textColorClass = getStrengthTextColor(strength);

  return (
    <View className="flex-row items-center mt-2">
      {/* Strength bars */}
      <View className="flex-row mr-2">
        {[1, 2, 3, 4].map((level) => (
          <View
            key={level}
            className={`w-6 h-2 rounded-full mr-1 ${
              level <= strengthLevel ? colorClass : 'bg-gray-300'
            }`}
          />
        ))}
      </View>
      
      {/* Strength label */}
      <Text className={`text-sm ${textColorClass}`}>
        {strength.charAt(0).toUpperCase() + strength.slice(1)}
      </Text>
    </View>
  );
};
