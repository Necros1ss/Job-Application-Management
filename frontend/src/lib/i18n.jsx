import { createContext, useContext, useMemo, useState } from "react";

const LANGUAGE_KEY = "appLanguage";

export const languages = [
  { code: "en", label: "English", shortLabel: "EN" },
  { code: "vi", label: "Tiếng Việt", shortLabel: "VI" },
];

const dictionaries = {
  en: {
    "app.name": "Job Tracker",
    "nav.modules": "Modules",
    "nav.workflow": "Workflow",
    "nav.whyUs": "Why Us",
    "auth.login": "Log in",
    "auth.startFree": "Start Free",
    "auth.createWorkspace": "Create workspace",
    "auth.createAccount": "Create Account",
    "auth.welcomeBack": "Welcome back",
    "auth.loginTitle": "Log in to Job Tracker",
    "auth.loginSubtitle": "Access recruitment, onboarding, employee, attendance, and leave tools.",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.forgotPassword": "Forgot password?",
    "auth.signingIn": "Signing in...",
    "auth.signIn": "Sign in",
    "auth.noAccount": "Don't have an account?",
    "auth.createOne": "Create one",
    "auth.haveAccount": "Already have an account?",
    "auth.roleTitle": "Join as a recruiter or candidate",
    "auth.roleSubtitle": "Choose the account type that matches what you want to do first. You can continue into the signup form with the role already selected.",
    "auth.candidate": "Candidate",
    "auth.recruiter": "Recruiter",
    "auth.candidateHeadline": "Find work and track every application.",
    "auth.recruiterHeadline": "Hire talent and manage the pipeline.",
    "auth.candidateDesc": "Search jobs, apply with a cover letter, read recruiter messages, and follow onboarding tasks.",
    "auth.recruiterDesc": "Publish roles, review candidates, schedule interviews, send offers, and start onboarding.",
    "auth.signupCandidateTitle": "Start applying with Job Tracker",
    "auth.signupRecruiterTitle": "Start hiring with Job Tracker",
    "auth.signupSubtitle": "Select your account type, then create the workspace profile you need.",
    "auth.name": "Name",
    "auth.companyName": "Company Name",
    "menu.profile": "Profile",
    "menu.settings": "Settings",
    "language.label": "Language",
    "landing.badge": "Open, self-hosted hiring and HR workflow",
    "landing.title": "Job Tracker HRMS for precise hiring operations.",
    "landing.subtitle": "A practical hiring workspace inspired by open-source HR systems: recruitment, interviews, onboarding, employee records, attendance, and leave in one calm dashboard.",
  },
  vi: {
    "app.name": "Job Tracker",
    "nav.modules": "Phân hệ",
    "nav.workflow": "Quy trình",
    "nav.whyUs": "Lý do chọn",
    "auth.login": "Đăng nhập",
    "auth.startFree": "Bắt đầu",
    "auth.createWorkspace": "Tạo workspace",
    "auth.createAccount": "Tạo tài khoản",
    "auth.welcomeBack": "Chào mừng trở lại",
    "auth.loginTitle": "Đăng nhập Job Tracker",
    "auth.loginSubtitle": "Truy cập tuyển dụng, onboarding, nhân sự, chấm công và nghỉ phép.",
    "auth.email": "Email",
    "auth.password": "Mật khẩu",
    "auth.forgotPassword": "Quên mật khẩu?",
    "auth.signingIn": "Đang đăng nhập...",
    "auth.signIn": "Đăng nhập",
    "auth.noAccount": "Chưa có tài khoản?",
    "auth.createOne": "Tạo mới",
    "auth.haveAccount": "Đã có tài khoản?",
    "auth.roleTitle": "Tham gia với vai trò recruiter hoặc candidate",
    "auth.roleSubtitle": "Chọn loại tài khoản phù hợp với việc bạn muốn làm trước. Form đăng ký sẽ nhận sẵn vai trò đã chọn.",
    "auth.candidate": "Candidate",
    "auth.recruiter": "Recruiter",
    "auth.candidateHeadline": "Tìm việc và theo dõi từng đơn ứng tuyển.",
    "auth.recruiterHeadline": "Tuyển người và quản lý pipeline.",
    "auth.candidateDesc": "Tìm job, nộp CV, đọc tin nhắn recruiter và theo dõi onboarding.",
    "auth.recruiterDesc": "Đăng tin, duyệt ứng viên, đặt lịch phỏng vấn, gửi offer và onboarding.",
    "auth.signupCandidateTitle": "Bắt đầu ứng tuyển với Job Tracker",
    "auth.signupRecruiterTitle": "Bắt đầu tuyển dụng với Job Tracker",
    "auth.signupSubtitle": "Chọn loại tài khoản, sau đó tạo hồ sơ workspace phù hợp.",
    "auth.name": "Họ tên",
    "auth.companyName": "Tên công ty",
    "menu.profile": "Hồ sơ",
    "menu.settings": "Cài đặt",
    "language.label": "Ngôn ngữ",
    "landing.badge": "Quy trình tuyển dụng và HR tự host, mã nguồn mở",
    "landing.title": "Job Tracker HRMS cho vận hành tuyển dụng chính xác.",
    "landing.subtitle": "Workspace tuyển dụng thực dụng: tuyển dụng, phỏng vấn, onboarding, hồ sơ nhân sự, chấm công và nghỉ phép trong một dashboard gọn gàng.",
  },
};

const I18nContext = createContext(null);

const getInitialLanguage = () => {
  const stored = localStorage.getItem(LANGUAGE_KEY);
  if (languages.some((language) => language.code === stored)) {
    return stored;
  }

  return navigator.language?.toLowerCase().startsWith("vi") ? "vi" : "en";
};

export const I18nProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getInitialLanguage);

  const setLanguage = (nextLanguage) => {
    const normalized = languages.some((item) => item.code === nextLanguage) ? nextLanguage : "en";
    localStorage.setItem(LANGUAGE_KEY, normalized);
    setLanguageState(normalized);
  };

  const value = useMemo(() => {
    const dictionary = dictionaries[language] || dictionaries.en;
    return {
      language,
      setLanguage,
      t: (key) => dictionary[key] || dictionaries.en[key] || key,
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
};
