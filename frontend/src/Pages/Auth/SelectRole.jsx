import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBriefcase, FaUserTie } from "react-icons/fa";

const SelectRole = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("");

  const options = [
    {
      role: "recruiter",
      title: "I am a recruiter",
      description: "Hiring for open roles",
      icon: <FaBriefcase className="text-xl" />,
    },
    {
      role: "candidate",
      title: "I am a candidate",
      description: "Looking for job opportunities",
      icon: <FaUserTie className="text-xl" />,
    },
  ];

  const handleContinue = () => {
    if (!selectedRole) {
      return;
    }

    navigate("/signup/create", { state: { role: selectedRole } });
  };

  return (
    <div className="h-screen px-4 py-32 ">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-4xl font-semibold mb-12">Join as a recruiter or candidate</h2>

        <div className="grid md:grid-cols-2 gap-6 text-left">
          {options.map((option) => {
            const isSelected = selectedRole === option.role;

            return (
              <button
                key={option.role}
                type="button"
                onClick={() => setSelectedRole(option.role)}
                className={`border rounded-xl p-6 transition-all ${
                  isSelected ? "border-black ring-2 ring-black/20" : "border-gray"
                }`}
              >
                <div className="flex justify-between items-start mb-8">
                  <div>{option.icon}</div>
                  <span
                    className={`h-6 w-6 rounded-full border flex items-center justify-center ${
                      isSelected ? "border-black" : "border-gray"
                    }`}
                  >
                    {isSelected && <span className="h-3 w-3 bg-black rounded-full" />}
                  </span>
                </div>
                <p className="text-3xl md:text-2xl font-medium leading-tight">{option.title}</p>
                <p className="text-base text-gray mt-2">{option.description}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-10">
          <button
            type="button"
            disabled={!selectedRole}
            onClick={handleContinue}
            className="bg-black text-white rounded-lg px-6 py-3 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Account
          </button>
        </div>

        <p className="mt-8 text-sm text-dark-gray">
          Already have an account?{" "}
          <Link to="/login" className="underline hover:no-underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SelectRole;
