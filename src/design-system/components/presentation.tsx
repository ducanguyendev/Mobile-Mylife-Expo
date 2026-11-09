import type { PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { DestructiveButton, SecondaryButton } from '@/design-system/components/buttons';
import { AppText } from '@/design-system/components/app-text';
import { radius, spacing } from '@/design-system/tokens';
import { useAppTheme } from '@/theme/theme-provider';

type AppModalProps = PropsWithChildren<{ visible: boolean; onClose: () => void; title?: string }>;

export function AppModal({ visible, onClose, title, children }: AppModalProps) {
  const { colors } = useAppTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel="Đóng hộp thoại" onPress={onClose} style={[styles.scrim, { backgroundColor: colors.scrim }]}>
        <Pressable onPress={(event) => event.stopPropagation()} style={[styles.dialog, { backgroundColor: colors.surfaceElevated }]}>
          {title ? <AppText variant="sectionTitle">{title}</AppText> : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function ActionSheet({ visible, onClose, title, children }: AppModalProps) {
  const { colors } = useAppTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel="Đóng bảng thao tác" onPress={onClose} style={[styles.scrim, styles.bottom, { backgroundColor: colors.scrim }]}>
        <Pressable onPress={(event) => event.stopPropagation()} style={[styles.sheet, { backgroundColor: colors.surfaceElevated }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          {title ? <AppText variant="sectionTitle">{title}</AppText> : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function ConfirmDialog({ visible, title, message, confirmLabel = 'Xác nhận', onConfirm, onClose, destructive = false }: {
  visible: boolean; title: string; message: string; confirmLabel?: string; onConfirm: () => void; onClose: () => void; destructive?: boolean;
}) {
  return (
    <AppModal visible={visible} title={title} onClose={onClose}>
      <AppText tone="secondary">{message}</AppText>
      <View style={styles.actions}>
        <SecondaryButton title="Hủy" onPress={onClose} compact />
        {destructive ? <DestructiveButton title={confirmLabel} onPress={onConfirm} compact /> : <SecondaryButton title={confirmLabel} onPress={onConfirm} compact />}
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  dialog: { width: '100%', maxWidth: 440, borderRadius: radius.largeCard, padding: spacing.xl, gap: spacing.md },
  bottom: { justifyContent: 'flex-end', paddingHorizontal: 0, paddingBottom: 0 },
  sheet: { width: '100%', maxWidth: 620, minHeight: 180, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: radius.pill, marginBottom: spacing.xs },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
});
