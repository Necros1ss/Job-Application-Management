import { useState, useEffect } from "react";
import { SidebarMenuItem } from "./SidebarMenuItem";
import { RiLogoutCircleRFill } from "react-icons/ri";
import { BsLayoutSidebarInset } from "react-icons/bs";
import { Link, useLocation } from "react-router-dom";
import LogoutModal from "./LogoutModal";

const SideBar = ({ role = "candidate" }) => {
  const menuItems = SidebarMenuItem(role);
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
        (item.path === "dashboard" && (currentPath === "" || currentPath === "candidate" || currentPath === "recruiter"));
    });
    if (currentItem) {
      setPageTitle(currentItem.label);
    } else {
      setPageTitle(currentPath.charAt(0).toUpperCase() + currentPath.slice(1));
    }
  };

  const isActive = (itemPath) => {
    const currentPath = location.pathname.split("/").filter(Boolean).pop() || "";
    if (itemPath === "dashboard") {
      return currentPath === "" || currentPath === "candidate" || currentPath === "recruiter" || currentPath === "dashboard";
    }
    return currentPath === itemPath;
  };

  useEffect(() => {
    findPageTitle();
  }, [location.pathname, menuItems]);

  return (
    <div>
      <nav
        className={`px-5 py-3 fixed z-50 w-full lg:hidden transition-all duration-300 ${
          openSidebar ? "-translate-y-full" : "translate-x-0"
        } bg-[#19211D] text-white`}
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
          bg-[#19211D]`}
      >
        <div className="rounded-[20px] overflow-y-auto px-4 bg-[#19211D] text-white h-full">
          <div className="flex items-center justify-between pl-6">
            <p className="font-bold text-white">Job Tracker</p>
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
                    className={`flex items-center gap-2 py-2.5 pl-5 rounded-xl cursor-pointer transition-all duration-200 ${
                      active
                        ? "bg-white/15 text-white font-semibold"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="absolute bottom-1 left-4 right-4 bg-[#19211D] rounded-xl">
          <ul className="py-3 text-white space-y-1">
            <li>
              <div
                className="flex items-center gap-2 py-2 pl-5 rounded-xl cursor-pointer transition-colors duration-200 hover:bg-white/10"
                onClick={() => {
                  toggleMenu();
                  toggleLogoutModal();
                }}
              >
                <span className="text-xl">
                  <RiLogoutCircleRFill />
                </span>
                <div className="text-sm">Logout</div>
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
