import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, tokenStorage } from "../../lib/api";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function ForgotPass() {
    return (
        <div className='h-screen'>
            <h2 className="text-teal-dark text-3xl font-semibold mb-6">Forgot Password</h2>
        </div>
    );
}

export default ForgotPass;
