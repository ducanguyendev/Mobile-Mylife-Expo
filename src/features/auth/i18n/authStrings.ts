import { getLocales } from 'expo-localization';

const strings = {
  vi: {
    mark: 'MYLIFE · GIA ĐÌNH LÀ NHỮNG ĐIỀU BÌNH DỊ', welcome: 'Chào mừng trở lại', loginSubtitle: 'Tiếp tục lưu giữ những câu chuyện thân thương của gia đình.', showPassword: 'Hiện mật khẩu', hidePassword: 'Ẩn mật khẩu',
    registerTitle: 'Bắt đầu câu chuyện của gia đình', registerSubtitle: 'Tạo tài khoản MyLife để cùng lưu giữ những ký ức quý giá.', email: 'Email', password: 'Mật khẩu',
    fullName: 'Họ và tên', phone: 'Số điện thoại', gender: 'Giới tính', birthDate: 'Ngày sinh', confirmPassword: 'Xác nhận mật khẩu',
    emailPlaceholder: 'name@gmail.com', passwordPlaceholder: 'Nhập mật khẩu', namePlaceholder: 'Nguyễn Minh An', phonePlaceholder: '0912345678', birthPlaceholder: 'DD/MM/YYYY',
    remember: 'Ghi nhớ email', forgot: 'Quên mật khẩu?', login: 'Đăng nhập', register: 'Đăng ký', noAccount: 'Chưa có tài khoản?', hasAccount: 'Đã có tài khoản?',
    createAccount: 'Tạo tài khoản', chooseGender: 'Chọn giới tính', male: 'Nam', female: 'Nữ', other: 'Khác', loginSuccess: 'Đăng nhập thành công.',
    registerSuccess: 'Tạo tài khoản thành công', registerSuccessBody: 'Bạn có thể đăng nhập bằng tài khoản vừa tạo.', sessionExpired: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    configMissing: 'Chưa cấu hình địa chỉ máy chủ. Hãy kiểm tra tệp .env.local.', network: 'Không thể kết nối đến máy chủ. Kiểm tra Backend hoặc kết nối mạng.',
    server: 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.', forbidden: 'Bạn không có quyền thực hiện thao tác này.', rateLimit: 'Bạn thao tác quá nhanh. Hãy thử lại sau.',
    emailRequired: 'Vui lòng nhập email.', emailInvalid: 'Email chưa đúng định dạng.', emailTooLong: 'Email không được vượt quá 254 ký tự.',
    passwordRequired: 'Vui lòng nhập mật khẩu.', passwordLoginLength: 'Mật khẩu phải có từ 8 đến 72 ký tự.', invalidCredentials: 'Email hoặc mật khẩu không chính xác.',
    locked: 'Tài khoản này hiện đã bị khóa.', roleUnavailable: 'Vai trò tài khoản không được hỗ trợ.',
    nameRequired: 'Vui lòng nhập họ và tên.', nameLength: 'Họ và tên cần có từ 2 đến 50 ký tự.', nameLetters: 'Họ và tên chỉ gồm chữ cái và khoảng trắng.',
    phoneRequired: 'Vui lòng nhập số điện thoại.', phoneInvalid: 'Số điện thoại cần có 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09.',
    genderRequired: 'Vui lòng chọn giới tính.', dobRequired: 'Vui lòng nhập ngày sinh.', dobFormat: 'Nhập ngày sinh theo định dạng DD/MM/YYYY.', dobInvalid: 'Ngày sinh không hợp lệ.',
    dobFuture: 'Ngày sinh không thể ở trong tương lai.', dobAge: 'Độ tuổi đăng ký phải từ 6 đến 120.', gmail: 'Hiện chỉ hỗ trợ địa chỉ Gmail (@gmail.com).',
    passwordMin: 'Mật khẩu cần có ít nhất 8 ký tự.', passwordBytes: 'Mật khẩu không được vượt quá 72 byte UTF-8.', passwordGuidance: 'Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.', passwordLower: 'Thêm ít nhất một chữ thường.',
    passwordUpper: 'Thêm ít nhất một chữ in hoa.', passwordNumber: 'Thêm ít nhất một chữ số.', passwordSpecial: 'Thêm ít nhất một ký tự đặc biệt.',
    confirmRequired: 'Vui lòng xác nhận mật khẩu.', confirmMismatch: 'Mật khẩu xác nhận chưa khớp.', duplicateEmail: 'Email này đã được đăng ký.',
    dobServer: 'Ngày sinh chưa hợp lệ. Hãy kiểm tra lại.', serviceUnavailable: 'Dịch vụ đăng ký hiện chưa sẵn sàng.', fieldInvalid: 'Thông tin này chưa hợp lệ. Hãy kiểm tra lại.',
    googleMissing: 'Đăng nhập Google sẽ khả dụng sau khi cấu hình Google Client ID.', retryAfter: (seconds: number) => `Vui lòng thử lại sau ${seconds} giây.`,
    roleUser: 'Thành viên', roleAdmin: 'Quản trị viên', profileJoined: 'THÀNH VIÊN MYLIFE', logout: 'Đăng xuất', logoutWarning: 'Không thể kết nối máy chủ. Bạn đã đăng xuất khỏi thiết bị.',
    nativeTokensMissing: 'Máy chủ không trả token đăng nhập cho ứng dụng. Hãy kiểm tra cấu hình xác thực mobile ở Backend.',
    originRejected: 'Backend đã từ chối Origin của request. Hãy xem method, đường dẫn và Origin trong log Backend.',
    csrfHeaderRequired: 'Request có cookie trình duyệt nhưng thiếu header CSRF. Ứng dụng mobile sẽ không gửi cookie sau khi cập nhật.',
    nativeCookieRejected: 'Request mobile đang mang cookie trình duyệt. Hãy nạp lại ứng dụng sau khi cập nhật.',
  },
  en: {
    mark: 'MYLIFE · A LIVING FAMILY ARCHIVE', welcome: 'Welcome back', loginSubtitle: 'Continue preserving the stories that bring your family close.', showPassword: 'Show password', hidePassword: 'Hide password',
    registerTitle: 'Begin your family story', registerSubtitle: 'Create a MyLife account to keep your family memories together.', email: 'Email', password: 'Password',
    fullName: 'Full name', phone: 'Phone number', gender: 'Gender', birthDate: 'Date of birth', confirmPassword: 'Confirm password',
    emailPlaceholder: 'name@gmail.com', passwordPlaceholder: 'Enter your password', namePlaceholder: 'Minh An Nguyen', phonePlaceholder: '0912345678', birthPlaceholder: 'DD/MM/YYYY',
    remember: 'Remember email', forgot: 'Forgot password?', login: 'Sign in', register: 'Create account', noAccount: 'New to MyLife?', hasAccount: 'Already have an account?',
    createAccount: 'Create account', chooseGender: 'Choose gender', male: 'Male', female: 'Female', other: 'Other', loginSuccess: 'Signed in successfully.',
    registerSuccess: 'Account created successfully', registerSuccessBody: 'You can now sign in with your new account.', sessionExpired: 'Your session expired. Please sign in again.',
    configMissing: 'The API address is not configured. Check the .env.local file.', network: 'Could not reach the server. Check the backend or your network connection.',
    server: 'The server is having trouble. Please try again later.', forbidden: 'You do not have permission to do this.', rateLimit: 'Too many attempts. Please try again later.',
    emailRequired: 'Enter your email.', emailInvalid: 'Enter a valid email address.', emailTooLong: 'Email cannot exceed 254 characters.',
    passwordRequired: 'Enter your password.', passwordLoginLength: 'Password must be 8 to 72 characters.', invalidCredentials: 'Email or password is incorrect.',
    locked: 'This account is currently locked.', roleUnavailable: 'This account role is not supported.',
    nameRequired: 'Enter your full name.', nameLength: 'Full name must be 2 to 50 characters.', nameLetters: 'Use letters and spaces only.',
    phoneRequired: 'Enter your phone number.', phoneInvalid: 'Use 10 digits starting with 03, 05, 07, 08, or 09.',
    genderRequired: 'Choose a gender.', dobRequired: 'Enter your date of birth.', dobFormat: 'Use the DD/MM/YYYY date format.', dobInvalid: 'Enter a valid date of birth.',
    dobFuture: 'Date of birth cannot be in the future.', dobAge: 'You must be between 6 and 120 years old.', gmail: 'Only Gmail addresses (@gmail.com) are supported.',
    passwordMin: 'Password must contain at least 8 characters.', passwordBytes: 'Password cannot exceed 72 UTF-8 bytes.', passwordGuidance: 'At least 8 characters with upper and lowercase letters, a number, and a symbol.', passwordLower: 'Add at least one lowercase letter.',
    passwordUpper: 'Add at least one uppercase letter.', passwordNumber: 'Add at least one number.', passwordSpecial: 'Add at least one special character.',
    confirmRequired: 'Confirm your password.', confirmMismatch: 'Passwords do not match.', duplicateEmail: 'This email is already registered.',
    dobServer: 'Date of birth is invalid. Please check it.', serviceUnavailable: 'Registration is temporarily unavailable.', fieldInvalid: 'This field is invalid. Please check it.',
    googleMissing: 'Google sign-in will be available after Google Client IDs are configured.', retryAfter: (seconds: number) => `Please try again in ${seconds} seconds.`,
    roleUser: 'Member', roleAdmin: 'Administrator', profileJoined: 'MYLIFE MEMBER', logout: 'Sign out', logoutWarning: 'The server could not be reached. You have signed out on this device.',
    nativeTokensMissing: 'The server did not return mobile sign-in tokens. Check the Backend mobile authentication configuration.',
    originRejected: 'The Backend rejected this request Origin. Check the Backend log for its method, path, and Origin check.',
    csrfHeaderRequired: 'The request included browser cookies without the CSRF header. Mobile requests now omit browser cookies.',
    nativeCookieRejected: 'The mobile request carried browser cookies. Reload the app after updating.',
  },
} as const;

export type AuthStrings = {
  [Key in keyof typeof strings.vi]: typeof strings.vi[Key] extends (...args: infer Args) => infer Result
    ? (...args: Args) => Result
    : string;
};
export type AuthStringKey = keyof AuthStrings;

export function getAuthLanguage(): 'vi' | 'en' {
  const language = getLocales()[0]?.languageCode?.toLowerCase();
  return language === 'en' ? 'en' : 'vi';
}

export function getAuthStrings(language = getAuthLanguage()): AuthStrings {
  return strings[language];
}
