import { useState, useEffect } from "react";
import {
  MdOutlineEdit,
  MdCameraAlt,
  MdBusiness,
  MdLanguage,
  MdPhone,
  MdLocationOn,
  MdCategory,
  MdWork,
  MdPeople,
  MdVpnKey,
  MdDescription,
  MdPerson
} from "react-icons/md";
import { usersApi } from "../../lib/api";
import ProfileTopBar from "../../Components/ProfileTopBar";
import { showError, showSuccess } from "../../utils/toast";

const Profile = () => {
  // Trạng thái Edit cho từng section
  const [editingHero, setEditingHero] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState(false);

  // States cho TopBar & Cấu hình chung
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // States cho Recruiter (Cá nhân)
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  
  // States cho Contact (Liên hệ)
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedIn, setLinkedIn] = useState("");

  // States cho Company/Organization (Tổ chức)
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await usersApi.me();
        
        // Map dữ liệu từ API vào State
        setUserName(profile.full_name || profile.company_name || profile.name || "");
        setUserEmail(profile.email || "");
        
        setFullName(profile.full_name || profile.name || "");
        setJobTitle(profile.job_title || "");
        
        setEmail(profile.email || "");
        setPhone(profile.phone || "");
        setWebsite(profile.website || "");
        setLinkedIn(profile.linkedin || "");

        setCompanyName(profile.company_name || profile.name || "");
        setIndustry(profile.industry || "");
        setCompanySize(profile.company_size || "");
        setTaxCode(profile.tax_code || "");
        setAddress(profile.address || profile.location || "");
        setDescription(profile.description || "");

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
      const payload = {
        name: companyName,
        full_name: fullName,
        job_title: jobTitle,
        phone,
        website,
        linkedin: linkedIn,
        company_name: companyName,
        industry,
        company_size: companySize,
        tax_code: taxCode,
        address,
        location: address,
        description: description
      };

      const updated = await usersApi.updateMe(payload);

      // Cập nhật lại UI sau khi save thành công
      setUserName(updated.full_name || updated.company_name || updated.name || "");
      setUserEmail(updated.email || "");
      setFullName(updated.full_name || updated.name || "");
      setJobTitle(updated.job_title || "");
      setEmail(updated.email || "");
      setPhone(updated.phone || "");
      setWebsite(updated.website || "");
      setLinkedIn(updated.linkedin || "");
      setCompanyName(updated.company_name || updated.name || "");
      setIndustry(updated.industry || "");
      setCompanySize(updated.company_size || "");
      setTaxCode(updated.tax_code || "");
      setAddress(updated.address || updated.location || "");
      setDescription(updated.description || "");

      setProfileError("");
      showSuccess("Profile saved successfully");
    } catch (error) {
      showError(error.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditToggle = async (section) => {
    const sectionStates = {
      hero: editingHero,
      contact: editingContact,
      organization: editingOrganization,
    };

    // Nếu đang ở trạng thái edit và bấm chuyển -> Save
    if (sectionStates[section]) {
      await saveProfile();
    }

    if (section === "hero") setEditingHero(!editingHero);
    else if (section === "contact") setEditingContact(!editingContact);
    else if (section === "organization") setEditingOrganization(!editingOrganization);
  };

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
        className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition whitespace-nowrap"
      >
        <MdOutlineEdit className="text-lg" /> Edit Info
      </button>
    )
  );

  return (
    <div className="bg-[#fbfcfa] min-h-screen px-8 pt-4 pb-8 lg:px-10 lg:pt-5 lg:pb-10">      
      <ProfileTopBar userName={userName} userEmail={userEmail}  />
      
      <div className="w-full px-10 py-6 mx-auto font-sans text-gray-800">        
        {profileError && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium">
            {profileError}
          </div>
        )}

        {/* ================= HERO PROFILE (RECRUITER INFO) ================= */}
        <div className="flex justify-center mb-10">
          <div className="flex flex-col md:flex-row items-center md:items-center justify-center gap-6 max-w-4xl w-full">            
            
            {/* Avatar */}
            <div className="relative w-36 h-36 bg-[#0b3b4d] rounded-2xl flex-shrink-0 flex items-end justify-center overflow-hidden shadow-sm">
              <img 
                src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${fullName || "Alex"}&backgroundColor=0b3b4d`} 
                alt="Avatar" 
                className="w-32 h-32 object-cover translate-y-2"
              />
              <button className="absolute bottom-2 right-2 bg-black/30 text-white p-1.5 rounded-lg backdrop-blur-md hover:bg-black/50 transition">
                <MdCameraAlt size={16} />
              </button>
            </div>

            {/* Thông tin Cá nhân */}
            <div className="text-center md:text-left mt-2 w-full md:w-auto">
              <div className="flex items-center justify-center md:justify-start gap-5 w-full">
                <div className="flex flex-col gap-2 w-full md:w-auto md:max-w-2xl">
                  {editingHero ? (
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="text-3xl font-bold border-b-2 border-[#0b3b4d] outline-none bg-transparent px-1 pb-1 w-full max-w-md"
                      placeholder=""
                    />
                  ) : (
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-2">
                      {fullName || "Recruiter Name"} 
                      <span className="text-green-500 text-xl" title="Verified Recruiter">✔</span>
                    </h1>
                  )}

                  {editingHero ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="text-lg bg-white border border-gray-200 rounded-lg px-3 py-1 outline-none focus:border-[#0b3b4d] shadow-sm"
                        placeholder="Technical Recruiter..."
                      />
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xl font-medium">
                      {jobTitle || "Job Title not specified"} <span className="mx-2">•</span> {companyName || "Company not specified"}
                    </p>
                  )}
                </div>
                
                <div className="hidden md:block md:ml-6 lg:ml-10">
                  <ActionButton isEditing={editingHero} onClick={() => handleEditToggle("hero")} />
                </div>
              </div>
              
              {/* Nút Edit cho Mobile */}
              <div className="mt-4 md:hidden flex justify-center">
                <ActionButton isEditing={editingHero} onClick={() => handleEditToggle("hero")} />
              </div>
            </div>
          </div>
        </div>

        {/* ================= CÁC PHẦN BÊN DƯỚI ================= */}
        <div className="flex flex-col gap-6 w-full">
          
          {/* ================= CONTACT DETAILS ================= */}
          <div className="bg-white rounded-[20px] p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-[#0b3b4d]">Contact Details</h2>
              <ActionButton isEditing={editingContact} onClick={() => handleEditToggle("contact")} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><MdBusiness /> Account Email</p>
                <p className="font-semibold text-gray-900">{email || "Not specified"}</p>
                <p className="text-xs text-gray-400 mt-2">Email is managed by account settings.</p>
              </div>
              
              {/* Phone */}
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><MdPhone /> Phone Number</p>
                {editingContact ? (
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-[#0b3b4d]" placeholder="09xx xxx xxx" />
                ) : (
                  <p className="font-semibold text-gray-900">{phone || "Not specified"}</p>
                )}
              </div>
              
              {/* Website */}
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><MdLanguage /> Website</p>
                {editingContact ? (
                  <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-[#0b3b4d]" placeholder="https://your-company.com" />
                ) : (
                  <a href={website} target="_blank" rel="noreferrer" className="font-semibold text-[#0b3b4d] hover:underline break-all">{website || "Not specified"}</a>
                )}
              </div>

              {/* LinkedIn */}
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><MdPerson /> LinkedIn Profile</p>
                {editingContact ? (
                  <input type="text" value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-[#0b3b4d]" placeholder="https://linkedin.com/in/..." />
                ) : (
                  <a href={linkedIn} target="_blank" rel="noreferrer" className="font-semibold text-[#0b3b4d] hover:underline break-all">{linkedIn || "Not specified"}</a>
                )}
              </div>
            </div>
          </div>

          {/* ================= ORGANIZATION DETAILS ================= */}
          <div className="bg-white rounded-[20px] p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-[#0b3b4d]">Organization Details</h2>
              <ActionButton isEditing={editingOrganization} onClick={() => handleEditToggle("organization")} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Name */}
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 md:col-span-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><MdBusiness /> Company Legal Name</p>
                {editingOrganization ? (
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-[#0b3b4d]" placeholder="Tên đầy đủ của công ty..." />
                ) : (
                  <p className="font-semibold text-gray-900">{companyName || "Not specified"}</p>
                )}
              </div>

              {/* Industry */}
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><MdCategory /> Industry</p>
                {editingOrganization ? (
                  <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-[#0b3b4d]" placeholder="IT, Finance, E-commerce..." />
                ) : (
                  <p className="font-semibold text-gray-900">{industry || "Not specified"}</p>
                )}
              </div>

              {/* Company Size */}
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><MdPeople /> Company Size</p>
                {editingOrganization ? (
                  <select value={companySize} onChange={(e) => setCompanySize(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-[#0b3b4d]">
                    <option value="">Select size...</option>
                    <option value="1-50">1 - 50 employees</option>
                    <option value="51-200">51 - 200 employees</option>
                    <option value="201-500">201 - 500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                ) : (
                  <p className="font-semibold text-gray-900">{companySize || "Not specified"}</p>
                )}
              </div>

              {/* Tax Code */}
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><MdVpnKey /> Tax Code (Mã số thuế)</p>
                {editingOrganization ? (
                  <input type="text" value={taxCode} onChange={(e) => setTaxCode(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-[#0b3b4d]" placeholder="Nhập mã số thuế..." />
                ) : (
                  <p className="font-semibold text-gray-900">{taxCode || "Not specified"}</p>
                )}
              </div>

              {/* Address */}
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><MdLocationOn /> Address</p>
                {editingOrganization ? (
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-[#0b3b4d]" placeholder="Địa chỉ văn phòng..." />
                ) : (
                  <p className="font-semibold text-gray-900">{address || "Not specified"}</p>
                )}
              </div>

              {/* Description */}
              <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 md:col-span-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><MdDescription /> Company Description</p>
                {editingOrganization ? (
                  <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    rows={4}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 outline-none focus:border-[#0b3b4d] resize-none" 
                    placeholder="Giới thiệu về văn hóa, môi trường và sứ mệnh của công ty..." 
                  />
                ) : (
                  <p className="font-semibold text-gray-900 whitespace-pre-line">{description || "No description provided."}</p>
                )}
              </div>
            </div>
          </div>

          {/* ================= DB MAPPING (Chỉ dùng để Debug) ================= */}
          <div className="bg-[#f7f9fa] rounded-[20px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-[#0b3b4d] mb-4">DB Recruiter Mapping (Debug)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {[
                { label: "full_name", val: fullName },
                { label: "job_title", val: jobTitle },
                { label: "company_name", val: companyName },
                { label: "email", val: email },
                { label: "phone", val: phone },
                { label: "linkedin", val: linkedIn },
                { label: "industry", val: industry },
                { label: "company_size", val: companySize },
                { label: "tax_code", val: taxCode },
                { label: "address", val: address },
              ].map((item, index) => (
                <div key={index} className="bg-white rounded-xl border border-gray-100 p-3">
                  <p className="text-gray-500 text-xs">{item.label}</p>
                  <p className="font-semibold text-gray-900 truncate" title={item.val}>{item.val || "-"}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
