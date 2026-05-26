import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaBuilding, FaMapMarkerAlt, FaGlobe, FaBriefcase, FaRegEnvelope, FaPhoneAlt } from "react-icons/fa";
import TopBar from "../../Components/TopBar";
import { jobPostsApi, usersApi } from "../../lib/api";
import { showError } from "../../utils/toast";

const defaultCompanyLogo = "https://api.dicebear.com/8.x/initials/svg?seed=Company&backgroundColor=e0f2fe&textColor=0369a1";

const Company = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [jobDetail, setJobDetail] = useState("");
  const [isLoading, setIsLoading] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await usersApi.me();
        setUserName(response.name);
        setUserEmail(response.email);
      } catch (error) {
        showError(error.message || "Failed to load profile");
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchJobDetail = async () => {
      try {
        setIsLoading(true);
        const data = await jobPostsApi.getById(id);
        setJobDetail(data); 
      } 
      catch (error) {
        showError(error.message || "Failed to load company information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobDetail();
  }, [id]);

  const companySubtitle = useMemo(() => {
    if (!jobDetail?.jobTitle) {
      return "Hiring company information";
    }

    return `Hiring for: ${jobDetail.jobTitle}`;
  }, [jobDetail?.jobTitle]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <TopBar userName={userName} userEmail={userEmail} />

        <div className="max-w-6xl mx-auto px-6 pt-6 pb-4 text-sm text-gray-500">
            <span className= "hover:text-emerald-700 transition-colors">Jobs Detail</span> 
            <span className="mx-2"> / </span>
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 mb-6"
                >
                {jobDetail?.title || "Senior UI/UX Designer"}
            </button>
            <span className="mx-2"> / </span>
            <span className="text-gray-900 font-medium">{jobDetail?.title || "Senior UI/UX Designer"}</span>
        </div>
    <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] gap-6">
          <div className="rounded-3xl bg-white shadow-sm border border-slate-100 overflow-hidden">
            <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 px-8 py-10 text-white">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_white,_transparent_40%)]" />
              <div className="relative flex flex-col md:flex-row md:items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20 overflow-hidden shrink-0">
                  <img
                    src={jobDetail?.logo || defaultCompanyLogo}
                    alt={jobDetail?.companyName || "Company Name"}
                    className="w-full h-full object-contain bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/80">Hiring company</p>
                  <h1 className="text-3xl md:text-4xl font-bold leading-tight">{jobDetail?.companyName || "Company Name"}</h1>
                  <p className="text-white/90 text-sm md:text-base max-w-2xl">{companySubtitle}</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div className="flex items-center gap-3 text-slate-500 text-sm font-medium mb-2">
                    <FaBuilding className="text-emerald-600" />
                    Founded
                  </div>
                  <p className="text-lg font-bold text-slate-900">{jobDetail?.industry || "Clean Technology"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div className="flex items-center gap-3 text-slate-500 text-sm font-medium mb-2">
                    <FaMapMarkerAlt className="text-emerald-600" />
                    Company Size
                  </div>
                  <p className="text-lg font-bold text-slate-900">{jobDetail?.address || "Remote / Hybrid"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div className="flex items-center gap-3 text-slate-500 text-sm font-medium mb-2">
                    <FaBriefcase className="text-emerald-600" />
                    Company Type  
                  </div>
                  <p className="text-lg font-bold text-slate-900">{jobDetail?.jobTitle || "Open Position"}</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">About this company</h2>
                <p className="text-slate-600 leading-7">
                  {isLoading
                    ? "Loading company information..."
                    : "This page displays hiring company information based on the job you just viewed. If detailed company profile data is not available yet from the backend, this page uses the current job post data so the company profile still stays clear and consistent."}
                </p>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Quick facts</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Company</span>
                  <span className="font-semibold text-slate-900 text-right">{jobDetail?.companyName || "Company Name"}</span>
                </div>
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Industry</span>
                  <span className="font-semibold text-slate-900 text-right">{jobDetail?.industry || "-"}</span>
                </div>
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Location</span>
                  <span className="font-semibold text-slate-900 text-right">{jobDetail?.address || jobDetail?.location || "Remote"}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">Compensation</span>
                  <span className="font-semibold text-slate-900 text-right">{jobDetail?.salary || "Negotiable"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm p-6">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300 mb-3">Contact</p>
                  <div className="space-y-3 text-sm text-slate-200">
                    <div className="flex items-center gap-3">
                      <FaRegEnvelope className="text-emerald-300 shrink-0" />
                      <span>{jobDetail?.email || "Open Position"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaGlobe className="text-emerald-300 shrink-0" />
                      <span>{jobDetail?.website || "Open Position"}</span>
                    </div>
                     <div className="flex items-center gap-3">
                      <FaPhoneAlt className="text-emerald-300 shrink-0" />
                      <span>{jobDetail?.phone || "Open Position"}</span>
                    </div>
                  </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Company;
