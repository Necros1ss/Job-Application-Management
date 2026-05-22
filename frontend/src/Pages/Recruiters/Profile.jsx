import { useEffect, useMemo, useState } from "react";
import {
  MdBusiness,
  MdCategory,
  MdDescription,
  MdEmail,
  MdErrorOutline,
  MdLanguage,
  MdLocationOn,
  MdOutlineEdit,
  MdPeople,
  MdPhone,
  MdVpnKey,
} from "react-icons/md";
import ProfileTopBar from "../../Components/ProfileTopBar";
import { usersApi } from "../../lib/api";
import { showError, showSuccess } from "../../utils/toast";

const emptyProfile = {
  companyName: "",
  email: "",
  phone: "",
  website: "",
  linkedIn: "",
  industry: "",
  companySize: "",
  taxCode: "",
  address: "",
  description: "",
};

const FieldCard = ({ icon, label, value, children, editing = false, className = "" }) => (
  <div className={`rounded-[14px] border border-[#e5e5e5] bg-white p-4 shadow-[0_0_0_1px_rgba(10,10,10,0.04)] ${className}`}>
    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-[#737373]">
      <span className="text-[#0a0a0a]">{icon}</span>
      {label}
    </div>
    {editing ? children : <p className="min-h-[24px] break-words font-semibold text-[#0a0a0a]">{value || "Not updated"}</p>}
  </div>
);

const ProfileSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="blueprint-hero-panel p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="h-24 w-24 rounded-[14px] bg-[#e5e5e5]" />
        <div className="flex-1 space-y-3">
          <div className="h-8 w-72 rounded-full bg-[#e5e5e5]" />
          <div className="h-4 w-96 max-w-full rounded-full bg-[#f2f2f2]" />
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
    <div className="blueprint-card h-80 p-6" />
  </div>
);

const RecruiterProfile = () => {
  const [profile, setProfile] = useState(emptyProfile);
  const [draft, setDraft] = useState(emptyProfile);
  const [editingSection, setEditingSection] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const profileCompleteness = useMemo(() => {
    const checks = [
      profile.companyName,
      profile.email,
      profile.phone,
      profile.website,
      profile.linkedIn,
      profile.industry,
      profile.companySize,
      profile.taxCode,
      profile.address,
      profile.description,
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [profile]);

  const hydrateProfile = (payload) => {
    const nextProfile = {
      companyName: payload.company_name || payload.name || "",
      email: payload.email || "",
      phone: payload.phone || "",
      website: payload.website || "",
      linkedIn: payload.linkedin || "",
      industry: payload.industry || "",
      companySize: payload.company_size || "",
      taxCode: payload.tax_code || "",
      address: payload.address || payload.location || "",
      description: payload.description || "",
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
        name: draft.companyName,
        company_name: draft.companyName,
        phone: draft.phone,
        website: draft.website,
        linkedin: draft.linkedIn,
        industry: draft.industry,
        company_size: draft.companySize,
        tax_code: draft.taxCode,
        address: draft.address,
        location: draft.address,
        description: draft.description,
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
    setEditingSection(section);
  };

  const cancelEditing = () => {
    setDraft(profile);
    setEditingSection(null);
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
      <ProfileTopBar userName={profile.companyName} userEmail={profile.email} />

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
                    {(profile.companyName || profile.email || "R").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="blueprint-kicker">Recruiter profile</p>
                    <h1 className="mt-1 text-3xl font-semibold text-black md:text-4xl">
                      {profile.companyName || "Company name"}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#737373]">
                      Maintain the company details candidates see across jobs, interviews, and offers.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="blueprint-tag px-3 py-1 text-sm font-medium">
                        {profile.industry || "Industry not set"}
                      </span>
                      <span className="blueprint-tag px-3 py-1 text-sm font-medium">
                        {profile.companySize || "Company size not set"}
                      </span>
                      <span className="blueprint-tag px-3 py-1 text-sm font-medium">
                        {profileCompleteness}% complete
                      </span>
                    </div>
                  </div>
                </div>
                <div className="blueprint-card w-full p-4 md:w-64">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#0a0a0a]">Company readiness</span>
                    <span className="blueprint-metric font-semibold">{profileCompleteness}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f2f2f2]">
                    <div className="h-full rounded-full bg-black" style={{ width: `${profileCompleteness}%` }} />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#737373]">
                    Complete recruiter profiles make job posts feel more trustworthy.
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <FieldCard icon={<MdEmail />} label="Account email" value={profile.email} />
              <FieldCard icon={<MdCategory />} label="Industry" value={profile.industry} />
              <FieldCard icon={<MdPeople />} label="Company size" value={profile.companySize} />
            </section>

            <section className="blueprint-card p-5 md:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="blueprint-kicker">Organization</p>
                  <h2 className="mt-1 text-xl font-semibold text-black">Company identity</h2>
                </div>
                {renderSectionAction("organization")}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FieldCard
                  icon={<MdBusiness />}
                  label="Company legal name"
                  value={profile.companyName}
                  editing={editingSection === "organization"}
                  className="md:col-span-2"
                >
                  <input
                    value={draft.companyName}
                    onChange={(event) => setDraft((current) => ({ ...current, companyName: event.target.value }))}
                    className="blueprint-input w-full px-3 py-2"
                    placeholder="Full legal company name"
                  />
                </FieldCard>
                <FieldCard
                  icon={<MdCategory />}
                  label="Industry"
                  value={profile.industry}
                  editing={editingSection === "organization"}
                >
                  <input
                    value={draft.industry}
                    onChange={(event) => setDraft((current) => ({ ...current, industry: event.target.value }))}
                    className="blueprint-input w-full px-3 py-2"
                    placeholder="Technology, finance, e-commerce..."
                  />
                </FieldCard>
                <FieldCard
                  icon={<MdPeople />}
                  label="Company size"
                  value={profile.companySize}
                  editing={editingSection === "organization"}
                >
                  <select
                    value={draft.companySize}
                    onChange={(event) => setDraft((current) => ({ ...current, companySize: event.target.value }))}
                    className="blueprint-input w-full px-3 py-2"
                  >
                    <option value="">Select size</option>
                    <option value="1-50">1 - 50 employees</option>
                    <option value="51-200">51 - 200 employees</option>
                    <option value="201-500">201 - 500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </FieldCard>
                <FieldCard
                  icon={<MdVpnKey />}
                  label="Tax code"
                  value={profile.taxCode}
                  editing={editingSection === "organization"}
                >
                  <input
                    value={draft.taxCode}
                    onChange={(event) => setDraft((current) => ({ ...current, taxCode: event.target.value }))}
                    className="blueprint-input w-full px-3 py-2"
                    placeholder="Tax code"
                  />
                </FieldCard>
                <FieldCard
                  icon={<MdLocationOn />}
                  label="Address"
                  value={profile.address}
                  editing={editingSection === "organization"}
                >
                  <input
                    value={draft.address}
                    onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))}
                    className="blueprint-input w-full px-3 py-2"
                    placeholder="Office address"
                  />
                </FieldCard>
                <FieldCard
                  icon={<MdDescription />}
                  label="Company description"
                  value={profile.description || "No description provided."}
                  editing={editingSection === "organization"}
                  className="md:col-span-2"
                >
                  <textarea
                    rows={5}
                    value={draft.description}
                    onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                    className="blueprint-input w-full resize-none px-3 py-2"
                    placeholder="Describe your company culture, work environment, and mission..."
                  />
                </FieldCard>
              </div>
            </section>

            <section className="blueprint-card p-5 md:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="blueprint-kicker">Contact</p>
                  <h2 className="mt-1 text-xl font-semibold text-black">Public communication channels</h2>
                </div>
                {renderSectionAction("contact")}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FieldCard icon={<MdEmail />} label="Account email" value={profile.email} />
                <FieldCard
                  icon={<MdPhone />}
                  label="Phone number"
                  value={profile.phone}
                  editing={editingSection === "contact"}
                >
                  <input
                    value={draft.phone}
                    onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
                    className="blueprint-input w-full px-3 py-2"
                    placeholder="Phone number"
                  />
                </FieldCard>
                <FieldCard
                  icon={<MdLanguage />}
                  label="Website"
                  value={profile.website}
                  editing={editingSection === "contact"}
                >
                  <input
                    value={draft.website}
                    onChange={(event) => setDraft((current) => ({ ...current, website: event.target.value }))}
                    className="blueprint-input w-full px-3 py-2"
                    placeholder="https://company.com"
                  />
                </FieldCard>
                <FieldCard
                  icon={<MdBusiness />}
                  label="LinkedIn"
                  value={profile.linkedIn}
                  editing={editingSection === "contact"}
                >
                  <input
                    value={draft.linkedIn}
                    onChange={(event) => setDraft((current) => ({ ...current, linkedIn: event.target.value }))}
                    className="blueprint-input w-full px-3 py-2"
                    placeholder="https://linkedin.com/company/..."
                  />
                </FieldCard>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default RecruiterProfile;
