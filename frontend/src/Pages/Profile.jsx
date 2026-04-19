import { useState, useEffect } from "react";
import {
  MdOutlineEdit,
  MdAdd,
  MdCameraAlt,
  MdSettings,
  MdPictureAsPdf,
  MdClose
} from "react-icons/md";
import { usersApi } from "../lib/api";
import ProfileTopBar from "../Components/ProfileTopBar";
import { calculateAge } from '../utils/format';

const Profile = () => {
  const [editingName, setEditingName] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingExperience, setEditingExperience] = useState(false);
  const [editingJobPreferences, setEditingJobPreferences] = useState(false);
  const [editingResume, setEditingResume] = useState(false);
  const [editingSkills, setEditingSkills] = useState(false);

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [dob, setDoB] = useState("");
  const [experience, setExperience] = useState("");
  const [jobType, setJobType] = useState("");
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [resume, setResume] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const formatDate = (value) => {
    if (!value) return "Chưa cập nhật";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Chưa cập nhật";
    return parsed.toLocaleDateString("vi-VN");
  };

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
    const loadProfile = async () => {
      try {
        const profile = await usersApi.me();
        setName(profile.name || "");
        setEmail(profile.email || "");
        setPhone(profile.phone || "");
        setLocation(profile.location || "");
        setDoB(profile.dob || "");
        setExperience(profile.experience || "");
        setJobType(profile.job_type || "");
        setSkills(Array.isArray(profile.skills) ? profile.skills : []);
        setProfileError("");
      } catch (error) {
        setProfileError(error.message || "Failed to load profile");
      }
    };

    loadProfile();
  }, []);

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const updated = await usersApi.updateMe({
        name,
        phone,
        location,
        dob,
        experience,
        jobType,
        skills,
      });

      setName(updated.name || "");
      setEmail(updated.email || "");
      setPhone(updated.phone || "");
      setLocation(updated.location || "");
      setDoB(updated.dob || "");
      setExperience(updated.experience || "");
      setJobType(updated.job_type || "");
      setSkills(Array.isArray(updated.skills) ? updated.skills : []);
      setProfileError("");
    } catch (error) {
      setProfileError(error.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditToggle = async (section) => {
    const sectionStates = {
      personal: editingPersonal,
      experience: editingExperience,
      jobPreferences: editingJobPreferences,
      resume: editingResume,
      skills: editingSkills,
      name: editingName,
    };

    if (sectionStates[section] && section !== "resume") {
      await saveProfile();
    }

    if (section === "personal") setEditingPersonal(!editingPersonal);
    else if (section === "experience") setEditingExperience(!editingExperience);
    else if (section === "jobPreferences") setEditingJobPreferences(!editingJobPreferences);
    else if (section === "resume") setEditingResume(!editingResume);
    else if (section === "skills") setEditingSkills(!editingSkills);
    else if (section === "name") setEditingName(!editingName);
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, newSkill]);
      setNewSkill("");
    }
  };

  const handleDeleteSkill = (index) => {
    const newSkills = skills.filter((_, i) => i !== index);
    setSkills(newSkills);
  };

  const handleResumeChange = (e) => {
    setResume(e.target.files[0]);
  };

  // Nút lưu/edit dùng chung
  const ActionButton = ({ isEditing, onClick, label = "Save" }) => (
    isEditing ? (
      <button
        disabled={isSaving}
        onClick={onClick}
        className="px-4 py-2 bg-[#0b3b4d] text-white text-sm font-semibold rounded-lg hover:bg-[#072733] transition shadow-sm disabled:opacity-70"
      >
        {isSaving ? "Saving..." : label}
      </button>
    ) : (
      <button 
        onClick={onClick} 
        className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition"
      >
        <MdOutlineEdit className="text-lg" /> Edit Info
      </button>
    )
  );

  return (
    <div className="bg-[#fbfcfa] min-h-screen px-8 pt-4 pb-8 lg:px-10 lg:pt-5 lg:pb-10">      
      <ProfileTopBar userName={userName} userEmail={userEmail}  />
      
      {/* ================= KHUNG CHỨA TOÀN BỘ NỘI DUNG PROFILE ================= */}
      <div className="w-full px-10 py-6 mx-auto font-sans text-gray-800">        
        {/* ERROR MESSAGE */}
        {profileError && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium">
            {profileError}
          </div>
        )}

        {/* ================= HERO PROFILE ================= */}
        <div className="flex justify-center mb-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 max-w-3xl">            
            
            {/* Avatar (Đã xóa các class bị nhầm) */}
            <div className="relative w-36 h-36 bg-[#0b3b4d] rounded-2xl flex-shrink-0 flex items-end justify-center overflow-hidden shadow-sm">
              <img 
                src="https://api.dicebear.com/8.x/avataaars/svg?seed=Alex&backgroundColor=0b3b4d" 
                alt="Avatar" 
                className="w-32 h-32 object-cover translate-y-2"
              />
              <button className="absolute bottom-2 right-2 bg-black/30 text-white p-1.5 rounded-lg backdrop-blur-md hover:bg-black/50 transition">
                <MdCameraAlt size={16} />
              </button>
            </div>

            {/* Thông tin Tên & Mô tả */}
            <div className="flex-1 text-center md:text-left mt-2">
              <div className="flex items-center justify-center md:justify-start gap-3">
                {editingName ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-3xl font-bold border-b-2 border-[#0b3b4d] outline-none bg-transparent px-1 pb-1 w-full max-w-sm"
                    placeholder="Your Name"
                  />
                ) : (
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    {name || "Alex Rivera"} <span className="text-gray-400 font-medium text-2xl md:text-3xl hidden md:inline">• Senior Product Designer</span>
                  </h1>
                )}
                
                {editingName ? (
                  <button onClick={() => handleEditToggle("name")} className="text-sm px-3 py-1.5 bg-[#0b3b4d] text-white rounded-lg font-semibold">Save</button>
                ) : (
                  <button onClick={() => handleEditToggle("name")} className="text-gray-400 hover:text-gray-800"><MdOutlineEdit size={22} /></button>
                )}
              </div>
        
              <div className="mt-3">
                {editingName ? (
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <span className="text-gray-600 text-lg font-medium">Date of Birth:</span>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDoB(e.target.value)}
                      className="text-lg bg-white border border-gray-200 rounded-lg px-3 py-1 outline-none focus:border-[#0b3b4d] text-gray-800 shadow-sm"
                    />
                  </div>
                ) : (
                  <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
                    <span className="font-medium mr-2">Date of Birth:</span>
                    {dob ? (
                      <span className="text-gray-900 font-semibold">{formatDate(dob)}</span>
                    ) : (
                      <span className="text-gray-400 italic">Not specified</span>
                    )}
                    <br />
                    <span className="font-medium mr-2">Age:</span>
                    {calculateAge(dob) !== null ? (
                      <span className="text-gray-900 font-semibold">{calculateAge(dob)} years old</span>
                    ) : (
                      <span className="text-gray-400 italic">Not specified</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================= CÁC PHẦN BÊN DƯỚI ================= */}
        <div className="flex flex-col gap-6">
          {/* PERSONAL DETAILS */}
          <div className="bg-white rounded-[20px] p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-[#0b3b4d]">Personal Details</h2>
              <ActionButton isEditing={editingPersonal} onClick={() => handleEditToggle("personal")} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Email */}
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</p>
                {editingPersonal ? (
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-[#0b3b4d]" />
                ) : (
                  <p className="font-semibold text-gray-900">{email || "alex.rivera@design.curator"}</p>
                )}
              </div>
              
              {/* Phone */}
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Phone Number</p>
                {editingPersonal ? (
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-[#0b3b4d]" />
                ) : (
                  <p className="font-semibold text-gray-900">{phone || ""}</p>
                )}
              </div>

              {/* Address */}
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Address</p>
                {editingPersonal ? (
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-[#0b3b4d]" />
                ) : (
                  <p className="font-semibold text-gray-900">{location || ""}</p>
                )}
              </div>
            </div>
          </div>

          {/* WORK EXPERIENCE */}
          <div className="bg-white rounded-[20px] p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-[#0b3b4d]">Work Experience</h2>
              <button 
                onClick={() => handleEditToggle("experience")}
                className="px-4 py-2 bg-[#0b3b4d] text-white text-sm font-semibold rounded-full hover:bg-[#072733] transition flex items-center gap-1 shadow-sm"
              >
                {editingExperience ? (isSaving ? "Saving..." : "Save Changes") : <><MdAdd size={18} /> Add Position</>}
              </button>
            </div>

            <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-100">
              {editingExperience ? (
                <textarea
                  rows="4"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-[#0b3b4d]/20 focus:border-[#0b3b4d] resize-none"
                  placeholder="Write about your work experience..."
                />
              ) : (
                <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 bg-[#c6e1e8] rounded-xl flex items-center justify-center text-[#0b3b4d] flex-shrink-0">
                      <MdAdd size={20} className="rotate-45" /> {/* Placeholder cho icon công ty */}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Overview</h3>
                      {experience ? (
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{experience}</p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No experience details added yet. Click "+ Add Position" to update.</p>
                      )}
                    </div>
                </div>
              )}
            </div>
          </div>

          {/* SKILLS & JOB PREFERENCES ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* SKILLS */}
            <div className="bg-[#f7f9fa] rounded-[20px] p-6 md:p-8 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[#0b3b4d]">Skills</h2>
                <button onClick={() => handleEditToggle("skills")} className="text-gray-400 hover:text-gray-700 transition">
                  {editingSkills ? <span className="text-sm font-bold bg-white px-3 py-1 rounded border shadow-sm">Save</span> : <MdSettings size={22} />}
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span key={index} className="bg-[#e4ebf0] text-[#2b4c59] px-3.5 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2">
                    {skill}
                    {editingSkills && (
                      <button onClick={() => handleDeleteSkill(index)} className="text-[#2b4c59] hover:text-red-500 bg-white/50 rounded-full p-0.5">
                        <MdClose size={14} />
                      </button>
                    )}
                  </span>
                ))}
                
                {editingSkills && (
                  <div className="flex items-center bg-white rounded-full pl-3 pr-1 py-1 border border-gray-200 shadow-sm">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="New skill..."
                      className="w-24 text-sm outline-none bg-transparent"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                    />
                    <button onClick={handleAddSkill} className="bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full p-1 transition">
                      <MdAdd size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* JOB PREFERENCES */}
            <div className="bg-[#f7f9fa] rounded-[20px] p-6 md:p-8 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[#0b3b4d]">Job Preferences</h2>
                <ActionButton isEditing={editingJobPreferences} onClick={() => handleEditToggle("jobPreferences")} />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-50">
                  <span className="text-gray-500 text-sm font-medium">Desired Salary</span>
                  <span className="font-bold text-gray-900">$180k - $220k</span>
                </div>
                
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-50">
                  <span className="text-gray-500 text-sm font-medium">Job Type</span>
                  {editingJobPreferences ? (
                    <input 
                      type="text" 
                      value={jobType} 
                      onChange={(e) => setJobType(e.target.value)} 
                      className="text-right border-b border-gray-300 outline-none font-bold text-gray-900 w-1/2 focus:border-[#0b3b4d]" 
                      placeholder="e.g. Full-time • Remote"
                    />
                  ) : (
                    <span className="font-bold text-gray-900">{jobType || "Full-time • Remote"}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;