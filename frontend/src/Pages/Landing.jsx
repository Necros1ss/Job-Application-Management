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
    <div className="min-h-screen bg-[#f6f8f5] text-gray-950">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/20 bg-[#19211D]/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link to="/" className="text-lg font-extrabold text-white">
            Job Tracker
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-white/75 md:flex">
            <a href="#modules" className="hover:text-white">Modules</a>
            <a href="#workflow" className="hover:text-white">Workflow</a>
            <a href="#why" className="hover:text-white">Why Us</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-white/80 hover:text-white">
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600"
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      <section
        className="relative min-h-[92vh] overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(25,33,29,.94) 0%, rgba(25,33,29,.82) 44%, rgba(25,33,29,.28) 100%), url('https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1800&q=85')",
        }}
      >
        <div className="mx-auto flex min-h-[92vh] max-w-7xl items-center px-6 pb-20 pt-28 lg:px-10">
          <div className="max-w-3xl text-white">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <FaCheckCircle className="text-emerald-300" />
              Open, self-hosted hiring and HR workflow
            </div>
            <h1 className="text-5xl font-extrabold leading-tight tracking-normal md:text-7xl">
              Job Tracker HRMS
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82">
              A practical hiring workspace inspired by open-source HR systems: recruitment, interviews,
              onboarding, employee records, attendance, and leave in one calm dashboard.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-700"
              >
                Create workspace <FaArrowRight />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur hover:bg-white/15"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid translate-y-1/2 grid-cols-2 gap-3 rounded-2xl border border-white/20 bg-white p-4 shadow-2xl md:grid-cols-4">
              {metrics.map(([label, value]) => (
                <div key={label} className="rounded-xl bg-[#f6f8f5] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
                  <p className="mt-2 text-3xl font-extrabold text-[#19211D]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="modules" className="mx-auto max-w-7xl px-6 pb-20 pt-32 lg:px-10">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">All-in-one modules</p>
            <h2 className="mt-2 text-3xl font-extrabold text-gray-950 md:text-4xl">
              Hiring first, HR ready.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-gray-500">
            Keep the operational density of an HRMS while staying focused on the workflows this app already supports.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {modules.map(({ title, description, icon: Icon }) => (
            <div key={title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Icon size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-950">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-gray-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="workflow" className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">Workspace preview</p>
            <h2 className="mt-2 text-3xl font-extrabold text-gray-950 md:text-4xl">
              Move from candidate to employee without losing context.
            </h2>
            <p className="mt-5 text-sm leading-7 text-gray-500">
              The workflow keeps notes, timeline, onboarding tasks, employee status, leave, and attendance
              close to the recruiting process.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {["Pipeline", "Timeline", "Onboarding", "Attendance", "Leave"].map((item) => (
                <span key={item} className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-[#f6f8f5] p-4 shadow-xl">
            <div className="rounded-2xl bg-[#19211D] p-4 text-white">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">Recruitment Board</p>
                  <p className="mt-1 text-lg font-bold">Frontend Engineer</p>
                </div>
                <div className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold">Live</div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {["Applied", "Interview", "Offer"].map((stage, index) => (
                  <div key={stage} className="rounded-xl bg-white/10 p-4">
                    <p className="text-xs font-bold uppercase text-white/50">{stage}</p>
                    <div className="mt-4 space-y-3">
                      {[1, 2, 3].slice(0, index + 1).map((item) => (
                        <div key={item} className="rounded-lg bg-white p-3 text-gray-900">
                          <div className="h-2 w-20 rounded-full bg-gray-200" />
                          <div className="mt-2 h-2 w-28 rounded-full bg-emerald-100" />
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
            <div key={title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <FaUsers className="mb-5 text-emerald-600" size={22} />
              <h3 className="font-bold text-gray-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-[#19211D] px-6 py-8 text-white lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row md:items-center">
          <p className="font-bold">Job Tracker</p>
          <div className="flex items-center gap-4 text-sm text-white/70">
            <a href="https://github.com/Necros1ss/Job-Application-Management" className="inline-flex items-center gap-2 hover:text-white">
              <FaGithub /> GitHub
            </a>
            <Link to="/login" className="hover:text-white">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
