/**
 * App Navigator
 * 
 * Handles conditional rendering based on authentication state.
 * Renders LoadingScreen during auth check, Login/Register screens when unauthenticated,
 * and Home screen when authenticated.
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingScreen } from '../components/LoadingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';

/**
 * Screen types for navigation state
 */
type AuthScreen = 'login' | 'register';

/**
 * AppNavigator Component
 * Manages navigation between authentication screens and authenticated area
 */
export const AppNavigator: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');

  /**
   * Navigate to Register screen
   */
  const navigateToRegister = () => {
    setCurrentScreen('register');
  };

  /**
   * Navigate to Login screen
   */
  const navigateToLogin = () => {
    setCurrentScreen('login');
  };

  // Show loading screen while checking authentication status
  if (loading) {
    return <LoadingScreen />;
  }

  // Show authenticated area (Home screen) when user is logged in
  if (isAuthenticated) {
    return <HomeScreen />;
  }

  // Show authentication screens when user is not logged in
  // Toggle between Login and Register based on currentScreen state
  if (currentScreen === 'register') {
    return <RegisterScreen onNavigateToLogin={navigateToLogin} />;
  }

  return <LoginScreen onNavigateToRegister={navigateToRegister} />;
};
