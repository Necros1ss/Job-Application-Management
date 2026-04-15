import { useEffect, useState } from "react";
import { jobPostsApi, savedJobsApi, usersApi, applicationsApi} from "../../lib/api";
import { useNavigate } from "react-router-dom";
import TopBarDashboard from "../../Components/TopBarDashboard";


const Jobsearch = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [savingJobIds, setSavingJobIds] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const handleSaveClick = async (jobId) => {
    if (savingJobIds.includes(jobId) || savedJobIds.includes(jobId)) return;
    setSavingJobIds((prev) => [...prev, jobId]);

    try {
      const response = await savedJobsApi.save(jobId); 
      setSavedJobIds((prev) => [...prev, jobId]);
      alert("Đã lưu công việc!");
    } 
    catch (error) {
      console.error("Lỗi khi lưu:", error);
      alert("Lưu thất bại, có thể bạn đã lưu job này rồi.");
    } 
    finally {
      setSavingJobIds((prev) => prev.filter(id => id !== jobId));
    }
  };
    
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await usersApi.me();
        setUserName(profile.name || "");
        setUserEmail(profile.email || "");
      } catch (error) {
        setErrorMessage(error.message || "Failed to load profile");
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const data = await jobPostsApi.list(searchTerm);
        setJobs(data);
        setErrorMessage("");
      } catch (error) {
        setErrorMessage(error.message || "Failed to load jobs");
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-[#fbfcfa] px-8 pt-4 pb-12 lg:px-10 lg:pt-5 lg:pb-12">
      <TopBarDashboard
        userName={userName}
        userEmail={userEmail}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo tiêu đề, công ty, địa điểm..."
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Job Posting</h1>
          <p className="text-gray-500">Track your journey across {jobs.length} open roles.</p>
        </div>
      </div>

      {errorMessage && <p className="text-[#c93434] text-sm mt-4">{errorMessage}</p>}
      {isLoading && <p className="text-sm text-gray mt-4">Loading jobs...</p>}

      {!isLoading && !errorMessage && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {jobs.length === 0 ? (
            <p className="text-sm text-gray">No matching jobs found.</p>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="rounded-lg border border-light-gray bg-[#F8F9F8] p-4">
                
                <div className="flex-grow"
                onClick = {() => navigate(`/jobs/${job.id}`)}>
                  <h3 className="text-lg font-semibold">{job.title}</h3>
                  <p className="text-sm text-gray mt-1">{job.companyName}</p>
                  <p className="text-xs text-gray mt-2">{job.location}</p>
                  <p className="text-xs text-gray mt-1">{job.salary}</p>
                </div>

                <div className = "mt-4 flex justify-end">
                  <button 
                    onClick={() => handleSaveClick(job.id)}
                    className="text-gray-400 hover:text-teal-600 transition-colors flex-shrink-0"
                    title="Lưu công việc này"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                    </svg>
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Jobsearch;
