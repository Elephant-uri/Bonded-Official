# Custom Alert System Implementation Guide

## 🚀 Quick Start

### 1. Replace Native Alerts in Your Components

#### Before (Native Alert.alert)
```jsx
import { Alert } from 'react-native'

const handleDelete = () => {
  Alert.alert(
    'Delete Event',
    'Are you sure you want to delete this event?',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive' }
    ]
  )
}
```

#### After (Custom Alert System)
```jsx
import { useCustomAlert } from '../hooks/useCustomAlert'

const MyComponent = () => {
  const { showDelete, AlertComponent } = useCustomAlert()

  const handleDelete = () => {
    showDelete(
      'Delete Event',
      'Are you sure you want to delete this event?',
      () => console.log('Deleted'),
      () => console.log('Cancelled')
    )
  }

  return (
    <View>
      {/* Your component content */}
      <AlertComponent />
    </View>
  )
}
```

## 📋 Migration Checklist

### Step 1: Update Imports
- [ ] Remove `Alert` from 'react-native' imports
- [ ] Add `useCustomAlert` hook import
- [ ] Keep other imports unchanged

### Step 2: Replace Alert.alert Calls
- [ ] Find all `Alert.alert()` usage
- [ ] Replace with appropriate hook method:
  - `showError()` for error messages
  - `showSuccess()` for success messages  
  - `showDelete()` for delete confirmations
  - `showConfirm()` for general confirmations

### Step 3: Add AlertComponent
- [ ] Add `<AlertComponent />` to component return
- [ ] Place at root level of component
- [ ] Ensure it's outside scroll views

## 🎨 Common Patterns

### Delete Confirmation
```jsx
const { showDelete } = useCustomAlert()

const handleDeleteItem = (id, title) => {
  showDelete(
    `Delete ${type}`,
    `Are you sure you want to delete "${title}"? This action cannot be undone.`,
    () => deleteItem(id),
    () => console.log('Delete cancelled')
  )
}
```

### Success Notification
```jsx
const { showSuccess } = useCustomAlert()

const handleSuccess = () => {
  showSuccess(
    'Success!',
    'Operation completed successfully.'
  )
}
```

### Error Display
```jsx
const { showError } = useCustomAlert()

const handleError = (error) => {
  showError(
    'Error',
    error.message || 'Something went wrong. Please try again.'
  )
}
```

## 🔧 Troubleshooting

### Common Issues

#### Alert Not Showing
**Problem**: Modal doesn't appear
**Solution**: 
1. Check if `<AlertComponent />` is rendered
2. Verify hook is called correctly
3. Check console for errors

#### Wrong Colors
**Problem**: Alert uses wrong theme colors
**Solution**:
1. Verify theme provider is wrapping component
2. Check theme color definitions
3. Test with different themes

#### Animation Issues
**Problem**: Animations are choppy
**Solution**:
1. Check if native driver is enabled
2. Test on lower-end devices
3. Reduce animation complexity

## 📱 Platform Considerations

### iOS
- Uses native Modal component
- Smooth animations by default
- Haptic feedback works natively

### Android
- May need additional permissions for haptics
- Test on different Android versions
- Check modal behavior on various screen sizes

## 🎯 Best Practices

### Performance
- Use `useCallback` for alert handlers
- Avoid inline function definitions
- Keep alert messages concise
- Don't nest alerts

### Accessibility
- Test with screen readers
- Ensure proper focus management
- Use semantic button labels
- Provide sufficient color contrast

### UX Guidelines
- Use clear, action-oriented titles
- Keep messages under 2 lines
- Provide obvious cancel options
- Use appropriate alert types

## 🔄 Integration Examples

### Calendar Component
```jsx
// In calendar.jsx
import { useCustomAlert } from '../hooks/useCustomAlert'

function Calendar() {
  const { showDelete, showSuccess, showError, AlertComponent } = useCustomAlert()

  const handleDeleteEvent = (eventId, title) => {
    showDelete(
      'Delete Event',
      `Are you sure you want to delete "${title}"?`,
      () => deleteEventMutation.mutateAsync(eventId)
    )
  }

  const handleCreateSuccess = () => {
    showSuccess('Success!', 'Event created successfully!')
  }

  const handleCreateError = (error) => {
    showError('Error', error.message || 'Failed to create event')
  }

  return (
    <SafeAreaView>
      {/* Calendar content */}
      <AlertComponent />
    </SafeAreaView>
  )
}
```

### Form Component
```jsx
// In any form component
import { useCustomAlert } from '../hooks/useCustomAlert'

function EventForm() {
  const { showConfirm, showError, AlertComponent } = useCustomAlert()

  const handleSubmit = async (data) => {
    try {
      await submitForm(data)
      showConfirm('Success!', 'Your changes have been saved.')
    } catch (error) {
      showError('Submission Failed', error.message)
    }
  }

  return (
    <View>
      <EventForm onSubmit={handleSubmit} />
      <AlertComponent />
    </View>
  )
}
```

## 📚 Additional Resources

- [Full Documentation](./CustomAlertSystem.md)
- [Component Source](../components/CustomAlert.jsx)
- [Hook Source](../hooks/useCustomAlert.js)
- [Theme System](../app/theme.js)

---

**Need help?** Check the full documentation or review implementation examples.
