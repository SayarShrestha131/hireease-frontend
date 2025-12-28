/**
 * Bottom Tab Navigator
 * 
 * Main navigation with bottom tabs for authenticated users
 */

import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, Car, Calendar, User } from 'lucide-react-native';
import DashboardScreen from '../screens/DashboardScreen';
import HomeScreen from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import { ApiConfigScreen } from '../screens/ApiConfigScreen';

type TabScreen = 'dashboard' | 'vehicles' | 'bookings' | 'profile';
type SettingsScreenType = 'settings' | 'change-password' | 'api-config';

export const BottomTabNavigator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabScreen>('dashboard');
  const [settingsScreen, setSettingsScreen] = useState<SettingsScreenType>('settings');
  const [showSettings, setShowSettings] = useState(false);

  const navigateToSettings = () => {
    setShowSettings(true);
    setSettingsScreen('settings');
  };

  const navigateToChangePassword = () => {
    setSettingsScreen('change-password');
  };

  const navigateToApiConfig = () => {
    setSettingsScreen('api-config');
  };

  const navigateToProfile = () => {
    setActiveTab('profile');
    setShowSettings(false);
  };

  const navigateBack = () => {
    if (settingsScreen === 'change-password') {
      setSettingsScreen('settings');
    } else {
      setShowSettings(false);
    }
  };

  // Show settings screens
  if (showSettings) {
    if (settingsScreen === 'change-password') {
      return <ChangePasswordScreen onNavigateBack={navigateBack} />;
    }
    if (settingsScreen === 'api-config') {
      return <ApiConfigScreen onNavigateBack={navigateBack} />;
    }
    return (
      <SettingsScreen
        onNavigateToChangePassword={navigateToChangePassword}
        onNavigateToProfile={navigateToProfile}
        onNavigateToApiConfig={navigateToApiConfig}
        onNavigateBack={navigateBack}
      />
    );
  }

  // Show profile screen
  if (activeTab === 'profile') {
    return (
      <View className="flex-1">
        <ProfileScreen onNavigateBack={() => setActiveTab('dashboard')} />
        {renderBottomTabs()}
      </View>
    );
  }

  function renderBottomTabs() {
    return (
      <SafeAreaView edges={['bottom']} className="bg-white border-t border-gray-200">
        <View className="flex-row">
          <TabButton
            icon={Home}
            label="Home"
            active={activeTab === 'dashboard'}
            onPress={() => setActiveTab('dashboard')}
          />
          <TabButton
            icon={Car}
            label="Vehicles"
            active={activeTab === 'vehicles'}
            onPress={() => setActiveTab('vehicles')}
          />
          <TabButton
            icon={Calendar}
            label="Bookings"
            active={activeTab === 'bookings'}
            onPress={() => setActiveTab('bookings')}
          />
          <TabButton
            icon={User}
            label="Profile"
            active={activeTab === 'profile'}
            onPress={() => setActiveTab('profile')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1">
      {/* Screen Content */}
      {activeTab === 'dashboard' && <DashboardScreen />}
      {activeTab === 'vehicles' && <HomeScreen onNavigateToSettings={navigateToSettings} />}
      {activeTab === 'bookings' && <BookingsPlaceholder />}

      {/* Bottom Tab Bar */}
      {renderBottomTabs()}
    </View>
  );
};

interface TabButtonProps {
  icon: any;
  label: string;
  active: boolean;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ icon: Icon, label, active, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 items-center justify-center py-3"
      activeOpacity={0.7}
    >
      <Icon size={24} color={active ? '#0096c7' : '#9CA3AF'} />
      <Text
        className={`text-xs mt-1 ${active ? 'text-[#0096c7] font-semibold' : 'text-gray-500'}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// Placeholder for Bookings screen
const BookingsPlaceholder: React.FC = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="flex-1 items-center justify-center px-6">
        <Calendar size={64} color="#9CA3AF" />
        <Text className="text-xl font-bold text-gray-800 mt-4">My Bookings</Text>
        <Text className="text-gray-500 text-center mt-2">
          Your vehicle bookings will appear here
        </Text>
        <TouchableOpacity className="bg-[#0096c7] px-6 py-3 rounded-lg mt-6">
          <Text className="text-white font-semibold">Browse Vehicles</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
