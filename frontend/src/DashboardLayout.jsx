import SideBar from "./Components/SideBar";
import { Navigate, Outlet } from "react-router-dom";
import { tokenStorage } from "./lib/api";

const DashboardLayout = ({ allowedRole }) => {
  const token = tokenStorage.getToken();
  const userRole = tokenStorage.getRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!userRole) {
    tokenStorage.clearSession();
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to={userRole === "recruiter" ? "/recruiter" : "/candidate"} replace />;
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
