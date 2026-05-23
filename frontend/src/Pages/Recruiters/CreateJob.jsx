/* eslint-disable react/prop-types */
import { useState } from "react";
import { FaTimes, FaMapMarker, FaDollarSign, FaBriefcase, FaRegCalendarAlt, FaBookOpen, FaCheck } from "react-icons/fa";
import { jobPostsApi } from "../../lib/api";
import { showError, showSuccess } from "../../utils/toast";
import { useFormValidation, validators } from "../../hooks/useFormValidation";

const CreateJob = ({ isOpen, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const initialValues = {
    title: "",
    location: "",
    salary: "",
    employment_type: "full-time",
    experience: "",
    deadline: "",
    industry: "",
    description: "",
    responsibilities: "",
    requirements: "",
  };

  const futureDate = (message = "Deadline must be today or a future date") => (value) => {
    if (!value) return "";
    const selected = new Date(`${value}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected >= today ? "" : message;
  };

  const validationRules = {
    title: [
      validators.required("Job title is required"),
      validators.minLength(5, "Job title must be at least 5 characters"),
      validators.maxLength(255, "Job title must be 255 characters or less"),
    ],
    description: [
      validators.required("Description is required"),
      validators.minLength(50, "Description must be at least 50 characters"),
      validators.maxLength(10000, "Description must be 10000 characters or less"),
    ],
    deadline: [validators.required("Application deadline is required"), futureDate()],
  };

  const {
    values: form,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isValid,
    reset,
  } = useFormValidation(initialValues, validationRules);

  if (!isOpen) return null;

  const submitJob = async (values) => {
    setIsSubmitting(true);
    setError("");
    try {
      await jobPostsApi.create(values);
      showSuccess("Job created successfully");
      reset();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create job");
      showError(err.message || "Failed to create job");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    await submitJob(values);
  });

  const getFieldError = (name) => (touched[name] ? errors[name] : "");

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
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto" noValidate>
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
                    onBlur={handleBlur}
                    placeholder="e.g. Senior Frontend Developer"
                    required
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all ${
                      getFieldError("title") ? "border-red-300" : "border-gray-200"
                    }`}
                  />
                  {getFieldError("title") && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">{getFieldError("title")}</p>
                  )}
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
                      onBlur={handleBlur}
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
                      onBlur={handleBlur}
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
                      onBlur={handleBlur}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all bg-white"
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
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
                      onBlur={handleBlur}
                      required
                      className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all ${
                        getFieldError("deadline") ? "border-red-300" : "border-gray-200"
                      }`}
                    />
                    {getFieldError("deadline") && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">{getFieldError("deadline")}</p>
                    )}
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
                    onBlur={handleBlur}
                    rows="4"
                    placeholder="Describe the role, team, and company culture..."
                    required
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all resize-none ${
                      getFieldError("description") ? "border-red-300" : "border-gray-200"
                    }`}
                  />
                  {getFieldError("description") && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">{getFieldError("description")}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5"><FaCheck size={14} /> Responsibilities</span>
                  </label>
                  <textarea
                    name="responsibilities"
                    value={form.responsibilities}
                    onChange={handleChange}
                    onBlur={handleBlur}
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
                    onBlur={handleBlur}
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
              disabled={isSubmitting || !isValid}
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
