import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Drop-in replacement for React Native's <ImageBackground />.
 *
 * Uses expo-image under the hood so local and remote images are cached
 * in memory+disk. Repeated mounts display instantly instead of re-decoding.
 */
export default function CachedImageBackground({
  source,
  style,
  children,
  resizeMode = 'cover',
  ...rest
}) {
  const resolvedSource = source?.uri ? source.uri : source;
  const contentFit = resizeMode === 'contain' ? 'contain' : 'cover';

  return (
    <View style={style} {...rest}>
      <Image
        source={resolvedSource}
        cachePolicy="memory-disk"
        contentFit={contentFit}
        style={StyleSheet.absoluteFill}
        priority="high"
      />
      {children}
    </View>
  );
}
