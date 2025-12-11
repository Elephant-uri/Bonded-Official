import { Text, ImageBackground, View, StyleSheet, Animated, TouchableWithoutFeedback, Keyboard } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'
import ScreenWrapper from '../components/ScreenWrapper'
import { StatusBar } from 'expo-status-bar'
import { useAppTheme } from './theme'
import { hp, wp } from '../helpers/common'
import AnimatedLogo from '../components/AnimatedLogo'
import OTPInput from '../components/OTPInput'
import Button from '../components/Button'
import BackButton from '../components/BackButton'

export default function OTP() {
  const theme = useAppTheme()
  const styles = createStyles(theme)
  const router = useRouter()
  const { type, email, name, isVerified } = useLocalSearchParams()
  const [otpCode, setOtpCode] = useState('')
  const hoverValue = useRef(new Animated.Value(0)).current

  const isNewUser = type === 'new'

  useEffect(() => {
    const hoverAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(hoverValue, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(hoverValue, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    )

    hoverAnimation.start()
    return () => {
      hoverAnimation.stop()
      hoverValue.setValue(0)
    }
  }, [hoverValue])

  const hoverTranslate = hoverValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  })

  const handleOTPComplete = (code) => {
    setOtpCode(code)
  }

  const handleContinue = () => {
    // TODO: Verify OTP
    console.log('OTP Code:', otpCode)
    if (isNewUser) {
      // Navigate to onboarding for new users
      router.replace('/onboarding')
    } else {
      // Navigate to home for returning users
      router.replace('/home')
    }
  }

  return (
    <ImageBackground
      source={require('../assets/images/bonded-gradient.jpg')}
      style={styles.background}
      resizeMode='cover'
    >
      <ScreenWrapper bg='transparent'>
        <StatusBar style='light' />
        <BackButton onPress={() => router.back()} />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            {/* Conditional rendering based on user type */}
          {isNewUser ? (
            // NEW USER - Create Account View
            <View style={styles.contentContainer}>
              <Text style={styles.welcomeTitle}>Welcome!</Text>
              <Animated.View
                style={[
                  styles.linkContainer,
                  { transform: [{ translateY: hoverTranslate }] }
                ]}
              >
                <AnimatedLogo size={50} />
              </Animated.View>
              <Text style={styles.codePrompt}>
                We sent you a verification code to your email
              </Text>
            </View>
          ) : (
            // RETURNING USER - Welcome Back View
            <View style={styles.contentContainer}>
              <Text style={styles.welcomeBackTitle}>Welcome back!</Text>
              {name && (
                <Text style={styles.nameText}>{name}</Text>
              )}
              <Animated.View
                style={[
                  styles.linkContainer,
                  { transform: [{ translateY: hoverTranslate }] }
                ]}
              >
                <AnimatedLogo size={50} />
              </Animated.View>
              <Text style={styles.codePrompt}>
                We sent you a login code
              </Text>
              
              {/* Verification Badge */}
              {isVerified === 'true' && (
                <View style={styles.verificationBadge}>
                  <Text style={styles.badgeText}>✓ Student Verified</Text>
                </View>
              )}
            </View>
          )}

          {/* Shared OTP Input */}
          <Animated.View
            style={[
              styles.otpContainer,
              { transform: [{ translateY: hoverTranslate }] }
            ]}
          >
            <OTPInput
              length={4}
              onComplete={handleOTPComplete}
              value={otpCode}
              onChangeText={setOtpCode}
            />
          </Animated.View>

          {/* Continue Button */}
          <Button
            title="Continue"
            onPress={handleContinue}
            buttonStyle={styles.button}
          />
          </View>
        </TouchableWithoutFeedback>
      </ScreenWrapper>
    </ImageBackground>
  )
}

const createStyles = (theme) => StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: hp(4),
  },
  welcomeTitle: {
    color: theme.colors.textPrimary,
    fontSize: hp(5),
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(3),
  },
  welcomeBackTitle: {
    color: theme.colors.textPrimary,
    fontSize: hp(4),
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(1),
  },
  nameText: {
    color: theme.colors.bondedPurple,
    fontSize: hp(3),
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(3),
  },
  linkContainer: {
    marginVertical: hp(2),
  },
  codePrompt: {
    color: theme.colors.textSecondary,
    fontSize: hp(2.2),
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.body,
    marginTop: hp(2),
    paddingHorizontal: wp(4),
  },
  verificationBadge: {
    backgroundColor: theme.colors.success + '20',
    borderWidth: 1,
    borderColor: theme.colors.success,
    borderRadius: theme.radius.pill,
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(4),
    marginTop: hp(2),
  },
  badgeText: {
    color: theme.colors.success,
    fontSize: hp(1.8),
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.heading,
  },
  otpContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: hp(4),
  },
  button: {
    width: '100%',
    marginTop: hp(2),
  },
})

