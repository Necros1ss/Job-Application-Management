import { BsBriefcaseFill, BsPeople } from "react-icons/bs";
import { AiFillFolderOpen } from "react-icons/ai";
import { RiLayoutMasonryFill } from "react-icons/ri";
import { FaCalendar, FaClipboardList, FaEnvelope, FaUserTie, FaUserShield } from "react-icons/fa";

const candidateMenu = [
  {
    id: 0,
    label: "Dashboard",
    icon: <RiLayoutMasonryFill />,
    path: "dashboard",
  },
  {
    id: 1,
    label: "Applications",
    icon: <AiFillFolderOpen />,
    path: "applications",
  },
  {
    id: 2,
    label: "Job Post",
    icon: <BsBriefcaseFill />,
    path: "job",
  },
  {
    id: 3,
    label: "Messages",
    icon: <FaEnvelope />,
    path: "messages",
  },
  {
    id: 4,
    label: "Onboarding",
    icon: <FaClipboardList />,
    path: "onboarding",
  },
  {
    id: 5,
    label: "Employee",
    icon: <FaUserTie />,
    path: "employee",
  },
];

const recruiterMenu = [
  {
    id: 0,
    label: "Dashboard",
    icon: <RiLayoutMasonryFill />,
    path: "dashboard",
  },
  {
    id: 1,
    label: "Job Posts",
    icon: <BsBriefcaseFill />,
    path: "job",
  },
  {
    id: 2,
    label: "Application",
    icon: <BsPeople />,
    path: "application",
  },
  {
    id: 3,
    label: "Interviews",
    icon: <FaCalendar />,
    path: "interviews",
  },
  {
    id: 4,
    label: "Onboarding",
    icon: <FaClipboardList />,
    path: "onboarding",
  },
  {
    id: 5,
    label: "Employees",
    icon: <FaUserTie />,
    path: "employees",
  },
];

const adminMenu = [
  {
    id: 0,
    label: "Dashboard",
    icon: <RiLayoutMasonryFill />,
    path: "dashboard",
  },
  {
    id: 1,
    label: "Users",
    icon: <FaUserShield />,
    path: "users",
  },
  {
    id: 2,
    label: "Jobs",
    icon: <BsBriefcaseFill />,
    path: "jobs",
  },
];

export const SidebarMenuItem = (role = "candidate") =>
  role === "recruiter" ? recruiterMenu : role === "admin" ? adminMenu : candidateMenu;

