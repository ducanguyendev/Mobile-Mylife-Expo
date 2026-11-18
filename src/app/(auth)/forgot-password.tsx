import { router } from 'expo-router';
import { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';

import { AppText } from '@/design-system/components/app-text';
import { MyLifeTextField } from '@/design-system/components/fields';
import { PrimaryButton, TextButton } from '@/design-system/components/buttons';
import { AppCard } from '@/design-system/components/surfaces';
import { AppScrollScreen } from '@/components/layout/app-screen';
import { spacing } from '@/design-system/tokens';
import { useAppTheme } from '@/theme/theme-provider';
import { getAuthStrings } from '@/features/auth/i18n/authStrings';
import { requestPasswordReset } from '@/features/auth/api/authApi';
import { mapAuthApiError } from '@/features/auth/validation/authErrorMessages';
import { normalizeEmail } from '@/features/auth/validation/authValidation';

// The reset itself happens on the web reset page (linked from the email),
// which works for web and mobile users alike — no deep link needed.
export default function ForgotPasswordScreen() {
  const { colors, language } = useAppTheme();
  const copy = getAuthStrings(language);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);

  const submit = async () => {
    Keyboard.dismiss();
    setMessage(null);
    const normalized = normalizeEmail(email);
    if (!normalized || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(normalized)) {
      setEmailError(copy.emailInvalid);
      return;
    }
    setEmailError(undefined);
    setLoading(true);
    try {
      await requestPasswordReset(normalized);
      setSent(true);
    } catch (error) {
      const mapped = mapAuthApiError(error, copy);
      setEmailError(mapped.fieldErrors.email);
      setMessage(mapped.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScrollScreen contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.heading}>
        <View style={[styles.mark, { backgroundColor: colors.accentFamily }]}>
          <AppText variant="title" style={{ color: colors.onAccent }}>M</AppText>
        </View>
        <AppText variant="display">{copy.forgotTitle}</AppText>
        <AppText tone="secondary">{sent ? copy.forgotSentDesc : copy.forgotDesc}</AppText>
      </View>

      <AppCard style={styles.form}>
        {message ? <FormMessage message={message} /> : null}
        {sent ? (
          <>
            <AppText variant="title">{copy.forgotSentTitle}</AppText>
            <PrimaryButton title={copy.backToLogin} onPress={() => router.replace('/(auth)/login')} fullWidth />
          </>
        ) : (
          <>
            <MyLifeTextField
              label={copy.email}
              value={email}
              onChangeText={(value) => { setEmail(value); if (emailError) setEmailError(undefined); }}
              error={emailError}
              placeholder={copy.emailPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
              autoComplete="email"
              returnKeyType="done"
              onSubmitEditing={() => void submit()}
            />
            <PrimaryButton title={copy.sendResetLink} onPress={() => void submit()} loading={loading} disabled={loading} fullWidth />
            <TextButton title={copy.backToLogin} onPress={() => router.back()} compact />
          </>
        )}
      </AppCard>
    </AppScrollScreen>
  );
}

function FormMessage({ message }: { message: string }) {
  const { colors } = useAppTheme();
  return <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.errorBanner, { backgroundColor: `${colors.error}12`, borderColor: `${colors.error}45` }]}><AppText tone="error">{message}</AppText></View>;
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, justifyContent: 'center', gap: spacing.lg, paddingBottom: spacing.xxxl },
  mark: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  heading: { gap: spacing.xs, marginBottom: spacing.xs },
  form: { gap: spacing.md, padding: spacing.lg },
  errorBanner: { borderWidth: 1, borderRadius: 14, padding: spacing.md },
});
