import { StyleSheet, Text, View, ViewStyle, StyleProp, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SkillCardProps {
  title: string;
  emoji: string;
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
  avatarUrl?: string;
  rating?: number | null;
  reviewsCount?: number | null;
  ordersCount?: number | null;
}

export default function SkillCard({ title, emoji, style, subtitle, avatarUrl, rating, reviewsCount, ordersCount }: SkillCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? (
        <View style={styles.subtitleRow}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.subtitleAvatar} />
          ) : null}
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      ) : null}
      {typeof rating === 'number' && (
        <View style={styles.metricsPrimaryRow}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.metricText}>{rating.toFixed(1)}</Text>
        </View>
      )}
      {(typeof reviewsCount === 'number' || typeof ordersCount === 'number') && (
        <View style={styles.metricsSecondaryRow}>
          {typeof reviewsCount === 'number' && (
            <View style={styles.tag}><Text style={styles.tagText}>{reviewsCount} reviews</Text></View>
          )}
          {typeof ordersCount === 'number' && (
            <View style={styles.tag}><Text style={styles.tagText}>{ordersCount} orders</Text></View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 188,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
    textAlign: 'center',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  subtitleAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  metricsPrimaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metricsSecondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metricText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  tag: {
    backgroundColor: '#f1f2f6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginHorizontal: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#64748b',
  },
});
