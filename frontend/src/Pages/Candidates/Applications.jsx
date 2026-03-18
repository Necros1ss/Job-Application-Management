import { useState, useEffect } from "react";
import { FaPlus, FaList, FaThLarge } from "react-icons/fa";
import { LuSearch } from "react-icons/lu";
import { MdClose } from "react-icons/md";
import AddNewJobs from "../../Components/AddNewJob";
import EditJobModal from "../../Components/EditJobModal";
import { applicationsApi } from "../../lib/api";

const formatDate = (date) => {
  if (!date) {
    return "";
  }

  return new Date(date).toLocaleDateString();
};

const Applications = () => {
  const [showJobModal, setShowJobModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [checkedJobIds, setCheckedJobIds] = useState([]);
  const [isCardView, setIsCardView] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const data = await applicationsApi.list();
      setJobs(data);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message || "Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleOpenJobModal = () => {
    setShowJobModal(true);
  };

  const handleAddJob = async (newJob) => {
    try {
      const createdJob = await applicationsApi.create(newJob);
      setJobs((prev) => [createdJob, ...prev]);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message || "Failed to create application");
    }
  };

  const handleEditJob = async (updatedJob) => {
    try {
      const saved = await applicationsApi.update(updatedJob.id, updatedJob);
      setJobs((prev) => prev.map((job) => (job.id === saved.id ? saved : job)));
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message || "Failed to update application");
    }
  };

  const handleOpenEditModal = (job) => {
    setSelectedJob(job);
    setShowEditModal(true);
  };

  const handleDeleteJob = async (jobToDelete) => {
    try {
      await applicationsApi.remove(jobToDelete.id);
      setJobs((prev) => prev.filter((job) => job.id !== jobToDelete.id));
      setCheckedJobIds((prev) => prev.filter((id) => id !== jobToDelete.id));
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message || "Failed to delete application");
    }
  };

  const handleCheckJob = (jobId) => {
    setCheckedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const handleBulkDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete the selected jobs?"
    );

    if (!confirmDelete) {
      return;
    }

    const results = await Promise.allSettled(
      checkedJobIds.map((jobId) => applicationsApi.remove(jobId))
    );

    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length > 0) {
      setErrorMessage("Some applications could not be deleted. Please retry.");
      return;
    }

    setJobs((prev) => prev.filter((job) => !checkedJobIds.includes(job.id)));
    setCheckedJobIds([]);
    setErrorMessage("");
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleJobs = jobs.filter((job) => {
    const matchesTab = activeTab === "all" || job.status === activeTab;
    const matchesSearch =
      normalizedSearch.length === 0 ||
      job.jobTitle.toLowerCase().includes(normalizedSearch) ||
      job.companyName.toLowerCase().includes(normalizedSearch);

    return matchesTab && matchesSearch;
  });

  return (
    <div className="h-screen">
      <span className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-semibold">Applications</h2>
        <div className="flex items-center gap-4">
          <span className="hidden md:flex items-center gap-2">
            <p className="text-secondary-text">Total Applications:</p>
            <p className="font-semibold">{jobs.length}</p>
          </span>
          <button
            className="bg-black text-white rounded-full py-2 px-2.5 flex justify-center items-center gap-3 text-sm"
            onClick={handleOpenJobModal}
          >
            <p className="hidden md:flex">Add new Job</p>
            <span className="text-sm">
              <FaPlus />
            </span>
          </button>
        </div>
      </span>

      {showJobModal && (
        <AddNewJobs setJobModal={setShowJobModal} onAddJob={handleAddJob} />
      )}

      {showEditModal && selectedJob && (
        <EditJobModal
          job={selectedJob}
          setEditModal={setShowEditModal}
          onEditJob={handleEditJob}
        />
      )}

      {errorMessage && (
        <p className="text-[#c93434] text-sm mb-3" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex justify-between mb-4">
        <form
          onSubmit={(event) => event.preventDefault()}
          className="flex items-center gap-2 border border-tertiary-text rounded-lg pl-2 py-1.5 w-48"
        >
          <label className="sr-only" htmlFor="search-applications">
            Search
          </label>
          <LuSearch className="text-gray text-sm" />
          <input
            id="search-applications"
            type="search"
            name="search"
            placeholder="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-32 outline-none bg-white"
          />
        </form>
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 py-1 px-2 cursor-pointer text-tertiary-text">
            <button onClick={() => setIsCardView(true)}>
              <FaThLarge />
            </button>
            <button onClick={() => setIsCardView(false)}>
              <FaList />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 border-b overflow-auto">
        <ul className="flex text-sm font-medium text-center">
          {["all", "applied", "interview", "offered", "rejected"].map((tab) => (
            <li className="me-2" key={tab}>
              <button
                className={`inline-block p-4 ${
                  activeTab === tab ? "border-b-2" : ""
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {isLoading && <p className="text-sm text-gray">Loading applications...</p>}

      {!isLoading && isCardView ? (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-12">
          {visibleJobs.map((job) => (
            <div
              key={job.id}
              className="rounded-lg overflow-hidden mt-4 cursor-pointer hover:shadow-lg bg-[#F8F9F8] border border-light-gray"
              onClick={() => handleOpenEditModal(job)}
            >
              <div className="p-4">
                <div className="flex justify-between items-center">
                  <p className="text-teal text-lg font-semibold">{job.jobTitle}</p>
                  <span
                    className="text-gray text-lg cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteJob(job);
                    }}
                  >
                    <MdClose />
                  </span>
                </div>
                <h3 className="text-xl mt-2">{job.companyName}</h3>
                <p className="text-xs text-gray mt-2">
                  {job.status} on {formatDate(job.applicationDate)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && !isCardView ? (
        <div className="overflow-x-auto rounded-t-2xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#E2E6E4] text-primary-text">
              <tr>
                <th className="px-6 py-3"></th>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Company</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {visibleJobs.map((job) => (
                <tr key={job.id} className="border-b border-light-gray">
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={checkedJobIds.includes(job.id)}
                      onChange={() => handleCheckJob(job.id)}
                    />
                  </td>
                  <td
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => handleOpenEditModal(job)}
                  >
                    {job.jobTitle}
                  </td>
                  <td className="px-6 py-4">{job.companyName}</td>
                  <td className="px-6 py-4">{job.status}</td>
                  <td className="px-6 py-4">{formatDate(job.applicationDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {checkedJobIds.length > 0 && (
            <div className="flex justify-end mt-4 absolute right-0 mr-5">
              <button
                className="bg-[#c40707] text-white py-1 px-4 rounded text-sm"
                onClick={handleBulkDelete}
              >
                Delete Selected
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Applications;
