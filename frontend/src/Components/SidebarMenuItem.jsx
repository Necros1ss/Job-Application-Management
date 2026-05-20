import { BsBriefcaseFill, BsFillPersonFill, BsPeople } from "react-icons/bs";
import { AiFillFolderOpen } from "react-icons/ai";
import { RiLayoutMasonryFill } from "react-icons/ri";
import { RiBarChart2Fill, RiShieldUserFill } from "react-icons/ri";

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
    label: "Profile",
    icon: <BsFillPersonFill />,
    path: "profile",
  }
];

const adminMenu = [
  {
    id: 0,
    label: "Overview",
    icon: <RiBarChart2Fill />,
    path: "dashboard",
  },
  {
    id: 1,
    label: "Users",
    icon: <RiShieldUserFill />,
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

