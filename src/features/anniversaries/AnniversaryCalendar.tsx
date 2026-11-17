import { memo, useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/design-system/components/app-text';
import { MyLifeTextField } from '@/design-system/components/fields';
import { PrimaryButton, SecondaryButton } from '@/design-system/components/buttons';
import { AppCard } from '@/design-system/components/surfaces';
import { useAppTheme } from '@/theme/theme-provider';
import type { Anniversary } from './anniversary-data';
import { calendarGrid, calendarMonthValid, dateMonth, eventsByNextDate, moveCalendarMonth, type CalendarDay, type CalendarMonth } from './calendar-data';
import { solarDateLabel, type AnniversaryCopy } from './anniversary-strings';

type Props = {
  items: Anniversary[];
  month: CalendarMonth;
  today: string;
  selected: string | null;
  copy: AnniversaryCopy;
  onMonth: (month: CalendarMonth) => void;
  onSelect: (date: string | null) => void;
};
export const AnniversaryCalendar = memo(function AnniversaryCalendar({ items, month, today, selected, copy, onMonth, onSelect }: Props) {
  const { language } = useAppTheme();
  const [jumpOpen, setJumpOpen] = useState(false);
  const cells = useMemo(() => calendarGrid({ year: month.year, month: month.month }), [month.year, month.month]);
  const grouped = useMemo(() => eventsByNextDate(items), [items]);
  const previous = useMemo(() => moveCalendarMonth(month, -1), [month]);
  const next = useMemo(() => moveCalendarMonth(month, 1), [month]);
  const monthFormatter = useMemo(() => new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }), [language]);
  const monthLabel = useMemo(() => monthFormatter.format(new Date(`${month.year}-${String(month.month).padStart(2, '0')}-01T12:00:00Z`)), [monthFormatter, month.year, month.month]);
  const summaries = useMemo(() => cells.map(cell => {
    const events = grouped.get(cell.date);
    const count = events?.length ?? 0;
    const death = events?.filter(item => item.eventType === 'DEATH_ANNIVERSARY').length ?? 0;
    const family = count - death;
    const label = [solarDateLabel(cell.date, language, copy), `${count} ${copy.events}`, death ? `${copy.death} ${death}` : '', family ? `${copy.family} ${family}` : '', cell.date === today ? copy.today : ''].filter(Boolean).join(', ');
    return { cell, count, death, family, label };
  }), [cells, grouped, language, copy, today]);
  return <AppCard inset style={{ gap: 16 }}>
    <AppText variant="sectionTitle" accessibilityRole="header">{monthLabel}</AppText>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <SecondaryButton compact title={copy.previous} disabled={!calendarMonthValid(previous)} onPress={() => onMonth(previous)} />
      <SecondaryButton compact title={copy.next} disabled={!calendarMonthValid(next)} onPress={() => onMonth(next)} />
      <SecondaryButton compact title={copy.today} onPress={() => { onMonth(dateMonth(today)); onSelect(today); }} />
      <SecondaryButton compact title={copy.jump} onPress={() => setJumpOpen(true)} />
    </View>
    <View style={{ flexDirection: 'row' }}>
      {copy.weekdays.map(day => <View key={day} style={{ width: '14.285714%', alignItems: 'center' }}><AppText variant="caption">{day}</AppText></View>)}
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {summaries.map(summary => <CalendarCell key={summary.cell.date} summary={summary} selected={summary.cell.date === selected} today={summary.cell.date === today} onSelect={onSelect} />)}
    </View>
    <AppText variant="caption" tone="secondary">{copy.deathMarker} · {copy.familyMarker}</AppText>
    <AppText tone="secondary">{copy.coverage}</AppText>
    <AppText>{selected ? `${copy.selectedDate} ${solarDateLabel(selected, language, copy)}` : copy.chooseDate}</AppText>
    {jumpOpen ? <MonthJump month={month} copy={copy} onCancel={() => setJumpOpen(false)} onConfirm={value => { onMonth(value); setJumpOpen(false); }} /> : null}
  </AppCard>;
});
type CellSummary = { cell: CalendarDay; count: number; death: number; family: number; label: string };
const CalendarCell = memo(function CalendarCell({ summary, selected, today, onSelect }: { summary: CellSummary; selected: boolean; today: boolean; onSelect: Props['onSelect'] }) {
  const { colors, language } = useAppTheme();
  const choose = useCallback(() => onSelect(selected ? null : summary.cell.date), [onSelect, selected, summary.cell.date]);
  return <Pressable accessibilityRole="button" accessibilityLabel={summary.label} accessibilityState={{ selected }} onPress={choose}
    style={[styles.cell, { backgroundColor: selected ? colors.surfaceMuted : colors.surface, borderWidth: selected ? 3 : today ? 2 : 0, borderColor: colors.controlBorder }]}>
    <AppText tone={summary.cell.inMonth ? 'primary' : 'secondary'}>{summary.cell.day}</AppText>
    {summary.count ? <View style={[styles.marker, { borderBottomColor: summary.death ? colors.accentAnniversary : colors.accentFamily }]}>
      <AppText variant="caption" style={styles.center}>{summary.death ? language === 'vi' ? 'G' : 'D' : ''}{summary.family ? language === 'vi' ? 'S' : 'F' : ''}{summary.count}</AppText>
    </View> : null}
  </Pressable>;
});
const styles = StyleSheet.create({ cell: { width: '14.285714%', minHeight: 70, paddingVertical: 8, alignItems: 'center', gap: 4, borderRadius: 12 }, marker: { alignItems: 'center', maxWidth: '100%', borderBottomWidth: 3 }, center: { textAlign: 'center' } });
function MonthJump({ month, copy, onCancel, onConfirm }: { month: CalendarMonth; copy: AnniversaryCopy; onCancel: () => void; onConfirm: (value: CalendarMonth) => void }) {
  const { colors, reducedMotion } = useAppTheme();
  const [year, setYear] = useState(String(month.year));
  const [number, setNumber] = useState(String(month.month));
  const [error, setError] = useState(false);
  return <Modal visible animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={onCancel}>
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 20 }}>
        <AppText variant="sectionTitle" accessibilityRole="header">{copy.jump}</AppText>
        <MyLifeTextField label={copy.month} accessibilityLabel={copy.month} value={number} onChangeText={setNumber} maxLength={2} keyboardType="number-pad" />
        <MyLifeTextField label={copy.year} accessibilityLabel={copy.year} value={year} onChangeText={setYear} maxLength={4} keyboardType="number-pad" />
        {error ? <AppText accessibilityRole="alert" tone="error">{copy.invalidDate}</AppText> : null}
        <PrimaryButton title={copy.apply} onPress={() => {
          const value = { year: Number(year), month: Number(number) };
          if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(number) || !calendarMonthValid(value)) setError(true);
          else onConfirm(value);
        }} />
        <SecondaryButton title={copy.cancel} onPress={onCancel} />
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}
