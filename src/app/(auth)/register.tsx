import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, StyleSheet, View, type TextInputInstance } from 'react-native';

import { AppScrollScreen } from '@/components/layout/app-screen';
import { useToast } from '@/components/feedback/toast-provider';
import { AppText } from '@/design-system/components/app-text';
import { PrimaryButton } from '@/design-system/components/buttons';
import { ChoiceChip, ChipRow } from '@/design-system/components/controls';
import { MyLifePasswordField, MyLifeTextField } from '@/design-system/components/fields';
import { AppCard } from '@/design-system/components/surfaces';
import { spacing } from '@/design-system/tokens';
import { useAppTheme } from '@/theme/theme-provider';
import { useAuth } from '@/features/auth/context/auth-provider';
import { getAuthStrings } from '@/features/auth/i18n/authStrings';
import { mapAuthApiError } from '@/features/auth/validation/authErrorMessages';
import { formatBirthDateForApi, normalizeEmail, normalizeFullName, validateRegistration, type AuthFieldErrors } from '@/features/auth/validation/authValidation';

export default function RegisterScreen() {
  const { colors, language } = useAppTheme();
  const { register } = useAuth();
  const { showToast } = useToast();
  const copy = getAuthStrings(language);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const nameRef = useRef<TextInputInstance>(null);
  const phoneRef = useRef<TextInputInstance>(null);
  const dobRef = useRef<TextInputInstance>(null);
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);

  const updateField = (field: keyof AuthFieldErrors, update: () => void) => {
    update();
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setMessage(null);
  };

  const submit = async () => {
    Keyboard.dismiss();
    setMessage(null);
    const input = { fullName, phoneNumber, gender, dateOfBirth, email, password, confirmPassword };
    const errors = validateRegistration(input, copy);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    const backendDate = formatBirthDateForApi(dateOfBirth);
    if (!backendDate) return;
    setLoading(true);
    try {
      const registeredEmail = await register({
        ...input,
        fullName: normalizeFullName(fullName),
        phoneNumber: phoneNumber.trim(),
        dateOfBirth: backendDate,
        email: normalizeEmail(email),
      });
      showToast(copy.registerSuccess, 'success');
      router.replace({ pathname: '/(auth)/login', params: { registeredEmail } });
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
      <View style={styles.heading}>
        <AppText variant="screenTitle" accessibilityRole="header">{copy.registerTitle}</AppText>
        <AppText tone="secondary">{copy.registerSubtitle}</AppText>
      </View>

      <AppCard style={styles.form}>
        {message ? <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.errorBanner, { backgroundColor: `${colors.error}12`, borderColor: `${colors.error}45` }]}><AppText tone="error">{message}</AppText></View> : null}
        <MyLifeTextField inputRef={nameRef} label={copy.fullName} value={fullName} onChangeText={(value) => updateField('fullName', () => setFullName(value))} error={fieldErrors.fullName} placeholder={copy.namePlaceholder} autoCapitalize="words" autoCorrect={false} autoComplete="name" textContentType="name" returnKeyType="next" onSubmitEditing={() => phoneRef.current?.focus()} maxLength={50} />
        <MyLifeTextField inputRef={phoneRef} label={copy.phone} value={phoneNumber} onChangeText={(value) => updateField('phoneNumber', () => setPhoneNumber(value.replace(/\D/g, '').slice(0, 10)))} error={fieldErrors.phoneNumber} placeholder={copy.phonePlaceholder} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" returnKeyType="next" onSubmitEditing={() => dobRef.current?.focus()} maxLength={10} />
        <View style={styles.fieldGroup}>
          <AppText variant="label">{copy.gender}</AppText>
          <ChipRow>
            <ChoiceChip label={copy.male} selected={gender === 'Nam'} onPress={() => updateField('gender', () => setGender('Nam'))} />
            <ChoiceChip label={copy.female} selected={gender === 'Nữ'} onPress={() => updateField('gender', () => setGender('Nữ'))} />
            <ChoiceChip label={copy.other} selected={gender === 'Khác'} onPress={() => updateField('gender', () => setGender('Khác'))} />
          </ChipRow>
          {fieldErrors.gender ? <AppText variant="caption" tone="error">{fieldErrors.gender}</AppText> : null}
        </View>
        <MyLifeTextField inputRef={dobRef} label={copy.birthDate} value={dateOfBirth} onChangeText={(value) => updateField('dateOfBirth', () => setDateOfBirth(formatDateInput(value)))} error={fieldErrors.dateOfBirth} helperText={copy.birthPlaceholder} placeholder={copy.birthPlaceholder} keyboardType="number-pad" returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} maxLength={10} />
        <MyLifeTextField inputRef={emailRef} label={copy.email} value={email} onChangeText={(value) => updateField('email', () => setEmail(value))} error={fieldErrors.email} helperText={copy.gmail} placeholder={copy.emailPlaceholder} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} maxLength={254} />
        <MyLifePasswordField inputRef={passwordRef} label={copy.password} value={password} onChangeText={(value) => updateField('password', () => setPassword(value))} error={fieldErrors.password} helperText={copy.passwordGuidance} placeholder={copy.passwordPlaceholder} autoComplete="new-password" textContentType="newPassword" returnKeyType="next" onSubmitEditing={() => confirmRef.current?.focus()} showPasswordLabel={copy.showPassword} hidePasswordLabel={copy.hidePassword} />
        <MyLifePasswordField inputRef={confirmRef} label={copy.confirmPassword} value={confirmPassword} onChangeText={(value) => updateField('confirmPassword', () => setConfirmPassword(value))} error={fieldErrors.confirmPassword} placeholder={copy.confirmPassword} autoComplete="new-password" textContentType="newPassword" returnKeyType="done" onSubmitEditing={() => void submit()} showPasswordLabel={copy.showPassword} hidePasswordLabel={copy.hidePassword} />
        <PrimaryButton title={copy.createAccount} onPress={() => void submit()} loading={loading} disabled={loading} fullWidth />
      </AppCard>
      <View style={styles.loginPrompt}><AppText tone="secondary">{copy.hasAccount}</AppText><AppText accessibilityRole="link" variant="label" tone="accent" onPress={() => router.back()}>{copy.login}</AppText></View>
    </AppScrollScreen>
  );
}

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length < 3) return digits;
  if (digits.length < 5) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

const styles = StyleSheet.create({
  page: { gap: spacing.lg, paddingBottom: spacing.xxxl },
  mark: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  heading: { gap: spacing.xs, marginBottom: spacing.xs },
  form: { gap: spacing.md, padding: spacing.lg },
  fieldGroup: { gap: spacing.xs },
  errorBanner: { borderWidth: 1, borderRadius: 14, padding: spacing.md },
  loginPrompt: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
});
