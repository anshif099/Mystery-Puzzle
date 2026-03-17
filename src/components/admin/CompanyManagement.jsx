import React, { useEffect, useMemo, useState } from "react";
import { Plus, Edit2, Trash2, Eye, Loader2 } from "lucide-react";
import {
  cloudCompanyAdminConfigured,
  createCompanyAdmin,
  deleteCompanyAdmin,
  getCompanyAdmins,
  getCompanyAdminsCached,
  updateCompanyAdmin,
} from "../../services/companyAdminCloud";

const initialForm = {
  name: "",
  admin: "",
  email: "",
  password: "",
  campaigns: "0",
  status: "Active",
};

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [formData, setFormData] = useState(initialForm);

  const activeCompaniesCount = useMemo(
    () => companies.filter((company) => company.status === "Active").length,
    [companies]
  );

  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setEditingId("");
    setFormError("");
    setFormData(initialForm);
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingId("");
    setFormData(initialForm);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (company) => {
    setIsEditMode(true);
    setEditingId(company.id);
    setFormData({
      name: company.name || "",
      admin: company.admin || "",
      email: company.email || "",
      password: "",
      campaigns: String(company.campaigns ?? 0),
      status: company.status || "Active",
    });
    setFormError("");
    setShowModal(true);
  };

  const syncCompanies = async () => {
    setLoading(true);
    setPageError("");

    if (!cloudCompanyAdminConfigured()) {
      setCompanies(getCompanyAdminsCached());
      setPageError(
        "Firebase is not configured. Add VITE_FIREBASE_* keys to enable internet sync across devices."
      );
      setLoading(false);
      return;
    }

    try {
      const rows = await getCompanyAdmins();
      setCompanies(rows);
    } catch (error) {
      const cachedRows = getCompanyAdminsCached();
      setCompanies(cachedRows);
      const details =
        typeof error?.message === "string" ? ` (${error.message})` : "";
      setPageError(
        cachedRows.length
          ? `Cloud sync failed${details}. Showing locally cached records.`
          : `Cloud sync failed${details}. Please check internet and Firebase rules.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncCompanies();
  }, []);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormError("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return "Company name is required.";
    }
    if (!formData.admin.trim()) {
      return "Admin name is required.";
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      return "Valid admin email is required.";
    }
    if (!isEditMode && formData.password.trim().length < 6) {
      return "Password must be at least 6 characters.";
    }
    if (formData.campaigns === "" || Number(formData.campaigns) < 0) {
      return "Campaign count must be 0 or more.";
    }
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      if (!cloudCompanyAdminConfigured()) {
        setFormError(
          "Firebase is not configured. Add VITE_FIREBASE_* keys to save data online."
        );
        return;
      }

      if (isEditMode) {
        const existing = companies.find((company) => company.id === editingId);
        const payload = {
          name: formData.name.trim(),
          admin: formData.admin.trim(),
          email: formData.email.trim().toLowerCase(),
          campaigns: Number(formData.campaigns || 0),
          status: formData.status,
          password:
            formData.password.trim() || existing?.password || "",
          createdAt: existing?.createdAt || new Date().toISOString(),
        };

        const updated = await updateCompanyAdmin(editingId, payload);
        setCompanies((prev) =>
          prev.map((company) =>
            company.id === editingId ? { ...company, ...updated } : company
          )
        );
      } else {
        const created = await createCompanyAdmin({
          name: formData.name.trim(),
          admin: formData.admin.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password.trim(),
          campaigns: Number(formData.campaigns || 0),
          status: formData.status,
        });
        setCompanies((prev) => [created, ...prev]);
      }

      closeModal();
      setPageError("");
    } catch (error) {
      const details =
        typeof error?.message === "string" ? ` (${error.message})` : "";
      setFormError(
        isEditMode
          ? `Update failed${details}.`
          : `Create failed${details}.`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (company) => {
    const confirmed = window.confirm(
      `Delete ${company.name} company admin? This cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    try {
      if (!cloudCompanyAdminConfigured()) {
        setPageError(
          "Firebase is not configured. Add VITE_FIREBASE_* keys to enable delete."
        );
        return;
      }

      await deleteCompanyAdmin(company.id);
      setCompanies((prev) => prev.filter((item) => item.id !== company.id));
    } catch (error) {
      const details =
        typeof error?.message === "string" ? ` (${error.message})` : "";
      setPageError(`Delete failed${details}.`);
    }
  };

  const handleStatusToggle = async (company) => {
    const nextStatus = company.status === "Active" ? "Disabled" : "Active";

    try {
      if (!cloudCompanyAdminConfigured()) {
        setPageError(
          "Firebase is not configured. Add VITE_FIREBASE_* keys to update status."
        );
        return;
      }

      const updated = await updateCompanyAdmin(company.id, {
        ...company,
        status: nextStatus,
      });

      setCompanies((prev) =>
        prev.map((item) =>
          item.id === company.id ? { ...item, ...updated } : item
        )
      );
    } catch (error) {
      const details =
        typeof error?.message === "string" ? ` (${error.message})` : "";
      setPageError(`Status update failed${details}.`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-4 bg-white p-2 px-6 rounded-2xl shadow-sm border border-gray-50">
          <span className="text-mint font-black text-2xl">{activeCompaniesCount}</span>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Active Companies
          </span>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-mint text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-mint/20"
        >
          <Plus size={20} />
          CREATE COMPANY ADMIN
        </button>
      </div>

      {pageError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 font-semibold rounded-2xl p-4">
          {pageError}
        </div>
      )}

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest">
                Company Name
              </th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest">
                Admin Name
              </th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest">
                Email
              </th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest">
                Campaigns
              </th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest">
                Status
              </th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-8 py-10 text-center text-gray-500 font-semibold">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Loading company admins...
                  </span>
                </td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-8 py-10 text-center text-gray-400 font-semibold">
                  No company admins found. Create one to get started.
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-8 py-6 font-bold text-gray-800">{company.name}</td>
                  <td className="px-8 py-6 font-medium text-gray-600">{company.admin}</td>
                  <td className="px-8 py-6 font-medium text-gray-600">{company.email}</td>
                  <td className="px-8 py-6">
                    <span className="bg-sky-blue/10 text-sky-blue px-3 py-1 rounded-full font-black text-xs">
                      {company.campaigns}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span
                      className={`px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider ${
                        company.status === "Active"
                          ? "bg-mint/10 text-mint"
                          : "bg-accent/10 text-accent"
                      }`}
                    >
                      {company.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleStatusToggle(company)}
                        className="p-2 text-gray-400 hover:text-sky-blue hover:bg-sky-blue/10 rounded-lg transition-all"
                        title="Toggle status"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => openEditModal(company)}
                        className="p-2 text-gray-400 hover:text-mint hover:bg-mint/10 rounded-lg transition-all"
                        title="Edit company admin"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(company)}
                        className="p-2 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-all"
                        title="Delete company admin"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[40px] p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-3xl font-black text-gray-900 mb-8">
              {isEditMode ? "Edit Company Admin" : "Create Company Admin"}
            </h3>

            <form className="grid md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-500 tracking-widest ml-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => handleFieldChange("name", event.target.value)}
                  className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-mint/10 focus:bg-white transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-500 tracking-widest ml-1">
                  Admin Name
                </label>
                <input
                  type="text"
                  value={formData.admin}
                  onChange={(event) => handleFieldChange("admin", event.target.value)}
                  className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-mint/10 focus:bg-white transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-500 tracking-widest ml-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => handleFieldChange("email", event.target.value)}
                  className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-mint/10 focus:bg-white transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-500 tracking-widest ml-1">
                  Password {isEditMode ? "(leave blank to keep current)" : ""}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(event) => handleFieldChange("password", event.target.value)}
                  placeholder="********"
                  className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-mint/10 focus:bg-white transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-500 tracking-widest ml-1">
                  Campaigns
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.campaigns}
                  onChange={(event) => handleFieldChange("campaigns", event.target.value)}
                  className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-mint/10 focus:bg-white transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-500 tracking-widest ml-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(event) => handleFieldChange("status", event.target.value)}
                  className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-mint/10 focus:bg-white transition-all font-bold"
                >
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              {formError && (
                <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 font-semibold">
                  {formError}
                </div>
              )}

              <div className="md:col-span-2 flex gap-4 mt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-mint text-white py-4 rounded-2xl font-black hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-mint/20 disabled:opacity-70 disabled:hover:scale-100"
                >
                  {saving ? "Saving..." : isEditMode ? "SAVE CHANGES" : "CREATE ADMIN"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-8 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManagement;
