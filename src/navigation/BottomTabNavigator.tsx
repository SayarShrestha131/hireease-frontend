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
import { KYCSubmissionScreen } from '../screens/KYCSubmissionScreen';
import { KYCStatusScreen } from '../screens/KYCStatusScreen';
import { KYCReviewListScreen } from '../screens/admin/KYCReviewListScreen';
import { KYCDetailScreen } from '../screens/admin/KYCDetailScreen';
import { MyBookingsScreen } from '../screens/MyBookingsScreen';
import BookingDetailScreen from '../screens/BookingDetailScreen';
import { BookingFormScreen } from '../screens/BookingFormScreen';
import { BookingConfirmationScreen } from '../screens/BookingConfirmationScreen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { BookingSuccessScreen } from '../screens/BookingSuccessScreen';
import { useAuth } from '../contexts/AuthContext';
import { Vehicle } from '../types/vehicle';
import { AddOns, PriceBreakdown, Booking } from '../types/booking';

type TabScreen = 'dashboard' | 'vehicles' | 'bookings' | 'profile';
type SettingsScreenType = 'settings' | 'change-password' | 'api-config' | 'kyc-status' | 'kyc-submission';
type AdminScreenType = 'kyc-review-list' | 'kyc-detail';

export const BottomTabNavigator: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabScreen>('dashboard');
  const [settingsScreen, setSettingsScreen] = useState<SettingsScreenType>('settings');
  const [showSettings, setShowSettings] = useState(false);
  const [showAdminScreen, setShowAdminScreen] = useState(false);
  const [showBookingDetail, setShowBookingDetail] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showBookingConfirmation, setShowBookingConfirmation] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const [adminScreen, setAdminScreen] = useState<AdminScreenType>('kyc-review-list');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [bookingFormData, setBookingFormData] = useState<{
    vehicle: Vehicle;
    pickupDate: Date;
    pickupTime: string;
    dropoffDate: Date;
    dropoffTime: string;
    addOns: AddOns;
    priceBreakdown: PriceBreakdown;
  } | null>(null);

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

  const navigateToKYCStatus = () => {
    setShowSettings(true);
    setSettingsScreen('kyc-status');
  };

  const navigateToKYCSubmission = () => {
    setShowSettings(true);
    setSettingsScreen('kyc-submission');
  };

  const navigateToKYCReviewList = () => {
    setShowAdminScreen(true);
    setAdminScreen('kyc-review-list');
  };

  const navigateToKYCDetail = (submissionId: string) => {
    setShowAdminScreen(true);
    setAdminScreen('kyc-detail');
    setSelectedSubmissionId(submissionId);
  };

  const navigateToProfile = () => {
    setActiveTab('profile');
    setShowSettings(false);
  };

  const navigateToBookingDetail = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setShowBookingDetail(true);
  };

  const navigateBackFromBookingDetail = () => {
    setShowBookingDetail(false);
    setSelectedBookingId(null);
  };

  const navigateToBookingForm = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowBookingForm(true);
  };

  const navigateBackFromBookingForm = () => {
    setShowBookingForm(false);
    setSelectedVehicle(null);
  };

  const navigateToBookingConfirmation = (data: {
    vehicle: Vehicle;
    pickupDate: Date;
    pickupTime: string;
    dropoffDate: Date;
    dropoffTime: string;
    addOns: AddOns;
    priceBreakdown: PriceBreakdown;
  }) => {
    setBookingFormData(data);
    setShowBookingForm(false);
    setShowBookingConfirmation(true);
  };

  const navigateBackFromBookingConfirmation = () => {
    setShowBookingConfirmation(false);
    setShowBookingForm(true);
  };

  const navigateToPayment = (booking: Booking) => {
    setCurrentBooking(booking);
    setShowBookingConfirmation(false);
    setShowPayment(true);
  };

  const navigateBackFromPayment = () => {
    setShowPayment(false);
    setShowBookingConfirmation(true);
  };

  const navigateToBookingSuccess = (booking: Booking) => {
    setCurrentBooking(booking);
    setShowPayment(false);
    setShowBookingSuccess(true);
  };

  const navigateFromSuccessToBookingDetail = (bookingId: string) => {
    setShowBookingSuccess(false);
    setSelectedBookingId(bookingId);
    setShowBookingDetail(true);
  };

  const navigateFromSuccessToBookingsList = () => {
    setShowBookingSuccess(false);
    setCurrentBooking(null);
    setBookingFormData(null);
    setSelectedVehicle(null);
    setActiveTab('bookings');
  };

  const navigateFromSuccessToHome = () => {
    setShowBookingSuccess(false);
    setCurrentBooking(null);
    setBookingFormData(null);
    setSelectedVehicle(null);
    setActiveTab('vehicles');
  };

  const navigateBack = () => {
    if (settingsScreen === 'change-password' || settingsScreen === 'kyc-submission') {
      setSettingsScreen('settings');
    } else if (settingsScreen === 'kyc-status') {
      setSettingsScreen('settings');
    } else {
      setShowSettings(false);
    }
  };

  const navigateBackFromAdmin = () => {
    if (adminScreen === 'kyc-detail') {
      setAdminScreen('kyc-review-list');
    } else {
      setShowAdminScreen(false);
      setActiveTab('dashboard');
    }
  };

  // Show booking detail screen
  if (showBookingDetail && selectedBookingId) {
    return (
      <BookingDetailScreen
        bookingId={selectedBookingId}
        onNavigateBack={navigateBackFromBookingDetail}
      />
    );
  }

  // Show booking form screen
  if (showBookingForm && selectedVehicle) {
    return (
      <BookingFormScreen
        route={{
          params: {
            vehicleId: selectedVehicle._id,
            vehicle: selectedVehicle,
          },
        }}
        onNavigateToConfirmation={navigateToBookingConfirmation}
        onNavigateToKYC={navigateToKYCSubmission}
        onNavigateBack={navigateBackFromBookingForm}
      />
    );
  }

  // Show booking confirmation screen
  if (showBookingConfirmation && bookingFormData) {
    return (
      <BookingConfirmationScreen
        route={{
          params: bookingFormData,
        }}
        onNavigateToPayment={navigateToPayment}
        onNavigateToKYC={navigateToKYCSubmission}
        onNavigateBack={navigateBackFromBookingConfirmation}
      />
    );
  }

  // Show payment screen
  if (showPayment && currentBooking) {
    return (
      <PaymentScreen
        route={{
          params: {
            booking: currentBooking,
          },
        }}
        onNavigateToSuccess={navigateToBookingSuccess}
        onNavigateBack={navigateBackFromPayment}
      />
    );
  }

  // Show booking success screen
  if (showBookingSuccess && currentBooking) {
    return (
      <BookingSuccessScreen
        route={{
          params: {
            booking: currentBooking,
          },
        }}
        onNavigateToBookingDetails={navigateFromSuccessToBookingDetail}
        onNavigateToBookingsList={navigateFromSuccessToBookingsList}
        onNavigateToHome={navigateFromSuccessToHome}
      />
    );
  }

  // Show admin screens
  if (showAdminScreen && user?.role === 'admin') {
    if (adminScreen === 'kyc-detail' && selectedSubmissionId) {
      return (
        <KYCDetailScreen
          submissionId={selectedSubmissionId}
          onNavigateBack={navigateBackFromAdmin}
        />
      );
    }
    if (adminScreen === 'kyc-review-list') {
      return (
        <KYCReviewListScreen
          onNavigateToDetail={navigateToKYCDetail}
          onNavigateBack={navigateBackFromAdmin}
        />
      );
    }
  }

  // Show settings screens
  if (showSettings) {
    if (settingsScreen === 'change-password') {
      return <ChangePasswordScreen onNavigateBack={navigateBack} />;
    }
    if (settingsScreen === 'api-config') {
      return <ApiConfigScreen onNavigateBack={navigateBack} />;
    }
    if (settingsScreen === 'kyc-status') {
      return (
        <KYCStatusScreen
          onNavigateToSubmission={navigateToKYCSubmission}
          onNavigateBack={navigateBack}
        />
      );
    }
    if (settingsScreen === 'kyc-submission') {
      return (
        <KYCSubmissionScreen
          onNavigateToStatus={navigateToKYCStatus}
          onNavigateBack={navigateBack}
        />
      );
    }
    return (
      <SettingsScreen
        onNavigateToChangePassword={navigateToChangePassword}
        onNavigateToProfile={navigateToProfile}
        onNavigateToApiConfig={navigateToApiConfig}
        onNavigateToKYCStatus={navigateToKYCStatus}
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
      {activeTab === 'dashboard' && <DashboardScreen onNavigateToKYCReview={navigateToKYCReviewList} />}
      {activeTab === 'vehicles' && (
        <HomeScreen 
          onNavigateToSettings={navigateToSettings}
          onNavigateToBookingForm={navigateToBookingForm}
        />
      )}
      {activeTab === 'bookings' && (
        <MyBookingsScreen 
          onNavigateToDetail={navigateToBookingDetail}
          onNavigateToVehicles={() => setActiveTab('vehicles')}
        />
      )}

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
