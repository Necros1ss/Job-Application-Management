/* eslint-disable react/prop-types, react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { SidebarMenuItem } from "./SidebarMenuItem";
import { RiLogoutCircleRFill } from "react-icons/ri";
import { BsLayoutSidebarInset } from "react-icons/bs";
import { Link, useLocation } from "react-router-dom";
import LogoutModal from "./LogoutModal";
import { useI18n } from "../lib/i18n";

const SideBar = ({ role = "candidate" }) => {
  const menuItems = SidebarMenuItem(role);
  const { t } = useI18n();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [pageTitle, setPageTitle] = useState("");
  const [openLogoutModal, setOpenLogoutModal] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setOpenSidebar(!openSidebar);
  };

  const toggleLogoutModal = () => {
    setOpenLogoutModal(!openLogoutModal);
  };

  const isActive = (itemPath) => {
    const pathname = location.pathname;
    const segments = pathname.split("/").filter(Boolean);
    const baseSegment = segments[0] || "";
    const isDashboardPath = baseSegment === "candidate" || baseSegment === "recruiter" || baseSegment === "admin" || baseSegment === "hr-manager" || baseSegment === "interviewer" || (segments.length === 1 && baseSegment === "dashboard");
    if (itemPath === "dashboard") {
      return isDashboardPath;
    }
    return pathname.startsWith(`/${baseSegment}/${itemPath}`) || segments[1] === itemPath;
  };

  const findPageTitle = () => {
    const pathname = location.pathname;
    const segments = pathname.split("/").filter(Boolean);
    const baseSegment = segments[0] || "";
    const subSegment = segments[1] || "";

    const isDashboardPath = (s, b) =>
      s.length === 1 && (b === "candidate" || b === "recruiter" || b === "admin" || b === "hr-manager" || b === "interviewer" || b === "dashboard");

    const currentItem = menuItems.find((item) => {
      if (item.path === "dashboard") {
        return segments.length === 1 || isDashboardPath(segments, baseSegment);
      }
      return subSegment === item.path || pathname.startsWith(`/${baseSegment}/${item.path}`);
    });

    if (currentItem) {
      setPageTitle(t(currentItem.labelKey) || currentItem.label);
    } else {
      const display = subSegment || baseSegment;
      setPageTitle(display.charAt(0).toUpperCase() + display.slice(1));
    }
  };

  useEffect(() => {
    findPageTitle();
  }, [location.pathname, menuItems, t]);

  return (
    <div>
      <nav
        className={`px-5 py-3 fixed z-50 w-full lg:hidden transition-all duration-300 ${
          openSidebar ? "-translate-y-full" : "translate-x-0"
        } border-b border-[#e5e5e5] bg-white text-[#0a0a0a] dark:border-[#2a2a2a] dark:bg-[#0a0a0a] dark:text-white`}
      >
        <div className="flex gap-3 items-center">
          <button
            className="text-xl lg:hidden"
            title="Toggle Menu"
            onClick={toggleMenu}
          >
            <BsLayoutSidebarInset className="" />
          </button>
          <h3 className="md:text-lg font-semibold">{pageTitle}</h3>
        </div>
      </nav>

      {openSidebar && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={toggleMenu}
        />
      )}

      <div
        className={`fixed h-full top-0 left-0 bottom-0 z-40 w-56 py-4 lg:py-6 transition-transform
          ${openSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          border-r border-[#e5e5e5] bg-white dark:border-[#2a2a2a] dark:bg-[#0a0a0a]`}
      >
        <div className="h-full overflow-y-auto rounded-[14px] bg-white px-4 text-[#0a0a0a] dark:bg-[#0a0a0a] dark:text-white">
          <div className="flex items-center justify-between pl-6">
            <p className="font-semibold text-black dark:text-white">Job Tracker</p>
            <button
              className="text-xl lg:hidden"
              title="Minimize Sidebar"
              onClick={toggleMenu}
            >
              <BsLayoutSidebarInset className="" />
            </button>
          </div>

          <ul className="space-y-1 mt-6">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              return (
                <li key={item.id} onClick={toggleMenu}>
                  <Link
                    to={item.path}
                    className={`flex cursor-pointer items-center gap-2 rounded-[10px] py-2.5 pl-5 transition-all duration-200 ${
                      active
                        ? "bg-black text-white font-medium dark:bg-white dark:text-black"
                        : "text-[#737373] hover:bg-[#f2f2f2] hover:text-[#0a0a0a] dark:text-[#a3a3a3] dark:hover:bg-[#171717] dark:hover:text-white"
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm">{t(item.labelKey) || item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="absolute bottom-1 left-4 right-4 rounded-[10px] bg-white dark:bg-[#0a0a0a]">
          <ul className="space-y-1 py-3 text-[#0a0a0a] dark:text-white">
            <li>
              <div
                className="flex cursor-pointer items-center gap-2 rounded-[10px] py-2 pl-5 text-[#737373] transition-colors duration-200 hover:bg-[#f2f2f2] hover:text-[#0a0a0a] dark:text-[#a3a3a3] dark:hover:bg-[#171717] dark:hover:text-white"
                onClick={() => {
                  toggleMenu();
                  toggleLogoutModal();
                }}
              >
                <span className="text-xl">
                  <RiLogoutCircleRFill />
                </span>
                <div className="text-sm">{t("menu.logout")}</div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {openLogoutModal && (
        <LogoutModal setOpenLogoutModal={setOpenLogoutModal} />
      )}
    </div>
  );
};

export default SideBar;
