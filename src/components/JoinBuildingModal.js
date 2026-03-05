import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TextInputField from './TextInputField';
import PrimaryButton from './PrimaryButton';
import { colors, radius, spacing, typography, shadow } from '../theme/tokens';

export default function JoinBuildingModal({ visible, onClose, onJoin }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (!code.trim()) {
      setError('חובה להזין מזהה בניין');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onJoin(code.trim());
      setCode('');
    } catch (e) {
      if (e.message === 'INVALID_BUILDING_CODE') {
        setError('מזהה הבניין לא תקין');
      } else {
        setError('שגיאה, נסה שוב');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={22} color={colors.muted} />
          </TouchableOpacity>

          <MaterialCommunityIcons
            name="office-building-marker"
            size={48}
            color={colors.secondary}
            style={styles.icon}
          />
          <Text style={styles.title}>הצטרף לבניין שלך</Text>
          <Text style={styles.subtitle}>
            הזן את מזהה הבניין שקיבלת מוועד הבית
          </Text>

          <TextInputField
            label="מזהה בניין"
            placeholder="לדוגמה: VAAD2024"
            value={code}
            onChangeText={(v) => {
              setCode(v);
              if (error) setError('');
            }}
            error={error}
            autoCapitalize="characters"
          />

          <PrimaryButton
            title="הצטרף"
            onPress={handleJoin}
            loading={loading}
            disabled={loading}
            style={styles.btn}
          />
        </View>
      </KeyboardAvoidingView>
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
    maxWidth: 360,
    ...shadow.card,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    padding: spacing.xs,
    zIndex: 1,
  },
  icon: {
    alignSelf: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  title: {
    fontFamily: typography.fontFamily,
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  btn: {
    marginTop: spacing.sm,
  },
});
