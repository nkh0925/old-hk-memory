import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Switch, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../../contexts/SettingsContext';
import theme from '../../theme';

export const AiModeModal: React.FC = () => {
  const { isAiModeEnabled, toggleAiMode, isModalVisible, setModalVisible } = useSettings();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isModalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <Pressable 
        style={styles.overlay} 
        onPress={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>✨ AI Time Travel Mode</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.colors.gray500} />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Enable this mode to watch historical photos come to life through AI videos, 
            and use your own imagination to reconstruct the past.
          </Text>
          
          <View style={styles.noteContainer}>
            {/* FIXED: Changed from gray600 to gray500 to match your theme setup */}
            <Ionicons name="information-circle-outline" size={16} color={theme.colors.gray500} />
            <Text style={styles.noteText}>
              Note: This feature requires more battery and mobile data.
            </Text>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Activate AI Features</Text>
            <Switch
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={isAiModeEnabled ? theme.colors.white : theme.colors.gray100}
              onValueChange={toggleAiMode}
              value={isAiModeEnabled}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  description: {
    fontSize: theme.fontSize.md,
    lineHeight: 22,
    color: theme.colors.gray500,
    marginBottom: theme.spacing.md,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray100,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  noteText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray500,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  toggleLabel: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  button: {
    height: 50,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
  },
});