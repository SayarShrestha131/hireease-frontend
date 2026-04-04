# ProfilePictureUpload Component

A reusable React Native component for uploading profile pictures with face validation support. Provides camera and gallery options, image preview, upload progress tracking, and comprehensive error handling.

## Features

- ✅ Camera capture with front-facing camera
- ✅ Gallery image selection
- ✅ Image preview before upload
- ✅ Upload progress indicator
- ✅ Face validation error handling
- ✅ User-friendly error messages with guidance
- ✅ Retry functionality after errors
- ✅ Disabled state support
- ✅ Current image display
- ✅ Responsive design with NativeWind/Tailwind CSS

## Requirements

This component validates the following requirements:
- **1.1**: Profile picture prerequisite enforcement
- **1.2**: KYC form access control based on profile picture
- **1.3**: Face validation on upload
- **1.4**: Real person detection (not side profile or blurry)
- **1.5**: Clear error messages with retry guidance

## Installation

The component is already part of the project. Import it from the components directory:

```typescript
import { ProfilePictureUpload } from '../components/ProfilePictureUpload';
// or
import { ProfilePictureUpload } from '../components';
```

## Dependencies

- `expo-image-picker`: For camera and gallery access
- `lucide-react-native`: For icons
- `react-native`: Core React Native components

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `currentImageUrl` | `string \| null` | No | `undefined` | URL of the current profile picture to display |
| `onUploadStart` | `() => void` | No | `undefined` | Callback fired when upload begins |
| `onUploadSuccess` | `(imageUri: string) => void` | No | `undefined` | Callback fired when upload succeeds |
| `onUploadError` | `(error: string) => void` | No | `undefined` | Callback fired when upload fails |
| `onImageSelected` | `(imageUri: string) => void` | No | `undefined` | Callback fired when user selects an image |
| `disabled` | `boolean` | No | `false` | Disables all upload interactions |

## Usage Examples

### Basic Usage

```typescript
import { ProfilePictureUpload } from '../components';

export const MyScreen = () => {
  return (
    <View>
      <ProfilePictureUpload />
    </View>
  );
};
```

### With Current Image

```typescript
import { ProfilePictureUpload } from '../components';

export const MyScreen = () => {
  const currentImageUrl = 'https://api.example.com/profile/picture/user123.jpg';
  
  return (
    <View>
      <ProfilePictureUpload currentImageUrl={currentImageUrl} />
    </View>
  );
};
```

### With Upload Handling

```typescript
import { ProfilePictureUpload } from '../components';
import apiClient from '../services/apiClient';

export const MyScreen = () => {
  const handleImageSelected = async (imageUri: string) => {
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('profilePicture', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      await apiClient.post('/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Profile picture uploaded!');
    } catch (error) {
      Alert.alert('Error', 'Upload failed');
    }
  };

  return (
    <View>
      <ProfilePictureUpload onImageSelected={handleImageSelected} />
    </View>
  );
};
```

### With All Callbacks

```typescript
import { ProfilePictureUpload } from '../components';

export const MyScreen = () => {
  const [status, setStatus] = useState('idle');

  return (
    <View>
      <Text>Status: {status}</Text>
      <ProfilePictureUpload
        onUploadStart={() => setStatus('Uploading...')}
        onUploadSuccess={(uri) => setStatus('Success!')}
        onUploadError={(error) => setStatus(`Error: ${error}`)}
        onImageSelected={(uri) => setStatus('Image selected')}
      />
    </View>
  );
};
```

### Disabled State

```typescript
import { ProfilePictureUpload } from '../components';

export const MyScreen = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <View>
      <ProfilePictureUpload disabled={isSubmitting} />
    </View>
  );
};
```

## Permissions

The component automatically requests the following permissions:

- **Camera**: Required for taking photos
- **Media Library**: Required for selecting from gallery

If permissions are denied, the component displays an alert explaining why the permission is needed.

## Error Handling

The component handles various error scenarios:

### Face Validation Errors

When a face validation error occurs (e.g., "No face detected"), the component displays:
- Error message
- Helpful tips for taking a good profile picture
- Retry button

### Permission Errors

When permissions are denied:
- Alert dialog explaining the required permission
- No further action until permission is granted

### Upload Errors

When upload fails:
- Error message display
- Retry button
- Error callback invoked (if provided)

## Image Requirements

The component enforces the following requirements (displayed to users):

- Clear frontal face photo
- Good lighting, no shadows
- No sunglasses or face coverings
- Supported formats: JPEG, PNG
- Maximum size: 5MB

## Camera Configuration

The component uses the following camera settings:

- **Camera Type**: Front-facing (for selfies)
- **Aspect Ratio**: 1:1 (square)
- **Quality**: 0.8 (80%)
- **Editing**: Enabled (allows cropping/adjustments)

## Styling

The component uses NativeWind/Tailwind CSS classes for styling. Key style features:

- Responsive layout
- Consistent color scheme (primary: #0096c7)
- Clear visual hierarchy
- Accessible touch targets
- Loading states with overlays
- Error states with red accents
- Success states with green accents

## Accessibility

The component includes:

- Clear button labels
- Visual feedback for all interactions
- Loading indicators during processing
- Error messages with actionable guidance
- Disabled state visual indicators

## Testing

Unit tests are provided in `__tests__/ProfilePictureUpload.test.tsx`. Tests cover:

- Rendering in various states
- Permission handling
- Image selection flow
- Error handling
- Callback invocation
- Camera configuration
- Disabled state

Run tests with:
```bash
npm test ProfilePictureUpload.test.tsx
```

## Integration with Backend

The component is designed to work with the backend profile picture upload endpoint:

**Endpoint**: `POST /api/profile/picture`

**Request**:
- Content-Type: `multipart/form-data`
- Field: `profilePicture` (file)

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "profilePicture": "filename.jpg"
    }
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "No face detected in image"
}
```

## Face Validation

The backend performs face validation using face-api.js:

1. Detects face presence in uploaded image
2. Validates face quality (frontal, clear, not blurry)
3. Checks for real person (liveness detection)
4. Returns validation results

If validation fails:
- Uploaded file is deleted
- Error message is returned
- Component displays error with guidance

## Best Practices

1. **Always handle the `onImageSelected` callback** to upload the image to your server
2. **Use the `disabled` prop** during form submission or other operations
3. **Provide `currentImageUrl`** to show existing profile pictures
4. **Handle errors gracefully** with the `onUploadError` callback
5. **Show loading states** using the `onUploadStart` callback
6. **Test on both iOS and Android** as image picker behavior may differ

## Troubleshooting

### Images not displaying
- Check that the image URL is accessible
- Verify CORS settings if loading from external server
- Ensure proper authentication headers are included

### Camera not opening
- Verify camera permissions are granted
- Check device has a camera
- Test on physical device (camera may not work in simulator)

### Upload failing
- Check network connectivity
- Verify API endpoint is correct
- Check file size is within limits
- Ensure proper authentication token

### Face validation failing
- Ensure good lighting
- Face camera directly
- Remove sunglasses/masks
- Use clear, non-blurry images

## Related Components

- `FaceVerificationTestModal`: For testing face verification
- `ProfileScreen`: Uses this component for profile management
- `KYCSubmissionScreen`: Requires profile picture before KYC submission

## Future Enhancements

Potential improvements for future versions:

- [ ] Real-time face detection preview
- [ ] Image compression before upload
- [ ] Multiple image format support
- [ ] Drag-and-drop support (web)
- [ ] Image filters/adjustments
- [ ] Batch upload support
- [ ] Cloud storage integration
- [ ] Progress tracking for large files

## License

Part of the Enhanced KYC Face Verification system.
