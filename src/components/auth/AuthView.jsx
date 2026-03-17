import React, { useState } from "react";
import { findCompanyAdminByCredentials } from "../../services/companyAdminCloud";

const SUPER_ADMIN = {
  email: "mystery@gmail.com",
  password: "mystery@123",
};

const AuthView = ({ onAuthSuccess }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.email.includes("@")) {
      nextErrors.email = "Invalid email address";
    }
    if (formData.password.length < 6) {
      nextErrors.password = "Password too short";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setLoading(true);
    setErrors({});

    const email = formData.email.trim().toLowerCase();
    const password = formData.password.trim();

    try {
      if (email === SUPER_ADMIN.email && password === SUPER_ADMIN.password) {
        onAuthSuccess({
          role: "super_admin",
          adminId: "super_admin",
          name: "Super Admin",
          email,
        });
        return;
      }

      const companyAdmin = await findCompanyAdminByCredentials(email, password);
      if (!companyAdmin) {
        setErrors({ form: "Incorrect email or password." });
        return;
      }

      onAuthSuccess({
        role: "company_admin",
        adminId: companyAdmin.id,
        companyId: companyAdmin.companyId || companyAdmin.id,
        companyName: companyAdmin.name,
        name: companyAdmin.admin,
        email: companyAdmin.email,
        subscriptionEndDate: companyAdmin.subscriptionEndDate || "",
        subscriptionEndsAt: Number(companyAdmin.subscriptionEndsAt || 0),
      });
    } catch (authError) {
      setErrors({
        form:
          authError?.message ||
          "Login failed. Please check your internet and database rules.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen pt-24 pb-12 flex items-center justify-center px-6 pastel-gradient">
      <div className="max-w-6xl w-full bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">
        <div className="w-full md:w-1/2 bg-sky-blue/10 p-12 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-10 left-10 floating-piece w-12 h-12 bg-mint rounded-lg rotate-12 opacity-50" />
          <div className="absolute bottom-20 right-10 floating-piece w-16 h-16 bg-lavender-blue rounded-xl -rotate-6 opacity-50" />

          <img src="/icons.png" alt="Logo" className="w-48 h-48 mb-8 drop-shadow-2xl relative z-10" />
          <h2 className="text-4xl font-black text-gray-900 text-center mb-4 relative z-10">
            Start Your Challenge
          </h2>
          <p className="text-xl text-gray-600 text-center relative z-10 font-medium">
            Super Admin and Company Admin login from one screen.
          </p>

          <div className="mt-12 w-full max-w-sm grid grid-cols-2 gap-4 relative z-10">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="aspect-square bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-white/50 flex items-center justify-center text-2xl font-black text-gray-600"
              >
                {index}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <div className="mb-12">
            <h3 className="text-4xl font-black text-gray-900 mb-4">Welcome Back!</h3>
            <p className="text-gray-500 font-medium">
              Login as Super Admin or Company Admin to manage your campaign.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.form && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {errors.form}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 px-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-mint focus:ring-4 focus:ring-mint/10 transition-all outline-none font-medium"
                onChange={(event) => updateField("email", event.target.value)}
              />
              {errors.email && (
                <span className="text-accent text-xs font-bold px-1">{errors.email}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 px-1">
                Password
              </label>
              <input
                type="password"
                placeholder="********"
                value={formData.password}
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-mint focus:ring-4 focus:ring-mint/10 transition-all outline-none font-medium"
                onChange={(event) => updateField("password", event.target.value)}
              />
              {errors.password && (
                <span className="text-accent text-xs font-bold px-1">{errors.password}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-mint text-white py-4 rounded-2xl font-black text-xl hover:bg-mint/90 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-mint/20 mt-4 disabled:opacity-60 disabled:hover:scale-100"
            >
              {loading ? "Checking..." : "Login"}
            </button>

            <div className="text-center mt-8">
              <span className="text-gray-400 font-medium">Secure campaign access enabled</span>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default AuthView;
