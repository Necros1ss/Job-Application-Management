import { useEffect, useMemo, useState } from "react";
import {
  MdAdd,
  MdBadge,
  MdCake,
  MdCheck,
  MdClose,
  MdEmail,
  MdErrorOutline,
  MdLocationOn,
  MdOutlineEdit,
  MdPerson,
  MdPhone,
  MdWork,
} from "react-icons/md";
import ProfileTopBar from "../../Components/ProfileTopBar";
import { usersApi } from "../../lib/api";
import { calculateAge } from "../../utils/format";
import { showError, showSuccess } from "../../utils/toast";

const emptyProfile = {
  name: "",
  email: "",
  phone: "",
  location: "",
  dob: "",
  experience: "",
  jobType: "",
  skills: [],
};

const normalizeDateForInput = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const formatDate = (value) => {
  if (!value) return "Not updated";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not updated";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const FieldCard = ({ icon, label, value, children, editing = false }) => (
  <div className="rounded-[14px] border border-[#e5e5e5] bg-white p-4 shadow-[0_0_0_1px_rgba(10,10,10,0.04)]">
    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-[#737373]">
      <span className="text-[#0a0a0a]">{icon}</span>
      {label}
    </div>
    {editing ? children : <p className="min-h-[24px] font-semibold text-[#0a0a0a]">{value || "Not updated"}</p>}
  </div>
);

const ProfileSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="blueprint-hero-panel p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="h-24 w-24 rounded-[14px] bg-[#e5e5e5]" />
        <div className="flex-1 space-y-3">
          <div className="h-8 w-64 rounded-full bg-[#e5e5e5]" />
          <div className="h-4 w-80 max-w-full rounded-full bg-[#f2f2f2]" />
          <div className="flex gap-2">
            <div className="h-8 w-24 rounded-full bg-[#f2f2f2]" />
            <div className="h-8 w-28 rounded-full bg-[#f2f2f2]" />
          </div>
        </div>
      </div>
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="blueprint-card h-28 p-5" />
      ))}
    </div>
    <div className="blueprint-card h-72 p-6" />
  </div>
);

const CandidateProfile = () => {
  const [profile, setProfile] = useState(emptyProfile);
  const [draft, setDraft] = useState(emptyProfile);
  const [editingSection, setEditingSection] = useState(null);
  const [newSkill, setNewSkill] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const profileCompleteness = useMemo(() => {
    const checks = [
      profile.name,
      profile.email,
      profile.phone,
      profile.location,
      profile.dob,
      profile.experience,
      profile.jobType,
      profile.skills.length > 0,
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [profile]);

  const age = calculateAge(profile.dob);

  const hydrateProfile = (payload) => {
    const nextProfile = {
      name: payload.name || "",
      email: payload.email || "",
      phone: payload.phone || "",
      location: payload.location || "",
      dob: normalizeDateForInput(payload.dob),
      experience: payload.experience || "",
      jobType: payload.job_type || payload.jobType || "",
      skills: Array.isArray(payload.skills) ? payload.skills.filter(Boolean) : [],
    };
    setProfile(nextProfile);
    setDraft(nextProfile);
  };

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const response = await usersApi.me();
        if (!mounted) return;
        hydrateProfile(response);
        setProfileError("");
      } catch (error) {
        if (!mounted) return;
        const message = error.message || "Failed to load profile";
        setProfileError(message);
        showError(message);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const saveProfile = async () => {
    try {
      setIsSaving(true);
      const updated = await usersApi.updateMe({
        name: draft.name,
        phone: draft.phone,
        location: draft.location,
        dob: draft.dob || null,
        experience: draft.experience,
        jobType: draft.jobType,
        skills: draft.skills,
      });
      hydrateProfile(updated);
      setEditingSection(null);
      setProfileError("");
      showSuccess("Profile saved successfully");
    } catch (error) {
      showError(error.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (section) => {
    setDraft(profile);
    setNewSkill("");
    setEditingSection(section);
  };

  const cancelEditing = () => {
    setDraft(profile);
    setNewSkill("");
    setEditingSection(null);
  };

  const addSkill = () => {
    const normalizedSkill = newSkill.trim();
    if (!normalizedSkill) return;
    setDraft((current) => ({
      ...current,
      skills: current.skills.some((skill) => skill.toLowerCase() === normalizedSkill.toLowerCase())
        ? current.skills
        : [...current.skills, normalizedSkill],
    }));
    setNewSkill("");
  };

  const removeSkill = (index) => {
    setDraft((current) => ({
      ...current,
      skills: current.skills.filter((_, skillIndex) => skillIndex !== index),
    }));
  };

  const renderSectionAction = (section) =>
    editingSection === section ? (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={cancelEditing}
          className="rounded-[10px] border border-[#e5e5e5] px-4 py-2 text-sm font-semibold text-[#0a0a0a] hover:bg-[#f2f2f2]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={saveProfile}
          disabled={isSaving}
          className="blueprint-primary px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => startEditing(section)}
        className="inline-flex items-center gap-2 rounded-[10px] border border-[#e5e5e5] px-4 py-2 text-sm font-semibold text-[#0a0a0a] hover:bg-[#f2f2f2]"
      >
        <MdOutlineEdit size={18} />
        Edit
      </button>
    );

  return (
    <div className="min-h-screen bg-white px-4 pb-8 sm:px-6 lg:px-8">
      <ProfileTopBar userName={profile.name} userEmail={profile.email} />

      <main className="mx-auto max-w-6xl space-y-6">
        {profileError && (
          <div className="flex items-start gap-3 rounded-[14px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <MdErrorOutline className="mt-0.5 text-lg" />
            <span>{profileError}</span>
          </div>
        )}

        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <>
            <section className="blueprint-hero-panel p-5 md:p-6">
              <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-5 md:flex-row md:items-center">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[14px] border border-[#e5e5e5] bg-black text-4xl font-semibold text-white">
                    {(profile.name || profile.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="blueprint-kicker">Candidate profile</p>
                    <h1 className="mt-1 text-3xl font-semibold text-black md:text-4xl">
                      {profile.name || "Candidate Name"}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#737373]">
                      Keep your contact information, skills, and job preferences ready before applying.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="blueprint-tag px-3 py-1 text-sm font-medium">
                        {profile.jobType || "Job type not set"}
                      </span>
                      <span className="blueprint-tag px-3 py-1 text-sm font-medium">
                        {profile.skills.length} skills
                      </span>
                      <span className="blueprint-tag px-3 py-1 text-sm font-medium">
                        {profileCompleteness}% complete
                      </span>
                    </div>
                  </div>
                </div>
                <div className="blueprint-card w-full p-4 md:w-64">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#0a0a0a]">Profile readiness</span>
                    <span className="blueprint-metric font-semibold">{profileCompleteness}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f2f2f2]">
                    <div className="h-full rounded-full bg-black" style={{ width: `${profileCompleteness}%` }} />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#737373]">
                    Complete profiles help recruiters understand your fit faster.
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <FieldCard icon={<MdEmail />} label="Email address" value={profile.email} />
              <FieldCard icon={<MdCake />} label="Date of birth" value={formatDate(profile.dob)} />
              <FieldCard icon={<MdBadge />} label="Age" value={age !== null ? `${age} years old` : "Not updated"} />
            </section>

            <section className="blueprint-card p-5 md:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="blueprint-kicker">Personal details</p>
                  <h2 className="mt-1 text-xl font-semibold text-black">Contact and identity</h2>
                </div>
                {renderSectionAction("personal")}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FieldCard
                  icon={<MdPerson />}
                  label="Full name"
                  value={profile.name}
                  editing={editingSection === "personal"}
                >
                  <input
                    value={draft.name}
                    onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                    className="blueprint-input w-full px-3 py-2"
                    placeholder="Your full name"
                  />
                </FieldCard>
                <FieldCard
                  icon={<MdPhone />}
                  label="Phone number"
                  value={profile.phone}
                  editing={editingSection === "personal"}
                >
                  <input
                    value={draft.phone}
                    onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
                    className="blueprint-input w-full px-3 py-2"
                    placeholder="Phone number"
                  />
                </FieldCard>
                <FieldCard
                  icon={<MdLocationOn />}
                  label="Location"
                  value={profile.location}
                  editing={editingSection === "personal"}
                >
                  <input
                    value={draft.location}
                    onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))}
                    className="blueprint-input w-full px-3 py-2"
                    placeholder="City, country"
                  />
                </FieldCard>
                <FieldCard
                  icon={<MdCake />}
                  label="Date of birth"
                  value={formatDate(profile.dob)}
                  editing={editingSection === "personal"}
                >
                  <input
                    type="date"
                    value={draft.dob}
                    onChange={(event) => setDraft((current) => ({ ...current, dob: event.target.value }))}
                    className="blueprint-input w-full px-3 py-2"
                  />
                </FieldCard>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="blueprint-card p-5 md:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="blueprint-kicker">Experience</p>
                    <h2 className="mt-1 text-xl font-semibold text-black">Professional summary</h2>
                  </div>
                  {renderSectionAction("experience")}
                </div>
                {editingSection === "experience" ? (
                  <textarea
                    rows={8}
                    value={draft.experience}
                    onChange={(event) => setDraft((current) => ({ ...current, experience: event.target.value }))}
                    className="blueprint-input w-full resize-none px-3 py-2"
                    placeholder="Summarize your recent work, strengths, and career focus..."
                  />
                ) : (
                  <div className="rounded-[14px] border border-[#e5e5e5] bg-[#f2f2f2] p-5">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[10px] bg-white text-black">
                      <MdWork size={22} />
                    </div>
                    <p className="whitespace-pre-line text-sm leading-6 text-[#0a0a0a]">
                      {profile.experience || "No experience summary added yet."}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="blueprint-card p-5 md:p-6">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="blueprint-kicker">Skills</p>
                      <h2 className="mt-1 text-xl font-semibold text-black">Core capabilities</h2>
                    </div>
                    {renderSectionAction("skills")}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(editingSection === "skills" ? draft.skills : profile.skills).map((skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        className="inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-[#f2f2f2] px-3 py-1.5 text-sm font-semibold text-[#0a0a0a]"
                      >
                        {skill}
                        {editingSection === "skills" && (
                          <button
                            type="button"
                            onClick={() => removeSkill(index)}
                            className="rounded-full bg-white p-0.5 text-[#737373] hover:text-[#c22b10]"
                            aria-label={`Remove ${skill}`}
                          >
                            <MdClose size={14} />
                          </button>
                        )}
                      </span>
                    ))}
                    {profile.skills.length === 0 && editingSection !== "skills" && (
                      <p className="text-sm text-[#737373]">No skills added yet.</p>
                    )}
                  </div>
                  {editingSection === "skills" && (
                    <div className="mt-4 flex gap-2">
                      <input
                        value={newSkill}
                        onChange={(event) => setNewSkill(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addSkill();
                          }
                        }}
                        className="blueprint-input min-w-0 flex-1 px-3 py-2"
                        placeholder="Add a skill"
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        className="inline-flex items-center gap-2 rounded-[10px] border border-[#e5e5e5] px-4 py-2 text-sm font-semibold hover:bg-[#f2f2f2]"
                      >
                        <MdAdd size={18} />
                        Add
                      </button>
                    </div>
                  )}
                </div>

                <div className="blueprint-card p-5 md:p-6">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="blueprint-kicker">Preference</p>
                      <h2 className="mt-1 text-xl font-semibold text-black">Target role type</h2>
                    </div>
                    {renderSectionAction("preference")}
                  </div>
                  {editingSection === "preference" ? (
                    <input
                      value={draft.jobType}
                      onChange={(event) => setDraft((current) => ({ ...current, jobType: event.target.value }))}
                      className="blueprint-input w-full px-3 py-2"
                      placeholder="Full-time, remote, hybrid..."
                    />
                  ) : (
                    <div className="flex items-center gap-3 rounded-[14px] border border-[#e5e5e5] bg-[#f2f2f2] p-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white text-black">
                        <MdCheck size={20} />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase text-[#737373]">Preferred job type</p>
                        <p className="font-semibold text-[#0a0a0a]">{profile.jobType || "Not updated"}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default CandidateProfile;
