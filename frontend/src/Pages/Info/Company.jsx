import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaBuilding, FaMapMarkerAlt, FaGlobe, FaBriefcase, FaRegEnvelope } from "react-icons/fa";
import TopBar from "../../Components/TopBar";
import { jobPostsApi, usersApi } from "../../lib/api";

const defaultCompanyLogo = "https://api.dicebear.com/8.x/initials/svg?seed=Company&backgroundColor=e0f2fe&textColor=0369a1";

const Company = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const initialCompany = location.state?.company || null;

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [jobDetail, setJobDetail] = useState(initialCompany);
  const [isLoading, setIsLoading] = useState(!initialCompany);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await usersApi.me();
        setUserName(response.name);
        setUserEmail(response.email);
      } catch (error) {}
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (jobDetail?.name && jobDetail?.jobTitle) {
      return;
    }

    const fetchJobDetail = async () => {
      try {
        setIsLoading(true);
        const data = await jobPostsApi.getById(id);
        setJobDetail({
          id: data.id,
          name: data.companyName,
          logo: data.companyLogo,
          industry: data.industry,
          location: data.location,
          jobTitle: data.title,
          salary: data.salary,
        });
      } catch (error) {
        setJobDetail(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobDetail();
  }, [id, jobDetail?.jobTitle, jobDetail?.name]);

  const companyTitle = jobDetail?.name || "Company Profile";
  const companySubtitle = useMemo(() => {
    if (!jobDetail?.jobTitle) {
      return "Thông tin công ty tuyển dụng";
    }

    return `Đang tuyển: ${jobDetail.jobTitle}`;
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
                    alt={companyTitle}
                    className="w-full h-full object-contain bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/80">Hiring company</p>
                  <h1 className="text-3xl md:text-4xl font-bold leading-tight">{companyTitle}</h1>
                  <p className="text-white/90 text-sm md:text-base max-w-2xl">{companySubtitle}</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div className="flex items-center gap-3 text-slate-500 text-sm font-medium mb-2">
                    <FaBuilding className="text-emerald-600" />
                    Industry
                  </div>
                  <p className="text-lg font-bold text-slate-900">{jobDetail?.industry || "Clean Technology"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div className="flex items-center gap-3 text-slate-500 text-sm font-medium mb-2">
                    <FaMapMarkerAlt className="text-emerald-600" />
                    Location
                  </div>
                  <p className="text-lg font-bold text-slate-900">{jobDetail?.location || "Remote / Hybrid"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div className="flex items-center gap-3 text-slate-500 text-sm font-medium mb-2">
                    <FaBriefcase className="text-emerald-600" />
                    Open role
                  </div>
                  <p className="text-lg font-bold text-slate-900">{jobDetail?.jobTitle || "Open Position"}</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">About this company</h2>
                <p className="text-slate-600 leading-7">
                  {isLoading
                    ? "Đang tải thông tin công ty..."
                    : "Trang này hiển thị thông tin công ty tuyển dụng dựa trên job bạn vừa xem. Nếu backend chưa có dữ liệu chi tiết riêng cho công ty, các thông tin ở đây sẽ được suy ra từ job post hiện tại để bạn vẫn có một trang profile rõ ràng và nhất quán."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-100 p-5 bg-white shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700 mb-3">Snapshot</p>
                  <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-4">
                      <span>Job title</span>
                      <span className="font-semibold text-slate-900 text-right">{jobDetail?.jobTitle || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Salary</span>
                      <span className="font-semibold text-slate-900 text-right">{jobDetail?.salary || "Negotiable"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Company name</span>
                      <span className="font-semibold text-slate-900 text-right">{jobDetail?.name || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 p-5 bg-slate-900 text-white shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300 mb-3">Contact</p>
                  <div className="space-y-3 text-sm text-slate-200">
                    <div className="flex items-center gap-3">
                      <FaRegEnvelope className="text-emerald-300 shrink-0" />
                      <span>Recruiter contact chưa được backend cung cấp</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaGlobe className="text-emerald-300 shrink-0" />
                      <span>Company website chưa được cung cấp</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Quick facts</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Company</span>
                  <span className="font-semibold text-slate-900 text-right">{companyTitle}</span>
                </div>
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Current job</span>
                  <span className="font-semibold text-slate-900 text-right">{jobDetail?.jobTitle || "-"}</span>
                </div>
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Location</span>
                  <span className="font-semibold text-slate-900 text-right">{jobDetail?.location || "Remote"}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">Compensation</span>
                  <span className="font-semibold text-slate-900 text-right">{jobDetail?.salary || "Negotiable"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300 mb-3">Next step</p>
              <h3 className="text-xl font-bold mb-2">Interested in this company?</h3>
              <p className="text-sm text-slate-300 leading-6 mb-5">
                Quay lại job detail để ứng tuyển hoặc lưu job nếu bạn muốn theo dõi thêm.
              </p>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 transition"
              >
                Back to job detail
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Company;