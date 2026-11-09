import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ScrollViewProps, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { layout, spacing } from '@/design-system/tokens';
import { AppText } from '@/design-system/components/app-text';
import { useAppTheme } from '@/theme/theme-provider';

type AppScreenProps = ViewProps & { padded?: boolean; centered?: boolean };

export function AppScreen({ children, padded = true, centered = false, style, ...props }: AppScreenProps) {
  const { colors } = useAppTheme();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.content,
          padded && styles.padded,
          centered && styles.centered,
          { backgroundColor: colors.background },
          style,
        ]}
        {...props}>
        {children}
      </View>
    </SafeAreaView>
  );
}

type AppScrollScreenProps = ScrollViewProps & { children: React.ReactNode; padded?: boolean };

export function AppScrollScreen({ children, contentContainerStyle, padded = true, ...props }: AppScrollScreenProps) {
  const { colors } = useAppTheme();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={[styles.scrollContent, padded && styles.padded, contentContainerStyle]}
          style={{ backgroundColor: colors.background }}
          {...props}>
          <View style={styles.width}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type AppHeaderProps = { title: string; subtitle?: string; eyebrow?: string; right?: React.ReactNode };

export function AppHeader({ title, subtitle, eyebrow, right }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        {eyebrow ? <AppText variant="caption" tone="secondary">{eyebrow}</AppText> : null}
        <AppText variant="screenTitle" accessibilityRole="header">{title}</AppText>
        {subtitle ? <AppText tone="secondary">{subtitle}</AppText> : null}
      </View>
      {right}
    </View>
  );
}

export function LargeTitleHeader({ title, eyebrow, subtitle }: Omit<AppHeaderProps, 'right'>) {
  return <AppHeader title={title} eyebrow={eyebrow} subtitle={subtitle} />;
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="sectionTitle" accessibilityRole="header">{title}</AppText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
  width: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
  padded: { paddingHorizontal: layout.screenGutter },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.xl },
  headerCopy: { flex: 1, gap: spacing.xxs },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
});
