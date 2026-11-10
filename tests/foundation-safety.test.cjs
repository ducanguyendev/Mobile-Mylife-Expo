const assert = require('node:assert/strict');
const test = require('node:test');
const { createLoader, hookRuntime } = require('./helpers/load-foundation.cjs');
const validation = createLoader()('src/features/family/validation/familyValidation.ts');
const values = { fullName: 'Member', generation: '1', gender: 'Nam', dateOfBirth: '1950-01-01', lifeStatus: 'LIVING', deathDate: '', role: '', address: '', phoneNumber: '', facebookUrl: '', instagramUrl: '', biography: '', fatherId: '', motherId: '', spouseId: '', childIds: [] };
test('unsupported horizontal relationships are omitted rather than cleared by an unrelated edit', () => {
  const payload = validation.toFamilyInput({ ...values, phoneNumber: '0901234567' });
  assert.equal(Object.hasOwn(payload, 'horizontalRelations'), false);
  assert.equal(JSON.stringify(payload).includes('horizontalRelations'), false);
  assert.equal(payload.phoneNumber, '0901234567');
});
test('editing roundtrips every supported scalar and relation field from a Web member', () => {
  assert.equal(typeof validation.memberToFormValues, 'function');
  const member = { ...validation.toFamilyInput(values), id: 1, fatherId: 2, motherId: 3, spouseId: 4, childIds: [5, 6], role: 'Ancestor', address: 'Test address', biography: 'Existing biography', facebookUrl: 'https://example.test/f', instagramUrl: 'https://example.test/i', horizontalRelations: [{ memberId: 7, relationType: 'sibling' }] };
  const form = validation.memberToFormValues(member);
  const result = validation.toFamilyInput({ ...form, phoneNumber: '0901234567' });
  for (const field of ['fullName', 'gender', 'dateOfBirth', 'lifeStatus', 'deathDate', 'role', 'address', 'facebookUrl', 'instagramUrl', 'biography', 'fatherId', 'motherId', 'spouseId']) assert.equal(result[field], member[field], field);
  assert.deepEqual(Array.from(result.childIds), [5, 6]);
  assert.equal(Object.hasOwn(result, 'horizontalRelations'), false);
});
test('family dates and required deceased date retain existing validation', () => {
  assert.equal(validation.validDateOnly('2024-02-29'), true);
  assert.equal(validation.validDateOnly('2025-02-29'), false);
  assert.ok(validation.validateMember({ ...values, lifeStatus: 'DECEASED', deathDate: '' }).deathDate);
  assert.ok(validation.validateMember({ ...values, lifeStatus: 'DECEASED', deathDate: '1949-01-01' }).deathDate);
});
test('horizontal backend validation remains a form error', () => {
  assert.equal(validation.backendFieldErrors({ fieldErrors: { HorizontalRelations: ['Invalid relationship'] } }).form, 'Invalid relationship');
});
function nodes(tree) { return !tree || typeof tree !== 'object' ? [] : Array.isArray(tree) ? tree.flatMap(nodes) : [tree, ...nodes(tree.props?.children)]; }
test('all family deep links belong to an authenticated USER protected group', () => {
  const h = hookRuntime(); let status = 'unauthenticated'; let isUser = false;
  const loader = createLoader({
    react: h.hooks, 'react/jsx-runtime': { jsx: h.jsx, jsxs: h.jsx },
    'expo-router': { Stack: { Screen: 'Screen', Protected: 'Protected' }, DarkTheme: { colors: {} }, DefaultTheme: { colors: {} }, ThemeProvider: 'ThemeProvider' },
    'expo-status-bar': { StatusBar: 'StatusBar' },
    'react-native': { View: 'View', StyleSheet: { create: styles => styles } },
    '@/features/auth/context/auth-provider': { AuthProvider: 'AuthProvider', useAuth: () => ({ status, isUser }) },
    '@/features/auth/context/authEvents': { onSessionExpired: () => () => {} },
    '@/components/feedback/toast-provider': { ToastProvider: 'ToastProvider', useToast: () => ({ showToast() {} }) },
    '@/components/feedback/states': { LoadingState: 'LoadingState' },
    '@/components/layout/app-screen': { AppScreen: 'AppScreen' },
    '@/design-system/components/app-text': { AppText: 'AppText' },
    '@/features/auth/i18n/authStrings': { getAuthStrings: () => ({}) },
    '@/theme/theme-provider': { AppThemeProvider: 'AppThemeProvider', useAppTheme: () => ({ resolvedMode: 'light', colors: {} }) },
  });
  const root = loader('src/app/_layout.tsx').default;
  const navigation = nodes(root()).find(node => node.type?.name === 'AppNavigation').type;
  for (const state of [['checking', false], ['unauthenticated', false], ['authenticated', false], ['authenticated', true]]) {
    [status, isUser] = state;
    const tree = h.render(navigation);
    const group = nodes(tree).find(node => node.type === 'Protected' && nodes(node.props.children).some(child => child.type === 'Screen' && child.props.name === 'family'));
    assert.ok(group, 'family navigator must be explicitly protected, not auto-discovered unguarded');
    assert.equal(group.props.guard, status === 'authenticated' && isUser);
    const tabs = nodes(tree).find(node => node.type === 'Protected' && nodes(node.props.children).some(child => child.type === 'Screen' && child.props.name === '(tabs)'));
    assert.equal(tabs.props.guard, status === 'authenticated');
    assert.ok(group.props.redirectTo);
  }
});
