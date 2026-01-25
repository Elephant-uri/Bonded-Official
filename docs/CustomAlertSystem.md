# Custom Alert System Documentation

## Overview

The Custom Alert System replaces React Native's native `Alert.alert()` with a modern, branded, and accessible modal system that follows 2024 mobile app design standards.

## 🎯 Problem Solved

### Issues with Native Alert.alert()
- **No design control** - Can't match app branding or theme
- **Disruptive UX** - Abrupt screen blocking with no animations
- **Limited customization** - Fixed button text and styling
- **Poor accessibility** - Limited focus management
- **Outdated pattern** - Modern apps use custom modals (Instagram, TikTok, Snapchat)

### Industry Standards 2024
- **Instagram/TikTok/Snapchat** - All use custom modal designs
- **Material Design 3** - Custom dialog components with smooth animations
- **iOS Human Interface** - Custom alerts with app branding
- **Progressive enhancement** - Smooth transitions and haptic feedback

## 🏗️ Architecture

### Components

#### 1. CustomAlert Component
```jsx
<CustomAlert
  visible={visible}
  onClose={onClose}
  type={ALERT_TYPES.DELETE}
  title="Delete Event"
  message="This action cannot be undone."
  buttons={buttons}
  onButtonPress={handleButtonPress}
/>
```

**Features:**
- **Animated transitions** - Fade and scale animations
- **Theme integration** - Uses app color scheme
- **Type-specific styling** - Different colors for different alert types
- **Haptic feedback** - Enhanced touch feedback
- **Accessibility** - Proper focus management

#### 2. useCustomAlert Hook
```jsx
const { showDelete, showSuccess, showError, AlertComponent } = useCustomAlert()

// Usage examples
showDelete('Delete Event', 'Are you sure?', onDelete, onCancel)
showSuccess('Success!', 'Event created successfully')
showError('Error', 'Failed to create event')
```

**API:**
- `showDelete(title, message, onDelete, onCancel)`
- `showSuccess(title, message, onDismiss)`
- `showError(title, message, onDismiss)`
- `showConfirm(title, message, onConfirm, onCancel)`
- `AlertComponent` - Render the modal

## 🎨 Design System

### Alert Types

| Type | Icon | Colors | Use Case |
|-------|-------|---------|-----------|
| `DELETE` | 🗑️ | Red theme | Destructive actions |
| `SUCCESS` | ✅ | Green theme | Positive feedback |
| `ERROR` | ❌ | Red theme | Error states |
| `INFO` | ℹ️ | Blue theme | Informational |
| `CONFIRM` | ❓ | Primary theme | Confirmations |

### Styling

#### Container
- **Rounded corners** (16px radius)
- **Shadow elevation** (8px)
- **Border** (2px with theme color)
- **Max width** (screen width - 40px)

#### Animations
- **Fade in/out** (200ms duration)
- **Scale animation** (spring physics)
- **Native driver** for performance

#### Buttons
- **Primary action** - Full width, theme color
- **Secondary action** - Outline style, cancel color
- **Destructive action** - Red background, white text

## 📱 Implementation Guide

### 1. Setup Hook
```jsx
import { useCustomAlert } from '../hooks/useCustomAlert'

function MyComponent() {
  const { showDelete, AlertComponent } = useCustomAlert()
  
  return (
    <View>
      {/* Your component content */}
      <AlertComponent />
    </View>
  )
}
```

### 2. Show Alerts
```jsx
// Delete confirmation
showDelete(
  'Delete Event',
  'This action cannot be undone.',
  () => deleteEvent(id),
  () => console.log('cancelled')
)

// Success notification
showSuccess(
  'Event Created!',
  'Your event was created successfully.'
)

// Error message
showError(
  'Creation Failed',
  'Please check your connection and try again.'
)
```

### 3. Integration with Existing Code

#### Replace Alert.alert calls
```jsx
// Before
Alert.alert('Delete Event', 'Are you sure?', [
  { text: 'Cancel', style: 'cancel' },
  { text: 'Delete', style: 'destructive' }
])

// After
showDelete('Delete Event', 'Are you sure?', onDelete, onCancel)
```

## 🔧 Technical Details

### File Structure
```
/components/CustomAlert.jsx     # Modal component
/hooks/useCustomAlert.js        # React hook
/docs/CustomAlertSystem.md      # This documentation
```

### Dependencies
- React Native (Modal, Animated, Dimensions)
- Expo Haptics for touch feedback
- App theme system for colors
- SafeAreaView for proper insets

### Performance Considerations
- **Native driver** for animations (60fps)
- **Optimized re-renders** with useCallback
- **Memory efficient** - Single modal instance
- **Fast animations** - 200ms transitions

## 🎯 Best Practices

### When to Use
- **Critical actions** - Delete, confirm important changes
- **Success feedback** - After successful operations
- **Error states** - When operations fail
- **User guidance** - Important information

### When NOT to Use
- **Non-critical info** - Use toast notifications instead
- **Frequent actions** - Consider inline confirmations
- **Multi-step flows** - Use dedicated screens
- **Optional features** - Use less disruptive UI

### Content Guidelines
- **Clear titles** - Maximum 2-3 words
- **Concise messages** - Maximum 2-3 lines
- **Action-oriented buttons** - Clear verb-based labels
- **Consistent terminology** - Match app language

## 🔄 Migration Guide

### Step 1: Import Hook
```jsx
import { useCustomAlert } from '../hooks/useCustomAlert'
```

### Step 2: Replace Alert.alert
```jsx
// Find all Alert.alert calls
Alert.alert('Title', 'Message', buttons)

// Replace with appropriate hook method
showError('Title', 'Message')  // For errors
showSuccess('Title', 'Message') // For success
showDelete('Title', 'Message', onDelete, onCancel) // For deletions
```

### Step 3: Add AlertComponent
```jsx
// Add to component return
return (
  <View>
    {/* Existing content */}
    <AlertComponent />
  </View>
)
```

## 🎨 Theming

### Color Mapping
```javascript
const getAlertColors = (type) => {
  switch (type) {
    case ALERT_TYPES.DELETE:
      return {
        background: theme.colors.error + '15',
        border: theme.colors.error,
        icon: theme.colors.error,
        buttonBackground: theme.colors.error,
        buttonText: theme.colors.white,
      }
    // ... other types
  }
}
```

### Responsive Design
- **Max width**: Screen width - 40px
- **Padding**: 24px on all sides
- **Font scaling**: Responsive font sizes
- **Touch targets**: Minimum 44px button height

## 🧪 Testing

### Manual Testing Checklist
- [ ] All alert types render correctly
- [ ] Animations are smooth (60fps)
- [ ] Haptic feedback works
- [ ] Theme colors apply correctly
- [ ] Buttons are accessible
- [ ] Modal closes properly
- [ ] Screen reader support works

### Automated Testing
```javascript
// Test hook methods
describe('useCustomAlert', () => {
  it('should show delete alert', () => {
    const { showDelete } = renderHook(() => useCustomAlert())
    showDelete('Test', 'Message', jest.fn(), jest.fn())
    // Assert modal is visible with correct content
  })
})
```

## 🚀 Future Enhancements

### Planned Features
- **Toast notifications** - For non-critical feedback
- **Bottom sheets** - Less disruptive alternative
- **Custom animations** - Brand-specific transitions
- **Sound effects** - Audio feedback option
- **Accessibility improvements** - VoiceOver optimizations

### Performance Optimizations
- **Animation profiling** - Ensure 60fps on all devices
- **Memory monitoring** - Prevent memory leaks
- **Bundle size optimization** - Tree-shake unused features
- **Native modules** - Consider native implementation

---

## 📞 Support

For questions or issues with the Custom Alert System:
1. Check this documentation
2. Review implementation examples
3. Test on different devices
4. Consult the component source code

**Last Updated**: January 2025
**Version**: 1.0.0
