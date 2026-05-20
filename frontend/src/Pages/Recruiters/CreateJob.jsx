import React, { useState } from "react";
import { FaTimes, FaMapMarker, FaDollarSign, FaBriefcase, FaRegCalendarAlt, FaBookOpen, FaCheck } from "react-icons/fa";
import { jobPostsApi } from "../../lib/api";
import { showError, showSuccess } from "../../utils/toast";

const CreateJob = ({ isOpen, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    location: "",
    salary: "",
    employment_type: "Full-time",
    experience: "",
    deadline: "",
    industry: "",
    description: "",
    responsibilities: "",
    requirements: "",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showError("Job title is required.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await jobPostsApi.create(form);
      showSuccess("Job created successfully");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      showError(err.message || "Failed to create job");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Create New Job Posting</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Senior Frontend Developer"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5"><FaMapMarker size={14} /> Location</span>
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="e.g. Ho Chi Minh City, Vietnam"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5"><FaDollarSign size={14} /> Salary</span>
                    </label>
                    <input
                      type="text"
                      name="salary"
                      value={form.salary}
                      onChange={handleChange}
                      placeholder="e.g. $50,000 - $80,000 / year"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5"><FaBriefcase size={14} /> Employment Type</span>
                    </label>
                    <select
                      name="employment_type"
                      value={form.employment_type}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all bg-white"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5"><FaRegCalendarAlt size={14} /> Application Deadline</span>
                    </label>
                    <input
                      type="date"
                      name="deadline"
                      value={form.deadline}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Job Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5"><FaBookOpen size={14} /> Description</span>
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Describe the role, team, and company culture..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5"><FaCheck size={14} /> Responsibilities</span>
                  </label>
                  <textarea
                    name="responsibilities"
                    value={form.responsibilities}
                    onChange={handleChange}
                    rows="3"
                    placeholder="List key responsibilities and daily tasks..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Requirements
                  </label>
                  <textarea
                    name="requirements"
                    value={form.requirements}
                    onChange={handleChange}
                    rows="3"
                    placeholder="List required skills, qualifications, and experience..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? "Creating..." : "Create Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJob;
