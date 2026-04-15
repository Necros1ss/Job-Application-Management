import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TopBar from "../../Components/TopBar";
import { LuMapPin, LuBuilding2, LuTrendingUp } from "react-icons/lu";
import { 
  FaCheckCircle, FaRegBookmark, FaBookmark, FaRegCalendarAlt, 
  FaRegMoneyBillAlt, FaBriefcase, FaLink, FaTwitter, FaLinkedinIn,
  FaHome, FaHeartbeat, FaMoneyBillWave, FaDumbbell
} from "react-icons/fa";

// Giữ nguyên các API import của bạn
import { applyFromJob, usersApi, jobPostsApi, savedJobsApi } from "../../lib/api";

const JobDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // State của bạn
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [jobs, setJobs] = useState([]);
  const [jobDetail, setJobDetail] = useState("");
  
  const [savingJobIds, setSavingJobIds] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  // Logic Apply Job của bạn
  const applyJob = async (jobId) => {
    const normalizedJobId = Number(jobId ?? jobDetail?.id ?? id);
    try {
      setIsLoading(true);
      const response = await applyFromJob(normalizedJobId);
      setIsApplied(true); 
      alert("Apply thành công.");   
      setTimeout(() => { navigate("/job"); }, 1000);
    } catch (error) {
      console.error("Lỗi khi lưu:", error);
      alert("Apply thất bại, có thể bạn đã apply job này rồi.");   
    } finally {
      setIsLoading(false);
    } 
  }; 

  // Logic Lưu Job của bạn
  const handleSaveClick = async (jobId) => {
    if (savingJobIds.includes(jobId) || savedJobIds.includes(jobId)) return;
    setSavingJobIds((prev) => [...prev, jobId]);
    try {
      await savedJobsApi.save(jobId); 
      setSavedJobIds((prev) => [...prev, jobId]);
      alert("Đã lưu công việc!");
    } catch (error) {
      console.error("Lỗi khi lưu:", error);
      alert("Lưu thất bại, có thể bạn đã lưu job này rồi.");
    } finally {
      setSavingJobIds((prev) => prev.filter(id => id !== jobId));
    }
  };

  // Logic xử lý thời gian của bạn
  const formatDeadline = (value) => {
    if (!value) return "Chưa cập nhật";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Chưa cập nhật";
    return parsed.toLocaleDateString("vi-VN");
  };

  const checkDeadline = (value) => {
    if (!value) return false;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsed.setHours(0, 0, 0, 0);
    return parsed < today;
  }

  // Effect Fetch Data của bạn
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await usersApi.me();
        setUserName(response.name);
        setUserEmail(response.email);
        setJobs(await jobPostsApi.list());
      } catch (error) {}
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchJobDetail = async () => {
      try {
        const data = await jobPostsApi.getById(id); 
        setJobDetail(data); 
      } catch (error) {}
    };
    fetchJobDetail();
  }, [id]);

  const isSaved = savedJobIds.includes(jobDetail?.id);

  return (
    <div className='min-h-screen bg-gray-50 text-gray-800 font-sans'>
      {/* Breadcrumb */}
      <TopBar userName={userName} userEmail={userEmail} />
      <div className="max-w-6xl mx-auto px-6 pt-6 pb-4 text-sm text-gray-500">
        Find Jobs <span className="mx-2">›</span> 
        Design & Creative <span className="mx-2">›</span> 
        <span className="text-gray-900 font-medium">{jobDetail?.title || "Senior UI/UX Designer"}</span>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12 flex flex-col gap-6">
        
        {/* ================= HERO CARD (Top Section) ================= */}
        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center border border-gray-100 p-2 overflow-hidden shadow-sm">
              <img 
                src={jobDetail?.companyLogo || "https://api.dicebear.com/8.x/initials/svg?seed=ES&backgroundColor=e0f2fe&textColor=0369a1"} 
                alt="Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {jobDetail?.title || "Senior UI/UX Designer"}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                  <LuBuilding2 className="text-gray-400" />
                  {jobDetail?.companyName || "EcoSphere Solutions"}
                </span>
                <span className="flex items-center gap-1.5">
                  <LuMapPin className="text-gray-400" />
                  {jobDetail?.location || "Oslo, Norway (Remote)"}
                </span>
                <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase">
                  Full Time
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button 
              onClick={() => handleSaveClick(jobDetail?.id)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              {isSaved ? <FaBookmark className="text-emerald-600" /> : <FaRegBookmark />} 
              {isSaved ? "Saved" : "Save Job"}
            </button>
            <button 
              disabled={checkDeadline(jobDetail?.deadline) || isLoading}
              onClick={() => applyJob(jobDetail?.id)}
              className={`flex-1 md:flex-none flex items-center justify-center px-8 py-2.5 font-semibold rounded-lg transition shadow-sm ${
                checkDeadline(jobDetail?.deadline) 
                  ? "bg-red-500 hover:bg-red-600 text-white cursor-not-allowed" 
                  : "bg-emerald-500 hover:bg-emerald-600 text-white"
              }`}
            >
              {isLoading ? "Processing..." : checkDeadline(jobDetail?.deadline) ? "Đã hết hạn" : "Apply Now"}
            </button>
          </div>
        </div>

        {/* ================= MAIN CONTENT LAYOUT ================= */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LEFT COLUMN (2/3 width) */}
          <div className="w-full lg:w-2/3 space-y-6">
            
            {/* Job Description */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900">Job Description</h2>
              </div>
              <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                {jobDetail?.description || "At EcoSphere Solutions, we are building the future of sustainable energy management. We are looking for a Senior UI/UX Designer who is passionate about creating intuitive, editorial-grade digital experiences that empower users to monitor and optimize their carbon footprint.\n\nYou will lead the design vision for our flagship platform, working closely with engineering and product teams to translate complex data into beautiful, actionable interfaces."}
              </div>
            </div>

            {/* Key Responsibilities */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900">Key Responsibilities</h2>
              </div>
              <ul className="space-y-4">
                {[
                  "Lead the end-to-end design process from discovery and research to high-fidelity prototyping and hand-off.",
                  "Collaborate with the engineering team to ensure high-quality implementation of our design system.",
                  "Maintain and evolve our 'Editorial Curator' design system, ensuring consistency across all touchpoints.",
                  "Conduct user interviews and usability testing to validate design decisions with data."
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-600">
                    <FaCheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900">Requirements</h2>
              </div>
              <ul className="space-y-4">
                {[
                  "5+ years of experience in UI/UX Design, ideally within SaaS or Fintech environments.",
                  "Expert proficiency in Figma and prototyping tools (Protopie, Framer).",
                  "Strong understanding of accessibility standards (WCAG) and responsive design principles.",
                  "Portfolio demonstrating high-end typography, layout, and visual hierarchy skills."
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-600">
                    <FaCheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Perks & Benefits */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900">Perks & Benefits</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-lg"><FaHome /></div>
                  <span className="font-semibold text-gray-800">100% Remote Work</span>
                </div>
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-lg"><FaHeartbeat /></div>
                  <span className="font-semibold text-gray-800">Health & Dental</span>
                </div>
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-lg"><FaMoneyBillWave /></div>
                  <span className="font-semibold text-gray-800">Competitive Equity</span>
                </div>
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-lg"><FaDumbbell /></div>
                  <span className="font-semibold text-gray-800">Wellness Stipend</span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (1/3 width - Sidebar) */}
          <div className="w-full lg:w-1/3 space-y-6">
            
            {/* About Company */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-6">About Company</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 p-2">
                  <img src={jobDetail?.companyLogo || "https://api.dicebear.com/8.x/initials/svg?seed=ES&backgroundColor=e0f2fe&textColor=0369a1"} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{jobDetail?.companyName || "EcoSphere Solutions"}</h4>
                  <p className="text-sm text-gray-500">Sustainability & Energy</p>
                </div>
              </div>
              <div className="space-y-4 mb-6 text-sm">
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">Industry</span>
                  <span className="font-semibold text-gray-800">{jobDetail?.industry || "Clean Tech"}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">Team Size</span>
                  <span className="font-semibold text-gray-800">50 - 200</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-gray-500">Website</span>
                  <a href="#" className="font-semibold text-emerald-600 hover:underline">ecosphere.tech</a>
                </div>
              </div>
              <button className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-800 font-semibold rounded-lg transition border border-gray-200">
                View Profile
              </button>
            </div>

            {/* Quick Overview */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-6">Quick Overview</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-lg shrink-0">
                    <LuTrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-0.5">Experience</p>
                    <p className="font-bold text-gray-900">Senior (5+ Years)</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-lg shrink-0">
                    <FaBriefcase size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-0.5">Employment Type</p>
                    <p className="font-bold text-gray-900">Full-Time, Permanent</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-lg shrink-0">
                    <FaRegMoneyBillAlt size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-0.5">Salary Range</p>
                    <p className="font-bold text-gray-900">{jobDetail?.salary || "$95k - $130k / Year"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-lg shrink-0">
                    <FaRegCalendarAlt size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-0.5">Deadline</p>
                    <p className="font-bold text-gray-900">{formatDeadline(jobDetail?.deadline)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Share this Job */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Share this Job</h3>
              <div className="flex gap-3">
                <button className="flex-1 h-10 flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 transition"><FaLink /></button>
                <button className="flex-1 h-10 flex items-center justify-center bg-[#1DA1F2] text-white rounded-lg hover:bg-blue-500 transition"><FaTwitter /></button>
                <button className="flex-1 h-10 flex items-center justify-center bg-[#0A66C2] text-white rounded-lg hover:bg-blue-700 transition"><FaLinkedinIn /></button>
              </div>
            </div>

          </div>
        </div>

        {/* ================= SIMILAR JOBS SECTION ================= */}
        <div className="mt-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Recommendation</p>
              <h2 className="text-2xl font-bold text-gray-900">Similar Jobs for You</h2>
            </div>
            <a href="#" className="text-emerald-600 font-semibold hover:underline flex items-center gap-1">
              View all listings <span className="text-lg">→</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer flex flex-col justify-between h-52">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center p-1.5"><img src="https://api.dicebear.com/8.x/initials/svg?seed=VS" alt="Logo" className="rounded" /></div>
                  <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs font-bold uppercase">New</span>
                </div>
                <h3 className="font-bold text-gray-900">Lead Product Designer</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><LuMapPin size={14}/> Stockholm, Sweden</p>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="font-bold text-gray-900">$110k - $150k</span>
                <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">›</div>
              </div>
            </div>
            {/* Card 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer flex flex-col justify-between h-52">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center p-1.5"><img src="https://api.dicebear.com/8.x/initials/svg?seed=UX" alt="Logo" className="rounded" /></div>
                </div>
                <h3 className="font-bold text-gray-900">Visual Designer</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><LuMapPin size={14}/> Copenhagen, Denmark</p>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="font-bold text-gray-900">$80k - $115k</span>
                <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">›</div>
              </div>
            </div>
            {/* Card 3 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer flex flex-col justify-between h-52">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center p-1.5 text-gray-300">...</div>
                </div>
                <h3 className="font-bold text-gray-900">UX Researcher</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><LuMapPin size={14}/> Remote, Europe</p>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="font-bold text-gray-900">$90k - $120k</span>
                <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">›</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default JobDetail;