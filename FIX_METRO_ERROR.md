# Metro Bundler Error Fix

## Problem
You were experiencing a "runtime not ready: TypeError: property is not configurable" error in Metro bundler.

## Root Cause
The issue was caused by:
1. **Module-level code execution**: The `api.ts` config file was executing code and accessing `process.env` at module initialization time, before the React Native runtime was ready
2. **Incorrect Babel plugin**: Using `react-native-worklets/plugin` instead of `react-native-reanimated/plugin`

## Fixes Applied

### 1. Fixed `babel.config.js`
Changed from `react-native-worklets/plugin` to `react-native-reanimated/plugin` (which includes worklets support)

### 2. Fixed `src/config/api.ts`
- Converted to lazy initialization pattern
- Added safety checks for `process.env` access
- Removed module-level code execution
- Used cached values to prevent repeated initialization

## Steps to Complete the Fix

### 1. Clear Metro Bundler Cache
```cmd
cd frontend\my-expo-app
npx expo start -c
```

### 2. (Optional) Remove Unused Dependency
Since you're not using `react-native-worklets` directly:
```cmd
npm uninstall react-native-worklets
```

### 3. If Issue Persists - Full Clean
```cmd
rmdir /s /q node_modules
rmdir /s /q .expo
del /f /q package-lock.json
npm install
npx expo start -c
```

### 4. Restart Your Development Server
After clearing the cache, restart Expo:
```cmd
npx expo start
```

## What Changed

### Before (Problematic):
```typescript
// Executed immediately at module load
let baseURL = getBaseURL();
const config = { baseURL, timeout: 15000 };
export const API_BASE_URL = config.baseURL;
```

### After (Fixed):
```typescript
// Lazy initialization - only executed when needed
let cachedBaseURL: string | null = null;
const getBaseURL = (): string => {
  if (cachedBaseURL) return cachedBaseURL;
  // ... initialization logic
};
const getConfig = (): ApiConfig => {
  return { baseURL: getBaseURL(), timeout: 15000 };
};
export default getConfig();
```

## Why This Works
- Lazy initialization delays code execution until the runtime is ready
- Safety checks prevent accessing undefined properties
- Caching prevents repeated initialization
- Proper Babel plugin ensures correct code transformation

## Verification
After applying the fix, you should see:
- No "property is not configurable" errors
- Metro bundler starts successfully
- App loads without runtime errors
