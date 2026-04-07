import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from 'src/components/common';
import theme from 'src/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.title}>Old Hong Kong Memory</Text>
        </View>
        
        <Text style={styles.tagline}>
          Preserving history, one photo at a time
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.buttonWrapper}>
          <Button 
            title="Login" 
            onPress={() => router.push('/(auth)/login' as any)}
          />
        </View>
        <View style={styles.spacer} />
        <View style={styles.buttonWrapper}>
          <Button 
            title="Register" 
            onPress={() => router.push('/(auth)/register' as any)} 
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
  },
  title: {
    fontSize: 32,
    fontFamily: theme.fonts.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: '80%',
  },
  footer: {
    paddingBottom: 40,
    width: '100%',
  },
  buttonWrapper: {
    width: '100%',
  },
  spacer: {
    height: 16,
  },
});