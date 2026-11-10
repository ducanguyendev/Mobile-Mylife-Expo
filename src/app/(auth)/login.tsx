import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View, type TextInputInstance } from 'react-native';

import { AppText } from '@/design-system/components/app-text';
import { MyLifePasswordField, MyLifeTextField } from '@/design-system/components/fields';
import { PrimaryButton, SecondaryButton } from '@/design-system/components/buttons';
import { AppCard } from '@/design-system/components/surfaces';
import { AppScrollScreen } from '@/components/layout/app-screen';
import { useToast } from '@/components/feedback/toast-provider';
import { spacing } from '@/design-system/tokens';
import { useAppTheme } from '@/theme/theme-provider';
import { useAuth } from '@/features/auth/context/auth-provider';
import { getAuthStrings } from '@/features/auth/i18n/authStrings';
import { mapAuthApiError } from '@/features/auth/validation/authErrorMessages';
import { normalizeEmail, validateLogin, type AuthFieldErrors } from '@/features/auth/validation/authValidation';

export default function LoginScreen() {
  const params = useLocalSearchParams<{ registeredEmail?: string }>();
  const registeredEmail = typeof params.registeredEmail === 'string' ? params.registeredEmail : '';
  const { colors, language } = useAppTheme();
  const { login, rememberedEmail, rememberMe, setRememberEmailPreference } = useAuth();
  const { showToast } = useToast();
  const copy = getAuthStrings(language);
  const [email, setEmail] = useState(registeredEmail || rememberedEmail || '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(Boolean(registeredEmail) || rememberMe);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const passwordRef = useRef<TextInputInstance>(null);

  const submit = async () => {
    Keyboard.dismiss();
    setMessage(null);
    const errors = validateLogin(email, password, copy);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setLoading(true);
    try {
      await login(normalizeEmail(email), password, remember);
      showToast(copy.loginSuccess, 'success');
      router.replace('/(tabs)');
    } catch (error) {
      const mapped = mapAuthApiError(error, copy);
      setFieldErrors((current) => ({ ...current, ...mapped.fieldErrors }));
      setMessage(mapped.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScrollScreen contentContainerStyle={styles.page}>
      <View style={[styles.mark, { backgroundColor: colors.accentFamily }]}><AppText variant="sectionTitle" style={{ color: colors.onAccent }}>M</AppText></View>
      <AppText variant="caption" tone="accent" style={styles.eyebrow}>{copy.mark}</AppText>
      <View style={styles.heading}>
        <AppText variant="display" accessibilityRole="header">{copy.welcome}</AppText>
        <AppText tone="secondary">{copy.loginSubtitle}</AppText>
      </View>

      <AppCard style={styles.form}>
        {message ? <FormMessage message={message} /> : null}
        <MyLifeTextField
          label={copy.email}
          value={email}
          onChangeText={(value) => { setEmail(value); setFieldErrors((current) => ({ ...current, email: undefined })); setMessage(null); }}
          error={fieldErrors.email}
          placeholder={copy.emailPlaceholder}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          autoComplete="email"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          maxLength={254}
        />
        <MyLifePasswordField
          inputRef={passwordRef}
          label={copy.password}
          value={password}
          onChangeText={(value) => { setPassword(value); setFieldErrors((current) => ({ ...current, password: undefined })); setMessage(null); }}
          error={fieldErrors.password}
          placeholder={copy.passwordPlaceholder}
          textContentType="password"
          autoComplete="current-password"
          returnKeyType="done"
          onSubmitEditing={() => void submit()}
          showPasswordLabel={copy.showPassword}
          hidePasswordLabel={copy.hidePassword}
        />
        <View style={styles.rememberRow}>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: remember }} onPress={() => { const next = !remember; setRemember(next); void setRememberEmailPreference(next, email); }} style={styles.checkboxRow}>
            <View style={[styles.checkbox, { borderColor: remember ? colors.accentFamily : colors.controlBorder, backgroundColor: remember ? colors.accentFamily : colors.surfaceElevated }]}>
              {remember ? <AppText variant="caption" style={{ color: colors.onAccent }}>✓</AppText> : null}
            </View>
            <AppText variant="label" tone="secondary">{copy.remember}</AppText>
          </Pressable>
        </View>
        <PrimaryButton title={copy.login} onPress={() => void submit()} loading={loading} disabled={loading} fullWidth />
      </AppCard>

      <View style={styles.registerPrompt}>
        <AppText tone="secondary">{copy.noAccount}</AppText>
        <SecondaryButton title={copy.register} onPress={() => router.push('/(auth)/register')} compact />
      </View>
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
  eyebrow: { letterSpacing: 1.1 },
  heading: { gap: spacing.xs, marginBottom: spacing.xs },
  form: { gap: spacing.md, padding: spacing.lg },
  rememberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  checkboxRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  registerPrompt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  errorBanner: { borderWidth: 1, borderRadius: 14, padding: spacing.md },
});
