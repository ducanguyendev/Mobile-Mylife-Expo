import { formatDateOnly } from '@/features/home/home-data';
import type { Language } from '@/preferences/preferences';
import type { Anniversary, AnniversaryType } from './anniversary-data';

const en = {
  memories: 'Memories', title: 'Family calendar', subtitle: 'Anniversaries and the next dates shared by your family.',
  timeline: 'Family timeline', calendar: 'Calendar', library: 'Library · Coming soon', future: 'Photo and library management is coming later.',
  upcoming: 'Upcoming anniversaries', list: 'Chronological list', grid: 'Month calendar',
  coverage: 'Each anniversary has one provided upcoming occurrence. Other months may have no dates yet. Refresh to update the available dates.',
  previous: 'Previous month', next: 'Next month', today: 'Today', jump: 'Go to month', month: 'Month', year: 'Year', apply: 'Apply',
  weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  selectedDate: 'Selected date', chooseDate: 'Select a date to see its events.', clear: 'Clear filters',
  search: 'Search title, member, place, host or notes', all: 'All', death: 'Death anniversary', family: 'Family event',
  deathMarker: 'D · Death anniversary', familyMarker: 'F · Family event', events: 'events', count: 'Shown / total',
  add: 'Add anniversary', edit: 'Edit anniversary', details: 'Anniversary details', remove: 'Delete anniversary',
  save: 'Save anniversary', saving: 'Saving…', cancel: 'Cancel', close: 'Close', refresh: 'Refresh', retryPreview: 'Retry date preview',
  titleField: 'Title', eventType: 'Event type', member: 'Related member', pick: 'Choose related member', none: 'No linked member',
  memberHelp: 'Death anniversaries can link to deceased members with a recorded death date. Update missing dates in the member profile.',
  memberDates: 'Edit member dates', profile: 'Open member profile', memberCalendar: 'Member anniversaries', manage: 'Manage original anniversary',
  original: 'Original solar date', dateHint: 'YYYY-MM-DD', originalHelp: 'The historical date stays separate from the upcoming occurrence.',
  day: 'Lunar day', lunarMonth: 'Lunar month', lunarYear: 'Original lunar year', lunarHelp: 'Vietnamese lunar year 1800–2200. Enter the actual lunar year of the original event.',
  leap: 'Leap lunar month', conversion: 'Converted original solar date', matched: 'Original dates match', mismatch: 'The original solar date does not match the lunar conversion.',
  previewLoading: 'Checking dates…', previewPending: 'Complete the lunar date and wait for matching conversion and next-occurrence previews before saving.',
  nextDate: 'Next solar occurrence', nextYear: 'Next lunar year', currentPassed: 'The occurrence in the current solar year has passed.',
  currentNotPassed: 'The occurrence in the current solar year has not passed, or that year has no matching leap month.',
  leapHelp: 'Years without this leap month are skipped.',
  place: 'Place', deathPlace: 'Commemoration place', host: 'Host', deathHost: 'Commemoration host', notes: 'Notes', noValue: 'Not recorded',
  legacy: 'This older record has no original solar date. Its upcoming occurrence is still available. Enter the original date to save an update.',
  discardTitle: 'Discard unsaved changes?', discardMessage: 'Your anniversary draft has not been saved.', keep: 'Keep editing', discard: 'Discard draft',
  deleteTitle: 'Delete this anniversary?', deleteHint: 'The anniversary and its derived Timeline row will be removed. The member profile is preserved.',
  saved: 'Anniversary saved.', removed: 'Anniversary removed.', empty: 'No anniversaries yet', emptyHint: 'Add a family event or a death anniversary.',
  noResults: 'No anniversaries match these filters.', noDayEvents: 'No provided upcoming occurrences on this date.',
  loadError: 'Could not load anniversaries. Please retry.', failed: 'Could not complete the operation. Please retry.',
  uncertain: 'The last write may have reached the server. Refresh to reconcile before saving or deleting again.',
  stale: 'This anniversary changed since you opened it. Close and reload its latest details before editing or deleting.',
  invalidData: 'The server response could not be validated. Please refresh.', invalidDate: 'Enter a valid ISO date or month/year.',
  invalidTitle: 'Enter a title containing 2–200 characters.', invalidType: 'Choose a supported anniversary type.',
  invalidLunar: 'This lunar date or leap month is invalid. Check the day, month and year.',
  requiredDate: 'Enter a valid original solar date and, for a death anniversary, its lunar year.',
  living: 'A death anniversary can only link to a deceased member.', missingDeath: 'The linked member needs a valid recorded death date.',
  deathMismatch: 'The original solar date must equal the linked member’s recorded death date.',
  missingMember: 'The related member is unavailable. Refresh the family directory.',
  invalidPlace: 'Place must contain at most 500 characters.', invalidHost: 'Host must contain at most 300 characters.', invalidNotes: 'Notes must contain at most 2000 characters.',
  forbidden: 'This feature is available to USER accounts.', expired: 'Your session expired. Please sign in again.', notFound: 'This anniversary or member is no longer available.',
};
export type AnniversaryCopy = typeof en;
const vi: AnniversaryCopy = {
  memories: 'Ký ức', title: 'Lịch gia đình', subtitle: 'Ngày kỷ niệm và những dịp sắp tới của gia đình.',
  timeline: 'Dòng thời gian gia đình', calendar: 'Lịch', library: 'Thư viện · Sắp có', future: 'Chức năng quản lý ảnh và thư viện sẽ có sau.',
  upcoming: 'Ngày kỷ niệm sắp tới', list: 'Danh sách theo thời gian', grid: 'Lịch tháng',
  coverage: 'Mỗi ngày kỷ niệm chỉ có một lần sắp tới được cung cấp. Những tháng khác có thể chưa có dữ liệu. Tải lại để cập nhật các ngày đã có.',
  previous: 'Tháng trước', next: 'Tháng sau', today: 'Hôm nay', jump: 'Đến tháng', month: 'Tháng', year: 'Năm', apply: 'Áp dụng',
  weekdays: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
  selectedDate: 'Ngày đã chọn', chooseDate: 'Chọn một ngày để xem sự kiện.', clear: 'Xóa bộ lọc',
  search: 'Tìm tiêu đề, thành viên, địa điểm, chủ trì hoặc ghi chú', all: 'Tất cả', death: 'Ngày giỗ', family: 'Sự kiện gia đình',
  deathMarker: 'G · Ngày giỗ', familyMarker: 'S · Sự kiện gia đình', events: 'sự kiện', count: 'Hiển thị / tổng số',
  add: 'Thêm ngày kỷ niệm', edit: 'Sửa ngày kỷ niệm', details: 'Chi tiết ngày kỷ niệm', remove: 'Xóa ngày kỷ niệm',
  save: 'Lưu ngày kỷ niệm', saving: 'Đang lưu…', cancel: 'Hủy', close: 'Đóng', refresh: 'Tải lại', retryPreview: 'Kiểm tra ngày lại',
  titleField: 'Tiêu đề', eventType: 'Loại sự kiện', member: 'Thành viên liên quan', pick: 'Chọn thành viên liên quan', none: 'Không liên kết thành viên',
  memberHelp: 'Ngày giỗ có thể liên kết với người đã mất có ngày mất trong hồ sơ. Hãy cập nhật ngày còn thiếu trong hồ sơ thành viên.',
  memberDates: 'Sửa ngày của thành viên', profile: 'Mở hồ sơ thành viên', memberCalendar: 'Ngày kỷ niệm của thành viên', manage: 'Quản lý ngày kỷ niệm gốc',
  original: 'Ngày dương lịch gốc', dateHint: 'YYYY-MM-DD', originalHelp: 'Ngày lịch sử được lưu riêng với lần diễn ra sắp tới.',
  day: 'Ngày âm lịch', lunarMonth: 'Tháng âm lịch', lunarYear: 'Năm âm lịch gốc', lunarHelp: 'Năm âm lịch Việt Nam từ 1800–2200. Nhập đúng năm âm lịch của sự kiện gốc.',
  leap: 'Tháng âm lịch nhuận', conversion: 'Ngày dương lịch gốc sau chuyển đổi', matched: 'Ngày gốc khớp nhau', mismatch: 'Ngày dương lịch gốc không khớp với kết quả đổi âm lịch.',
  previewLoading: 'Đang kiểm tra ngày…', previewPending: 'Điền đủ ngày âm lịch và chờ kết quả chuyển đổi cùng lần diễn ra tiếp theo khớp nhau trước khi lưu.',
  nextDate: 'Lần dương lịch tiếp theo', nextYear: 'Năm âm lịch tiếp theo', currentPassed: 'Lần diễn ra trong năm dương lịch hiện tại đã qua.',
  currentNotPassed: 'Lần diễn ra trong năm dương lịch hiện tại chưa qua, hoặc năm đó không có tháng nhuận tương ứng.',
  leapHelp: 'Những năm không có tháng nhuận này sẽ được bỏ qua.',
  place: 'Địa điểm', deathPlace: 'Nơi tổ chức giỗ', host: 'Chủ trì', deathHost: 'Người chủ trì giỗ', notes: 'Ghi chú', noValue: 'Chưa ghi nhận',
  legacy: 'Bản ghi cũ chưa có ngày dương lịch gốc. Lần diễn ra sắp tới vẫn được hiển thị. Hãy nhập ngày gốc để lưu cập nhật.',
  discardTitle: 'Bỏ thay đổi chưa lưu?', discardMessage: 'Bản nháp ngày kỷ niệm chưa được lưu.', keep: 'Tiếp tục sửa', discard: 'Bỏ bản nháp',
  deleteTitle: 'Xóa ngày kỷ niệm này?', deleteHint: 'Ngày kỷ niệm và dòng thời gian được sinh từ nó sẽ bị xóa. Hồ sơ thành viên được giữ lại.',
  saved: 'Đã lưu ngày kỷ niệm.', removed: 'Đã xóa ngày kỷ niệm.', empty: 'Chưa có ngày kỷ niệm', emptyHint: 'Thêm một sự kiện gia đình hoặc ngày giỗ.',
  noResults: 'Không có ngày kỷ niệm khớp bộ lọc.', noDayEvents: 'Không có lần diễn ra sắp tới được cung cấp cho ngày này.',
  loadError: 'Không tải được ngày kỷ niệm. Vui lòng thử lại.', failed: 'Không thể hoàn tất thao tác. Vui lòng thử lại.',
  uncertain: 'Lần ghi vừa rồi có thể đã đến máy chủ. Hãy tải lại để đối chiếu trước khi lưu hoặc xóa tiếp.',
  stale: 'Ngày kỷ niệm đã thay đổi từ lúc mở. Hãy đóng và tải lại chi tiết mới nhất trước khi sửa hoặc xóa.',
  invalidData: 'Không xác thực được dữ liệu phản hồi. Vui lòng tải lại.', invalidDate: 'Nhập ngày ISO hoặc tháng/năm hợp lệ.',
  invalidTitle: 'Nhập tiêu đề từ 2–200 ký tự.', invalidType: 'Chọn loại ngày kỷ niệm được hỗ trợ.',
  invalidLunar: 'Ngày âm lịch hoặc tháng nhuận không hợp lệ. Hãy kiểm tra ngày, tháng và năm.',
  requiredDate: 'Nhập ngày dương lịch gốc hợp lệ và năm âm lịch nếu là ngày giỗ.',
  living: 'Ngày giỗ chỉ được liên kết với thành viên đã mất.', missingDeath: 'Thành viên được liên kết cần có ngày mất hợp lệ trong hồ sơ.',
  deathMismatch: 'Ngày dương lịch gốc phải bằng ngày mất được ghi trong hồ sơ thành viên.',
  missingMember: 'Không tìm thấy thành viên liên quan. Hãy tải lại danh sách gia đình.',
  invalidPlace: 'Địa điểm tối đa 500 ký tự.', invalidHost: 'Chủ trì tối đa 300 ký tự.', invalidNotes: 'Ghi chú tối đa 2000 ký tự.',
  forbidden: 'Chức năng này dành cho tài khoản USER.', expired: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', notFound: 'Ngày kỷ niệm hoặc thành viên không còn tồn tại.',
};
export const anniversaryStrings = { en, vi };
export function anniversaryTypeLabel(type: AnniversaryType, copy: AnniversaryCopy): string {
  return type === 'DEATH_ANNIVERSARY' ? copy.death : copy.family;
}
export function solarDateLabel(date: string | null, language: Language, copy: AnniversaryCopy): string {
  return date ? formatDateOnly(date, language) ?? copy.noValue : copy.noValue;
}
export function countdownLabel(item: Pick<Anniversary, 'daysUntil'>, language: Language, copy: AnniversaryCopy): string {
  return item.daysUntil === 0 ? copy.today : language === 'vi' ? `Còn ${item.daysUntil} ngày` : `In ${item.daysUntil} days`;
}
export function anniversaryError(error: unknown, copy: AnniversaryCopy): string {
  const value = error as { code?: string; message?: string; status?: number } | null;
  const messages: Record<string, string> = {
    FAMILY_ANNIVERSARY_INVALID_EVENT_TYPE: copy.invalidType, FAMILY_ANNIVERSARY_INVALID_TITLE: copy.invalidTitle,
    FAMILY_ANNIVERSARY_INVALID_LUNAR_DATE: copy.invalidLunar, FAMILY_ANNIVERSARY_ORIGINAL_DATE_REQUIRED: copy.requiredDate,
    FAMILY_ANNIVERSARY_DATE_MISMATCH: copy.mismatch, FAMILY_ANNIVERSARY_MEMBER_NOT_DECEASED: copy.living,
    FAMILY_ANNIVERSARY_MEMBER_DEATH_DATE_REQUIRED: copy.missingDeath, FAMILY_ANNIVERSARY_DEATH_DATE_MISMATCH: copy.deathMismatch,
    FAMILY_ANNIVERSARY_INVALID_PLACE: copy.invalidPlace, FAMILY_ANNIVERSARY_INVALID_HOST: copy.invalidHost,
    FAMILY_ANNIVERSARY_INVALID_NOTES: copy.invalidNotes, ANNIVERSARY_MEMBER_MISSING: copy.missingMember,
    ANNIVERSARY_STALE: copy.stale, ANNIVERSARY_RECONCILE: copy.uncertain,
    ANNIVERSARY_INVALID_DATA: copy.invalidData, ANNIVERSARY_PREVIEW_PENDING: copy.previewPending,
    ANNIVERSARY_INVALID_DATE: copy.invalidDate,
  };
  const code = value?.code ?? value?.message ?? '';
  if (messages[code]) return messages[code];
  if (value?.status === 401) return copy.expired;
  if (value?.status === 403) return copy.forbidden;
  if (value?.status === 404) return copy.notFound;
  return copy.failed;
}
