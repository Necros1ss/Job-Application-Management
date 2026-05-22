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

  const findPageTitle = () => {
    const currentPath = location.pathname.split("/").filter(Boolean).pop() || "";
    const currentItem = menuItems.find((item) => {
      return currentPath === item.path ||
        currentPath.includes(item.path) ||
        (item.path === "dashboard" && (currentPath === "" || currentPath === "candidate" || currentPath === "recruiter" || currentPath === "admin"));
    });
    if (currentItem) {
      setPageTitle(t(currentItem.labelKey) || currentItem.label);
    } else {
      setPageTitle(currentPath.charAt(0).toUpperCase() + currentPath.slice(1));
    }
  };

  const isActive = (itemPath) => {
    const currentPath = location.pathname.split("/").filter(Boolean).pop() || "";
    if (itemPath === "dashboard") {
      return currentPath === "" || currentPath === "candidate" || currentPath === "recruiter" || currentPath === "admin" || currentPath === "dashboard";
    }
    return currentPath === itemPath;
  };

  useEffect(() => {
    findPageTitle();
  }, [location.pathname, menuItems, t]);

  return (
    <div>
      <nav
        className={`px-5 py-3 fixed z-50 w-full lg:hidden transition-all duration-300 ${
          openSidebar ? "-translate-y-full" : "translate-x-0"
        } border-b border-[#e5e5e5] bg-white text-[#0a0a0a]`}
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
          border-r border-[#e5e5e5] bg-white`}
      >
        <div className="h-full overflow-y-auto rounded-[14px] bg-white px-4 text-[#0a0a0a]">
          <div className="flex items-center justify-between pl-6">
            <p className="font-semibold text-black">Job Tracker</p>
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
                        ? "bg-black text-white font-medium"
                        : "text-[#737373] hover:bg-[#f2f2f2] hover:text-[#0a0a0a]"
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

        <div className="absolute bottom-1 left-4 right-4 rounded-[10px] bg-white">
          <ul className="space-y-1 py-3 text-[#0a0a0a]">
            <li>
              <div
                className="flex cursor-pointer items-center gap-2 rounded-[10px] py-2 pl-5 text-[#737373] transition-colors duration-200 hover:bg-[#f2f2f2] hover:text-[#0a0a0a]"
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
