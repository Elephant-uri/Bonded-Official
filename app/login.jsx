import { Text, ImageBackground, View, StyleSheet, Animated, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'expo-router'
import ScreenWrapper from '../components/ScreenWrapper'
import { StatusBar } from 'expo-status-bar'
import { useAppTheme } from './theme'
import { hp, wp } from '../helpers/common'
import AnimatedLogo from '../components/AnimatedLogo'
import Input from '../components/Input'
import Button from '../components/Button'
import BackButton from '../components/BackButton'

export default function Login() {
  const theme = useAppTheme()
  const styles = createStyles(theme)
  const router = useRouter()
  const [email, setEmail] = useState('')
  const hoverValue = useRef(new Animated.Value(0)).current

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

  const handleContinue = () => {
    
    const trimmedEmail = email.trim()
    
    if (!trimmedEmail) {
      Alert.alert('Error', 'Please enter your email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address')
      return
    }


    // TODO: Replace with actual email check using useCheckEmail hook
    // For now, simulate checking - you'll replace this with:
    // const { data: userExists } = useCheckEmail(trimmedEmail)
    // const isNewUser = !userExists
    
    // Temporary: Simulate new user for testing
    const isNewUser = true // Replace with actual check
    
    // Navigate to OTP screen
    const route = `/otp?type=${isNewUser ? 'new' : 'returning'}&email=${encodeURIComponent(trimmedEmail)}`
    
    
    try {
      router.push(route)
    } catch (error) {
      console.error('❌ Navigation error:', error)
      Alert.alert('Navigation Error', error.message || 'Failed to navigate')
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
            <AnimatedLogo size={60} style={styles.animatedLogo} />
            <Text style={styles.title}>Please enter your email to continue.</Text>
            
            <Animated.View 
              style={[
                styles.inputContainer,
                { transform: [{ translateY: hoverTranslate }] }
              ]}
            >
              <Input
                placeholder="your.email@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                containerStyle={styles.inputWrapper}
              />
              
             
            </Animated.View>
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
  animatedLogo: {
    marginTop: hp(-20),
    marginBottom: hp(4),
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: hp(3.5),
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(6),
    paddingHorizontal: wp(4),
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
    gap: hp(3),
  },
  inputWrapper: {
    width: '100%',
  },
  button: {
    width: '100%',
    marginTop: hp(10),
  },
})