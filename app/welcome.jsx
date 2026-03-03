import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import AnimatedLogo from '../components/AnimatedLogo'
import Button from '../components/Button'
import CachedImageBackground from '../components/CachedImageBackground'
import ScreenWrapper from '../components/ScreenWrapper'
import { hp, wp } from '../helpers/common'
import { useAppTheme } from './theme'

const phrases = [
  'New friends.',
  'New roommates.',
  'New clubs.',
  'New organizations.',
  'New classes.',
  'New connections.',
];

const welcome = () => {
  const theme = useAppTheme()
  const styles = createStyles(theme)
  const hoverValue = useRef(new Animated.Value(0)).current
  const phraseAnim = useRef(new Animated.Value(1)).current
  const [phraseIndex, setPhraseIndex] = useState(0)
  const router = useRouter()

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
    <CachedImageBackground
      source={require('../assets/images/bonded-gradient.jpg')}
      style={styles.background}
    >
      <ScreenWrapper bg='transparent' >
        <StatusBar style='light' />
        <View style={styles.container}>


          {/* TITLE text */}
          <View style={styles.textGroup}>
            {/* welcome image */}
            <AnimatedLogo size={60} />
            <Text style={styles.title}>Find your people on campus.</Text>
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
              <Text style={styles.metricsFigure}>1K+</Text>
              <Text style={styles.metricsLabel}>students already bonded</Text>
            </Animated.View>

          </View>

          {/* footer */}
          <View style={styles.footer}>
            <Button
              title="Get Started"
              buttonStyle={{ marginHorizontal: wp(4) }}
              onPress={() => router.push('/login')}
            />


          </View>

        </View>

      </ScreenWrapper>
    </CachedImageBackground>
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: wp(2),
    paddingTop: hp(6),
    gap: hp(4),
  },
  textGroup: {
    gap: 25,
    alignItems: 'center',
    paddingHorizontal: wp(5),
    marginTop: hp(0),
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: hp(5),
    textAlign: 'center',
    letterSpacing: -0.5,
    fontFamily: theme.typography.fontFamily.extrabold,
  },
  punchline: {
    textAlign: 'center',
    fontSize: hp(3),
    paddingHorizontal: wp(4),
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.medium,
  },
  metricsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    marginTop: hp(2.5),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#4b1b72',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  metricsFigure: {
    fontSize: hp(2.2),
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.extrabold,
  },
  metricsLabel: {
    fontSize: hp(1.8),
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
  },
  footer: {
    width: '100%',
    paddingBottom: hp(4),
  },
})