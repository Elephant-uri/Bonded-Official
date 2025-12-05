import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import theme from '../constants/theme'
import { hp, wp } from '../helpers/common'
import AppTopBar from '../components/AppTopBar'
import BottomNav from '../components/BottomNav'
import AppHeader from '../components/AppHeader'
import AppCard from '../components/AppCard'
import SectionHeader from '../components/SectionHeader'

export default function Settings() {
  const router = useRouter()
  const [darkMode, setDarkMode] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(false)

  const SettingItem = ({ icon, title, subtitle, onPress, rightComponent, showArrow = true }) => (
    <TouchableOpacity
      style={styles.settingItem}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIconContainer}>
          <Ionicons name={icon} size={hp(2.2)} color={theme.colors.bondedPurple} />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || (showArrow && (
        <Ionicons
          name="chevron-forward"
          size={hp(2)}
          color={theme.colors.softBlack}
          style={{ opacity: 0.5 }}
        />
      ))}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <AppHeader title="Settings" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Appearance */}
          <SectionHeader title="Appearance" />
          <AppCard style={styles.sectionCard}>
              <SettingItem
                icon="moon-outline"
                title="Dark Mode"
                subtitle="Switch to dark theme"
                rightComponent={
                  <Switch
                    value={darkMode}
                    onValueChange={setDarkMode}
                    trackColor={{ false: theme.colors.offWhite, true: theme.colors.bondedPurple }}
                    thumbColor={theme.colors.white}
                  />
                }
                showArrow={false}
              />
          </AppCard>

          {/* Notifications */}
          <SectionHeader title="Notifications" />
          <AppCard style={styles.sectionCard}>
              <SettingItem
                icon="notifications-outline"
                title="Push Notifications"
                subtitle="Receive notifications on your device"
                rightComponent={
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: theme.colors.offWhite, true: theme.colors.bondedPurple }}
                    thumbColor={theme.colors.white}
                  />
                }
                showArrow={false}
              />
              <SettingItem
                icon="mail-outline"
                title="Email Notifications"
                subtitle="Get notified via email"
                rightComponent={
                  <Switch
                    value={emailNotifications}
                    onValueChange={setEmailNotifications}
                    trackColor={{ false: theme.colors.offWhite, true: theme.colors.bondedPurple }}
                    thumbColor={theme.colors.white}
                  />
                }
                showArrow={false}
              />
          </AppCard>

          {/* Preferences */}
          <SectionHeader title="Preferences" />
          <AppCard style={styles.sectionCard}>
              <SettingItem
                icon="person-outline"
                title="Edit Profile"
                onPress={() => router.push('/profile')}
              />
              <SettingItem
                icon="lock-closed-outline"
                title="Privacy & Security"
                onPress={() => {}}
              />
              <SettingItem
                icon="language-outline"
                title="Language"
                subtitle="English"
                onPress={() => {}}
              />
          </AppCard>

          {/* About */}
          <SectionHeader title="About" />
          <AppCard style={styles.sectionCard}>
              <SettingItem
                icon="help-circle-outline"
                title="Help & Support"
                onPress={() => {}}
              />
              <SettingItem
                icon="document-text-outline"
                title="Terms of Service"
                onPress={() => {}}
              />
              <SettingItem
                icon="shield-checkmark-outline"
                title="Privacy Policy"
                onPress={() => {}}
              />
              <SettingItem
                icon="information-circle-outline"
                title="App Version"
                subtitle="1.0.0"
                showArrow={false}
              />
          </AppCard>

          {/* Account */}
          <SectionHeader title="Account" />
          <AppCard style={styles.sectionCard}>
              <SettingItem
                icon="log-out-outline"
                title="Sign Out"
                titleStyle={{ color: theme.colors.error }}
                onPress={() => {
                  // TODO: Handle sign out
                }}
              />
          </AppCard>
        </ScrollView>

        <BottomNav />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.offWhite,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(10),
  },
  sectionCard: {
    marginBottom: hp(2),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    backgroundColor: theme.colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: hp(1.9),
    fontWeight: '600',
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(0.2),
  },
  settingSubtitle: {
    fontSize: hp(1.5),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
    opacity: 0.7,
  },
})


