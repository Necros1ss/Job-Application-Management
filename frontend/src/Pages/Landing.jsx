import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaCalendarCheck,
  FaCheckCircle,
  FaClipboardList,
  FaGithub,
  FaLayerGroup,
  FaUserTie,
  FaUsers,
} from "react-icons/fa";

const modules = [
  {
    title: "Recruitment Pipeline",
    description: "Track candidates from applied to offer with list and pipeline views.",
    icon: FaLayerGroup,
  },
  {
    title: "Onboarding",
    description: "Turn accepted offers into clear pre-start checklists.",
    icon: FaClipboardList,
  },
  {
    title: "Employees",
    description: "Convert hired candidates into active employee records.",
    icon: FaUserTie,
  },
  {
    title: "Attendance",
    description: "Record daily attendance with present, remote, late, and absent states.",
    icon: FaCalendarCheck,
  },
];

const metrics = [
  ["Candidates", "248"],
  ["Interviews", "36"],
  ["Offers", "12"],
  ["Open Tasks", "18"],
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-white text-[#0a0a0a]">
      <header className="sticky inset-x-0 top-0 z-50 border-b border-[#e5e5e5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link to="/" className="text-lg font-semibold text-black">
            Job Tracker
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-[#737373] md:flex">
            <a href="#modules" className="hover:text-black">Modules</a>
            <a href="#workflow" className="hover:text-black">Workflow</a>
            <a href="#why" className="hover:text-black">Why Us</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="rounded-full px-3 py-2 text-sm font-medium text-[#0a0a0a] hover:bg-[#f2f2f2]">
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-[10px] bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a0a0a]"
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-[#e5e5e5]">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center px-6 py-20 text-center lg:px-10">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-[#f2f2f2] px-3 py-1.5 text-xs font-medium text-[#0a0a0a]">
              <FaCheckCircle className="text-black" />
              Open, self-hosted hiring and HR workflow
            </div>
            <h1 className="text-[44px] font-semibold leading-none text-black sm:text-[48px]">
              Job Tracker HRMS
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[18px] leading-[1.33] text-[#0a0a0a]">
              A practical hiring workspace inspired by open-source HR systems: recruitment, interviews,
              onboarding, employee records, attendance, and leave in one calm dashboard.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-black px-12 py-2 text-sm font-semibold text-white hover:bg-[#0a0a0a]"
              >
                Create workspace <FaArrowRight />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium text-[#0a0a0a] hover:bg-[#f2f2f2]"
              >
                Log in
              </Link>
            </div>
          </div>

          <div className="mt-20 grid w-full grid-cols-2 gap-3 rounded-[14px] border border-[#e5e5e5] bg-white p-4 shadow-[0_0_0_1px_rgba(10,10,10,0.1)] md:grid-cols-4">
            {metrics.map(([label, value]) => (
              <div key={label} className="rounded-[10px] bg-[#f2f2f2] p-4 text-left">
                <p className="text-xs font-medium uppercase text-[#737373]">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-black">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="modules" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-medium uppercase text-[#737373]">All-in-one modules</p>
            <h2 className="mt-2 text-[32px] font-semibold leading-tight text-black">
              Hiring first, HR ready.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[#737373]">
            Keep the operational density of an HRMS while staying focused on the workflows this app already supports.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {modules.map(({ title, description, icon: Icon }) => (
            <div key={title} className="rounded-[14px] border border-[#e5e5e5] bg-white p-4 shadow-[0_0_0_1px_rgba(10,10,10,0.1)]">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#e5e5e5] bg-[#f2f2f2] text-black">
                <Icon size={20} />
              </div>
              <h3 className="text-base font-medium text-[#0a0a0a]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#737373]">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="workflow" className="border-y border-[#e5e5e5] bg-[#f2f2f2] py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-10">
          <div>
            <p className="text-xs font-medium uppercase text-[#737373]">Workspace preview</p>
            <h2 className="mt-2 text-[32px] font-semibold leading-tight text-black">
              Move from candidate to employee without losing context.
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#737373]">
              The workflow keeps notes, timeline, onboarding tasks, employee status, leave, and attendance
              close to the recruiting process.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {["Pipeline", "Timeline", "Onboarding", "Attendance", "Leave"].map((item) => (
                <span key={item} className="rounded-full border border-[#e5e5e5] bg-white px-3 py-1.5 text-sm font-medium text-[#0a0a0a]">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[14px] border border-[#e5e5e5] bg-white p-4 shadow-[0_0_0_1px_rgba(10,10,10,0.1)]">
            <div className="rounded-[10px] border border-[#e5e5e5] bg-white p-4 text-[#0a0a0a]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase text-[#737373]">Recruitment Board</p>
                  <p className="mt-1 text-lg font-medium">Frontend Engineer</p>
                </div>
                <div className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">Live</div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {["Applied", "Interview", "Offer"].map((stage, index) => (
                  <div key={stage} className="rounded-[10px] border border-[#e5e5e5] bg-[#f2f2f2] p-4">
                    <p className="text-xs font-medium uppercase text-[#737373]">{stage}</p>
                    <div className="mt-4 space-y-3">
                      {[1, 2, 3].slice(0, index + 1).map((item) => (
                        <div key={item} className="rounded-[10px] border border-[#e5e5e5] bg-white p-3">
                          <div className="h-2 w-20 rounded-full bg-[#0a0a0a]" />
                          <div className="mt-2 h-2 w-28 rounded-full bg-[#e5e5e5]" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            ["Free to run", "Designed for local development and self-hosted deployment."],
            ["Open workflow", "No black box: every stage is visible in the database and UI."],
            ["Built for teams", "Recruiters and candidates each get purpose-built views."],
          ].map(([title, description]) => (
            <div key={title} className="rounded-[14px] border border-[#e5e5e5] bg-white p-4 shadow-[0_0_0_1px_rgba(10,10,10,0.1)]">
              <FaUsers className="mb-5 text-black" size={22} />
              <h3 className="font-medium text-[#0a0a0a]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#737373]">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#e5e5e5] bg-white px-6 py-8 text-[#0a0a0a] lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row md:items-center">
          <p className="font-semibold">Job Tracker</p>
          <div className="flex items-center gap-4 text-sm text-[#737373]">
            <a href="https://github.com/Necros1ss/Job-Application-Management" className="inline-flex items-center gap-2 hover:text-black">
              <FaGithub /> GitHub
            </a>
            <Link to="/login" className="hover:text-black">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
