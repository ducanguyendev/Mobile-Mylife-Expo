import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/design-system/components/app-text';
import { radius, spacing } from '@/design-system/tokens';
import { useAppTheme } from '@/theme/theme-provider';

type ToastKind = 'success' | 'error' | 'info' | 'warning';
type Toast = { message: string; kind: ToastKind };
type ToastContextValue = { showToast: (message: string, kind?: ToastKind) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider.');
  return value;
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<Toast | null>(null);
  const { colors } = useAppTheme();
  const showToast = useCallback((message: string, kind: ToastKind = 'info') => {
    setToast({ message, kind });
    setTimeout(() => setToast(null), 2600);
  }, []);
  const value = useMemo(() => ({ showToast }), [showToast]);
  const palette = { success: colors.success, error: colors.error, info: colors.info, warning: colors.warning };
  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={styles.overlay}>
          <Pressable accessibilityRole="alert" accessibilityLiveRegion="polite" onPress={() => setToast(null)} style={[styles.toast, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={[styles.dot, { backgroundColor: palette[toast.kind] }]} />
            <AppText style={styles.message}>{toast.message}</AppText>
          </Pressable>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: 88, alignItems: 'center' },
  toast: { minHeight: 52, width: '100%', maxWidth: 500, borderWidth: 1, borderRadius: radius.input, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  message: { flex: 1 },
});
