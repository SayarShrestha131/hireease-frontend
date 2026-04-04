/**
 * ProfileScreen Unit Tests
 * 
 * Tests for profile picture management integration
 * Requirements: 1.1, 1.2, 1.6, 1.7
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { ProfileScreen } from '../ProfileScreen';
import { useAuth } from '../../contexts/AuthContext';

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../../services/apiClient');
jest.mock('expo-image-picker');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ProfileScreen - Profile Picture Management', () => {
  const mockOnNavigateBack = jest.fn();
  const mockRefreshUser = jest.fn();
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display ProfilePictureUpload component', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        profilePicture: null,
      },
      logout: mockLogout,
      refreshUser: mockRefreshUser,
      isAuthenticated: true,
      loading: false,
    } as any);

    const { getByText } = render(
      <ProfileScreen onNavigateBack={mockOnNavigateBack} />
    );

    await waitFor(() => {
      expect(getByText('Profile Picture')).toBeTruthy();
    });
  });

  it('should show KYC requirement notice when no profile picture exists', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        profilePicture: null,
      },
      logout: mockLogout,
      refreshUser: mockRefreshUser,
      isAuthenticated: true,
      loading: false,
    } as any);

    const { getByText } = render(
      <ProfileScreen onNavigateBack={mockOnNavigateBack} />
    );

    await waitFor(() => {
      expect(getByText('Profile Picture Required for KYC')).toBeTruthy();
      expect(getByText(/You must upload a profile picture before you can submit KYC verification/)).toBeTruthy();
    });
  });

  it('should not show KYC requirement notice when profile picture exists', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        profilePicture: 'profile123.jpg',
      },
      logout: mockLogout,
      refreshUser: mockRefreshUser,
      isAuthenticated: true,
      loading: false,
    } as any);

    const { queryByText } = render(
      <ProfileScreen onNavigateBack={mockOnNavigateBack} />
    );

    await waitFor(() => {
      expect(queryByText('Profile Picture Required for KYC')).toBeNull();
    });
  });

  it('should display delete button when profile picture exists', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        profilePicture: 'profile123.jpg',
      },
      logout: mockLogout,
      refreshUser: mockRefreshUser,
      isAuthenticated: true,
      loading: false,
    } as any);

    const { getByText } = render(
      <ProfileScreen onNavigateBack={mockOnNavigateBack} />
    );

    await waitFor(() => {
      expect(getByText('Delete Profile Picture')).toBeTruthy();
    });
  });

  it('should not display delete button when no profile picture exists', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        profilePicture: null,
      },
      logout: mockLogout,
      refreshUser: mockRefreshUser,
      isAuthenticated: true,
      loading: false,
    } as any);

    const { queryByText } = render(
      <ProfileScreen onNavigateBack={mockOnNavigateBack} />
    );

    await waitFor(() => {
      expect(queryByText('Delete Profile Picture')).toBeNull();
    });
  });
});
