import { Image } from 'expo-image';
import React from 'react';

const BLURHASH_PLACEHOLDER = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

/**
 * Drop-in replacement for React Native <Image /> with built-in disk caching.
 *
 * Props are forwarded to expo-image. Defaults:
 * - cachePolicy: 'memory-disk'  (fast memory lookup, persists to disk)
 * - transition: 150ms fade
 * - placeholder: subtle blurhash
 * - contentFit: 'cover'
 *
 * Usage:
 *   <CachedImage source={{ uri: url }} style={styles.avatar} />
 *   <CachedImage source={require('../assets/img.png')} />
 */
export default function CachedImage({
  source,
  placeholder,
  cachePolicy = 'memory-disk',
  transition = 150,
  contentFit = 'cover',
  style,
  ...rest
}) {
  const resolvedSource = source?.uri ? source.uri : source;

  return (
    <Image
      source={resolvedSource}
      placeholder={placeholder || BLURHASH_PLACEHOLDER}
      cachePolicy={cachePolicy}
      transition={transition}
      contentFit={contentFit}
      style={style}
      {...rest}
    />
  );
}
