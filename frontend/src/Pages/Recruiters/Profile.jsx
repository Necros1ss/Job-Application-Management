/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MdBusiness,
  MdCameraAlt,
  MdCategory,
  MdCheck,
  MdDescription,
  MdEmail,
  MdErrorOutline,
  MdInfoOutline,
  MdLanguage,
  MdLocationOn,
  MdOutlineEdit,
  MdPeople,
  MdPhone,
  MdVpnKey,
} from "react-icons/md";
import { usersApi } from "../../lib/api/index";
import { showError, showSuccess } from "../../utils/toast";

const emptyProfile = {
  id: "",
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
  logoFileName: "",
};

const getDraftKey = (profile) => (profile.id ? `recruiter-profile-draft:${profile.id}` : "");

const isValidLinkedInUrl = (value) => {
  if (!value.trim()) return true;

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && /(^|\.)linkedin\.com$/i.test(url.hostname);
  } catch {
    return false;
  }
};

const renderMarkdownPreview = (value) => {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return <p className="text-sm text-[#737373] dark:text-neutral-400">No description preview yet.</p>;
  }

  return (
    <div className="space-y-2 text-sm leading-6 text-[#0a0a0a] dark:text-neutral-100">
      {lines.map((line, index) => {
        if (line.startsWith("- ")) {
          return (
            <div key={`${line}-${index}`} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-black dark:bg-white" />
              <span>{line.slice(2)}</span>
            </div>
          );
        }

        return <p key={`${line}-${index}`}>{line.replace(/\*\*/g, "")}</p>;
      })}
    </div>
  );
};

const FieldCard = ({ icon, label, value, children, editing = false, className = "" }) => (
  <div
    className={`rounded-[14px] border border-[#e5e5e5] bg-white p-4 shadow-[0_0_0_1px_rgba(10,10,10,0.04)] dark:border-neutral-800 dark:bg-neutral-950 ${className}`}
  >
    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-[#737373] dark:text-neutral-400">
      <span className="text-[#0a0a0a] dark:text-white">{icon}</span>
      {label}
    </div>
    {editing ? (
      children
    ) : (
      <p className="min-h-[24px] break-words font-semibold text-[#0a0a0a] dark:text-white">{value || "Not updated"}</p>
    )}
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

const CompletionChecklist = ({ items, nextSuggestion }) => (
  <div className="mt-4 space-y-2">
    {items.map((item) => (
      <div key={item.label} className="flex items-center gap-2 text-xs text-[#525252] dark:text-neutral-300">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full ${
            item.complete ? "bg-black text-white dark:bg-white dark:text-black" : "bg-[#f2f2f2] text-[#a3a3a3] dark:bg-neutral-800"
          }`}
        >
          {item.complete ? <MdCheck size={14} /> : "?"}
        </span>
        <span className={item.complete ? "font-semibold text-[#0a0a0a] dark:text-white" : ""}>{item.label}</span>
      </div>
    ))}
    {nextSuggestion && (
      <div className="mt-3 flex items-start gap-2 rounded-[12px] bg-[#f7f7f7] p-3 text-xs leading-5 text-[#525252] dark:bg-neutral-900 dark:text-neutral-300">
        <MdInfoOutline className="mt-0.5 shrink-0 text-base" />
        <span>{nextSuggestion}</span>
      </div>
    )}
  </div>
);

const RecruiterProfile = () => {
  const [profile, setProfile] = useState(emptyProfile);
  const [draft, setDraft] = useState(emptyProfile);
  const [editingSection, setEditingSection] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const fileInputRef = useRef(null);

  const completionItems = useMemo(
    () => [
      { label: "Company name", complete: Boolean(profile.companyName) },
      { label: "Email", complete: Boolean(profile.email) },
      { label: "Phone", complete: Boolean(profile.phone) },
      { label: "Website", complete: Boolean(profile.website) },
      { label: "LinkedIn", complete: Boolean(profile.linkedIn) },
      { label: "Industry", complete: Boolean(profile.industry) },
      { label: "Company size", complete: Boolean(profile.companySize) },
      { label: "Address", complete: Boolean(profile.address) },
      { label: "Description", complete: Boolean(profile.description) },
      { label: "Logo", complete: Boolean(profile.logoFileName) },
    ],
    [profile]
  );

  const profileCompleteness = useMemo(() => {
    const completed = completionItems.filter((item) => item.complete).length;
    return Math.round((completed / completionItems.length) * 100);
  }, [completionItems]);

  const nextSuggestion = completionItems.find((item) => !item.complete)
    ? `Add ${completionItems.find((item) => !item.complete).label.toLowerCase()} to build candidate trust.`
    : "Your company profile is polished and ready for candidates.";

  const linkedInError =
    editingSection === "contact" && !isValidLinkedInUrl(draft.linkedIn) ? "Use a valid linkedin.com URL." : "";

  const hasUnsavedChanges = useMemo(
    () => editingSection && JSON.stringify(draft) !== JSON.stringify(profile),
    [draft, editingSection, profile]
  );

  const hydrateProfile = (payload) => {
    const nextProfile = {
      id: payload.id || "",
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
      logoFileName: payload.logoFileName || payload.logo_file_name || "",
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

  useEffect(() => {
    if (!profile.logoFileName) {
      setLogoUrl("");
      return undefined;
    }

    let active = true;
    let objectUrl = "";

    usersApi
      .getAvatarFile()
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setLogoUrl(objectUrl);
      })
      .catch(() => {
        if (active) setLogoUrl("");
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [profile.logoFileName]);

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const draftKey = getDraftKey(profile);
    if (!draftKey || !editingSection || !hasUnsavedChanges) return;
    window.localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [draft, editingSection, hasUnsavedChanges, profile]);

  const saveProfile = async () => {
    if (!isValidLinkedInUrl(draft.linkedIn)) {
      showError("Please enter a valid LinkedIn URL.");
      return;
    }

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
      window.localStorage.removeItem(getDraftKey(profile));
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
    const draftKey = getDraftKey(profile);
    const savedDraft = draftKey ? window.localStorage.getItem(draftKey) : null;

    if (savedDraft) {
      try {
        setDraft({ ...profile, ...JSON.parse(savedDraft) });
      } catch {
        setDraft(profile);
      }
    } else {
      setDraft(profile);
    }

    setEditingSection(section);
  };

  const cancelEditing = () => {
    if (hasUnsavedChanges && !window.confirm("Discard unsaved profile changes?")) {
      return;
    }

    setDraft(profile);
    setEditingSection(null);
  };

  const handleLogoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please choose an image file.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setLogoUrl(previewUrl);

    try {
      setIsUploadingLogo(true);
      const updated = await usersApi.uploadAvatar(file);
      hydrateProfile(updated);
      showSuccess("Company logo updated successfully");
    } catch (error) {
      showError(error.message || "Failed to upload logo");
    } finally {
      URL.revokeObjectURL(previewUrl);
      setIsUploadingLogo(false);
    }
  };

  const renderSectionAction = (section) =>
    editingSection === section ? (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={cancelEditing}
          className="rounded-[10px] border border-[#e5e5e5] px-4 py-2 text-sm font-semibold text-[#0a0a0a] hover:bg-[#f2f2f2] dark:border-neutral-800 dark:text-white dark:hover:bg-neutral-900"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={saveProfile}
          disabled={isSaving || Boolean(linkedInError)}
          className="blueprint-primary px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => startEditing(section)}
        className="inline-flex items-center gap-2 rounded-[10px] border border-[#e5e5e5] px-4 py-2 text-sm font-semibold text-[#0a0a0a] hover:bg-[#f2f2f2] dark:border-neutral-800 dark:text-white dark:hover:bg-neutral-900"
      >
        <MdOutlineEdit size={18} />
        Edit
      </button>
    );

  return (
    <div className="min-h-screen bg-white px-4 pb-8 dark:bg-[#050505] sm:px-6 lg:px-8">
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
              <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-5 md:flex-row md:items-center">
                  <div className="relative h-24 w-24 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[14px] border border-[#e5e5e5] bg-black text-4xl font-semibold text-white shadow-sm"
                      aria-label="Upload company logo"
                    >
                      {logoUrl ? (
                        <img src={logoUrl} alt={profile.companyName || "Company logo"} className="h-full w-full object-cover" />
                      ) : (
                        (profile.companyName || profile.email || "R").charAt(0).toUpperCase()
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-black shadow-sm hover:bg-[#f2f2f2] disabled:opacity-60"
                      aria-label="Change company logo"
                    >
                      <MdCameraAlt size={18} />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </div>
                  <div>
                    <p className="blueprint-kicker">Recruiter profile</p>
                    <h1 className="mt-1 text-3xl font-semibold text-black dark:text-white md:text-4xl">
                      {profile.companyName || "Company name"}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#737373] dark:text-neutral-300">
                      Maintain the company details candidates see across jobs, interviews, and offers.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="blueprint-tag px-3 py-1 text-sm font-medium">
                        {profile.industry || "Industry not set"}
                      </span>
                      <span className="blueprint-tag px-3 py-1 text-sm font-medium">
                        {profile.companySize || "Company size not set"}
                      </span>
                      <span className="blueprint-tag px-3 py-1 text-sm font-medium">{profileCompleteness}% complete</span>
                      {isUploadingLogo && <span className="blueprint-tag px-3 py-1 text-sm font-medium">Uploading logo...</span>}
                    </div>
                  </div>
                </div>
                <div className="blueprint-card w-full p-4 md:w-72">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#0a0a0a] dark:text-white">Company readiness</span>
                    <span className="blueprint-metric font-semibold">{profileCompleteness}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f2f2f2] dark:bg-neutral-800">
                    <div className="h-full rounded-full bg-black dark:bg-white" style={{ width: `${profileCompleteness}%` }} />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-[#0a0a0a] dark:text-white">
                    Your company profile is {profileCompleteness}% complete.
                  </p>
                  <CompletionChecklist items={completionItems} nextSuggestion={nextSuggestion} />
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
                  <h2 className="mt-1 text-xl font-semibold text-black dark:text-white">Company identity</h2>
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
                <FieldCard icon={<MdCategory />} label="Industry" value={profile.industry} editing={editingSection === "organization"}>
                  <input
                    value={draft.industry}
                    onChange={(event) => setDraft((current) => ({ ...current, industry: event.target.value }))}
                    className="blueprint-input w-full px-3 py-2"
                    placeholder="Technology, finance, e-commerce..."
                  />
                </FieldCard>
                <FieldCard icon={<MdPeople />} label="Company size" value={profile.companySize} editing={editingSection === "organization"}>
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
                <FieldCard icon={<MdVpnKey />} label="Tax code" value={profile.taxCode} editing={editingSection === "organization"}>
                  <input
                    value={draft.taxCode}
                    onChange={(event) => setDraft((current) => ({ ...current, taxCode: event.target.value }))}
                    className="blueprint-input w-full px-3 py-2"
                    placeholder="Tax code"
                  />
                </FieldCard>
                <FieldCard icon={<MdLocationOn />} label="Address" value={profile.address} editing={editingSection === "organization"}>
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
                  <div className="grid gap-4 lg:grid-cols-2">
                    <textarea
                      rows={7}
                      value={draft.description}
                      onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                      className="blueprint-input w-full resize-none px-3 py-2"
                      placeholder="Describe your company culture, work environment, and mission. Use - for bullet points."
                    />
                    <div className="rounded-[12px] border border-[#e5e5e5] bg-[#f7f7f7] p-4 dark:border-neutral-800 dark:bg-neutral-900">
                      <p className="mb-3 text-xs font-semibold uppercase text-[#737373] dark:text-neutral-400">Preview</p>
                      {renderMarkdownPreview(draft.description)}
                    </div>
                  </div>
                </FieldCard>
              </div>
            </section>

            <section className="blueprint-card p-5 md:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="blueprint-kicker">Contact</p>
                  <h2 className="mt-1 text-xl font-semibold text-black dark:text-white">Public communication channels</h2>
                </div>
                {renderSectionAction("contact")}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FieldCard icon={<MdEmail />} label="Account email" value={profile.email} />
                <FieldCard icon={<MdPhone />} label="Phone number" value={profile.phone} editing={editingSection === "contact"}>
                  <input
                    value={draft.phone}
                    onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
                    className="blueprint-input w-full px-3 py-2"
                    placeholder="Phone number"
                  />
                </FieldCard>
                <FieldCard icon={<MdLanguage />} label="Website" value={profile.website} editing={editingSection === "contact"}>
                  <input
                    value={draft.website}
                    onChange={(event) => setDraft((current) => ({ ...current, website: event.target.value }))}
                    className="blueprint-input w-full px-3 py-2"
                    placeholder="https://company.com"
                  />
                </FieldCard>
                <FieldCard icon={<MdBusiness />} label="LinkedIn" value={profile.linkedIn} editing={editingSection === "contact"}>
                  <input
                    value={draft.linkedIn}
                    onChange={(event) => setDraft((current) => ({ ...current, linkedIn: event.target.value }))}
                    className={`blueprint-input w-full px-3 py-2 ${linkedInError ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""}`}
                    placeholder="https://linkedin.com/company/..."
                  />
                  {linkedInError && <p className="mt-2 text-xs font-semibold text-red-600">{linkedInError}</p>}
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
