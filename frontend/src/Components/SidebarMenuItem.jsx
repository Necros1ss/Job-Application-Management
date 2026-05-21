import { BsBriefcaseFill, BsFillPersonFill, BsPeople } from "react-icons/bs";
import { AiFillFolderOpen } from "react-icons/ai";
import { RiLayoutMasonryFill } from "react-icons/ri";
import { FaCalendar, FaClipboardList, FaEnvelope } from "react-icons/fa";

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
    label: "Job Search",
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
    label: "Profile",
    icon: <BsFillPersonFill />,
    path: "profile",
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
    label: "Profile",
    icon: <BsFillPersonFill />,
    path: "profile",
  }
];

export const SidebarMenuItem = (role = "candidate") =>
  role === "recruiter" ? recruiterMenu : candidateMenu;

