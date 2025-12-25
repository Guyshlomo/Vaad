import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Typography } from '../../components/Typography';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useTheme } from '../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { Camera, X } from 'lucide-react-native';

const FALLBACK_CATEGORIES = ['מעלית', 'חשמל', 'מים', 'ניקיון', 'שער', 'דלת כניסה', 'אחר'];
const LOCATIONS = ['לובי', 'קומה', 'חניה', 'גג', 'אחר'];

export const CreateIssueScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);

  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('issue_report')
          .select('name, sort_order')
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          setCategories(data.map((r) => r.name));
        }
      } catch (e) {
        // Fallback stays in place
        console.log('Failed to load issue categories, using fallback.');
      }
    };

    loadCategories();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      // iOS often returns HEIC. "Compatible" helps get a more widely-supported representation (e.g. JPEG).
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      // Critical for iOS reliability: ensures we can upload bytes even when the URI is `ph://...`
      base64: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setImageAsset(result.assets[0]);
    }
  };

  const uploadIssueImage = async (issueId: string, asset: ImagePicker.ImagePickerAsset) => {
    // iOS sometimes returns URIs that `fetch(uri).blob()` can't read (resulting in 0-byte uploads).
    // Try Blob first, then fall back to reading Base64 via expo-file-system.
    let uploadBody: Blob | Uint8Array;
    let blobType = '';

    // Prefer base64 straight from ImagePicker when available (most reliable on iOS).
    if (asset.base64 && asset.base64.length > 0) {
      uploadBody = Buffer.from(asset.base64, 'base64');
    } else {
      try {
        const res = await fetch(asset.uri);
        const blob = await res.blob();
        blobType = blob.type || '';
        if (blob.size > 0) {
          uploadBody = blob;
        } else {
          throw new Error('Empty blob');
        }
      } catch {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: 'base64',
        });
        if (!base64 || base64.length === 0) {
          throw new Error('לא ניתן לקרוא את התמונה (iOS). נסה לבחור תמונה אחרת או לאפשר גישה מלאה לתמונות.');
        }
        uploadBody = Buffer.from(base64, 'base64');
      }
    }

    // Guard: never upload empty data (creates 0-byte objects)
    if (uploadBody instanceof Uint8Array && uploadBody.byteLength === 0) {
      throw new Error('התמונה ריקה (0 bytes). נסה לבחור תמונה אחרת.');
    }

    // When using picker base64, Expo returns JPEG bytes.
    const mimeType = asset.mimeType || blobType || 'image/jpeg';
    const extFromMime: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heif',
    };

    const fallbackName = asset.uri.split('/').pop() || `image-${Date.now()}.jpg`;
    const fileName = asset.fileName || fallbackName;
    const extFromName = (fileName.split('.').pop() || '').toLowerCase();
    const ext = extFromMime[mimeType] || extFromName || 'jpg';

    const filePath = `${issueId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('issue-images')
      .upload(filePath, uploadBody, { contentType: mimeType, upsert: true });

    if (uploadError) throw uploadError;

    // Store the storage path in DB; screens can resolve it to a signed/public URL.
    return filePath;
  };

  const handleSubmit = async () => {
    if (!category || !description || !user) return;
    setUploading(true);

    try {
      // 1. Get user building
      const { data: profile } = await supabase.from('profiles').select('building_id').eq('id', user.id).single();
      if (!profile?.building_id) throw new Error('שגיאה בזיהוי הבניין');

      // 2. Create Issue
      const { data: issue, error: issueError } = await supabase
        .from('issues')
        .insert({
          building_id: profile.building_id,
          reporter_id: user.id,
          category,
          description,
          location,
          status: 'open',
        })
        .select()
        .single();

      if (issueError) throw issueError;

      // 3. Upload media AFTER issue exists, then link it
      if (imageAsset) {
        const storagePath = await uploadIssueImage(issue.id, imageAsset);
        const { error: mediaError } = await supabase.from('issue_media').insert({
          issue_id: issue.id,
          url: storagePath,
          type: 'image',
        });
        if (mediaError) throw mediaError;
      }

      // 4. Push notification to building (best-effort)
      try {
        await supabase.functions.invoke('send-push', {
          body: {
            type: 'issue_created',
            building_id: profile.building_id,
            title: 'דיווח תקלה חדש',
            body: `${category} • ${location || 'כללי'}`,
            data: { issueId: issue.id, kind: 'issue_created' },
            exclude_user_id: user.id,
          },
        });
      } catch (e) {
        console.log('Failed to send push (issue_created):', e);
      }

      Alert.alert('תודה', 'הדיווח התקבל בהצלחה', [
        { text: 'אישור', onPress: () => navigation.goBack() }
      ]);
      
    } catch (error: any) {
      Alert.alert('שגיאה', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h2">דיווח תקלה</Typography>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <X color={theme.text} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="label" style={{ marginBottom: 8 }}>קטגוריה</Typography>
        <View style={styles.chips}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={[
                styles.chip,
                { 
                  backgroundColor: category === cat ? theme.primary : theme.surface,
                  borderColor: category === cat ? theme.primary : theme.border
                }
              ]}
            >
              <Typography color={category === cat ? 'white' : theme.text}>{cat}</Typography>
            </TouchableOpacity>
          ))}
        </View>

        <Typography variant="label" style={{ marginTop: 16, marginBottom: 8 }}>מיקום</Typography>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsScrollContent}
        >
          {LOCATIONS.map((loc) => (
            <TouchableOpacity
              key={loc}
              onPress={() => setLocation(loc)}
              style={[
                styles.chip,
                { 
                  backgroundColor: location === loc ? theme.primary : theme.surface,
                  borderColor: location === loc ? theme.primary : theme.border
                }
              ]}
            >
              <Typography color={location === loc ? 'white' : theme.text}>{loc}</Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Input
          label="תיאור התקלה"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={{ height: 100, marginTop: 16, textAlignVertical: 'top' }}
          placeholder="מה קרה? איפה זה בדיוק?"
        />

        <TouchableOpacity 
          style={[styles.imagePicker, { borderColor: theme.border, backgroundColor: theme.surface }]}
          onPress={pickImage}
        >
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <>
              <Camera color={theme.textSecondary} size={32} />
              <Typography variant="caption" color={theme.textSecondary} style={{ marginTop: 8 }}>
                הוסף תמונה (אופציונלי)
              </Typography>
            </>
          )}
        </TouchableOpacity>

        <Button
          title="שלח דיווח"
          onPress={handleSubmit}
          loading={uploading}
          disabled={!category || !description}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    // RTL: title on the right, close (X) on the left
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    paddingTop: 0,
  },
  chips: {
    // RTL: start laying chips from the right
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
  },
  chipsScroll: {
    marginBottom: 8,
  },
  chipsScrollContent: {
    // RTL: start laying options from the right
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginStart: 8,
    marginBottom: 8,
  },
  imagePicker: {
    height: 150,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

