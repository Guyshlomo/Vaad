import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from './Card';
import StatusChip from './StatusChip';
import { colors, spacing, typography, issueTypeMap, locationMap } from '../theme/tokens';
import { timeAgo } from '../utils/timeAgo';
import { supabase } from '../services/supabase';

export default function AdminIssueCard({ issue, onStatusChange, onDelete, onPress }) {
  const typeInfo = issueTypeMap[issue.type] || issueTypeMap.other;
  const locationLabel = locationMap[issue.location] || issue.location;
  const [reporterName, setReporterName] = useState('');

  useEffect(() => {
    if (issue.created_by) {
      supabase
        .from('users')
        .select('full_name')
        .eq('id', issue.created_by)
        .single()
        .then(({ data }) => {
          if (data) setReporterName(data.full_name);
        });
    }
  }, [issue.created_by]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <StatusChip status={issue.status} />
          <View style={styles.titleRow}>
            <MaterialCommunityIcons
              name={typeInfo.icon}
              size={20}
              color={colors.secondary}
              style={styles.icon}
            />
            <Text style={styles.title}>{typeInfo.label}</Text>
          </View>
        </View>

        <Text style={styles.meta}>
          {locationLabel} • {timeAgo(issue.created_at)}
        </Text>

        {reporterName ? (
          <Text style={styles.reporter}>דווח ע״י {reporterName}</Text>
        ) : null}

        {issue.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {issue.description}
          </Text>
        ) : null}

        <View style={styles.actions}>
          {issue.status === 'open' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionInProgress]}
              onPress={() => onStatusChange(issue.id, 'in_progress')}
            >
              <MaterialCommunityIcons name="wrench-outline" size={16} color={colors.white} />
              <Text style={styles.actionText}>העבר לטיפול</Text>
            </TouchableOpacity>
          )}

          {issue.status === 'in_progress' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionDone]}
              onPress={() => onStatusChange(issue.id, 'done')}
            >
              <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.white} />
              <Text style={styles.actionText}>סמן כתוקנה</Text>
            </TouchableOpacity>
          )}

          {issue.status === 'done' && onDelete && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionDelete]}
              onPress={() => onDelete(issue.id)}
            >
              <MaterialCommunityIcons name="delete-outline" size={16} color={colors.danger} />
              <Text style={[styles.actionText, { color: colors.danger }]}>מחיקה סופית</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  icon: {
    marginEnd: spacing.xs,
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  reporter: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.secondary,
    textAlign: 'right',
    marginTop: 2,
  },
  description: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'right',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
  },
  actionInProgress: {
    backgroundColor: colors.statusInProgress,
  },
  actionDone: {
    backgroundColor: colors.statusDone,
  },
  actionDelete: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  actionText: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
});
