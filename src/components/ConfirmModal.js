import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

export default function ConfirmModal({ visible, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, danger }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelLabel || 'ביטול'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, danger && styles.dangerBtn]}
              onPress={onConfirm}
            >
              <Text style={[styles.confirmText, danger && styles.dangerText]}>
                {confirmLabel || 'אישור'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
  },
  title: {
    fontFamily: typography.fontFamily,
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontFamily: typography.fontFamily,
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  cancelBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    color: colors.muted,
    fontWeight: '500',
  },
  confirmBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.button,
    backgroundColor: colors.secondary,
  },
  dangerBtn: {
    backgroundColor: colors.danger,
  },
  confirmText: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    color: colors.white,
    fontWeight: '600',
  },
  dangerText: {
    color: colors.white,
  },
});
