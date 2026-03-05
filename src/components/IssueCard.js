import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from './Card';
import StatusChip from './StatusChip';
import { colors, spacing, typography, issueTypeMap, locationMap } from '../theme/tokens';
import { timeAgo } from '../utils/timeAgo';

export default function IssueCard({ issue, onPress }) {
  const typeInfo = issueTypeMap[issue.type] || issueTypeMap.other;
  const locationLabel = locationMap[issue.location] || issue.location;

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
          <MaterialCommunityIcons name="chevron-left" size={22} color={colors.muted} />
        </View>
        <Text style={styles.meta}>
          {locationLabel} • {timeAgo(issue.created_at)}
        </Text>
        {issue.description ? (
          <Text style={styles.preview} numberOfLines={1}>
            {issue.description}
          </Text>
        ) : null}
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
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.sm,
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
  preview: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
});
