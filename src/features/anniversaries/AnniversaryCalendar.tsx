import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/design-system/components/app-text';
import { MyLifeTextField } from '@/design-system/components/fields';
import { PrimaryButton, SecondaryButton } from '@/design-system/components/buttons';
import { AppCard } from '@/design-system/components/surfaces';
import { useAppTheme } from '@/theme/theme-provider';
import type { Anniversary } from './anniversary-data';
import { calendarGrid, calendarMonthValid, dateMonth, eventsByNextDate, moveCalendarMonth, type CalendarMonth } from './calendar-data';
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
export function AnniversaryCalendar({ items, month, today, selected, copy, onMonth, onSelect }: Props) {
  const { colors, language } = useAppTheme();
  const [jumpOpen, setJumpOpen] = useState(false);
  const cells = useMemo(() => calendarGrid(month), [month]);
  const grouped = useMemo(() => eventsByNextDate(items), [items]);
  const previous = moveCalendarMonth(month, -1);
  const next = moveCalendarMonth(month, 1);
  const monthLabel = new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${month.year}-${String(month.month).padStart(2, '0')}-01T12:00:00Z`));
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
      {cells.map(cell => {
        const events = grouped.get(cell.date) ?? [];
        const death = events.filter(item => item.eventType === 'DEATH_ANNIVERSARY').length;
        const family = events.length - death;
        const isSelected = cell.date === selected;
        const isToday = cell.date === today;
        const label = [solarDateLabel(cell.date, language, copy), `${events.length} ${copy.events}`,
          death ? `${copy.death} ${death}` : '', family ? `${copy.family} ${family}` : '', isToday ? copy.today : ''].filter(Boolean).join(', ');
        return <Pressable key={cell.date} accessibilityRole="button" accessibilityLabel={label}
          accessibilityState={{ selected: isSelected }} onPress={() => onSelect(isSelected ? null : cell.date)}
          style={{ width: '14.285714%', minHeight: 70, paddingVertical: 8, alignItems: 'center', gap: 4,
            backgroundColor: isSelected ? colors.surfaceMuted : colors.surface,
            borderRadius: 12, borderWidth: isSelected ? 3 : isToday ? 2 : 0,
            borderColor: colors.controlBorder }}>
          <AppText tone={cell.inMonth ? 'primary' : 'secondary'}>{cell.day}</AppText>
          {events.length ? <View style={{ alignItems: 'center', maxWidth: '100%', borderBottomWidth: 3, borderBottomColor: death ? colors.accentAnniversary : colors.accentFamily }}>
            <AppText variant="caption" style={{ textAlign: 'center' }}>{death ? language === 'vi' ? 'G' : 'D' : ''}{family ? language === 'vi' ? 'S' : 'F' : ''}{events.length}</AppText>
          </View> : null}
        </Pressable>;
      })}
    </View>
    <AppText variant="caption" tone="secondary">{copy.deathMarker} · {copy.familyMarker}</AppText>
    <AppText tone="secondary">{copy.coverage}</AppText>
    <AppText>{selected ? `${copy.selectedDate} ${solarDateLabel(selected, language, copy)}` : copy.chooseDate}</AppText>
    {jumpOpen ? <MonthJump month={month} copy={copy} onCancel={() => setJumpOpen(false)} onConfirm={value => { onMonth(value); setJumpOpen(false); }} /> : null}
  </AppCard>;
}
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
