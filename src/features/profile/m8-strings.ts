const en = {
  profile: 'Profile', edit: 'Edit profile', security: 'Account security', avatar: 'Account avatar', back: 'Back', save: 'Save changes', cancel: 'Cancel', retry: 'Reload',
  fullName: 'Original full name', displayName: 'Display name', phoneNumber: 'Phone number', gender: 'Gender', dateOfBirth: 'Date of birth (DD/MM/YYYY)', email: 'Email', id: 'User ID', role: 'Role', providers: 'Sign-in methods', created: 'Created', updated: 'Updated',
  nameInvalid: 'Enter a display name of 1–100 characters.', phoneInvalid: 'Enter 10 digits starting with 03, 05, 07, 08 or 09.', genderInvalid: 'Select a gender.', dateInvalid: 'Enter a valid date using DD/MM/YYYY, up to today.',
  male: 'Male', female: 'Female', other: 'Other', required: 'This field is required.', saved: 'Changes saved.', error: 'Unable to complete the request. Reload and check the current information.',
  uncertain: 'The outcome could not be confirmed. Reload current information before another attempt.', conflict: 'This profile changed elsewhere. Reload before editing again.',
  discard: 'Discard unsaved changes?', discardMessage: 'Your edits will be lost.', discardAction: 'Discard', keep: 'Keep editing',
  currentPassword: 'Current password', newPassword: 'New password', confirmPassword: 'Confirm new password', changePassword: 'Change password', currentPasswordWrong: 'The current password is incorrect.',
  passwordInvalid: 'Use at least 8 characters and at most 72 UTF-8 bytes.', passwordSame: 'Choose a password different from the current password.', passwordMismatch: 'Confirmation must match the new password.',
  passwordHint: 'Strength improves with uppercase letters, numbers and symbols.', strengths: ['Enter a new password', 'Weak', 'Medium', 'Good', 'Strong'],
  passwordSuccess: 'Password changed. Existing sessions remain active. You can sign out of this session below.', sessionLimit: 'Changing your password keeps existing sessions active. This service supports signing out of the current session.',
  googleOnly: 'Your account uses Google sign-in. Manage your password through Google.', providerUnknown: 'Sign-in methods could not be verified. Reload your profile.', logout: 'Sign out',
  chooseImage: 'Choose image', upload: 'Upload avatar', uploading: 'Uploading…', removeAvatar: 'Remove avatar', removeAvatarMessage: 'Remove this account’s avatar?', imageHint: 'JPEG, PNG, WebP or GIF, up to 5 MiB.', imageError: 'Choose a valid JPEG, PNG, WebP or GIF up to 5 MiB. HEIC is unsupported.', avatarPrivacy: 'Account avatars are accessible through an email-based public redirect.',
  admin: 'Admin Console', dashboard: 'Overview', users: 'Users', logs: 'Login logs', totalUsers: 'Total users', totalActive: 'Active accounts', totalLocked: 'Locked accounts', successLogins: 'Successful logins · 7 days', failedLogins: 'Failed logins · 7 days', newRegistrations: 'New accounts · 7 days',
  distribution: 'Account distribution', all: 'All', active: 'Active', locked: 'Locked', search: 'Search email', newest: 'Newest first', oldest: 'Oldest first', emailAsc: 'Email A–Z', emailDesc: 'Email Z–A', noResults: 'No matching records',
  details: 'User details', promote: 'Change role to ADMIN', demote: 'Change role to USER', lock: 'Lock account', unlock: 'Unlock account', deleteUser: 'Delete user', confirm: 'Confirm',
  roleWarning: 'Changing this role revokes the user’s sessions.', lockWarning: 'Locking this account will interrupt the user’s access.', unlockWarning: 'Unlocking allows a new sign-in. Revoked sessions stay signed out.', deleteWarning: 'Deletion is permanent. Accounts with family members are protected.', protectedAccount: 'Administrator and current-account protections apply.',
  familyConflict: 'This user has family members. Deletion was rejected.', actionSuccess: 'Action confirmed and authoritative data refreshed.', actionStale: 'This account changed. Review the refreshed record before confirming again.',
  success: 'Success', failed: 'Failed', registered: 'Registered', ip: 'IP address', recentLogs: 'These are the recent records supplied by the service, limited to 50 records.', forbidden: 'Your account cannot access this information.',
  readonly: 'Identity, role and sign-in methods are managed by the service.', verified: 'Verified', accountStatus: 'Account status',
};
const vi: typeof en = {
  profile: 'Hồ sơ', edit: 'Sửa hồ sơ', security: 'Bảo mật tài khoản', avatar: 'Ảnh đại diện tài khoản', back: 'Quay lại', save: 'Lưu thay đổi', cancel: 'Hủy', retry: 'Tải lại',
  fullName: 'Họ tên gốc', displayName: 'Tên hiển thị', phoneNumber: 'Số điện thoại', gender: 'Giới tính', dateOfBirth: 'Ngày sinh (DD/MM/YYYY)', email: 'Email', id: 'Mã người dùng', role: 'Vai trò', providers: 'Phương thức đăng nhập', created: 'Ngày tạo', updated: 'Cập nhật',
  nameInvalid: 'Nhập tên hiển thị từ 1–100 ký tự.', phoneInvalid: 'Nhập 10 chữ số bắt đầu bằng 03, 05, 07, 08 hoặc 09.', genderInvalid: 'Chọn giới tính.', dateInvalid: 'Nhập ngày hợp lệ theo DD/MM/YYYY, tối đa đến hôm nay.',
  male: 'Nam', female: 'Nữ', other: 'Khác', required: 'Vui lòng nhập trường này.', saved: 'Đã lưu thay đổi.', error: 'Không thể hoàn tất yêu cầu. Tải lại để kiểm tra thông tin hiện tại.',
  uncertain: 'Chưa xác nhận được kết quả. Tải lại thông tin trước khi thử tiếp.', conflict: 'Hồ sơ đã thay đổi ở nơi khác. Tải lại trước khi sửa.',
  discard: 'Bỏ thay đổi chưa lưu?', discardMessage: 'Thông tin bạn vừa sửa sẽ bị mất.', discardAction: 'Bỏ thay đổi', keep: 'Tiếp tục sửa',
  currentPassword: 'Mật khẩu hiện tại', newPassword: 'Mật khẩu mới', confirmPassword: 'Xác nhận mật khẩu mới', changePassword: 'Đổi mật khẩu', currentPasswordWrong: 'Mật khẩu hiện tại chưa đúng.',
  passwordInvalid: 'Dùng ít nhất 8 ký tự và tối đa 72 byte UTF-8.', passwordSame: 'Mật khẩu mới phải khác mật khẩu hiện tại.', passwordMismatch: 'Xác nhận phải trùng với mật khẩu mới.',
  passwordHint: 'Chữ hoa, chữ số và ký hiệu giúp tăng độ mạnh.', strengths: ['Nhập mật khẩu mới', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'],
  passwordSuccess: 'Đã đổi mật khẩu. Các phiên hiện có vẫn hoạt động. Bạn có thể đăng xuất phiên này bên dưới.', sessionLimit: 'Đổi mật khẩu giữ các phiên hiện có hoạt động. Dịch vụ hỗ trợ đăng xuất phiên hiện tại.',
  googleOnly: 'Tài khoản dùng đăng nhập Google. Quản lý mật khẩu qua Google.', providerUnknown: 'Chưa xác minh được phương thức đăng nhập. Tải lại hồ sơ.', logout: 'Đăng xuất',
  chooseImage: 'Chọn ảnh', upload: 'Tải ảnh đại diện lên', uploading: 'Đang tải lên…', removeAvatar: 'Xóa ảnh đại diện', removeAvatarMessage: 'Xóa ảnh đại diện của tài khoản này?', imageHint: 'JPEG, PNG, WebP hoặc GIF, tối đa 5 MiB.', imageError: 'Chọn JPEG, PNG, WebP hoặc GIF hợp lệ tối đa 5 MiB. Chưa hỗ trợ HEIC.', avatarPrivacy: 'Ảnh tài khoản có thể được truy cập qua chuyển hướng công khai theo email.',
  admin: 'Bảng quản trị', dashboard: 'Tổng quan', users: 'Người dùng', logs: 'Nhật ký đăng nhập', totalUsers: 'Tổng người dùng', totalActive: 'Tài khoản hoạt động', totalLocked: 'Tài khoản bị khóa', successLogins: 'Đăng nhập thành công · 7 ngày', failedLogins: 'Đăng nhập thất bại · 7 ngày', newRegistrations: 'Tài khoản mới · 7 ngày',
  distribution: 'Phân bố tài khoản', all: 'Tất cả', active: 'Hoạt động', locked: 'Bị khóa', search: 'Tìm email', newest: 'Mới nhất trước', oldest: 'Cũ nhất trước', emailAsc: 'Email A–Z', emailDesc: 'Email Z–A', noResults: 'Không có kết quả phù hợp',
  details: 'Chi tiết người dùng', promote: 'Đổi vai trò thành ADMIN', demote: 'Đổi vai trò thành USER', lock: 'Khóa tài khoản', unlock: 'Mở khóa tài khoản', deleteUser: 'Xóa người dùng', confirm: 'Xác nhận',
  roleWarning: 'Đổi vai trò sẽ thu hồi các phiên của người dùng.', lockWarning: 'Khóa tài khoản sẽ gián đoạn quyền truy cập của người dùng.', unlockWarning: 'Mở khóa cho phép đăng nhập lại. Các phiên đã thu hồi vẫn bị đăng xuất.', deleteWarning: 'Xóa vĩnh viễn. Tài khoản có thành viên gia đình được bảo vệ.', protectedAccount: 'Áp dụng bảo vệ quản trị viên và tài khoản hiện tại.',
  familyConflict: 'Người dùng có thành viên gia đình. Yêu cầu xóa đã bị từ chối.', actionSuccess: 'Đã xác nhận thao tác và tải lại dữ liệu từ máy chủ.', actionStale: 'Tài khoản đã thay đổi. Kiểm tra thông tin mới trước khi xác nhận lại.',
  success: 'Thành công', failed: 'Thất bại', registered: 'Đã đăng ký', ip: 'Địa chỉ IP', recentLogs: 'Đây là các bản ghi gần đây do dịch vụ cung cấp, tối đa 50 bản ghi.', forbidden: 'Tài khoản không được truy cập thông tin này.',
  readonly: 'Thông tin định danh, vai trò và phương thức đăng nhập do dịch vụ quản lý.', verified: 'Xác minh', accountStatus: 'Trạng thái tài khoản',
};
export const m8Strings = { en, vi };
export type M8Copy = typeof en;
export function m8Error(error: unknown, copy: M8Copy) {
  const failure = error as { status?: number; code?: string; message?: string };
  if (failure.code === 'USER_HAS_FAMILY_MEMBERS') return copy.familyConflict;
  if (failure.status === 401 || failure.status === 403) return copy.forbidden;
  if (failure.message === 'PROFILE_CONFLICT') return copy.conflict;
  if (failure.message === 'ADMIN_STALE') return copy.actionStale;
  if (failure.message === 'Current password is incorrect.') return copy.currentPasswordWrong;
  if (failure.message?.startsWith('LIBRARY_')) return copy.imageError;
  if (!failure.status || failure.status >= 500) return copy.uncertain;
  return copy.error;
}
