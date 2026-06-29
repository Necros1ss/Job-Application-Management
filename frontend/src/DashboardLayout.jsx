/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import SideBar from "./Components/Sidebar";
import AccountMenu from "./Components/AccountMenu";
import LanguageSwitcher from "./Components/LanguageSwitcher";
import NotificationBell from "./Components/NotificationBell";
import ThemeToggle from "./Components/ThemeToggle";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { initializeSession, usersApi } from "./lib/api";
import PageLoader from "./Components/PageLoader";

const DashboardLayout = ({ allowedRole }) => {
  const { accessToken, user, setAuth, logout } = useAuthStore();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const allowedRoles = Array.isArray(allowedRole) ? allowedRole : allowedRole ? [allowedRole] : [];

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const session = await initializeSession();

      if (isMounted) {
        if (session?.token) {
          try {
            const profile = await usersApi.me();
            setAuth(profile, session.token);
          } catch {
            // If profile fetch fails but we have session, at least keep the session
            if (!user) {
              setAuth({ role: session.user?.role }, session.token);
            }
          }
        }

        setIsCheckingSession(false);
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isCheckingSession) {
    return <PageLoader />;
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  const role = user?.role;

  if (!role) {
    logout();
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const fallbackRoute =
      role === "recruiter" ? "/recruiter"
        : role === "admin" ? "/admin"
          : role === "hr_manager" ? "/hr-manager"
            : role === "interviewer" ? "/interviewer"
              : "/candidate";
    return <Navigate to={fallbackRoute} replace />;
  }

  const getRoleDisplayName = (role) => {
    const names = {
      candidate: "Candidate",
      recruiter: "Recruiter",
      admin: "Admin",
      hr_manager: "HR Manager",
      interviewer: "Interviewer",
    };
    return names[role] || role;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <header className="fixed left-0 right-0 top-0 z-40 border-b border-[var(--border-primary)] bg-[var(--bg-elevated)] lg:left-56">
        <div className="flex h-20 items-center justify-end px-6 lg:px-10">
          <div className="flex items-center gap-5 text-[var(--text-secondary)]">
            <span className="hidden text-sm font-medium text-[var(--text-secondary)] md:block">
              {getRoleDisplayName(role)}
            </span>
            <LanguageSwitcher compact />
            <ThemeToggle />
            <NotificationBell />
            <div className="h-6 w-px bg-[var(--border-primary)]" />
            <AccountMenu userName={user?.name || ""} userEmail={user?.email || ""} />
          </div>
        </div>
      </header>

      <SideBar role={role} />
      <div className="h-auto flex-grow px-6 pb-6 pt-24 lg:ml-56 lg:pt-24">
        <Outlet />
      </div>
    </div>
  );
};


export default DashboardLayout;
