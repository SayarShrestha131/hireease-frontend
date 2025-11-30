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
import { EmailVerificationScreen } from '../screens/EmailVerificationScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { VerifyCodeScreen } from '../screens/VerifyCodeScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import HomeScreen from '../screens/HomeScreen';

/**
 * Screen types for navigation state
 */
type AuthScreen = 'login' | 'register' | 'email-verification' | 'forgot-password' | 'verify-code' | 'reset-password';
type MainScreen = 'home' | 'settings' | 'change-password';

/**
 * AppNavigator Component
 * Manages navigation between authentication screens and authenticated area
 */
export const AppNavigator: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [mainScreen, setMainScreen] = useState<MainScreen>('home');
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetCode, setResetCode] = useState<string>('');

  // Reset to home screen when user logs in
  React.useEffect(() => {
    if (isAuthenticated) {
      setMainScreen('home');
    }
  }, [isAuthenticated]);

  /**
   * Navigate to Register screen
   */
  const navigateToRegister = () => {
    setAuthScreen('register');
  };

  /**
   * Navigate to Email Verification screen
   */
  const navigateToEmailVerification = (email: string) => {
    setVerificationEmail(email);
    setAuthScreen('email-verification');
  };

  /**
   * Navigate to Login screen
   */
  const navigateToLogin = () => {
    setAuthScreen('login');
  };

  /**
   * Navigate to Forgot Password screen
   */
  const navigateToForgotPassword = () => {
    setAuthScreen('forgot-password');
  };

  /**
   * Navigate to Verify Code screen
   */
  const navigateToVerifyCode = (email: string) => {
    setResetEmail(email);
    setAuthScreen('verify-code');
  };

  /**
   * Navigate to Reset Password screen
   */
  const navigateToResetPassword = (email: string, code: string) => {
    setResetEmail(email);
    setResetCode(code);
    setAuthScreen('reset-password');
  };

  /**
   * Navigate to Settings screen
   */
  const navigateToSettings = () => {
    setMainScreen('settings');
  };

  /**
   * Navigate to Change Password screen
   */
  const navigateToChangePassword = () => {
    setMainScreen('change-password');
  };

  /**
   * Navigate to Home screen
   */
  const navigateToHome = () => {
    setMainScreen('home');
  };

  // Show loading screen while checking authentication status
  if (loading) {
    return <LoadingScreen />;
  }

  // Show authenticated area when user is logged in
  if (isAuthenticated) {
    // Toggle between Home, Settings, and Change Password screens
    if (mainScreen === 'settings') {
      return (
        <SettingsScreen 
          onNavigateToChangePassword={navigateToChangePassword}
          onNavigateBack={navigateToHome}
        />
      );
    }

    if (mainScreen === 'change-password') {
      return <ChangePasswordScreen onNavigateBack={navigateToSettings} />;
    }
    
    return <HomeScreen onNavigateToSettings={navigateToSettings} />;
  }

  // Show authentication screens when user is not logged in
  // Toggle between Login, Register, Email Verification, Forgot Password, and Reset Password
  if (authScreen === 'register') {
    return (
      <RegisterScreen 
        onNavigateToLogin={navigateToLogin}
        onNavigateToEmailVerification={navigateToEmailVerification}
      />
    );
  }

  if (authScreen === 'email-verification') {
    return (
      <EmailVerificationScreen
        email={verificationEmail}
        onVerificationSuccess={navigateToLogin}
        onNavigateToLogin={navigateToLogin}
      />
    );
  }

  if (authScreen === 'forgot-password') {
    return (
      <ForgotPasswordScreen 
        onNavigateToLogin={navigateToLogin}
        onNavigateToVerifyCode={navigateToVerifyCode}
      />
    );
  }

  if (authScreen === 'verify-code') {
    return (
      <VerifyCodeScreen
        email={resetEmail}
        onNavigateToResetPassword={navigateToResetPassword}
        onNavigateBack={navigateToForgotPassword}
      />
    );
  }

  if (authScreen === 'reset-password') {
    return (
      <ResetPasswordScreen 
        email={resetEmail}
        code={resetCode}
        onNavigateToLogin={navigateToLogin}
        onNavigateToForgotPassword={navigateToForgotPassword}
      />
    );
  }

  return (
    <LoginScreen 
      onNavigateToRegister={navigateToRegister}
      onNavigateToForgotPassword={navigateToForgotPassword}
    />
  );
};
