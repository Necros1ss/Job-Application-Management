import { useEffect, useState } from "react";
import SideBar from "./Components/SideBar";
import { Navigate, Outlet } from "react-router-dom";
import { authApi, tokenStorage } from "./lib/api";

const DashboardLayout = ({ allowedRole }) => {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const token = tokenStorage.getToken();
  const userRole = tokenStorage.getRole();
  const allowedRoles = Array.isArray(allowedRole) ? allowedRole : allowedRole ? [allowedRole] : [];

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const currentToken = tokenStorage.getToken();
      const shouldRefresh = !currentToken || tokenStorage.isTokenExpired(currentToken);

      if (!shouldRefresh) {
        if (isMounted) {
          setIsCheckingSession(false);
        }
        return;
      }

      try {
        await authApi.refresh();
      } catch {
        tokenStorage.clearSession();
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isCheckingSession) {
    return null;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!userRole) {
    tokenStorage.clearSession();
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    const fallbackRoute = userRole === "recruiter" ? "/recruiter" : userRole === "admin" ? "/admin" : "/candidate";
    return <Navigate to={fallbackRoute} replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      <SideBar role={userRole} />
      <div className="h-auto flex-grow px-6 pb-6 pt-16 lg:ml-56 lg:pt-4">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
