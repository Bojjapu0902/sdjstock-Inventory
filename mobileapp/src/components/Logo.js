import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

// Same artwork as the web app (Clients/public/asserts/images/logo.webp).
// The logo has a light background, so it sits on a white tile over the dark headers.
const SOURCE = require('../../assets/images/logo.webp');

export default function Logo({ size = 48, style }) {
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: size * 0.25 }, style]}>
      <Image source={SOURCE} style={{ width: size * 0.92, height: size * 0.92 }} resizeMode="contain" accessibilityLabel="SDJ Marine logo" />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
});
