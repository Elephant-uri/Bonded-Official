import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import theme from '../constants/theme'
import { hp, wp } from '../helpers/common'
import AppTopBar from '../components/AppTopBar'

const MOCK_FORUMS = [
  { id: 'main', name: 'Main forum', type: 'main' },
  { id: 'cs-201', name: 'CS 201 – Data Structures', type: 'class' },
  { id: 'events', name: 'Campus Events', type: 'public' },
  { id: 'rmp', name: 'Rate my professor', type: 'rmp' },
]

export default function SearchForums() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const filtered = MOCK_FORUMS.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <AppTopBar
          schoolName="University of Rhode Island"
          onPressProfile={() => router.push('/profile')}
          onPressSchool={() => {}}
          onPressNotifications={() => router.push('/notifications')}
        />

        <Text style={styles.title}>Search forums</Text>

        <View style={styles.searchRow}>
          <Ionicons
            name="search-outline"
            size={hp(2.2)}
            color={theme.colors.softBlack}
            style={{ marginRight: wp(2) }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, class, or topic..."
            placeholderTextColor={theme.colors.softBlack}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              activeOpacity={0.8}
              onPress={() => router.push('/forum')}
            >
              <View style={styles.itemLeft}>
                <Ionicons
                  name={
                    item.type === 'main'
                      ? 'home-outline'
                      : item.type === 'class'
                      ? 'school-outline'
                      : item.type === 'rmp'
                      ? 'clipboard-outline'
                      : 'people-outline'
                  }
                  size={hp(2.1)}
                  color={theme.colors.bondedPurple}
                  style={{ marginRight: wp(2) }}
                />
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={hp(2)}
                color={theme.colors.softBlack}
              />
            </TouchableOpacity>
          )}
        />
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
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
  },
  title: {
    marginTop: hp(1.5),
    marginBottom: hp(1),
    fontSize: hp(2.4),
    fontWeight: '700',
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.xl,
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.9),
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
    marginBottom: hp(1.5),
  },
  searchInput: {
    flex: 1,
    fontSize: hp(1.9),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
  },
  list: {
    paddingTop: hp(1),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    fontSize: hp(1.9),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
  },
})



