import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ChipGroup from '../../components/ChipGroup';
import TextInputField from '../../components/TextInputField';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { colors, spacing, typography, issueTypeMap, locationMap } from '../../theme/tokens';

const typeOptions = Object.entries(issueTypeMap).map(([value, info]) => ({
  value,
  label: info.label,
  icon: info.icon,
}));

const locationOptions = Object.entries(locationMap).map(([value, label]) => ({
  value,
  label,
}));

export default function ReportIssueScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('אין גישה לתמונות', 'כדי להעלות תמונה צריך לאפשר גישה בהגדרות.', [
        { text: 'ביטול' },
        { text: 'הבנתי' },
      ]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    if (!type) {
      Alert.alert('שגיאה', 'יש לבחור סוג תקלה');
      return;
    }
    if (!description.trim()) {
      Alert.alert('שגיאה', 'יש להוסיף תיאור');
      return;
    }
    if (!location) {
      Alert.alert('שגיאה', 'יש לבחור מיקום');
      return;
    }

    setLoading(true);
    try {
      let media_urls = [];
      if (image) {
        const ext = image.split('.').pop();
        const fileName = `${Date.now()}.${ext}`;
        const response = await fetch(image);
        const blob = await response.blob();
        const { error: uploadError } = await supabase.storage
          .from('issue-media')
          .upload(fileName, blob);
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('issue-media')
            .getPublicUrl(fileName);
          media_urls = [urlData.publicUrl];
        }
      }

      const { error } = await supabase.from('issues').insert({
        building_id: profile.building_id,
        type,
        description: description.trim(),
        location,
        status: 'open',
        created_by: profile.id,
        media_urls,
      });

      if (error) throw error;
      router.back();
    } catch (e) {
      Alert.alert('שגיאה', 'לא הצלחנו לשלוח את התקלה, נסה שוב');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>דיווח תקלה</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>סוג תקלה</Text>
        <ChipGroup options={typeOptions} selected={type} onSelect={setType} />

        <TextInputField
          label="תיאור"
          placeholder="תאר את התקלה..."
          value={description}
          onChangeText={setDescription}
          multiline
          style={styles.field}
        />

        <Text style={styles.label}>מיקום</Text>
        <ChipGroup options={locationOptions} selected={location} onSelect={setLocation} />

        <View style={styles.mediaSection}>
          <Text style={styles.label}>תמונה (אופציונלי)</Text>
          {image ? (
            <TouchableOpacity onPress={pickImage}>
              <Image source={{ uri: image }} style={styles.preview} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
              <MaterialCommunityIcons name="camera-plus-outline" size={28} color={colors.muted} />
              <Text style={styles.uploadText}>העלה תמונה</Text>
            </TouchableOpacity>
          )}
        </View>

        <PrimaryButton
          title="שליחה"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontFamily: typography.fontFamily,
    ...typography.h2,
    color: colors.text,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl * 2,
  },
  label: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'right',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  field: {
    marginTop: spacing.base,
  },
  mediaSection: {
    marginTop: spacing.md,
  },
  uploadBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  uploadText: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  submitBtn: {
    marginTop: spacing.xl,
  },
});
