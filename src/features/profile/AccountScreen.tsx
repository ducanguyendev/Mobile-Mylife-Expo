import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect, usePreventRemove } from 'expo-router';
import { AppScrollScreen, LargeTitleHeader } from '@/components/layout/app-screen';
import { LoadingState } from '@/components/feedback/states';
import { AppText } from '@/design-system/components/app-text';
import { Avatar } from '@/design-system/components/avatar';
import { PrimaryButton, TextButton, DestructiveButton } from '@/design-system/components/buttons';
import { MyLifePasswordField, MyLifeTextField } from '@/design-system/components/fields';
import { ChipRow, ChoiceChip } from '@/design-system/components/controls';
import { spacing } from '@/design-system/tokens';
import { useAuth } from '@/features/auth/context/auth-provider';
import { useLocalization } from '@/localization/use-localization';
import { getSessionVersion } from '@/api/apiClient';
import type { AuthenticatedUser } from '@/features/auth/types/auth';
import type { Selection } from '@/features/library/library-upload';
import { accountWrites, profileApi } from './profile-api';
import { accountAvatarUri, passwordStrength, profileInput, providerLabel, validatePassword, validateProfile, type ProfileInput } from './profile-data';
import { accountAvatarBody, pickAccountAvatar } from './account-avatar';
import { m8Error, m8Strings } from './m8-strings';

const emptyPassword = () => ({ currentPassword: '', newPassword: '', confirmPassword: '' });
export function AccountScreen({ mode }: { mode: 'edit' | 'security' | 'avatar' }) {
  const { user, status, refreshSession, logout } = useAuth();
  const { language, copy: globalCopy } = useLocalization();
  const copy = m8Strings[language];
  const [original, setOriginal] = useState<AuthenticatedUser>();
  const [form, setForm] = useState<ProfileInput>({ displayName: '', phoneNumber: '', gender: '', dateOfBirth: '' });
  const [password, setPassword] = useState(emptyPassword);
  const [selection, setSelection] = useState<Selection>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [allowLeave, setAllowLeave] = useState(false);
  const alive = useRef(false);
  const controller = useRef(new AbortController());
  const submitted = useRef(false);
  const version = useRef(getSessionVersion()).current;
  const current = useCallback(() => alive.current && version === getSessionVersion() && !controller.current.signal.aborted, [version]);
  const gate = user ? accountWrites(user.id) : undefined;
  const dirty = mode === 'edit' ? !!original && JSON.stringify(form) !== JSON.stringify(profileInput(original)) : mode === 'avatar' ? !!selection : Object.values(password).some(Boolean);
  const disablePrevention = usePreventRemove(status === 'authenticated' && !allowLeave && (dirty || busy), ({ repeat }) => {
    if (submitted.current) return;
    Alert.alert(copy.discard, copy.discardMessage, [{ text: copy.keep, style: 'cancel' }, { text: copy.discardAction, style: 'destructive', onPress: () => { setAllowLeave(true); repeat(); } }]);
  });
  const load = useCallback(async () => {
    setLoading(true); setMessage(''); setSuccess(false);
    try {
      const fresh = await profileApi.me(controller.current.signal);
      if (!current()) return;
      setOriginal(fresh); setForm(profileInput(fresh)); setErrors({});
      accountWrites(fresh.id).reconcile();
      await refreshSession();
    } catch (error) { if (current()) setMessage(m8Error(error, copy)); }
    finally { if (current()) setLoading(false); }
  }, [copy, current, refreshSession]);
  useFocusEffect(useCallback(() => {
    alive.current = true; controller.current = new AbortController();
    void load();
    return () => { alive.current = false; controller.current.abort(); setPassword(emptyPassword()); setSelection(undefined); };
  }, [load]));
  useEffect(() => {
    const listener = AppState.addEventListener('change', next => { if (next !== 'active') setPassword(emptyPassword()); });
    return () => listener.remove();
  }, []);
  const mutate = async (operation: () => Promise<unknown>, passwordChange = false) => {
    if (!gate || submitted.current || busy || !current()) return;
    submitted.current = true; setBusy(true); setMessage(''); setSuccess(false);
    try {
      await gate.run(operation);
      if (!current()) return;
      await refreshSession();
      if (!current()) return;
      setPassword(emptyPassword()); setSelection(undefined);
      const fresh = await profileApi.me(controller.current.signal);
      if (!current()) return;
      setOriginal(fresh); setForm(profileInput(fresh)); setSuccess(true);
      setMessage(passwordChange ? copy.passwordSuccess : copy.saved);
    } catch (error) { if (current()) { setPassword(emptyPassword()); setMessage(m8Error(error, copy)); } }
    finally { submitted.current = false; if (current()) setBusy(false); }
  };
  const saveProfile = () => {
    const validation = validateProfile(form); setErrors(validation.errors);
    if (!Object.keys(validation.errors).length && original) void mutate(() => profileApi.save(original, form, controller.current.signal));
  };
  const savePassword = () => {
    const validation = validatePassword(password); setErrors(validation);
    if (!Object.keys(validation).length) void mutate(() => profileApi.password(password, controller.current.signal), true);
  };
  const pick = async () => {
    if (submitted.current) return;
    submitted.current = true; setBusy(true);
    try { const picked = await pickAccountAvatar(); if (picked && current()) setSelection(picked); }
    catch { if (current()) setMessage(copy.imageError); }
    finally { submitted.current = false; if (current()) setBusy(false); }
  };
  const upload = () => void mutate(async () => {
    if (!selection) return;
    const body = await accountAvatarBody(selection, controller.current.signal);
    if (!current()) throw Error('SESSION_CHANGED');
    return profileApi.avatar(body, controller.current.signal);
  });
  const fieldError = (key: string) => errors[key] ? copy[errors[key] as 'required'] : undefined;
  return <AppScrollScreen avoidAndroidKeyboard>
    <TextButton title={copy.back} onPress={() => router.back()} disabled={busy} />
    <LargeTitleHeader title={copy[mode === 'edit' ? 'edit' : mode]} />
    <View style={styles.form} collapsable={false}>
      {loading ? <LoadingState /> : null}
      <View collapsable={false}>{message ? <AppText accessibilityRole="alert" accessibilityLiveRegion="polite" tone={success ? 'success' : 'error'}>{message}</AppText> : null}</View>
      <View collapsable={false}>{gate?.uncertain ? <AppText tone="error">{copy.uncertain}</AppText> : null}</View>
      <TextButton title={copy.retry} disabled={busy || loading} onPress={() => {
        if (dirty) Alert.alert(copy.discard, copy.discardMessage, [{ text: copy.keep, style: 'cancel' }, { text: copy.discardAction, style: 'destructive', onPress: () => { setPassword(emptyPassword()); setSelection(undefined); void load(); } }]);
        else void load();
      }} />
      {original && !loading && mode === 'edit' ? <View style={styles.form} collapsable={false}>
        <AppText tone="secondary">{copy.readonly}</AppText>
        <MyLifeTextField label={copy.displayName} value={form.displayName} maxLength={150} disabled={busy} error={fieldError('displayName')} onChangeText={displayName => setForm(f => ({ ...f, displayName }))} autoFocus />
        <MyLifeTextField label={copy.phoneNumber} value={form.phoneNumber} keyboardType="phone-pad" disabled={busy} error={fieldError('phoneNumber')} onChangeText={phoneNumber => setForm(f => ({ ...f, phoneNumber }))} />
        <AppText variant="label">{copy.gender}</AppText><ChipRow>{(['Nam', 'Nữ', 'Khác'] as const).map((gender, index) => <ChoiceChip key={gender} label={[copy.male, copy.female, copy.other][index]} selected={form.gender === gender} onPress={() => { if (!busy) setForm(f => ({ ...f, gender })); }} />)}</ChipRow>
        {errors.gender ? <AppText tone="error">{copy.genderInvalid}</AppText> : null}
        <MyLifeTextField label={copy.dateOfBirth} value={form.dateOfBirth} placeholder="DD/MM/YYYY" keyboardType="numbers-and-punctuation" disabled={busy} error={fieldError('dateOfBirth')} onChangeText={dateOfBirth => setForm(f => ({ ...f, dateOfBirth }))} />
        <PrimaryButton title={copy.save} loading={busy} disabled={gate?.uncertain} onPress={saveProfile} />
      </View> : null}
      {original && !loading && mode === 'security' ? <View style={styles.form}>
        <AppText variant="label">{copy.providers}</AppText><AppText>{providerLabel(original)}</AppText>
        <AppText tone="secondary">{copy.sessionLimit}</AppText>
        {original.loginProviders?.local === true ? <>
          {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map(key => <MyLifePasswordField key={key} label={copy[key]} showPasswordLabel={`${globalCopy.showPassword} · ${copy[key]}`} hidePasswordLabel={`${globalCopy.hidePassword} · ${copy[key]}`} value={password[key]} disabled={busy} error={fieldError(key)} autoComplete="off" textContentType="none" autoCorrect={false} autoCapitalize="none" onChangeText={value => setPassword(p => ({ ...p, [key]: value }))} />)}
          <AppText accessibilityLiveRegion="polite">{copy.strengths[passwordStrength(password.newPassword)]}</AppText><AppText variant="caption" tone="secondary">{copy.passwordHint}</AppText>
          <PrimaryButton title={copy.changePassword} loading={busy} disabled={gate?.uncertain} onPress={savePassword} />
        </> : <AppText>{original.loginProviders?.google ? copy.googleOnly : copy.providerUnknown}</AppText>}
        <TextButton title={copy.logout} disabled={busy} onPress={() => { disablePrevention(); void logout(); }} />
      </View> : null}
      {original && !loading && mode === 'avatar' ? <View style={styles.form}>
        {selection ? <Image source={{ uri: selection.uri }} accessibilityLabel={copy.avatar} cachePolicy="none" style={styles.preview} /> : <Avatar key={`${user?.id}:${user?.updatedAt}`} uri={accountAvatarUri(user)} name={user?.displayName || user?.fullName || ''} size={112} />}
        <AppText tone="secondary">{copy.imageHint}</AppText><AppText variant="caption" tone="secondary">{copy.avatarPrivacy}</AppText>
        <TextButton title={copy.chooseImage} disabled={busy} onPress={() => void pick()} />
        {selection ? <><PrimaryButton title={busy ? copy.uploading : copy.upload} loading={busy} disabled={gate?.uncertain} onPress={upload} /><TextButton title={copy.cancel} disabled={busy} onPress={() => setSelection(undefined)} /></> : null}
        {user?.avatarUrl ? <DestructiveButton title={copy.removeAvatar} disabled={busy || gate?.uncertain} onPress={() => Alert.alert(copy.removeAvatar, copy.removeAvatarMessage, [{ text: copy.cancel, style: 'cancel' }, { text: copy.removeAvatar, style: 'destructive', onPress: () => void mutate(() => profileApi.avatar(null, controller.current.signal)) }])} /> : null}
      </View> : null}
    </View>
  </AppScrollScreen>;
}
const styles = StyleSheet.create({ form: { gap: spacing.md }, preview: { width: 144, height: 144, borderRadius: 72 } });
