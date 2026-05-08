/**
 * Notification Context
 * 
 * Manages app-wide notifications and real-time updates
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import apiClient from '../services/apiClient';

export interface Notification {
  id: string;
  type: 'vehicle_added' | 'booking_update' | 'kyc_update' | 'general';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  checkForNewVehicles: () => Promise<void>;
  setNavigateToVehicles: (callback: (() => void) | null) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastVehicleCheck, setLastVehicleCheck] = useState<Date>(new Date());
  const [navigateToVehiclesCallback, setNavigateToVehiclesCallback] = useState<(() => void) | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const showNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show popup alert for important notifications
    if (notification.type === 'vehicle_added') {
      Alert.alert(
        notification.title,
        notification.message,
        [
          { text: 'Dismiss', style: 'cancel' },
          { 
            text: 'View Vehicles', 
            onPress: () => {
              // Navigate to vehicles if callback is available
              if (navigateToVehiclesCallback) {
                navigateToVehiclesCallback();
              }
              markAsRead(newNotification.id);
            }
          }
        ]
      );
    }
  }, [navigateToVehiclesCallback]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const checkForNewVehicles = useCallback(async () => {
    try {
      console.log('[NotificationContext] Checking for new vehicles...');
      
      // Get vehicles added since last check
      const response = await apiClient.get(`/vehicles?sortBy=createdAt&order=desc&limit=5`);
      const vehicles = response.data.data.vehicles;

      console.log('[NotificationContext] Found', vehicles.length, 'recent vehicles');
      console.log('[NotificationContext] Last check time:', lastVehicleCheck.toISOString());

      // Check if any vehicles were added since last check
      const newVehicles = vehicles.filter((vehicle: any) => 
        new Date(vehicle.createdAt) > lastVehicleCheck
      );

      console.log('[NotificationContext] New vehicles since last check:', newVehicles.length);

      if (newVehicles.length > 0) {
        console.log('[NotificationContext] 🚗 Showing notification for new vehicles:', newVehicles.map((v: any) => v.name));
        
        // Show notification for new vehicles
        if (newVehicles.length === 1) {
          showNotification({
            type: 'vehicle_added',
            title: 'New Vehicle Available! 🚗',
            message: `${newVehicles[0].name} has been added to our fleet. Check it out now!`,
            data: { vehicle: newVehicles[0] }
          });
        } else {
          showNotification({
            type: 'vehicle_added',
            title: 'New Vehicles Available! 🚗',
            message: `${newVehicles.length} new vehicles have been added to our fleet. Browse them now!`,
            data: { vehicles: newVehicles }
          });
        }

        // Update last check time
        setLastVehicleCheck(new Date());
      }
    } catch (error) {
      console.error('[NotificationContext] Error checking for new vehicles:', error);
    }
  }, [lastVehicleCheck]);

  // Poll for new vehicles every 30 seconds
  useEffect(() => {
    const interval = setInterval(checkForNewVehicles, 30000);
    return () => clearInterval(interval);
  }, [checkForNewVehicles]);

  // Initial check when component mounts
  useEffect(() => {
    // Set initial check time to 5 minutes ago to catch recent additions
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    setLastVehicleCheck(fiveMinutesAgo);
    
    // Check immediately
    setTimeout(checkForNewVehicles, 2000);
  }, []);

  const setNavigateToVehicles = useCallback((callback: (() => void) | null) => {
    setNavigateToVehiclesCallback(callback);
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    showNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    checkForNewVehicles,
    setNavigateToVehicles,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Add displayName for debugging
NotificationProvider.displayName = 'NotificationProvider';

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
};