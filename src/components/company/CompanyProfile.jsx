import React, { useState, useRef, useEffect } from "react";
import { Loader2, Palette, UploadCloud, UserCircle } from "lucide-react";
import { updateCompanyAdmin } from "../../services/companyAdminCloud";
import { readSession, writeSession } from "../../services/session";

const extractThemeColors = (imgElement) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = imgElement.naturalWidth || imgElement.width;
  canvas.height = imgElement.naturalHeight || imgElement.height;
  context.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

  try {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const colorCounts = {};

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 128 || (r > 240 && g > 240 && b > 240) || (r < 15 && g < 15 && b < 15)) {
        continue;
      }

      const rQ = Math.round(r / 15) * 15;
      const gQ = Math.round(g / 15) * 15;
      const bQ = Math.round(b / 15) * 15;
      const key = `${rQ},${gQ},${bQ}`;

      colorCounts[key] = (colorCounts[key] || 0) + 1;
    }

    const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
    
    let primary = "#63D3A4";
    let secondary = "#9AA6D6";

    if (sorted.length > 0) {
      const [pKey] = sorted[0];
      const [pr, pg, pb] = pKey.split(',').map(Number);
      primary = `#${((1 << 24) + (pr << 16) + (pg << 8) + pb).toString(16).slice(1)}`;

      // Find a secondary color that is significantly different
      for (let i = 1; i < sorted.length; i++) {
        const [sKey] = sorted[i];
        const [sr, sg, sb] = sKey.split(',').map(Number);
        
        const dist = Math.sqrt(Math.pow(pr - sr, 2) + Math.pow(pg - sg, 2) + Math.pow(pb - sb, 2));
        if (dist > 60) {
          secondary = `#${((1 << 24) + (sr << 16) + (sg << 8) + sb).toString(16).slice(1)}`;
          break;
        }
      }
    }

    return { primary, secondary };
  } catch (e) {
    console.warn("Could not extract color:", e);
    return null;
  }
};

const CompanyProfile = ({ companyAdmin, onUpdate }) => {
  const [logo, setLogo] = useState(companyAdmin?.logo || "");
  const [profileVideo, setProfileVideo] = useState(companyAdmin?.profileVideo || "");
  const [address, setAddress] = useState(companyAdmin?.address || "");
  const [publicEmail, setPublicEmail] = useState(companyAdmin?.publicEmail || "");
  const [publicPhone, setPublicPhone] = useState(companyAdmin?.publicPhone || "");
  const [themeColor, setThemeColor] = useState(companyAdmin?.themeColor || "#63D3A4");
  const [themeSecondaryColor, setThemeSecondaryColor] = useState(companyAdmin?.themeSecondaryColor || "#9AA6D6");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const hiddenImgRef = useRef(null);

  useEffect(() => {
    setLogo(companyAdmin?.logo || "");
    setProfileVideo(companyAdmin?.profileVideo || "");
    setAddress(companyAdmin?.address || "");
    setPublicEmail(companyAdmin?.publicEmail || "");
    setPublicPhone(companyAdmin?.publicPhone || "");
    setThemeColor(companyAdmin?.themeColor || "#63D3A4");
    setThemeSecondaryColor(companyAdmin?.themeSecondaryColor || "#9AA6D6");
  }, [companyAdmin]);

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setLogo(dataUrl);

      // Load image to extract color
      const img = new Image();
      img.onload = () => {
        const colors = extractThemeColors(img);
        if (colors) {
          setThemeColor(colors.primary);
          setThemeSecondaryColor(colors.secondary);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!companyAdmin?.id) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const updated = await updateCompanyAdmin(companyAdmin.id, {
        ...companyAdmin,
        logo,
        profileVideo,
        address,
        publicEmail,
        publicPhone,
        themeColor,
        themeSecondaryColor,
      });

      const currentSession = readSession();
      if (currentSession && currentSession.companyId === updated.companyId) {
        writeSession({
          ...currentSession,
          themeColor: updated.themeColor,
          themeSecondaryColor: updated.themeSecondaryColor,
          logo: updated.logo
        });
      }

      setMessage("Profile updated successfully!");
      if (onUpdate) {
        onUpdate(updated);
      }
    } catch (err) {
      setError(err?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
      <div className="flex items-center gap-4 border-b border-gray-100 pb-6 mb-6">
        <div className="w-16 h-16 bg-mint/10 text-mint rounded-2xl flex items-center justify-center">
          <UserCircle size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900">Company Profile</h2>
          <p className="text-gray-500 font-medium mt-1">
            Manage your company's logo and branding theme.
          </p>
        </div>
      </div>

      {(message || error) && (
        <div
          className={`rounded-2xl p-4 font-semibold mb-6 ${
            error
              ? "bg-red-50 border border-red-200 text-red-600"
              : "bg-mint/10 border border-mint/30 text-mint"
          }`}
        >
          {error || message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-sm font-black uppercase tracking-widest text-gray-500">
              Company Logo
            </label>
            <div className="relative aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center overflow-hidden hover:bg-gray-100 transition-colors group cursor-pointer">
              {logo ? (
                <img
                  src={logo}
                  alt="Company Logo Preview"
                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="text-center p-6">
                  <UploadCloud size={40} className="mx-auto text-gray-400 mb-3" />
                  <p className="font-bold text-gray-600">Click to upload logo</p>
                  <p className="text-xs text-gray-400 mt-1 font-semibold">PNG, JPG or SVG (Max 2MB)</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-black uppercase tracking-widest text-gray-500">
              Theme Colors
            </label>
            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 h-[calc(100%-2rem)] flex flex-col justify-center space-y-6">
              
              {/* Primary Color */}
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-2xl shadow-inner border border-black/10 shrink-0" 
                  style={{ backgroundColor: themeColor }}
                />
                <div className="flex-1 space-y-1 relative">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Primary (Sidebar)</p>
                  <div className="flex items-center border border-gray-200 bg-white rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-mint transition-all">
                    <span className="pl-4 text-gray-400 font-bold">#</span>
                    <input
                      type="text"
                      value={themeColor.replace("#", "").toUpperCase()}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
                        setThemeColor(`#${val}`);
                      }}
                      className="w-full px-2 py-2 outline-none font-bold text-gray-800 tracking-wider text-sm"
                    />
                    <label className="absolute inset-y-0 right-0 w-12 flex items-center justify-center cursor-pointer border-l border-gray-100 hover:bg-gray-50 transition-colors pt-5">
                      <Palette size={16} className="text-gray-500" />
                      <input
                        type="color"
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Secondary Color */}
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-2xl shadow-inner border border-black/10 shrink-0" 
                  style={{ backgroundColor: themeSecondaryColor }}
                />
                <div className="flex-1 space-y-1 relative">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Secondary (Header)</p>
                  <div className="flex items-center border border-gray-200 bg-white rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 transition-all">
                    <span className="pl-4 text-gray-400 font-bold">#</span>
                    <input
                      type="text"
                      value={themeSecondaryColor.replace("#", "").toUpperCase()}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
                        setThemeSecondaryColor(`#${val}`);
                      }}
                      className="w-full px-2 py-2 outline-none font-bold text-gray-800 tracking-wider text-sm"
                    />
                    <label className="absolute inset-y-0 right-0 w-12 flex items-center justify-center cursor-pointer border-l border-gray-100 hover:bg-gray-50 transition-colors pt-5">
                      <Palette size={16} className="text-gray-500" />
                      <input
                        type="color"
                        value={themeSecondaryColor}
                        onChange={(e) => setThemeSecondaryColor(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <p className="text-xs font-semibold text-gray-500">
                These colors are seamlessly extracted from your uploaded logo, but you can adjust them here.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
          <div className="space-y-4">
            <label className="block text-sm font-black uppercase tracking-widest text-gray-500">
              Company Address (Optional)
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your official company address..."
              className="w-full bg-gray-50 p-4 rounded-2xl border border-transparent focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none min-h-[100px] resize-y"
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-black uppercase tracking-widest text-gray-500">
                Public Email (Optional)
              </label>
              <input
                type="email"
                value={publicEmail}
                onChange={(e) => setPublicEmail(e.target.value)}
                placeholder="contact@company.com"
                className="w-full bg-gray-50 p-4 rounded-2xl border border-transparent focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-black uppercase tracking-widest text-gray-500">
                Public Phone (Optional)
              </label>
              <input
                type="text"
                value={publicPhone}
                onChange={(e) => setPublicPhone(e.target.value)}
                placeholder="+1 234 567 890"
                className="w-full bg-gray-50 p-4 rounded-2xl border border-transparent focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none"
              />
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-100 space-y-4">
          <label className="block text-sm font-black uppercase tracking-widest text-gray-500">
            Profile Video Reference (Optional)
          </label>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={profileVideo}
              onChange={(e) => setProfileVideo(e.target.value)}
              placeholder="YouTube URL or direct video link (MP4)"
              className="w-full bg-gray-50 p-4 rounded-2xl border border-transparent focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none"
            />
            <p className="text-[10px] font-bold text-gray-400 px-1">
              Example: https://www.youtube.com/watch?v=... or https://example.com/video.mp4
            </p>
          </div>
        </div>


        <div className="pt-6 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-mint text-white px-8 py-4 rounded-2xl font-black hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-mint/20 disabled:opacity-70 disabled:hover:scale-100 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save Profile"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyProfile;
