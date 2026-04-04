# KYCStatusScreen Resubmission Window - Manual Test Guide

## Test Scenario 1: Active Resubmission Window (Within 24 Hours)

### Setup
1. Have a rejected KYC submission with `reviewedAt` timestamp less than 24 hours ago
2. Navigate to KYC Status Screen

### Expected Behavior
- ✅ Display "Rejected" status with red icon
- ✅ Show rejection reason from admin in red box
- ✅ Display "Resubmission Window" section with yellow background
- ✅ Show countdown timer in format HH:MM:SS
- ✅ Timer updates every second
- ✅ "Resubmit Locked" button is displayed (disabled, gray background)
- ✅ Info text: "Resubmission will be available after the 24-hour waiting period"

### Test Steps
1. Open the app and navigate to KYC Status
2. Verify all UI elements are displayed correctly
3. Wait 5-10 seconds and verify timer counts down
4. Try tapping the "Resubmit Locked" button
5. Verify alert shows: "You must wait 24 hours after rejection before resubmitting"

---

## Test Scenario 2: Expired Resubmission Window (After 24 Hours)

### Setup
1. Have a rejected KYC submission with `reviewedAt` timestamp more than 24 hours ago
2. Navigate to KYC Status Screen

### Expected Behavior
- ✅ Display "Rejected" status with red icon
- ✅ Show rejection reason from admin in red box
- ✅ NO "Resubmission Window" section displayed
- ✅ NO countdown timer displayed
- ✅ "Resubmit KYC" button is displayed (enabled, blue background)
- ✅ Info text: "Please review the rejection reason and resubmit with corrected information"

### Test Steps
1. Open the app and navigate to KYC Status
2. Verify countdown timer is NOT displayed
3. Verify "Resubmit KYC" button is enabled (blue)
4. Tap the "Resubmit KYC" button
5. Verify navigation to KYC submission form with pre-populated data

---

## Test Scenario 3: Timer Transition (Window Expiring)

### Setup
1. Have a rejected KYC submission with `reviewedAt` timestamp exactly 23:59:55 ago
2. Navigate to KYC Status Screen

### Expected Behavior
- ✅ Initially shows countdown timer: 00:00:05
- ✅ Timer counts down: 00:00:04, 00:00:03, 00:00:02, 00:00:01, 00:00:00
- ✅ When timer reaches 00:00:00, countdown section disappears
- ✅ Button changes from "Resubmit Locked" (gray) to "Resubmit KYC" (blue)
- ✅ Info text updates automatically

### Test Steps
1. Open the app and navigate to KYC Status
2. Watch the timer count down to zero
3. Verify UI updates automatically when timer expires
4. Verify button becomes enabled without page refresh

---

## Test Scenario 4: Pull-to-Refresh

### Setup
1. Have a rejected KYC submission
2. Navigate to KYC Status Screen

### Expected Behavior
- ✅ Pull down to refresh
- ✅ Loading indicator appears
- ✅ KYC status is re-fetched from API
- ✅ Timer recalculates based on fresh data
- ✅ UI updates with latest information

### Test Steps
1. Open the app and navigate to KYC Status
2. Pull down on the screen to trigger refresh
3. Verify loading indicator appears
4. Verify timer recalculates correctly after refresh

---

## Test Scenario 5: No Rejection (Other Statuses)

### Setup
1. Have a KYC submission with status "pending" or "approved"
2. Navigate to KYC Status Screen

### Expected Behavior
- ✅ NO countdown timer displayed
- ✅ NO "Resubmission Window" section
- ✅ Appropriate status UI for pending/approved state

### Test Steps
1. Test with pending submission - verify no timer
2. Test with approved submission - verify no timer
3. Test with no submission - verify no timer

---

## Edge Cases to Test

### Edge Case 1: Exactly 24 Hours
- Rejection timestamp exactly 24:00:00 ago
- Expected: Button should be enabled, no timer

### Edge Case 2: Just Under 24 Hours
- Rejection timestamp 23:59:59 ago
- Expected: Timer shows 00:00:01, button disabled

### Edge Case 3: Multiple Rejections
- User has multiple rejected submissions
- Expected: Timer calculates from most recent rejection

### Edge Case 4: Missing reviewedAt
- Rejected submission without reviewedAt timestamp
- Expected: Button enabled, no timer (graceful fallback)

---

## Requirements Validation

### Requirement 8.1: Display rejection reason from admin
- ✅ Rejection reason displayed in red box with "Rejection Reason" header

### Requirement 8.2: Show rejection message to user
- ✅ Admin's rejection reason is visible in the UI

### Requirement 8.3: Display resubmission window countdown
- ✅ Countdown timer displayed when within 24-hour window

### Requirement 8.4: Prevent resubmission for 24 hours
- ✅ Button disabled when within window
- ✅ Alert shown if user tries to resubmit early

### Requirement 8.5: Display remaining wait time in error message
- ✅ Alert message includes remaining hours and minutes

### Requirement 8.6: Enable resubmit button after 24 hours
- ✅ Button automatically enables when timer expires
- ✅ Button enabled if window already expired on load

---

## Implementation Checklist

- ✅ Import Timer icon from lucide-react-native
- ✅ Add state for remainingTime (hours, minutes, seconds, totalMs)
- ✅ Add state for canResubmit boolean
- ✅ Add useEffect to calculate remaining time every second
- ✅ Update handleResubmitKYC to check canResubmit and show alert
- ✅ Update renderRejectedState to show countdown timer
- ✅ Update renderRejectedState to conditionally disable button
- ✅ Update renderRejectedState to show appropriate info text
- ✅ Clean up interval on unmount
- ✅ Handle edge cases (no reviewedAt, expired window, etc.)

---

## Notes

- Timer updates every 1000ms (1 second) for smooth countdown
- Calculation uses milliseconds for precision
- Button styling changes based on canResubmit state
- Alert prevents navigation if window not expired
- Timer automatically cleans up on component unmount
- Works with pull-to-refresh to recalculate timer
