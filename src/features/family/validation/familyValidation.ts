import type { FamilyMemberInput } from '../types/family';

export type FormValues = Omit<FamilyMemberInput, 'generation' | 'fatherId' | 'motherId' | 'spouseId' | 'childIds' | 'horizontalRelations'> & {
  generation: string; fatherId: string; motherId: string; spouseId: string; childIds: string[];
};
export type FormErrors = Partial<Record<keyof FormValues | 'form', string>>;

export function vietnamDateString(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function validDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function validateMember(values: FormValues, now = new Date()): FormErrors {
  const errors: FormErrors = {};
  const name = values.fullName.trim();
  if (!name) errors.fullName = 'Họ tên là bắt buộc.';
  else if (name.length > 100) errors.fullName = 'Họ tên tối đa 100 ký tự.';
  const generation = Number(values.generation);
  if (!Number.isInteger(generation) || generation < 1) errors.generation = 'Thế hệ phải là số nguyên từ 1 trở lên.';
  if (values.gender && values.gender.length > 20) errors.gender = 'Giới tính tối đa 20 ký tự.';
  if (values.role && values.role.length > 50) errors.role = 'Vai trò tối đa 50 ký tự.';
  if (values.address && values.address.length > 255) errors.address = 'Địa chỉ tối đa 255 ký tự.';
  if (values.phoneNumber && values.phoneNumber.length > 20) errors.phoneNumber = 'Số điện thoại tối đa 20 ký tự.';
  if (values.facebookUrl && values.facebookUrl.length > 255) errors.facebookUrl = 'Đường dẫn Facebook tối đa 255 ký tự.';
  if (values.instagramUrl && values.instagramUrl.length > 255) errors.instagramUrl = 'Đường dẫn Instagram tối đa 255 ký tự.';
  if (values.dateOfBirth && !validDateOnly(values.dateOfBirth)) errors.dateOfBirth = 'Ngày sinh cần theo định dạng YYYY-MM-DD.';
  if (values.lifeStatus === 'LIVING') {
    if (values.deathDate) errors.deathDate = 'Người còn sống không có ngày mất.';
  } else if (!values.deathDate || !validDateOnly(values.deathDate)) {
    errors.deathDate = 'Ngày mất hợp lệ là bắt buộc với người đã mất.';
  } else if (values.deathDate > vietnamDateString(now)) {
    errors.deathDate = 'Ngày mất không thể ở tương lai theo giờ Việt Nam.';
  } else if (values.dateOfBirth && validDateOnly(values.dateOfBirth) && values.deathDate < values.dateOfBirth) {
    errors.deathDate = 'Ngày mất không thể trước ngày sinh.';
  }
  for (const key of ['fatherId', 'motherId', 'spouseId'] as const) {
    if (values[key] && (!Number.isInteger(Number(values[key])) || Number(values[key]) <= 0)) errors[key] = 'Chọn thành viên hợp lệ trong cây gia đình.';
  }
  if (values.fatherId && values.fatherId === values.motherId) errors.motherId = 'Cha và mẹ phải là hai thành viên khác nhau.';
  return errors;
}

export function toFamilyInput(values: FormValues): FamilyMemberInput {
  const optionalId = (value: string) => value ? Number(value) : null;
  return {
    ...values,
    fullName: values.fullName.trim(),
    generation: Number(values.generation),
    gender: values.gender || null,
    dateOfBirth: values.dateOfBirth || null,
    deathDate: values.lifeStatus === 'LIVING' ? null : values.deathDate,
    role: values.role || null,
    address: values.address || null,
    phoneNumber: values.phoneNumber || null,
    facebookUrl: values.facebookUrl || null,
    instagramUrl: values.instagramUrl || null,
    biography: values.biography || null,
    fatherId: optionalId(values.fatherId),
    motherId: optionalId(values.motherId),
    spouseId: optionalId(values.spouseId),
    childIds: values.childIds.map(Number).filter(Number.isInteger),
    horizontalRelations: [],
  };
}

export function memberErrorMessage(error: unknown): string {
  const apiError = error as { status?: number; code?: string; kind?: string; message?: string; fieldErrors?: Record<string, string[]> };
  if (apiError?.fieldErrors) return Object.values(apiError.fieldErrors).flat().join(' ');
  switch (apiError?.code) {
    case 'FAMILY_RELATED_MEMBER_NOT_FOUND': return 'Một quan hệ đã chọn không còn thuộc cây gia đình này. Hãy tải lại danh sách.';
    case 'FAMILY_SELF_RELATION': return 'Một thành viên không thể có quan hệ với chính mình.';
    case 'FAMILY_PARENTS_MUST_DIFFER': return 'Cha và mẹ phải là hai thành viên khác nhau.';
    case 'FAMILY_SPOUSE_IN_USE': return 'Thành viên này đã được ghép đôi với người khác.';
    case 'FAMILY_RELATIONSHIP_CYCLE': return 'Quan hệ này tạo thành vòng lặp trong cây gia đình.';
    case 'FAMILY_RELATIONSHIP_INVALID': return 'Thông tin quan hệ chưa hợp lệ.';
    case 'FAMILY_MEMBER_DEATH_DATE_REQUIRED': return 'Người đã mất cần có ngày mất.';
    case 'FAMILY_MEMBER_DEATH_DATE_FUTURE': return 'Ngày mất không thể ở tương lai theo giờ Việt Nam.';
    case 'FAMILY_MEMBER_DEATH_BEFORE_BIRTH': return 'Ngày mất không thể trước ngày sinh.';
    case 'FAMILY_MEMBER_INVALID_LIFE_STATUS': return 'Trạng thái sống không hợp lệ.';
  }
  if (apiError?.status === 401 || apiError?.kind === 'unauthorized') return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (apiError?.status === 403 || apiError?.kind === 'forbidden') return 'Tài khoản này không có quyền sử dụng cây gia đình.';
  if (apiError?.status === 404) return 'Không tìm thấy thành viên trong cây gia đình của bạn.';
  if (apiError?.kind === 'network') return 'Không kết nối được máy chủ. Kiểm tra mạng và thử lại.';
  if (apiError?.kind === 'server') return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
  if (apiError?.status === 400 || apiError?.status === 422) return 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại các trường.';
  return 'Không thể hoàn tất thao tác. Vui lòng thử lại.';
}

export function backendFieldErrors(error: unknown): Partial<Record<keyof FormValues, string>> {
  const result: Partial<Record<keyof FormValues, string>> = {};
  const fieldErrors = (error as { fieldErrors?: Record<string, string[]> })?.fieldErrors;
  if (!fieldErrors) return result;
  const fields: Record<string, keyof FormValues | 'form'> = { FullName: 'fullName', Generation: 'generation', Gender: 'gender', DateOfBirth: 'dateOfBirth', DeathDate: 'deathDate', FatherId: 'fatherId', MotherId: 'motherId', SpouseId: 'spouseId', ChildIds: 'childIds', HorizontalRelations: 'form', Role: 'role', Address: 'address', PhoneNumber: 'phoneNumber', FacebookUrl: 'facebookUrl', InstagramUrl: 'instagramUrl' };
  for (const [field, messages] of Object.entries(fieldErrors)) {
    const key = fields[field] ?? fields[field.charAt(0).toUpperCase() + field.slice(1)];
    if (key) result[key] = messages.join(' ');
  }
  return result;
}
