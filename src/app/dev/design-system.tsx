import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ActionSheet, AppModal, ConfirmDialog } from '@/design-system/components/presentation';
import { Avatar } from '@/design-system/components/avatar';
import { AppIcon } from '@/design-system/components/app-icon';
import { AppText } from '@/design-system/components/app-text';
import { DestructiveButton, IconButton, PrimaryButton, SecondaryButton, TextButton } from '@/design-system/components/buttons';
import { ChoiceChip, ChipRow, FilterChip, SegmentedTabs, StatusPill } from '@/design-system/components/controls';
import { MyLifeDateField, MyLifePasswordField, MyLifeSearchField, MyLifeSelectField, MyLifeTextArea, MyLifeTextField } from '@/design-system/components/fields';
import { AppCard, ActionRow, EditorialCard, InfoCard } from '@/design-system/components/surfaces';
import { AppScrollScreen, AppHeader, SectionHeader } from '@/components/layout/app-screen';
import { EmptyState, ErrorState, LoadingState, OfflineState, SkeletonBlock } from '@/components/feedback/states';
import { useToast } from '@/components/feedback/toast-provider';
import { spacing } from '@/design-system/tokens';
import { useAppTheme, type ThemeMode } from '@/theme/theme-provider';

const demoOptions = [{ value: 'tree', label: 'Cây' }, { value: 'members', label: 'Thành viên' }, { value: 'map', label: 'Bản đồ' }] as const;
type DemoTab = (typeof demoOptions)[number]['value'];

export default function DesignSystemScreen() {
  const { colors, mode, setMode } = useAppTheme();
  const { showToast } = useToast();
  const [tab, setTab] = useState<DemoTab>('tree');
  const [query, setQuery] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  return (
    <AppScrollScreen contentContainerStyle={styles.page}>
      <AppHeader title="Design System" eyebrow="MYLIFE · V3" subtitle="Nền tảng giao diện dùng chung." right={<IconButton label="Đóng" onPress={() => router.back()} icon={<AppIcon name={{ ios: 'xmark', android: 'close', web: 'close' }} />} />} />

      <SectionHeader title="Theme" />
      <SegmentedTabs<ThemeMode> options={[{ value: 'system', label: 'Hệ thống' }, { value: 'light', label: 'Sáng' }, { value: 'dark', label: 'Tối' }]} value={mode} onChange={setMode} />
      <View style={styles.swatches}>{Object.entries(colors).slice(0, 17).map(([name, color]) => <View key={name} style={styles.swatch}><View style={[styles.swatchColor, { backgroundColor: color }]} /><AppText variant="caption" numberOfLines={1}>{name}</AppText></View>)}</View>

      <SectionHeader title="Typography" />
      <AppCard style={styles.block}><AppText variant="display">A family archive</AppText><AppText variant="screenTitle">Every day, remembered.</AppText><AppText variant="sectionTitle">Section title</AppText><AppText variant="cardTitle">Card title with a warm voice</AppText><AppText>Body text stays calm and easy to read across screens.</AppText><AppText variant="bodyMedium">Body medium · A little more emphasis</AppText><AppText variant="caption" tone="secondary">CAPTION · 12 MAY 2026</AppText><AppText variant="label">Field label</AppText></AppCard>

      <SectionHeader title="Buttons & feedback" />
      <View style={styles.rowWrap}><PrimaryButton title="Primary" onPress={() => showToast('Đã lưu thay đổi', 'success')} /><SecondaryButton title="Secondary" onPress={() => showToast('Thông tin đã sẵn sàng', 'info')} /><TextButton title="Text button" onPress={() => showToast('Đây là thông báo', 'warning')} /><DestructiveButton title="Destructive" onPress={() => showToast('Có lỗi xảy ra', 'error')} /><PrimaryButton title="Loading" loading /><SecondaryButton title="Disabled" disabled /><IconButton label="Thêm thành viên" icon={<AppIcon name={{ ios: 'plus', android: 'add', web: 'add' }} />} /></View>

      <SectionHeader title="Fields" />
      <View style={styles.block}>
        <MyLifeTextField label="Họ và tên" placeholder="Ví dụ: Nguyễn Minh Anh" helperText="Tên hiển thị với gia đình." />
        <MyLifePasswordField label="Mật khẩu" placeholder="Nhập mật khẩu" />
        <MyLifeTextArea label="Ghi chú" placeholder="Viết một vài dòng…" helperText="Có thể chỉnh sửa sau." />
        <MyLifeSearchField label="Tìm kiếm" placeholder="Tìm thành viên" value={query} onChangeText={setQuery} />
        <MyLifeSelectField label="Mối quan hệ" value="Con gái" onPress={() => showToast('Danh sách lựa chọn sẽ hiển thị tại đây', 'info')} />
        <MyLifeDateField label="Ngày sinh" value="12 tháng 5, 2012" onPress={() => showToast('Bộ chọn ngày là nền tảng cho giai đoạn sau', 'info')} />
        <MyLifeTextField label="Trường có lỗi" placeholder="Kiểm tra địa chỉ email" error="Vui lòng nhập email hợp lệ." />
        <MyLifeTextField label="Chỉ đọc" value="Thông tin đã xác nhận" readOnly />
      </View>

      <SectionHeader title="Tabs, chips & status" />
      <View style={{ gap: spacing.md }}>
        <SegmentedTabs options={[...demoOptions]} value={tab} onChange={setTab} />
        <ChipRow><FilterChip label="Tất cả" selected /><FilterChip label="Ảnh" /><FilterChip label="Video" /><ChoiceChip label="Đã chọn" selected /></ChipRow>
        <View style={styles.rowWrap}><StatusPill label="Đang hoạt động" tone="success" /><StatusPill label="Sắp tới" tone="warning" /><StatusPill label="Nháp" /><StatusPill label="Lỗi" tone="error" /></View>
      </View>

      <SectionHeader title="Avatars & surfaces" />
      <View style={[styles.rowWrap, { alignItems: 'center' }]}><Avatar name="Mai Anh" size={36} /><Avatar name="Tuấn Minh" size={50} status="online" /><Avatar name="Bảo An Nguyễn" size={68} accent={colors.accentFamily} /></View>
      <View style={styles.rowWrap}><InfoCard label="Thành viên" value="12 người" /><InfoCard label="Ký ức" value="128 ảnh" accent={colors.accentLibrary} /></View>
      <EditorialCard inset style={styles.editorial}><AppText variant="caption" tone="secondary">LIVING FAMILY ARCHIVE</AppText><AppText variant="sectionTitle">A softer place for family stories.</AppText></EditorialCard>
      <AppCard style={styles.block}><ActionRow title="Một dòng cài đặt" detail="Mô tả ngắn bên dưới" leading={<AppIcon name={{ ios: 'gearshape', android: 'settings', web: 'settings' }} />} trailing={<AppIcon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} />} /></AppCard>

      <SectionHeader title="Loading, empty & error" />
      <View style={styles.block}><SkeletonBlock height={20} width="65%" /><SkeletonBlock height={120} /><LoadingState label="Đang tải nội dung" /></View>
      <EmptyState title="Chưa có kỷ niệm" message="Những khoảnh khắc đầu tiên của gia đình sẽ hiện ở đây." />
      <ErrorState title="Không thể tải nội dung" message="Vui lòng kiểm tra kết nối và thử lại." retry={() => showToast('Đang thử lại', 'info')} />
      <OfflineState />

      <SectionHeader title="Modal & toast" />
      <View style={styles.rowWrap}><SecondaryButton title="Mở modal" onPress={() => setModalVisible(true)} /><SecondaryButton title="Mở action sheet" onPress={() => setSheetVisible(true)} /><SecondaryButton title="Xác nhận" onPress={() => setConfirmVisible(true)} /></View>
      <View style={styles.rowWrap}><PrimaryButton title="Toast thành công" onPress={() => showToast('Lưu thành công', 'success')} compact /><SecondaryButton title="Toast lỗi" onPress={() => showToast('Có lỗi xảy ra', 'error')} compact /></View>

      <View style={[styles.themeFooter, { backgroundColor: colors.surfaceMuted }]}><AppText variant="caption" tone="secondary">Prototype tĩnh · Không có API hay tài khoản thật.</AppText></View>
      <AppModal visible={modalVisible} onClose={() => setModalVisible(false)} title="Một hộp thoại">
        <AppText tone="secondary">Nền tảng modal dùng chung cho biểu mẫu và thông tin ngắn.</AppText><PrimaryButton title="Đã hiểu" onPress={() => setModalVisible(false)} />
      </AppModal>
      <ActionSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} title="Thao tác">
        <SecondaryButton title="Chỉnh sửa thông tin" onPress={() => setSheetVisible(false)} fullWidth /><SecondaryButton title="Chia sẻ với gia đình" onPress={() => setSheetVisible(false)} fullWidth />
      </ActionSheet>
      <ConfirmDialog visible={confirmVisible} title="Xác nhận thao tác" message="Đây là một hộp thoại xác nhận mẫu." confirmLabel="Tiếp tục" onClose={() => setConfirmVisible(false)} onConfirm={() => { setConfirmVisible(false); showToast('Đã xác nhận', 'success'); }} />
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  page: { gap: spacing.md, paddingBottom: spacing.xxxl },
  block: { padding: spacing.lg, gap: spacing.md },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: { width: '23%', minWidth: 72, gap: spacing.xs },
  swatchColor: { height: 38, borderRadius: 10 },
  editorial: { gap: spacing.sm, minHeight: 120, justifyContent: 'center' },
  themeFooter: { padding: spacing.md, borderRadius: 14, alignItems: 'center' },
});
