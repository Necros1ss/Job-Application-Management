/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import SideBar from "./Components/Sidebar";
import AccountMenu from "./Components/AccountMenu";
import LanguageSwitcher from "./Components/LanguageSwitcher";
import NotificationBell from "./Components/NotificationBell";
import ThemeToggle from "./Components/ThemeToggle";
import { Navigate, Outlet } from "react-router-dom";
import { initializeSession, tokenStorage, usersApi } from "./lib/api";
import PageLoader from "./Components/PageLoader";

const DashboardLayout = ({ allowedRole }) => {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [session, setSession] = useState({
    token: tokenStorage.getToken(),
    role: tokenStorage.getRole(),
  });
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const allowedRoles = Array.isArray(allowedRole) ? allowedRole : allowedRole ? [allowedRole] : [];

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      await initializeSession();

      if (isMounted) {
        const token = tokenStorage.getToken();
        const role = tokenStorage.getRole();
        setSession({ token, role });

        if (token) {
          try {
            const profile = await usersApi.me();
            setUserName(profile.name || "");
            setUserEmail(profile.email || "");
          } catch {
            // use defaults
          }
        }

        setIsCheckingSession(false);
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isCheckingSession) {
    return <PageLoader />;
  }

  if (!session.token) {
    return <Navigate to="/login" replace />;
  }

  if (!session.role) {
    tokenStorage.clearSession();
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    const fallbackRoute =
      session.role === "recruiter" ? "/recruiter"
        : session.role === "admin" ? "/admin"
          : session.role === "hr_manager" ? "/hr-manager"
            : session.role === "interviewer" ? "/interviewer"
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
              {getRoleDisplayName(session.role)}
            </span>
            <LanguageSwitcher compact />
            <ThemeToggle />
            <NotificationBell />
            <div className="h-6 w-px bg-[var(--border-primary)]" />
            <AccountMenu userName={userName} userEmail={userEmail} />
          </div>
        </div>
      </header>

      <SideBar role={session.role} />
      <div className="h-auto flex-grow px-6 pb-6 pt-24 lg:ml-56 lg:pt-24">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
