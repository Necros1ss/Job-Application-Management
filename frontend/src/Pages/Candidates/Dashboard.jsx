import { useState, useEffect } from "react";
import { Doughnut, Pie } from "react-chartjs-2";
import { LuUserCircle2, LuSearch } from "react-icons/lu";
import { FaLongArrowAltRight, FaRegLightbulb } from "react-icons/fa";
import { BsBriefcase } from "react-icons/bs";
import { CiMenuKebab } from "react-icons/ci";
import DashboardCard from "../../Components/DashboardCard";
import { applicationsApi, usersApi } from "../../lib/api";
import "chart.js/auto";

const Dashboard = () => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [jobs, setJobs] = useState([]);
  const [chartType, setChartType] = useState("pie");
  const [menuOpen, setMenuOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [profile, applications] = await Promise.all([
          usersApi.me(),
          applicationsApi.list(),
        ]);

        setJobs(applications);
        setUserName(profile.name || "");
        setUserEmail(profile.email || "");
        setErrorMessage("");
      } catch (error) {
        setErrorMessage(error.message || "Failed to load dashboard data");
      }
    };

    loadDashboardData();
  }, []);

  const jobStatusCount = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {});

  const orderedStatuses = ["applied", "interview", "offered", "rejected"];
  const statusLabels = {
    applied: "Applied",
    interview: "Interview",
    offered: "Offer",
    rejected: "Rejected",
  };

  const data = {
    labels: orderedStatuses.map((status) => statusLabels[status]),
    datasets: [
      {
        label: "Applications",
        data: orderedStatuses.map((status) => jobStatusCount[status] || 0),
        backgroundColor: ["#36A2EB", "#FFCE56", "#00842B", "#FF6384"],
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    animation: {
      duration: 1000,
      easing: "easeInOutQuad",
    },
  };

  const resources = [
  ];

  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return "Good Morning";
    if (currentHour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const totalApplications = jobs.length;
  const totalRejected = jobStatusCount.rejected || 0;
  const totalInterviews = jobStatusCount.interview || 0;
  const totalOffers = jobStatusCount.offered || 0;

  return (
    <div>
      <div className="mb-5 flex flex-wrap justify-between items-center">
        <h1 className="font-bold text-[#2A2A2A] text-xl lg:text-2xl">
          {getGreeting()} {userName || "User"},
        </h1>
        <div className="gap-2 items-center border-l-2 border-[#5D6661] pl-4 hidden lg:flex">
          <div>
            <p className="text-[12px]">{userName || "User"}</p>
            <p className="text-[12px]">{userEmail || "you@beautiful.com"}</p>
          </div>
        </div>
      </div>
      {errorMessage && (
        <p className="text-[#c93434] text-sm mb-3" role="alert">
          {errorMessage}
        </p>
      )}
      <div className="rounded-lg mb-4">
        <div>
          <h2 className="text-xl text-gray-dark">Getting Started</h2>
          <div className="w-44 bg-light-gray rounded-full h-1.5 mt-1.5">
            <div className="bg-dark-gray h-1.5 rounded-full w-20"></div>
          </div>
          <p className="mt-1 text-[12px]">45% done</p>
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
            <DashboardCard
              to="/dashboard/profile"
              icon={LuUserCircle2}
              title="Complete your profile"
              description="Add more details"
            />
            <DashboardCard
              to="/dashboard/job"
              icon={LuSearch}
              title="Search for Jobs"
              description="Find jobs that match your skills"
            />
            <DashboardCard
              to="/dashboard/applications"
              icon={BsBriefcase}
              title="Update application status"
              description="Keep your job applications up to date"
            />
            <DashboardCard
              to="/dashboard"
              icon={FaRegLightbulb}
              title="Prepare for Interview"
              description="Browse our interview resources to help you prepare"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 p-4 relative">
              <div className="flex justify-between items-center">
                <h3 className="text-lg">Applications Tracking</h3>
                <span
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="hover:bg-[#E8E8E8] p-1.5 rounded-md relative"
                >
                  <CiMenuKebab className="rotate-90" />
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E8E8E8] rounded shadow-sm z-10 p-2">
                      <ul>
                        <li
                          className="p-2 hover:bg-[#E0E1E0] cursor-pointer text-sm rounded-md"
                          onClick={() => setChartType("doughnut")}
                        >
                          Doughnut Chart
                        </li>
                        <li
                          className="p-2 hover:bg-[#E0E1E0] cursor-pointer text-sm rounded-md"
                          onClick={() => setChartType("pie")}
                        >
                          Pie Chart
                        </li>
                      </ul>
                    </div>
                  )}
                </span>
              </div>
              <div className="w-full">
                {chartType === "doughnut" ? (
                  <div className="max-h-[400px] flex gap-20 items-center">
                    <Doughnut data={data} options={options} />
                    <div className="space-y-2 hidden md:block lg:hidden">
                      <div className="flex items-center">
                        <p className="text-sm text-gray mr-1">
                          Total Applications:
                        </p>
                        <p className="font-bold text-primary-text">
                          {totalApplications}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm text-gray mr-1">Total Rejected</p>
                        <p className="font-bold text-primary-text">
                          {totalRejected}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm text-gray mr-1">
                          Total Interviews
                        </p>
                        <p className="font-bold text-primary-text">
                          {totalInterviews}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm text-gray mr-1">Total Offers</p>
                        <p className="font-bold text-primary-text">
                          {totalOffers}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[400px] flex gap-20 items-center">
                    <Pie data={data} options={options} />
                    <div className="space-y-2 hidden md:block lg:hidden">
                      <div className="flex items-center">
                        <p className="text-sm text-gray mr-1">
                          Total Applications:
                        </p>
                        <p className="font-bold text-primary-text">
                          {totalApplications}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm text-gray mr-1">Total Rejected</p>
                        <p className="font-bold text-primary-text">
                          {totalRejected}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm text-gray mr-1">
                          Total Interviews
                        </p>
                        <p className="font-bold text-primary-text">
                          {totalInterviews}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm text-gray mr-1">Total Offers</p>
                        <p className="font-bold text-primary-text">
                          {totalOffers}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 md:hidden lg:grid">
                <div className="flex items-center">
                  <p className="text-sm text-gray mr-1">Total Applications:</p>
                  <p className="font-bold text-primary-text">
                    {totalApplications}
                  </p>
                </div>
                <div className="flex items-center">
                  <p className="text-sm text-gray mr-1">Total Rejected</p>
                  <p className="font-bold text-primary-text">{totalRejected}</p>
                </div>
                <div className="flex items-center">
                  <p className="text-sm text-gray mr-1">Total Interviews</p>
                  <p className="font-bold text-primary-text">
                    {totalInterviews}
                  </p>
                </div>
                <div className="flex items-center">
                  <p className="text-sm text-gray mr-1">Total Offers</p>
                  <p className="font-bold text-primary-text">{totalOffers}</p>
                </div>
              </div>
            </div>
            <div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
