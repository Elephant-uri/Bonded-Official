# Debugging OTP Login Issues

## Current Issue
- OTP codes are expiring or invalid
- Rate limiting from multiple failed attempts

## How OTP Works in Your App

1. **User enters email** → App calls `signInWithOtp()`
2. **Supabase sends 6-digit code** via email
3. **User enters code** → App calls `verifyOtp()`
4. **If valid** → User is logged in

## Common Issues & Fixes

### 1. Emails Not Being Sent

**Check Supabase Email Configuration:**
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Check if "Confirm signup" template is enabled
3. Check if SMTP is configured (or using default Supabase emails)

**Test if emails are being sent:**
- Check your spam/junk folder
- Use a personal email (Gmail, Yahoo, etc.) instead of .edu
- Check Supabase logs: Dashboard → Logs → Auth Logs

---

### 2. OTP Codes Expiring Too Fast

**Problem:** Supabase OTP codes expire in **60 seconds** by default

**Solutions:**

#### Option A: Increase OTP Expiration (Recommended)
1. Go to Supabase Dashboard → Authentication → Settings
2. Look for "OTP expiration" or "Magic link expiration"
3. Increase to 300 seconds (5 minutes) for testing

#### Option B: Use a Dedicated Test Account
```javascript
// For development only - add to login.jsx
const handleTestLogin = async () => {
  // Bypass OTP for testing
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'test-password-123',
  })
}
```

---

### 3. Rate Limiting

**Problem:** Supabase limits OTP requests to 1 per 60 seconds per email

**Solution:**
- Wait 60 seconds between requests (cooldown timer now added)
- Don't spam the resend button
- Use different email addresses for testing

---

### 4. Invalid Codes

**Common Causes:**
- Code already used (can only be used once)
- Wrong code entered (typo)
- Code expired (60 seconds)
- Old code from previous request

**Fix:**
- Request a new code (wait for cooldown)
- Copy/paste the code from email
- Use the most recent code

---

## Quick Test Steps

### Test 1: Check if Emails Are Sent
```
1. Enter email on login screen
2. Check console for: "✅ OTP sent successfully to: your@email.com"
3. Check email inbox (and spam)
4. If no email → Check Supabase email config
```

### Test 2: Verify OTP Works
```
1. Get a fresh OTP code
2. Enter it IMMEDIATELY (within 30 seconds)
3. Click "Verify Code"
4. Check console for success/error
```

### Test 3: Check Supabase Logs
```
1. Go to Supabase Dashboard
2. Click "Logs" → "Auth Logs"
3. Look for signInWithOtp and verifyOtp events
4. Check for errors
```

---

## Recommended Settings for Development

### Supabase Dashboard → Authentication → Settings

```
✅ Enable Email Confirmations: ON
✅ Enable Email OTP: ON
✅ Secure Email Change: ON
❌ Confirm Email: OFF (for faster testing)

OTP Expiration: 300 seconds (5 minutes)
Rate Limit Window: 60 seconds
Max Retries: 3
```

---

## Alternative: Skip OTP for Local Testing

If OTP is too painful for development, you can temporarily use password-based auth:

### 1. Create Test User in Supabase Dashboard
```
Email: test@bonded.local
Password: Test123!@#
```

### 2. Update Login Screen
```javascript
// Add this to login.jsx for development only
const DEV_MODE = __DEV__ && process.env.EXPO_PUBLIC_USE_PASSWORD_AUTH === 'true'

if (DEV_MODE) {
  // Use password auth for testing
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@bonded.local',
    password: 'Test123!@#',
  })
} else {
  // Use OTP for production
  await sendOTP(email)
}
```

### 3. Add to .env
```
EXPO_PUBLIC_USE_PASSWORD_AUTH=true
```

---

## Current Implementation Status

✅ **Fixed:**
- Added 60 second cooldown on screen load
- Better error messages
- Auto-clear code on resend
- Logging for debugging

⏳ **Still Need to Check:**
- Supabase email delivery (check spam folder)
- OTP expiration settings in Supabase
- Email template configuration

---

## Next Steps

1. **Check your email** - Look for the OTP code (including spam)
2. **Try with a different email** - Use Gmail/Yahoo instead of .edu
3. **Check Supabase Dashboard** - Verify email settings are correct
4. **Increase OTP expiration** - Change from 60s to 300s for testing
5. **Check Supabase logs** - See if OTP requests are succeeding

---

## Support Resources

- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- Supabase Email OTP: https://supabase.com/docs/guides/auth/auth-email
- Rate Limiting: https://supabase.com/docs/guides/auth/rate-limits
