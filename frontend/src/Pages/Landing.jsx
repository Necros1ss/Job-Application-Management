/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBriefcase,
  FaCalendarCheck,
  FaChartLine,
  FaCommentDots,
  FaLayerGroup,
  FaSearch,
  FaShieldAlt,
  FaTasks,
  FaUserCheck,
  FaUserTie,
  FaUsers,
} from "react-icons/fa";
import LanguageSwitcher from "../Components/LanguageSwitcher";
import ThemeToggle from "../Components/ThemeToggle";
import { useI18n } from "../lib/i18n";

const testimonials = [
  {
    name: "Mai Nguyen",
    role: "HR Manager, TechCorp",
    quote: "The board gives our recruiters the same picture of every candidate, from first application to offer.",
  },
  {
    name: "Daniel Tran",
    role: "Founder, StartupXYZ",
    quote: "It feels practical. We can post jobs, review CVs, schedule interviews, and hand off onboarding quickly.",
  },
  {
    name: "Linh Pham",
    role: "Talent Lead",
    quote: "The clean dashboard makes reporting simple enough for class demo and strong enough for portfolio review.",
  },
];

const AnimatedCounter = ({ value, suffix = "", start }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!start) return undefined;

    let frameId;
    const duration = 1300;
    const startedAt = performance.now();

    const tick = (timestamp) => {
      const progress = Math.min((timestamp - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [start, value]);

  return (
    <span>
      {displayValue.toLocaleString("en-US")}
      {suffix}
    </span>
  );
};

const Landing = () => {
  const { t } = useI18n();
  const statsRef = useRef(null);
  const stepsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [stepsVisible, setStepsVisible] = useState(false);

  const landingStats = [
    { labelKey: "landing.recruiters", value: 500, suffix: "+" },
    { labelKey: "landing.applicationsStat", value: 10000, suffix: "+" },
    { labelKey: "landing.satisfaction", value: 98, suffix: "%" },
  ];

  const landingFeatures = [
    { titleKey: "landing.smartJobBoard", descriptionKey: "landing.smartJobBoardDesc", icon: FaSearch },
    { titleKey: "landing.applicationTracking", descriptionKey: "landing.applicationTrackingDesc", icon: FaLayerGroup },
    { titleKey: "landing.interviewScheduler", descriptionKey: "landing.interviewSchedulerDesc", icon: FaCalendarCheck },
    { titleKey: "landing.onboardingManager", descriptionKey: "landing.onboardingManagerDesc", icon: FaTasks },
    { titleKey: "landing.employeePortal", descriptionKey: "landing.employeePortalDesc", icon: FaUserTie },
    { titleKey: "landing.adminDashboard", descriptionKey: "landing.adminDashboardDesc", icon: FaShieldAlt },
  ];

  const landingSteps = [
    { titleKey: "landing.postJob", descriptionKey: "landing.postJobDesc", icon: FaBriefcase },
    { titleKey: "landing.reviewCandidates", descriptionKey: "landing.reviewCandidatesDesc", icon: FaUsers },
    { titleKey: "landing.scheduleInterview", descriptionKey: "landing.scheduleInterviewDesc", icon: FaCommentDots },
    { titleKey: "landing.onboard", descriptionKey: "landing.onboardDesc", icon: FaUserCheck },
  ];

  useEffect(() => {
    const observed = [
      { node: statsRef.current, onVisible: () => setStatsVisible(true), threshold: 0.35 },
      { node: stepsRef.current, onVisible: () => setStepsVisible(true), threshold: 0.2 },
    ].filter((item) => item.node);

    if (observed.length === 0) return undefined;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const match = observed.find((item) => item.node === entry.target);
        match?.onVisible();
        observer.unobserve(entry.target);
      });
    });

    observed.forEach((item) => observer.observe(item.node));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (event, id) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen scroll-smooth bg-white text-[#0a0a0a] dark:bg-[#0a0a0a] dark:text-white">
      <header className="sticky inset-x-0 top-0 z-50 border-b border-[#e5e5e5] bg-white/95 backdrop-blur dark:border-[#2a2a2a] dark:bg-[#0a0a0a]/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-10">
          <Link to="/" className="text-lg font-semibold text-black dark:text-white">
            {t("landing.jobTracker")}
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#737373] dark:text-[#a3a3a3] md:flex">
            <a href="#features" onClick={(event) => scrollToSection(event, "features")} className="hover:text-black dark:hover:text-white">
              {t("landing.features")}
            </a>
            <a href="#workflow" onClick={(event) => scrollToSection(event, "workflow")} className="hover:text-black dark:hover:text-white">
              {t("landing.workflow")}
            </a>
            <a href="#testimonials" onClick={(event) => scrollToSection(event, "testimonials")} className="hover:text-black dark:hover:text-white">
              {t("landing.stories")}
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <Link
              to="/login"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-[#0a0a0a] hover:bg-[#f2f2f2] dark:text-white dark:hover:bg-[#171717] sm:inline-flex"
            >
              {t("auth.login")}
            </Link>
            <Link
              to="/signup"
              className="rounded-[10px] bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a0a0a] dark:bg-white dark:text-black dark:hover:bg-[#f5f5f5]"
            >
              {t("landing.startHiringFree")}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="overflow-hidden border-b border-[#e5e5e5] bg-white dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
          <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 items-center gap-10 px-5 py-14 sm:px-6 sm:py-18 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-[#f2f2f2] px-3 py-1.5 text-xs font-medium text-[#0a0a0a] dark:border-[#2a2a2a] dark:bg-[#171717] dark:text-white">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10c22b] opacity-40" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#10c22b]" />
                </span>
                {t("landing.fullCycleWorkspace")}
              </div>

              <h1 className="max-w-3xl text-[46px] font-bold leading-[0.95] tracking-normal text-black dark:text-white sm:text-[64px] lg:text-[72px]">
                {t("landing.hireSmarter")}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#4a4a4a] dark:text-[#c9c9c9] sm:text-lg">
                {t("landing.hireSmarterDesc")}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/signup?role=recruiter"
                  className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-black px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#0a0a0a] dark:bg-white dark:text-black dark:hover:bg-[#f5f5f5]"
                >
                  Start {t("landing.startHiringFree")} <FaArrowRight size={14} />
                </Link>
                <Link
                  to="/signup?role=candidate"
                  className="inline-flex items-center justify-center rounded-[10px] border border-[#e5e5e5] bg-white px-7 py-3 text-sm font-semibold text-[#0a0a0a] transition hover:bg-[#f2f2f2] dark:border-[#2a2a2a] dark:bg-[#121212] dark:text-white dark:hover:bg-[#171717]"
                >
                  {t("landing.findJobs")}
                </Link>
              </div>

              <div ref={statsRef} className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
                {landingStats.map((item) => (
                  <div key={item.labelKey} className="rounded-[12px] border border-[#e5e5e5] bg-white p-4 dark:border-[#2a2a2a] dark:bg-[#121212]">
                    <p className="blueprint-metric text-2xl font-semibold text-black dark:text-white sm:text-3xl">
                      <AnimatedCounter value={item.value} suffix={item.suffix} start={statsVisible} />
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#737373] dark:text-[#a3a3a3]">{t(item.labelKey)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="landing-mockup-glow absolute inset-x-8 -top-6 h-32 rounded-full bg-[#10c22b]/10 blur-3xl" />
              <div className="relative rounded-[24px] border border-[#d8d8d8] bg-[#f7f7f7] p-3 shadow-[0_24px_80px_rgba(10,10,10,0.14)] dark:border-[#2a2a2a] dark:bg-[#101010] dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                <div className="rounded-[18px] border border-[#e5e5e5] bg-white p-4 dark:border-[#2a2a2a] dark:bg-[#121212]">
                  <div className="mb-5 flex items-center justify-between border-b border-[#e5e5e5] pb-4 dark:border-[#2a2a2a]">
                    <div>
                      <p className="text-xs font-medium uppercase text-[#737373] dark:text-[#a3a3a3]">{t("landing.recruitmentCommand")}</p>
                      <p className="mt-1 text-lg font-semibold text-black dark:text-white">Frontend Engineer</p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-black px-3 py-1 text-xs font-medium text-white dark:bg-white dark:text-black">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#10c22b]" />
                      {t("interviews.online")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      [t("landing.cvScreening"), 42],
                      [t("landing.underReview"), 21],
                      [t("landing.interview"), 8],
                      [t("landing.offer"), 3],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[12px] border border-[#e5e5e5] bg-[#f2f2f2] p-3 dark:border-[#2a2a2a] dark:bg-[#171717]">
                        <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">{label}</p>
                        <p className="blueprint-metric mt-2 text-2xl font-semibold text-black dark:text-white">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    {[t("landing.cvScreening"), t("landing.underReview"), t("landing.interview")].map((stage, stageIndex) => (
                      <div key={stage} className="rounded-[12px] border border-[#e5e5e5] bg-[#f8f8f8] p-3 dark:border-[#2a2a2a] dark:bg-[#171717]">
                        <p className="text-xs font-semibold uppercase text-[#737373] dark:text-[#a3a3a3]">{stage}</p>
                        <div className="mt-3 space-y-2">
                          {[0, 1, 2].slice(0, stageIndex + 1).map((item) => (
                            <div key={item} className="rounded-[10px] border border-[#e5e5e5] bg-white p-3 dark:border-[#2a2a2a] dark:bg-[#121212]">
                              <div className="flex items-center gap-2">
                                <span className="h-7 w-7 rounded-full bg-black dark:bg-white" />
                                <div className="flex-1">
                                  <div className="h-2 w-24 rounded-full bg-black dark:bg-white" />
                                  <div className="mt-2 h-2 w-16 rounded-full bg-[#d8d8d8] dark:bg-[#2a2a2a]" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-[12px] border border-[#e5e5e5] bg-white p-4 dark:border-[#2a2a2a] dark:bg-[#121212]">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase text-[#737373] dark:text-[#a3a3a3]">{t("landing.aiScreening")}</p>
                        <FaChartLine className="text-black dark:text-white" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 rounded-full bg-black dark:bg-white" style={{ width: "86%" }} />
                        <div className="h-2 rounded-full bg-[#d8d8d8] dark:bg-[#2a2a2a]" style={{ width: "62%" }} />
                        <div className="h-2 rounded-full bg-[#d8d8d8] dark:bg-[#2a2a2a]" style={{ width: "44%" }} />
                      </div>
                    </div>
                    <div className="rounded-[12px] border border-[#e5e5e5] bg-[#f2f2f2] p-4 dark:border-[#2a2a2a] dark:bg-[#171717]">
                      <p className="text-xs font-semibold uppercase text-[#737373] dark:text-[#a3a3a3]">{t("menu.onboarding")}</p>
                      <p className="blueprint-metric mt-3 text-3xl font-semibold text-black dark:text-white">78%</p>
                      <p className="mt-1 text-xs text-[#737373] dark:text-[#a3a3a3]">{t("landing.tasksReady")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-10">
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase text-[#737373] dark:text-[#a3a3a3]">{t("landing.features")}</p>
            <h2 className="mt-2 text-[34px] font-bold leading-tight text-black dark:text-white sm:text-[42px]">
              {t("landing.stories")}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {landingFeatures.map(({ titleKey, descriptionKey, icon: Icon }) => (
              <article
                key={titleKey}
                className="group rounded-[16px] border border-[#e5e5e5] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(10,10,10,0.12)] dark:border-[#2a2a2a] dark:bg-[#121212] dark:hover:shadow-[0_18px_48px_rgba(0,0,0,0.45)]"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-[12px] bg-black text-white transition group-hover:scale-105 dark:bg-white dark:text-black">
                  <Icon size={21} />
                </div>
                <h3 className="text-lg font-bold text-black dark:text-white">{t(titleKey)}</h3>
                <p className="mt-3 text-sm leading-6 text-[#737373] dark:text-[#a3a3a3]">{t(descriptionKey)}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="workflow" className="border-y border-[#e5e5e5] bg-[#f7f7f7] py-20 dark:border-[#2a2a2a] dark:bg-[#101010]">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
            <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-semibold uppercase text-[#737373] dark:text-[#a3a3a3]">{t("landing.howItWorks")}</p>
                <h2 className="mt-2 text-[34px] font-bold leading-tight text-black dark:text-white sm:text-[42px]">
                  {t("landing.fromJobPost")}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-[#737373] dark:text-[#a3a3a3]">
                {t("landing.howItWorksDesc")}
              </p>
            </div>

            <div ref={stepsRef} className="relative grid grid-cols-1 gap-5 lg:grid-cols-4">
              <div className="absolute left-0 right-0 top-9 hidden h-px bg-[#d8d8d8] dark:bg-[#2a2a2a] lg:block" />
              {landingSteps.map(({ titleKey, descriptionKey, icon: Icon }, index) => (
                <article
                  key={titleKey}
                  className={`landing-step-reveal relative rounded-[16px] border border-[#e5e5e5] bg-white p-5 dark:border-[#2a2a2a] dark:bg-[#121212] ${
                    stepsVisible ? "is-visible" : ""
                  }`}
                  style={{ transitionDelay: `${index * 120}ms` }}
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black">
                    <Icon size={19} />
                  </div>
                  <p className="text-xs font-semibold uppercase text-[#737373] dark:text-[#a3a3a3]">{t("common.page")} {index + 1}</p>
                  <h3 className="mt-2 text-lg font-bold text-black dark:text-white">{t(titleKey)}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#737373] dark:text-[#a3a3a3]">{t(descriptionKey)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="bg-[linear-gradient(180deg,#ffffff_0%,#f7f7f7_100%)] px-5 py-20 dark:bg-[linear-gradient(180deg,#0a0a0a_0%,#101010_100%)] sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase text-[#737373] dark:text-[#a3a3a3]">{t("landing.testimonials")}</p>
            <h2 className="mt-2 text-[34px] font-bold leading-tight text-black dark:text-white sm:text-[42px]">
              {t("landing.builtForDemos")}
            </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {testimonials.map((item) => (
                <article key={item.name} className="rounded-[16px] border border-[#e5e5e5] bg-white p-5 shadow-sm dark:border-[#2a2a2a] dark:bg-[#121212]">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-sm font-bold text-white dark:bg-white dark:text-black">
                      {item.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-bold text-black dark:text-white">{item.name}</p>
                      <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">{item.role}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-7 text-[#4a4a4a] dark:text-[#c9c9c9]">&ldquo;{item.quote}&rdquo;</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[24px] bg-black p-8 text-white dark:bg-white dark:text-black sm:p-10 lg:p-14">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase text-white/60 dark:text-black/60">{t("landing.startToday")}</p>
                <h2 className="mt-3 max-w-2xl text-[34px] font-bold leading-tight sm:text-[46px]">
                  {t("landing.readyToTransform")}
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 dark:text-black/70">
                  {t("landing.readyToTransformDesc")}
                </p>
              </div>
              <Link
                to="/signup?role=recruiter"
                className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-white px-7 py-3 text-sm font-bold text-black transition hover:bg-[#f2f2f2] dark:bg-black dark:text-white dark:hover:bg-[#171717]"
              >
                {t("landing.startHiringFree")} <FaArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e5e5e5] bg-white px-5 py-8 text-[#0a0a0a] dark:border-[#2a2a2a] dark:bg-[#0a0a0a] dark:text-white sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row md:items-center">
          <p className="font-semibold">{t("landing.jobTracker")}</p>
          <div className="flex items-center gap-4 text-sm text-[#737373] dark:text-[#a3a3a3]">
            <a href="#features" onClick={(event) => scrollToSection(event, "features")} className="hover:text-black dark:hover:text-white">
              {t("landing.features")}
            </a>
            <Link to="/login" className="hover:text-black dark:hover:text-white">
              {t("auth.login")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
