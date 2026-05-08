
/**
 * Profile Screen
 * 
 * Comprehensive user profile management with tabs for different sections
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { 
  User as UserIcon, 
  Mail, 
  Calendar,
  Edit3,
  Save,
  X,
  Shield,
  Phone,
  Bell,
  Clock,
  UserPlus,
  Trash2,
  Camera,
  AlertCircle
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { EmergencyContact } from '../types/auth';
import apiClient from '../services/apiClient';
import { getCurrentApiUrl } from '../config/api';
import { ProfilePictureUpload } from '../components/ProfilePictureUpload';
import profileService from '../services/profileService';



interface ProfileScreenProps {
  onNavigateBack: () => void;
}

type TabType = 'profile' | 'contact' | 'emergency' | 'preferences';

/**
 * ProfileScreen Component
 */
export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigateBack }) => {
  const { user, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [updateRestriction, setUpdateRestriction] = useState<{
    canUpdate: boolean;
    daysRemaining?: number;
    nextUpdateDate?: Date;
  } | null>(null);
  const [profilePictureError, setProfilePictureError] = useState<string | null>(null);

  // Profile fields
  const [username, setUsername] = useState(user?.username || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');

  // Contact fields
  const [phone, setPhone] = useState(user?.contactInfo?.phone || '');
  const [address, setAddress] = useState(user?.contactInfo?.address || '');
  const [city, setCity] = useState(user?.contactInfo?.city || '');
  const [country, setCountry] = useState(user?.contactInfo?.country || '');
  const [postalCode, setPostalCode] = useState(user?.contactInfo?.postalCode || '');

  // Notification preferences
  const [emailNotif, setEmailNotif] = useState(user?.notificationPreferences?.email ?? true);
  const [smsNotif, setSmsNotif] = useState(user?.notificationPreferences?.sms ?? false);
  const [pushNotif, setPushNotif] = useState(user?.notificationPreferences?.push ?? true);
  const [bookingUpdates, setBookingUpdates] = useState(user?.notificationPreferences?.bookingUpdates ?? true);
  const [promotions, setPromotions] = useState(user?.notificationPreferences?.promotions ?? false);
  const [reminders, setReminders] = useState(user?.notificationPreferences?.reminders ?? true);

  // Emergency contacts
  const [newEmergencyContact, setNewEmergencyContact] = useState({ name: '', relationship: '', phone: '' });

  /**
   * Fetch profile data on mount
   */
  React.useEffect(() => {
    fetchProfileData();
  }, []);

  /**
   * Update form fields when user data changes
   */
  React.useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setDateOfBirth(user.dateOfBirth || '');
      setPhone(user.contactInfo?.phone || '');
      setAddress(user.contactInfo?.address || '');
      setCity(user.contactInfo?.city || '');
      setCountry(user.contactInfo?.country || '');
      setPostalCode(user.contactInfo?.postalCode || '');
      setEmailNotif(user.notificationPreferences?.email ?? true);
      setSmsNotif(user.notificationPreferences?.sms ?? false);
      setPushNotif(user.notificationPreferences?.push ?? true);
      setBookingUpdates(user.notificationPreferences?.bookingUpdates ?? true);
      setPromotions(user.notificationPreferences?.promotions ?? false);
      setReminders(user.notificationPreferences?.reminders ?? true);
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setFetchingProfile(true);
      await refreshUser();
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      if (err.response?.status === 401) {
        console.log('Token expired or invalid - showing cached data');
      }
    } finally {
      setFetchingProfile(false);
    }
  };

  const handlePickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload a profile picture.');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    try {
      setUploadingImage(true);
      setProfilePictureError(null);
      console.log('[ProfileScreen] ========== UPLOAD START ==========');
      console.log('[ProfileScreen] Starting upload for:', imageUri);

      // Prepare image data for profile service
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const imageData = {
        uri: imageUri,
        name: filename,
        type,
      };

      console.log('[ProfileScreen] Image data prepared:', imageData);
      console.log('[ProfileScreen] Using profile service for upload...');
      
      // Use profile service for upload
      const response = await profileService.uploadProfilePicture(imageData);

      console.log('[ProfileScreen] Upload response:', response);

      if (response.success) {
        console.log('[ProfileScreen] Upload successful, refreshing user data...');
        await refreshUser();
        console.log('[ProfileScreen] User data refreshed');
        console.log('[ProfileScreen] ========== UPLOAD END (SUCCESS) ==========');
        Alert.alert('Success', 'Profile picture updated successfully');
      }
    } catch (error: any) {
      console.error('[ProfileScreen] ========== UPLOAD END (ERROR) ==========');
      console.error('[ProfileScreen] Error uploading profile picture:', error);
      console.error('[ProfileScreen] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMessage = error.message || 'Failed to upload profile picture';
      setProfilePictureError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProfilePictureUploadStart = () => {
    setUploadingImage(true);
    setProfilePictureError(null);
  };

  const handleProfilePictureUploadSuccess = async (imageUri: string) => {
    await uploadProfilePicture(imageUri);
  };

  const handleProfilePictureUploadError = (error: string) => {
    setProfilePictureError(error);
    setUploadingImage(false);
  };

  const handleProfilePictureImageSelected = async (imageUri: string) => {
    // Image selected, automatically upload it
    console.log('[ProfileScreen] Image selected, uploading:', imageUri);
    await uploadProfilePicture(imageUri);
  };

  const handleDeleteProfilePicture = async () => {
    Alert.alert(
      'Delete Profile Picture',
      'Are you sure you want to delete your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploadingImage(true);
              console.log('[ProfileScreen] Using profile service for deletion...');
              
              // Use profile service for deletion
              await profileService.deleteProfilePicture();
              
              await refreshUser();
              Alert.alert('Success', 'Profile picture deleted successfully');
            } catch (error: any) {
              console.error('Error deleting profile picture:', error);
              const errorMessage = error.message || 'Failed to delete profile picture';
              Alert.alert('Error', errorMessage);
            } finally {
              setUploadingImage(false);
            }
          },
        },
      ]
    );
  };

  const getProfilePictureUrl = () => {
    if (user?.profilePicture) {
      const baseUrl = getCurrentApiUrl();
      // Remove /api suffix from baseUrl since we need the root URL
      const rootUrl = baseUrl.replace(/\/api\/?$/, '');
      const imageUrl = `${rootUrl}/api/profile/picture/${user.profilePicture}?t=${Date.now()}`;
      console.log('[ProfileScreen] Profile picture URL:', imageUrl);
      return imageUrl;
    }
    return null;
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const updateData: any = {};

      if (activeTab === 'profile') {
        if (username && username.length < 2) {
          setError('Username must be at least 2 characters');
          return;
        }
        if (username) {
          updateData.username = username;
        }
        
        // Format date of birth to YYYY-MM-DD with zero-padding
        if (dateOfBirth) {
          const dateRegex = /^\d{4}-\d{1,2}-\d{1,2}$/;
          if (dateRegex.test(dateOfBirth)) {
            const [year, month, day] = dateOfBirth.split('-');
            updateData.dateOfBirth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          } else {
            updateData.dateOfBirth = dateOfBirth;
          }
        }
      }

      if (activeTab === 'contact') {
        updateData.contactInfo = { phone, address, city, country, postalCode };
      }

      if (activeTab === 'preferences') {
        updateData.notificationPreferences = {
          email: emailNotif,
          sms: smsNotif,
          push: pushNotif,
          bookingUpdates,
          promotions,
          reminders,
        };
      }

      const response = await apiClient.put('/profile', updateData);
      await refreshUser();

      // Check if there's a next update date in response
      if (response.data.data.nextUpdateAllowed) {
        setUpdateRestriction({
          canUpdate: false,
          daysRemaining: 7,
          nextUpdateDate: new Date(response.data.data.nextUpdateAllowed)
        });
      }

      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update profile';
      setError(errorMessage);
      
      // Check if error is due to 7-day restriction
      if (err.response?.status === 403 && err.response?.data?.data) {
        const restrictionData = err.response.data.data;
        setUpdateRestriction({
          canUpdate: false,
          daysRemaining: restrictionData.daysRemaining,
          nextUpdateDate: new Date(restrictionData.nextUpdateDate)
        });
        
        Alert.alert(
          'Update Restricted',
          `You can only update your profile once every 7 days. Please try again in ${restrictionData.daysRemaining} day(s).`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmergencyContact = async () => {
    if (!newEmergencyContact.name || !newEmergencyContact.relationship || !newEmergencyContact.phone) {
      Alert.alert('Error', 'Please fill all emergency contact fields');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/profile/emergency-contacts', newEmergencyContact);
      await refreshUser();
      setNewEmergencyContact({ name: '', relationship: '', phone: '' });
      Alert.alert('Success', 'Emergency contact added');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to add emergency contact');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEmergencyContact = async (index: number) => {
    try {
      setLoading(true);
      await apiClient.delete(`/profile/emergency-contacts/${index}`);
      await refreshUser();
      Alert.alert('Success', 'Emergency contact removed');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to remove emergency contact');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setUsername(user.username || '');
      setDateOfBirth(user.dateOfBirth || '');
      setPhone(user.contactInfo?.phone || '');
      setAddress(user.contactInfo?.address || '');
      setCity(user.contactInfo?.city || '');
      setCountry(user.contactInfo?.country || '');
      setPostalCode(user.contactInfo?.postalCode || '');
    }
    setError(null);
    setIsEditing(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderTabButton = (tab: TabType, icon: any, label: string) => (
    <TouchableOpacity
      onPress={() => {
        setActiveTab(tab);
        setIsEditing(false);
      }}
      className={`flex-1 py-3 items-center border-b-2 ${
        activeTab === tab ? 'border-[#0096c7]' : 'border-gray-200'
      }`}
    >
      {React.createElement(icon, {
        size: 20,
        color: activeTab === tab ? '#0096c7' : '#9CA3AF',
      })}
      <Text className={`text-xs mt-1 ${activeTab === tab ? 'text-[#0096c7] font-semibold' : 'text-gray-500'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderProfileTab = () => (
    <View>
      {/* Update Restriction Notice - DISABLED for testing */}
      {false && updateRestriction && !updateRestriction?.canUpdate && (activeTab === 'profile' || activeTab === 'contact') && (
        <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <View className="flex-row items-start">
            <Clock size={20} color="#F59E0B" />
            <View className="flex-1 ml-3">
              <Text className="text-yellow-800 font-semibold mb-1">Profile Update Restriction</Text>
              <Text className="text-yellow-700 text-sm">
                You can update your profile again in {updateRestriction?.daysRemaining || 0} day(s).
              </Text>
              <Text className="text-yellow-600 text-xs mt-1">
                Next update: {updateRestriction?.nextUpdateDate?.toLocaleDateString() || 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Profile Picture Section */}
      <View className="bg-white rounded-lg p-6 mb-4 shadow-sm">
        <Text className="text-lg font-bold text-gray-800 mb-4">Profile Picture</Text>
        
        {/* Profile Picture Upload Component */}
        <ProfilePictureUpload
          currentImageUrl={getProfilePictureUrl()}
          onUploadStart={handleProfilePictureUploadStart}
          onUploadSuccess={handleProfilePictureUploadSuccess}
          onUploadError={handleProfilePictureUploadError}
          onImageSelected={handleProfilePictureImageSelected}
          disabled={uploadingImage || !isEditing}
        />

        {/* Profile Picture Requirement Notice */}
        {!user?.profilePicture && (
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <View className="flex-row items-start">
              <AlertCircle size={20} color="#3B82F6" />
              <View className="flex-1 ml-3">
                <Text className="text-blue-800 font-semibold mb-1">Profile Picture Required for KYC</Text>
                <Text className="text-blue-700 text-sm">
                  You must upload a profile picture before you can submit KYC verification. This helps us verify your identity.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Delete Profile Picture Option */}
        {user?.profilePicture && isEditing && (
          <TouchableOpacity
            onPress={handleDeleteProfilePicture}
            disabled={uploadingImage}
            className="bg-red-50 border border-red-200 rounded-lg py-3 flex-row items-center justify-center mt-4"
            activeOpacity={0.7}
          >
            <Trash2 size={18} color="#EF4444" />
            <Text className="text-red-600 font-semibold ml-2">Delete Profile Picture</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="bg-white rounded-lg p-6 mb-4 shadow-sm">
        <Text className="text-lg font-bold text-gray-800 mb-4">Personal Information</Text>

        {/* Email (Read-only) */}
        <View className="mb-4 pb-4 border-b border-gray-200">
          <View className="flex-row items-center mb-2">
            <Mail size={16} color="#6B7280" />
            <Text className="text-sm font-semibold text-gray-600 ml-2">Email</Text>
          </View>
          <Text className="text-base text-gray-800 ml-6">{user?.email}</Text>
        </View>

        {/* Username */}
        <View className="mb-4">
          <View className="flex-row items-center mb-2">
            <UserIcon size={16} color="#6B7280" />
            <Text className="text-sm font-semibold text-gray-600 ml-2">Username</Text>
          </View>
          {isEditing ? (
            <TextInput
              value={username}
              onChangeText={setUsername}
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800"
              placeholder="Enter username"
              editable={!loading}
            />
          ) : (
            <Text className="text-base text-gray-800 ml-6">{user?.username || 'Not set'}</Text>
          )}
        </View>

        {/* Date of Birth */}
        <View className="mb-4">
          <View className="flex-row items-center mb-2">
            <Calendar size={16} color="#6B7280" />
            <Text className="text-sm font-semibold text-gray-600 ml-2">Date of Birth</Text>
          </View>
          {isEditing ? (
            <TextInput
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800"
              placeholder="YYYY-MM-DD"
              editable={!loading}
            />
          ) : (
            <Text className="text-base text-gray-800 ml-6">
              {user?.dateOfBirth ? formatDate(user.dateOfBirth) : 'Not set'}
            </Text>
          )}
        </View>

        {/* Member Since */}
        <View>
          <Text className="text-sm font-semibold text-gray-600 mb-2">Member Since</Text>
          <Text className="text-base text-gray-800">{formatDate(user?.createdAt)}</Text>
        </View>
      </View>
    </View>
  );

  const renderContactTab = () => (
    <View>
      <View className="bg-white rounded-lg p-6 mb-4 shadow-sm">
        <Text className="text-lg font-bold text-gray-800 mb-4">Contact Information</Text>

        {/* Phone */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-600 mb-2">Phone</Text>
          {isEditing ? (
            <TextInput
              value={phone}
              onChangeText={setPhone}
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800"
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              editable={!loading}
            />
          ) : (
            <Text className="text-base text-gray-800">{phone || 'Not set'}</Text>
          )}
        </View>

        {/* Address */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-600 mb-2">Address</Text>
          {isEditing ? (
            <TextInput
              value={address}
              onChangeText={setAddress}
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800"
              placeholder="Enter address"
              editable={!loading}
            />
          ) : (
            <Text className="text-base text-gray-800">{address || 'Not set'}</Text>
          )}
        </View>

        {/* City */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-600 mb-2">City</Text>
          {isEditing ? (
            <TextInput
              value={city}
              onChangeText={setCity}
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800"
              placeholder="Enter city"
              editable={!loading}
            />
          ) : (
            <Text className="text-base text-gray-800">{city || 'Not set'}</Text>
          )}
        </View>

        {/* Country */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-600 mb-2">Country</Text>
          {isEditing ? (
            <TextInput
              value={country}
              onChangeText={setCountry}
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800"
              placeholder="Enter country"
              editable={!loading}
            />
          ) : (
            <Text className="text-base text-gray-800">{country || 'Not set'}</Text>
          )}
        </View>

        {/* Postal Code */}
        <View>
          <Text className="text-sm font-semibold text-gray-600 mb-2">Postal Code</Text>
          {isEditing ? (
            <TextInput
              value={postalCode}
              onChangeText={setPostalCode}
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800"
              placeholder="Enter postal code"
              editable={!loading}
            />
          ) : (
            <Text className="text-base text-gray-800">{postalCode || 'Not set'}</Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderEmergencyTab = () => (
    <View>
      <View className="bg-white rounded-lg p-6 mb-4 shadow-sm">
        <Text className="text-lg font-bold text-gray-800 mb-4">Emergency Contacts</Text>

        {/* Existing Contacts */}
        {user?.emergencyContacts && user.emergencyContacts.length > 0 ? (
          user.emergencyContacts.map((contact, index) => (
            <View key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-800">{contact.name}</Text>
                  <Text className="text-sm text-gray-600 mt-1">{contact.relationship}</Text>
                  <Text className="text-sm text-gray-600 mt-1">{contact.phone}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveEmergencyContact(index)}
                  className="bg-red-100 p-2 rounded-lg"
                >
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text className="text-gray-500 text-center py-4">No emergency contacts added</Text>
        )}

        {/* Add New Contact */}
        <View className="mt-4 pt-4 border-t border-gray-200">
          <Text className="text-base font-semibold text-gray-800 mb-3">Add New Contact</Text>
          
          <TextInput
            value={newEmergencyContact.name}
            onChangeText={(text) => setNewEmergencyContact({ ...newEmergencyContact, name: text })}
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800 mb-3"
            placeholder="Name"
          />
          
          <TextInput
            value={newEmergencyContact.relationship}
            onChangeText={(text) => setNewEmergencyContact({ ...newEmergencyContact, relationship: text })}
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800 mb-3"
            placeholder="Relationship"
          />
          
          <TextInput
            value={newEmergencyContact.phone}
            onChangeText={(text) => setNewEmergencyContact({ ...newEmergencyContact, phone: text })}
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800 mb-3"
            placeholder="Phone"
            keyboardType="phone-pad"
          />
          
          <TouchableOpacity
            onPress={handleAddEmergencyContact}
            disabled={loading}
            className="bg-[#0096c7] rounded-lg py-3 flex-row items-center justify-center"
          >
            <UserPlus size={20} color="#FFFFFF" />
            <Text className="text-white font-semibold ml-2">Add Contact</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPreferencesTab = () => (
    <View>
      <View className="bg-white rounded-lg p-6 mb-4 shadow-sm">
        <Text className="text-lg font-bold text-gray-800 mb-4">Notification Preferences</Text>

        {/* Toggle switches */}
        {[
          { label: 'Email Notifications', value: emailNotif, setter: setEmailNotif },
          { label: 'SMS Notifications', value: smsNotif, setter: setSmsNotif },
          { label: 'Push Notifications', value: pushNotif, setter: setPushNotif },
          { label: 'Booking Updates', value: bookingUpdates, setter: setBookingUpdates },
          { label: 'Promotions', value: promotions, setter: setPromotions },
          { label: 'Reminders', value: reminders, setter: setReminders },
        ].map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => isEditing && item.setter(!item.value)}
            disabled={!isEditing}
            className="flex-row justify-between items-center py-4 border-b border-gray-200"
          >
            <Text className="text-base text-gray-800">{item.label}</Text>
            <View className={`w-12 h-6 rounded-full ${item.value ? 'bg-[#0096c7]' : 'bg-gray-300'}`}>
              <View className={`w-5 h-5 rounded-full bg-white mt-0.5 ${item.value ? 'ml-6' : 'ml-0.5'}`} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {fetchingProfile ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0096c7" />
          <Text className="text-gray-600 mt-4">Loading profile...</Text>
        </View>
      ) : (
        <>
          {/* Header */}
          <View className="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
            <TouchableOpacity onPress={onNavigateBack} className="mb-3 mt-4">
              <Text className="text-[#0096c7] text-base">← Back</Text>
            </TouchableOpacity>
            <View className="flex-row justify-between items-center">
              <Text className="text-2xl font-bold text-gray-800">My Profile</Text>
              {(activeTab === 'profile' || activeTab === 'contact' || activeTab === 'preferences') && !isEditing && (
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  className="bg-[#0096c7] rounded-full p-2"
                >
                  <Edit3 size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Tabs */}
          <View className="bg-white flex-row">
            {renderTabButton('profile', UserIcon, 'Profile')}
            {renderTabButton('contact', Phone, 'Contact')}
            {renderTabButton('emergency', Shield, 'Emergency')}
            {renderTabButton('preferences', Bell, 'Preferences')}
          </View>

          <ScrollView className="flex-1 px-6 py-6">
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'contact' && renderContactTab()}
            {activeTab === 'emergency' && renderEmergencyTab()}
            {activeTab === 'preferences' && renderPreferencesTab()}

            {/* Error Message */}
            {error && (
              <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <Text className="text-red-700 text-sm">{error}</Text>
              </View>
            )}

            {/* Edit Actions */}
            {isEditing && (activeTab === 'profile' || activeTab === 'contact' || activeTab === 'preferences') && (
              <View className="flex-row space-x-3 mb-6">
                <TouchableOpacity
                  onPress={handleCancelEdit}
                  disabled={loading}
                  className="flex-1 bg-gray-200 rounded-lg py-4 flex-row items-center justify-center mr-2"
                >
                  <X size={20} color="#374151" />
                  <Text className="text-gray-800 text-base font-semibold ml-2">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleUpdateProfile}
                  disabled={loading}
                  className={`flex-1 bg-[#0096c7] rounded-lg py-4 flex-row items-center justify-center ml-2 ${
                    loading ? 'opacity-50' : ''
                  }`}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Save size={20} color="#FFFFFF" />
                      <Text className="text-white text-base font-semibold ml-2">Save</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
};
