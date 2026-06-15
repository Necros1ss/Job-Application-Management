import { userRepository } from "../repositories/userRepository.js";

const mapProfile = (row) => ({
  id: row.id,
  name: row.role === "recruiter" ? row.company_name || "" : row.candidate_name || "",
  full_name:
    row.role === "recruiter"
      ? row.recruiter_name || row.company_name || ""
      : row.candidate_name || "",
  company_name: row.role === "recruiter" ? row.company_name || "" : "",
  email:
    row.role === "recruiter"
      ? row.recruiter_email || row.login_name
      : row.candidate_email || row.login_name,
  phone: row.role === "recruiter" ? row.recruiter_phone || "" : row.candidate_phone || "",
  address: row.role === "recruiter" ? row.recruiter_address || "" : row.address || "",
  website: row.role === "recruiter" ? row.recruiter_website || "" : "",
  linkedin: row.role === "recruiter" ? row.recruiter_linkedin || "" : "",
  industry: row.role === "recruiter" ? row.recruiter_industry || "" : "",
  company_size: row.role === "recruiter" ? row.recruiter_company_size || "" : "",
  tax_code: row.role === "recruiter" ? row.recruiter_tax_code || "" : "",
  description: row.role === "recruiter" ? row.recruiter_description || "" : "",
  avatarFileName: row.role === "recruiter" ? "" : row.avatar_file_name || "",
  logoFileName: row.role === "recruiter" ? row.logo_file_name || "" : "",
  dob: row.role === "recruiter" ? "" : row.candidate_dob || "", 
  experience: row.role === "recruiter" ? "" : row.experience || "",
  job_type: row.role === "recruiter" ? "" : row.job_type || "",
  skills: row.role === "recruiter" ? [] : row.skills || [],
  notificationPreferences: row.notification_preferences || {},
  role: row.role,
});

export const userService = {
  getProfile: async (id) => {
    const row = await userRepository.findFullProfileById(id);
    if (!row) throw new Error("User not found");
    return mapProfile(row);
  },

  updateProfile: async (id, data) => {
    const user = await userRepository.findFullProfileById(id);
    if (!user) throw new Error("User not found");

    if (user.role === "recruiter") {
      await userRepository.updateRecruiter(id, {
        company_name: data.company_name || data.name,
        phone: data.phone,
        address: data.address || data.location,
        website: data.website,
        linkedin: data.linkedin,
        industry: data.industry,
        company_size: data.company_size,
        tax_code: data.tax_code,
        description: data.description,
      });
    } else {
      await userRepository.updateCandidate(id, {
        name: data.name,
        phone: data.phone,
        address: data.address || data.location,
        dob: data.dob,
        skills: Array.isArray(data.skills) ? data.skills : null,
        experience: data.experience,
        job_type: data.job_type || data.jobType,
      });
    }

    return await userService.getProfile(id);
  },

  uploadAvatar: async (id, role, fileData) => {
    await userRepository.updateAvatar(id, role, fileData);
    return await userService.getProfile(id);
  },

  updateNotificationPreferences: async (id, preferences) => {
    const allowedKeys = new Set(["newApplication", "interviewReminder", "statusChanged", "newMessage"]);
    const normalized = {};
    for (const [key, value] of Object.entries(preferences)) {
      if (allowedKeys.has(key) && typeof value === "boolean") {
        normalized[key] = value;
      }
    }
    return await userRepository.updateNotificationPreferences(id, normalized);
  },

  deleteAccount: async (id) => {
    const deleted = await userRepository.deleteUser(id);
    if (!deleted) throw new Error("User not found");
    return true;
  },
};
