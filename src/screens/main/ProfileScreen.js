import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProfileHeaderCard from '../../components/ProfileHeaderCard';
import SectionHeader from '../../components/SectionHeader';
import SettingsRowToggle from '../../components/SettingsRowToggle';
import DangerButton from '../../components/DangerButton';
import ConfirmModal from '../../components/ConfirmModal';
import Card from '../../components/Card';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, isAdmin, signOut, deleteAccount, getBuildingCode } = useAuth();
  const [notifications, setNotifications] = useState({
    issues: true,
    vaad: true,
    statusUpdates: true,
  });
  const [darkMode, setDarkMode] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [buildingCode, setBuildingCode] = useState(null);
  const [codeVisible, setCodeVisible] = useState(false);

  async function handleShowBuildingCode() {
    if (codeVisible) {
      setCodeVisible(false);
      setBuildingCode(null);
      return;
    }
    const code = await getBuildingCode();
    if (code) {
      setBuildingCode(code);
      setCodeVisible(true);
    } else {
      Alert.alert('שגיאה', 'לא הצלחנו למצוא את קוד הבניין');
    }
  }

  async function handleLogout() {
    setLogoutModal(false);
    await signOut();
  }

  async function handleDelete() {
    setDeleteModal(false);
    await deleteAccount();
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.screenTitle}>הפרופיל שלי</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <ProfileHeaderCard
          profile={profile}
          onEdit={() => router.push('/modals/edit-profile')}
        />

        {isAdmin && (
          <>
            <SectionHeader title="ניהול בניין" />
            <Card style={styles.adminCard}>
              <TouchableOpacity style={styles.buildingCodeRow} onPress={handleShowBuildingCode}>
                <MaterialCommunityIcons
                  name="key-variant"
                  size={22}
                  color={colors.secondary}
                  style={styles.codeIcon}
                />
                <View style={styles.codeTextContainer}>
                  <Text style={styles.codeLabel}>הצג מזהה בניין</Text>
                  <Text style={styles.codeHint}>שתף את הקוד עם דיירי הבניין</Text>
                </View>
                <MaterialCommunityIcons
                  name={codeVisible ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={colors.muted}
                />
              </TouchableOpacity>
              {codeVisible && buildingCode && (
                <View style={styles.codeDisplay}>
                  <Text style={styles.codeValue}>{buildingCode}</Text>
                  <Text style={styles.codeCaption}>
                    העבר קוד זה לדיירים כדי שיוכלו להצטרף לבניין
                  </Text>
                </View>
              )}
            </Card>
          </>
        )}

        <SectionHeader title="הגדרות" />
        <View style={styles.section}>
          <SettingsRowToggle
            label="הודעות תקלות"
            value={notifications.issues}
            onValueChange={(v) => setNotifications((p) => ({ ...p, issues: v }))}
          />
          <SettingsRowToggle
            label="הודעות ועד"
            value={notifications.vaad}
            onValueChange={(v) => setNotifications((p) => ({ ...p, vaad: v }))}
          />
          <SettingsRowToggle
            label="עדכוני סטטוס"
            value={notifications.statusUpdates}
            onValueChange={(v) => setNotifications((p) => ({ ...p, statusUpdates: v }))}
          />
        </View>

        <SectionHeader title="תצוגה" />
        <View style={styles.section}>
          <SettingsRowToggle
            label="מצב לילה"
            value={darkMode}
            onValueChange={setDarkMode}
          />
        </View>

        <View style={styles.dangerZone}>
          <DangerButton
            title="יציאה מהחשבון"
            onPress={() => setLogoutModal(true)}
            style={styles.dangerBtn}
          />
          <DangerButton
            title="מחיקת חשבון"
            onPress={() => setDeleteModal(true)}
            style={styles.dangerBtn}
          />
        </View>
      </ScrollView>

      <ConfirmModal
        visible={logoutModal}
        title="לצאת מהחשבון?"
        confirmLabel="יציאה"
        onConfirm={handleLogout}
        onCancel={() => setLogoutModal(false)}
      />

      <ConfirmModal
        visible={deleteModal}
        title="מחיקת חשבון"
        message="מחיקת החשבון תנתק אותך מהבניין. האם את/ה בטוח/ה?"
        confirmLabel="מחיקה"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
        danger
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenTitle: {
    fontFamily: typography.fontFamily,
    ...typography.h1,
    color: colors.text,
    textAlign: 'right',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  scroll: {
    paddingBottom: spacing.xxl * 2,
  },
  adminCard: {
    marginHorizontal: spacing.base,
  },
  buildingCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeIcon: {
    marginEnd: spacing.md,
  },
  codeTextContainer: {
    flex: 1,
  },
  codeLabel: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'right',
  },
  codeHint: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
    marginTop: 2,
  },
  codeDisplay: {
    marginTop: spacing.base,
    paddingTop: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  codeValue: {
    fontFamily: typography.fontFamily,
    fontSize: 28,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 3,
    marginBottom: spacing.sm,
  },
  codeCaption: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.base,
    borderRadius: 16,
    overflow: 'hidden',
  },
  dangerZone: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  dangerBtn: {
    width: '100%',
  },
});
