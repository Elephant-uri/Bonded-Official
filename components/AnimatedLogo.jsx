import { Image } from 'expo-image';
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { wp } from '../helpers/common';

const logoSource = require('../assets/images/transparent-bonded.png');

const AnimatedLogo = ({ size = 60, source = logoSource, duration = 4000, style }) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => {
      anim.stop();
      spinValue.setValue(0);
    };
  }, [spinValue, duration]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const dim = wp(size);

  return (
    <Animated.View style={[{ width: dim, height: dim }, style, { transform: [{ rotate: spin }] }]}>
      <Image
        source={source}
        cachePolicy="memory-disk"
        contentFit="contain"
        style={{ width: dim, height: dim }}
        priority="high"
      />
    </Animated.View>
  );
};

export default AnimatedLogo;
