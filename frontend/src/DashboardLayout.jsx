/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import SideBar from "./Components/SideBar";
import { Navigate, Outlet } from "react-router-dom";
import { initializeSession, tokenStorage } from "./lib/api";
import PageLoader from "./Components/PageLoader";

const DashboardLayout = ({ allowedRole }) => {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [session, setSession] = useState({
    token: tokenStorage.getToken(),
    role: tokenStorage.getRole(),
  });
  const allowedRoles = Array.isArray(allowedRole) ? allowedRole : allowedRole ? [allowedRole] : [];

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      // initializeSession restores the in-memory access token from the httpOnly
      // refresh cookie after reloads, then DashboardLayout stores a render-safe
      // snapshot instead of reading sessionStorage directly during render.
      await initializeSession();

      if (isMounted) {
        setSession({
          token: tokenStorage.getToken(),
          role: tokenStorage.getRole(),
        });
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
    const fallbackRoute = session.role === "recruiter" ? "/recruiter" : session.role === "admin" ? "/admin" : "/candidate";
    return <Navigate to={fallbackRoute} replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      <SideBar role={session.role} />
      <div className="h-auto flex-grow px-6 pb-6 pt-16 lg:ml-56 lg:pt-4">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
