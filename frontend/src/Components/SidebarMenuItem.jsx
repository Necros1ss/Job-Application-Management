import { BsBriefcaseFill, BsFillPersonFill, BsPeople } from "react-icons/bs";
import { AiFillFolderOpen } from "react-icons/ai";
import { RiLayoutMasonryFill } from "react-icons/ri";

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
    label: "Profile",
    icon: <BsFillPersonFill />,
    path: "profile",
  },
  {
    id: 2,
    label: "Job Posts",
    icon: <BsBriefcaseFill />,
    path: "job",
  },
  {
    id: 3,
    label: "Application",
    icon: <BsPeople />,
    path: "application",
  }
];

export const SidebarMenuItem = (role = "candidate") =>
  role === "recruiter" ? recruiterMenu : candidateMenu;

