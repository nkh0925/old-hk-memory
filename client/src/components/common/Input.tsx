/**
 * Input component
 * Text input with label, error state, and various configurations
 * Optimized for Modern Archive style (minimalist nostalgia - bottom line only)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardTypeOptions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import theme from '../../theme';   // 使用优化后的完整 theme

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
}

const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
  keyboardType = 'default',
  autoCapitalize = 'none',
  multiline = false,
  numberOfLines = 1,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputContainerStyle: ViewStyle[] = [
    styles.inputContainer,
    isFocused && styles.inputContainer_focused,
    error ? styles.inputContainer_error : null,
    multiline && styles.inputContainer_multiline,
  ].filter(Boolean) as ViewStyle[];

  const inputStyle: TextStyle[] = [
    styles.input,
    multiline ? styles.input_multiline : null,
  ].filter(Boolean) as TextStyle[];

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={inputContainerStyle}>
        <TextInput
          style={inputStyle}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.gray500}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.fonts.title,   // Serif for archival label
  },
  inputContainer: {
    borderBottomWidth: 1,              // 只保留底边框，旧表格风格
    borderBottomColor: theme.colors.border,
    backgroundColor: 'transparent',    // 无背景框，更纸质
  },
  inputContainer_focused: {
    borderBottomColor: theme.colors.primary,   // Heritage Green
    borderBottomWidth: 2,
  },
  inputContainer_error: {
    borderBottomColor: theme.colors.error,     // Stamp Red
  },
  inputContainer_multiline: {
    minHeight: 100,
  },
  input: {
    paddingHorizontal: 0,              // 无左右内边框
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    minHeight: 48,
    fontFamily: theme.fonts.body,      // 正文保持清晰
  },
  input_multiline: {
    minHeight: 100,
    paddingTop: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
    fontFamily: theme.fonts.body,
  },
});

export default Input;