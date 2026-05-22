/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";

const DashboardCard = ({ to, icon: Icon, title, description }) => {
  return (
    <div>
      <Link
        to={to}
        className="block h-full w-full rounded-xl border border-light-gray bg-white p-3 shadow-sm transition-colors hover:bg-[#f8f8f8] dark:border-[#2a2a2a] dark:bg-[#121212] dark:hover:bg-[#171717]"
      >
        <span className="flex w-8 h-8 rounded-full items-center justify-center text-secondary-text text-xl dark:text-[#a3a3a3]">
          <Icon />
        </span>
        <h5 className="md:text-lg font-bold text-primary-text dark:text-white">{title}</h5>
        <p className="text-gray text-sm dark:text-[#a3a3a3]">{description}</p>
      </Link>
    </div>
  );
};

export default DashboardCard;
