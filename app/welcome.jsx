import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Animated, Easing, ImageBackground, StyleSheet, Text, useColorScheme, View } from 'react-native'
import AnimatedLogo from '../components/AnimatedLogo'
import Button from '../components/Button'
import ScreenWrapper from '../components/ScreenWrapper'
import { hp, wp } from '../helpers/common'
import { useAppTheme, useThemeMode } from './theme'

const phrases = [
  'Built in 24 hours.',
  'Find your people.',
  'Bond with your campus.',
  'Born at the hackathon.',
  'The future of campus.',
];

const welcome = () => {
  const theme = useAppTheme()
  const styles = createStyles(theme)
  const hoverValue = useRef(new Animated.Value(0)).current
  const phraseAnim = useRef(new Animated.Value(1)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const [phraseIndex, setPhraseIndex] = useState(0)
  const router = useRouter()
  const { setMode } = useThemeMode()
  const systemScheme = useColorScheme() || 'light'

  useLayoutEffect(() => {
    setMode('light')
    return () => {
      setMode(systemScheme)
    }
  }, [setMode, systemScheme])

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.loop(
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
    ]).start()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length)
    }, 2600)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    phraseAnim.setValue(0)
    Animated.timing(phraseAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start()
  }, [phraseIndex, phraseAnim])

  const hoverTranslate = hoverValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  })
  const phraseTranslate = phraseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-15, 0],
  })

  return (
    <ImageBackground
      source={require('../assets/images/bonded-gradient.jpg')}
      style={styles.background}
      resizeMode='cover'
    >
      <ScreenWrapper bg='transparent' >
        <StatusBar style='light' />
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>

          {/* Hackathon Badge */}
          <View style={styles.badgeContainer}>
            <View style={styles.glassBadge}>
              <Text style={styles.badgeText}>🚀 HACKATHON EDITION 2024</Text>
            </View>
          </View>

          {/* TITLE text */}
          <View style={styles.textGroup}>
            <AnimatedLogo size={70} />
            <Text style={styles.title}>Bonded: Find your people.</Text>
            <Animated.Text
              style={[
                styles.punchline,
                {
                  opacity: phraseAnim,
                  transform: [{ translateY: phraseTranslate }],
                },
              ]}
            >
              {phrases[phraseIndex]}
            </Animated.Text>

            <Animated.View style={[styles.metricsPill, { transform: [{ translateY: hoverTranslate }] }]}>
              <View style={styles.metricsIcon}>
                <Text style={styles.metricsFigure}>24h</Text>
              </View>
              <Text style={styles.metricsLabel}>built for the future</Text>
            </Animated.View>

          </View>

          {/* footer */}
          <View style={styles.footer}>
            <Button
              title="Get Started"
              buttonStyle={styles.mainButton}
              textStyle={styles.mainButtonText}
              onPress={() => router.push('/login')}
            />
            <Text style={styles.versionTag}>v1.0.0-hackathon</Text>
          </View>

        </Animated.View>

      </ScreenWrapper>
    </ImageBackground>
  )
}

export default welcome

const createStyles = (theme) => StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(6),
    paddingTop: hp(4),
    paddingBottom: hp(4),
  },
  badgeContainer: {
    marginTop: hp(2),
  },
  glassBadge: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)', // For web, but doesn't hurt native
  },
  badgeText: {
    color: '#FFF',
    fontSize: hp(1.2),
    fontWeight: '800',
    letterSpacing: 1,
  },
  textGroup: {
    gap: 20,
    alignItems: 'center',
    marginTop: hp(4),
  },
  title: {
    color: '#FFF',
    fontSize: hp(4.5),
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
    fontFamily: 'System',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  punchline: {
    textAlign: 'center',
    fontSize: hp(2.4),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'System',
  },
  metricsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: hp(1),
    paddingHorizontal: wp(5),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 999,
    marginTop: hp(2),
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  metricsIcon: {
    backgroundColor: theme.colors.bondedPurple,
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: 6,
  },
  metricsFigure: {
    fontSize: hp(1.8),
    fontWeight: '900',
    color: '#FFF',
  },
  metricsLabel: {
    fontSize: hp(1.6),
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: hp(2),
  },
  mainButton: {
    width: '100%',
    backgroundColor: '#FFF',
    height: hp(7),
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  mainButtonText: {
    color: theme.colors.bondedPurple,
    fontWeight: '800',
    fontSize: hp(2.2),
  },
  versionTag: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: hp(1.2),
    fontWeight: '600',
    letterSpacing: 2,
  },
})