import { BsBriefcaseFill, BsPeople } from "react-icons/bs";
import { AiFillFolderOpen } from "react-icons/ai";
import { RiLayoutMasonryFill } from "react-icons/ri";
import { FaCalendar, FaClipboardList, FaEnvelope, FaUserTie, FaUserShield, FaChartBar, FaCheckCircle } from "react-icons/fa";

const candidateMenu = [
  {
    id: 0,
    label: "Dashboard",
    labelKey: "menu.dashboard",
    icon: <RiLayoutMasonryFill />,
    path: "dashboard",
  },
  {
    id: 1,
    label: "Applications",
    labelKey: "menu.applications",
    icon: <AiFillFolderOpen />,
    path: "applications",
  },
  {
    id: 2,
    label: "Job Search",
    labelKey: "menu.jobSearch",
    icon: <BsBriefcaseFill />,
    path: "job",
  },
  {
    id: 3,
    label: "Messages",
    labelKey: "menu.messages",
    icon: <FaEnvelope />,
    path: "messages",
  },
  {
    id: 4,
    label: "Onboarding",
    labelKey: "menu.onboarding",
    icon: <FaClipboardList />,
    path: "onboarding",
  },
  {
    id: 5,
    label: "Employee",
    labelKey: "menu.employee",
    icon: <FaUserTie />,
    path: "employee",
  },
];

const recruiterMenu = [
  {
    id: 0,
    label: "Dashboard",
    labelKey: "menu.dashboard",
    icon: <RiLayoutMasonryFill />,
    path: "dashboard",
  },
  {
    id: 1,
    label: "Job Posts",
    labelKey: "menu.jobPosts",
    icon: <BsBriefcaseFill />,
    path: "job",
  },
  {
    id: 2,
    label: "Application",
    labelKey: "menu.application",
    icon: <BsPeople />,
    path: "application",
  },
  {
    id: 3,
    label: "Interviews",
    labelKey: "menu.interviews",
    icon: <FaCalendar />,
    path: "interviews",
  },
  {
    id: 4,
    label: "Onboarding",
    labelKey: "menu.onboarding",
    icon: <FaClipboardList />,
    path: "onboarding",
  },
  {
    id: 5,
    label: "Employees",
    labelKey: "menu.employees",
    icon: <FaUserTie />,
    path: "employees",
  },
];

const adminMenu = [
  {
    id: 0,
    label: "Dashboard",
    labelKey: "menu.dashboard",
    icon: <RiLayoutMasonryFill />,
    path: "dashboard",
  },
  {
    id: 1,
    label: "Users",
    labelKey: "menu.users",
    icon: <FaUserShield />,
    path: "users",
  },
  {
    id: 2,
    label: "Jobs",
    labelKey: "menu.jobs",
    icon: <BsBriefcaseFill />,
    path: "jobs",
  },
];

const hrManagerMenu = [
  {
    id: 0,
    label: "Dashboard",
    labelKey: "menu.dashboard",
    icon: <RiLayoutMasonryFill />,
    path: "dashboard",
  },
  {
    id: 1,
    label: "Job Approvals",
    labelKey: "menu.jobApprovals",
    icon: <FaCheckCircle />,
    path: "jobs",
  },
  {
    id: 2,
    label: "Recruiters",
    labelKey: "menu.recruiters",
    icon: <BsPeople />,
    path: "recruiters",
  },
  {
    id: 3,
    label: "Reports",
    labelKey: "menu.reports",
    icon: <FaChartBar />,
    path: "reports",
  },
];

const interviewerMenu = [
  {
    id: 0,
    label: "Dashboard",
    labelKey: "menu.dashboard",
    icon: <RiLayoutMasonryFill />,
    path: "dashboard",
  },
  {
    id: 1,
    label: "My Interviews",
    labelKey: "menu.myInterviews",
    icon: <FaCalendar />,
    path: "interviews",
  },
];

export const SidebarMenuItem = (role = "candidate") =>
  role === "recruiter" ? recruiterMenu
    : role === "admin" ? adminMenu
      : role === "hr_manager" ? hrManagerMenu
        : role === "interviewer" ? interviewerMenu
          : candidateMenu;

