"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadImageToImageKit } from "@/lib/imagekit";
import {
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  Upload,
  RotateCcw,
  Eye,
  Settings,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AdminSettingsPage() {
  const supabase = createClient();
  
  // Refs
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Banner State
  const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(null);
  const [previewBannerUrl, setPreviewBannerUrl] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);

  // Logo State
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [previewLogoUrl, setPreviewLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);

  // Favicon State
  const [currentFaviconUrl, setCurrentFaviconUrl] = useState<string | null>(null);
  const [previewFaviconUrl, setPreviewFaviconUrl] = useState<string | null>(null);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [savingFavicon, setSavingFavicon] = useState(false);

  // Privacy Settings State
  const [hidePublicStudents, setHidePublicStudents] = useState<boolean>(false);
  const [currentHidePublicStudents, setCurrentHidePublicStudents] = useState<boolean>(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // General Page State
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Drag states
  const [dragOverBanner, setDragOverBanner] = useState(false);

  /* ── Load all settings on mount ── */
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data, error: fetchErr } = await supabase
          .from("site_settings")
          .select("*");

        if (fetchErr) throw fetchErr;

        const banner = data?.find(s => s.key === "hero_banner_url")?.value || null;
        const logo = data?.find(s => s.key === "logo_url")?.value || null;
        const favicon = data?.find(s => s.key === "favicon_url")?.value || null;
        const hideStudents = data?.find(s => s.key === "hide_public_students")?.value === "true";

        setCurrentBannerUrl(banner);
        setPreviewBannerUrl(banner);

        setCurrentLogoUrl(logo);
        setPreviewLogoUrl(logo);

        setCurrentFaviconUrl(favicon);
        setPreviewFaviconUrl(favicon);

        setHidePublicStudents(hideStudents);
        setCurrentHidePublicStudents(hideStudents);
      } catch (err: any) {
        setError("সেটিংস লোড করতে সমস্যা হয়েছে।");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [supabase]);

  // File Validation Helper
  const validateFile = (file: File, maxSizeMB: number): boolean => {
    if (!file.type.startsWith("image/")) {
      setError("শুধুমাত্র ইমেজ ফাইল আপলোড করা যাবে।");
      return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`ফাইলের সাইজ ${maxSizeMB}MB এর বেশি হওয়া যাবে না।`);
      return false;
    }
    setError(null);
    setSuccess(null);
    return true;
  };

  /* ── Banner Actions ── */
  const processBanner = async (file: File) => {
    if (!validateFile(file, 5)) return;
    setUploadingBanner(true);
    try {
      const url = await uploadImageToImageKit(file, "hero-banner");
      setPreviewBannerUrl(url);
      setSuccess("নতুন ব্যানার ছবি আপলোড হয়েছে। পরিবর্তন সংরক্ষণ করুন।");
    } catch (err: any) {
      setError("ব্যানার আপলোড ব্যর্থ: " + (err.message || "অজানা ত্রুটি।"));
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleBannerDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverBanner(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processBanner(file);
  };

  const saveBanner = async () => {
    if (!previewBannerUrl || previewBannerUrl === currentBannerUrl) return;
    setSavingBanner(true);
    setError(null);
    setSuccess(null);
    try {
      const { error: err } = await supabase
        .from("site_settings")
        .upsert({ key: "hero_banner_url", value: previewBannerUrl, updated_at: new Date().toISOString() });
      if (err) throw err;
      setCurrentBannerUrl(previewBannerUrl);
      setSuccess("হিরো ব্যানার সফলভাবে সংরক্ষণ করা হয়েছে।");
    } catch (err: any) {
      setError("সংরক্ষণ করতে ব্যর্থ: " + (err.message || "অজানা ত্রুটি।"));
    } finally {
      setSavingBanner(false);
    }
  };

  const resetBanner = () => {
    setPreviewBannerUrl(currentBannerUrl);
    setSuccess(null);
    setError(null);
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  };

  /* ── Logo Actions ── */
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFile(file, 2)) return;
    setUploadingLogo(true);
    try {
      const url = await uploadImageToImageKit(file, "logo");
      setPreviewLogoUrl(url);
      setSuccess("নতুন লোগো ছবি আপলোড হয়েছে। পরিবর্তন সংরক্ষণ করুন।");
    } catch (err: any) {
      setError("লোগো আপলোড ব্যর্থ: " + (err.message || "অজানা ত্রুটি।"));
    } finally {
      setUploadingLogo(false);
    }
  };

  const saveLogo = async () => {
    if (!previewLogoUrl || previewLogoUrl === currentLogoUrl) return;
    setSavingLogo(true);
    setError(null);
    setSuccess(null);
    try {
      const { error: err } = await supabase
        .from("site_settings")
        .upsert({ key: "logo_url", value: previewLogoUrl, updated_at: new Date().toISOString() });
      if (err) throw err;
      setCurrentLogoUrl(previewLogoUrl);
      setSuccess("প্রতিষ্ঠানের লোগো সফলভাবে সংরক্ষণ করা হয়েছে।");
    } catch (err: any) {
      setError("সংরক্ষণ করতে ব্যর্থ: " + (err.message || "অজানা ত্রুটি।"));
    } finally {
      setSavingLogo(false);
    }
  };

  const resetLogo = () => {
    setPreviewLogoUrl(currentLogoUrl);
    setSuccess(null);
    setError(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  /* ── Favicon Actions ── */
  const handleFaviconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFile(file, 1)) return;
    setUploadingFavicon(true);
    try {
      const url = await uploadImageToImageKit(file, "favicon");
      setPreviewFaviconUrl(url);
      setSuccess("নতুন ফেভিকন ছবি আপলোড হয়েছে। পরিবর্তন সংরক্ষণ করুন।");
    } catch (err: any) {
      setError("ফেভিকন আপলোড ব্যর্থ: " + (err.message || "অজানা ত্রুটি।"));
    } finally {
      setUploadingFavicon(false);
    }
  };

  const saveFavicon = async () => {
    if (!previewFaviconUrl || previewFaviconUrl === currentFaviconUrl) return;
    setSavingFavicon(true);
    setError(null);
    setSuccess(null);
    try {
      const { error: err } = await supabase
        .from("site_settings")
        .upsert({ key: "favicon_url", value: previewFaviconUrl, updated_at: new Date().toISOString() });
      if (err) throw err;
      setCurrentFaviconUrl(previewFaviconUrl);
      setSuccess("ওয়েবসাইট ফেভিকন সফলভাবে সংরক্ষণ করা হয়েছে।");

      // Dynamically update head favicon tag immediately
      let link: HTMLLinkElement | null = document.querySelector("link[rel='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = previewFaviconUrl;
    } catch (err: any) {
      setError("সংরক্ষণ করতে ব্যর্থ: " + (err.message || "অজানা ত্রুটি।"));
    } finally {
      setSavingFavicon(false);
    }
  };

  const resetFavicon = () => {
    setPreviewFaviconUrl(currentFaviconUrl);
    setSuccess(null);
    setError(null);
    if (faviconInputRef.current) faviconInputRef.current.value = "";
  };

  /* ── Privacy Settings Actions ── */
  const savePrivacySettings = async () => {
    setSavingPrivacy(true);
    setError(null);
    setSuccess(null);
    try {
      const { error: err } = await supabase
        .from("site_settings")
        .upsert({
          key: "hide_public_students",
          value: hidePublicStudents ? "true" : "false",
          updated_at: new Date().toISOString()
        });
      if (err) throw err;
      setCurrentHidePublicStudents(hidePublicStudents);
      setSuccess("প্রাইভেসি সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে।");
    } catch (err: any) {
      setError("সংরক্ষণ করতে ব্যর্থ: " + (err.message || "অজানা ত্রুটি।"));
    } finally {
      setSavingPrivacy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl text-left">
      {/* Description */}
      <p className="text-slate-500 text-sm">
        ওয়েবসাইটের লোগো, ফেভিকন এবং হোমপেজ ব্যানার ছবি পরিবর্তন ও নিয়ন্ত্রণ করুন।
      </p>

      {/* Notification Banner */}
      {success && (
        <div className="flex items-start gap-2.5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs animate-slide-down">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2.5 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs animate-slide-down">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
          <p className="text-slate-400 text-xs font-semibold">সেটিংস লোড হচ্ছে...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* LEFT COLUMN: Logo & Favicon Card */}
          <div className="space-y-6">
            
            {/* Institution Logo Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-teal-600" />
                প্রতিষ্ঠানের লোগো
              </h2>
              
              <div className="flex items-center gap-6">
                {/* Logo Preview */}
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                  {previewLogoUrl ? (
                    <Image
                      src={previewLogoUrl}
                      alt="Logo Preview"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  ) : (
                    <span className="text-slate-300 font-bold text-3xl">ম</span>
                  )}
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className="space-y-2 flex-1">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    লোগো ইমেজটি সাইডবার এবং টপবারে প্রদর্শিত হবে। বর্গাকার ছবি সবচেয়ে ভালো দেখায়।
                  </p>
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    আপলোড করুন
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={resetLogo}
                  disabled={previewLogoUrl === currentLogoUrl || uploadingLogo || savingLogo}
                  className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold border border-slate-200 rounded-xl disabled:opacity-40 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  onClick={saveLogo}
                  disabled={previewLogoUrl === currentLogoUrl || uploadingLogo || savingLogo}
                  className="inline-flex items-center gap-1 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingLogo ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  সংরক্ষণ করুন
                </button>
              </div>
            </div>

            {/* Favicon Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Image
                  src={previewFaviconUrl || "/favicon.ico"}
                  alt="Favicon Icon"
                  width={16}
                  height={16}
                  className="object-contain"
                  unoptimized
                />
                ওয়েবসাইট ফেভিকন
              </h2>

              <div className="flex items-center gap-6">
                {/* Favicon Preview */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                  {previewFaviconUrl ? (
                    <Image
                      src={previewFaviconUrl}
                      alt="Favicon Preview"
                      width={32}
                      height={32}
                      className="object-contain"
                      unoptimized
                    />
                  ) : (
                    <span className="text-slate-300 text-xs font-bold">ICO</span>
                  )}
                  {uploadingFavicon && (
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className="space-y-2 flex-1">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    ফেভিকনটি ব্রাউজারের ট্যাব বারে দেখা যাবে। 32×32 PNG বা ICO ছবি ব্যবহার করুন।
                  </p>
                  <button
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={uploadingFavicon}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    আপলোড করুন
                  </button>
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/x-icon, image/png, image/jpeg"
                    onChange={handleFaviconChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={resetFavicon}
                  disabled={previewFaviconUrl === currentFaviconUrl || uploadingFavicon || savingFavicon}
                  className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold border border-slate-200 rounded-xl disabled:opacity-40 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  onClick={saveFavicon}
                  disabled={previewFaviconUrl === currentFaviconUrl || uploadingFavicon || savingFavicon}
                  className="inline-flex items-center gap-1 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingFavicon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  সংরক্ষণ করুন
                </button>
              </div>
            </div>

            {/* Privacy Settings Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-teal-600" />
                প্রাইভেসি সেটিংস
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="space-y-0.5 text-left pr-4">
                    <p className="text-xs font-bold text-slate-800">পাবলিক শিক্ষার্থী তালিকা লুকান</p>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      এটি চালু করলে পাবলিক ওয়েবসাইট থেকে শিক্ষার্থীদের তালিকা ও মেনু লিংকটি সম্পূর্ণ লুকিয়ে ফেলা হবে।
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={hidePublicStudents}
                      onChange={(e) => setHidePublicStudents(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setHidePublicStudents(currentHidePublicStudents);
                    setSuccess(null);
                    setError(null);
                  }}
                  disabled={hidePublicStudents === currentHidePublicStudents || savingPrivacy}
                  className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold border border-slate-200 rounded-xl disabled:opacity-40 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  onClick={savePrivacySettings}
                  disabled={hidePublicStudents === currentHidePublicStudents || savingPrivacy}
                  className="inline-flex items-center gap-1 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingPrivacy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  সংরক্ষণ করুন
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Hero Banner Card */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-teal-600" />
                    হিরো ব্যানার প্রিভিউ
                  </h2>
                  {previewBannerUrl && (
                    <Link
                      href="/"
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      লাইভ দেখুন
                    </Link>
                  )}
                </div>

                {/* Banner Preview */}
                {previewBannerUrl ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-100">
                    <Image
                      src={previewBannerUrl}
                      alt="হিরো ব্যানার প্রিভিউ"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-3">
                      <span className="text-white text-[10px] font-semibold">
                        {previewBannerUrl !== currentBannerUrl ? "⚡ নতুন ব্যানার (সংরক্ষণ করা হয়নি)" : "✅ বর্তমান ব্যানার"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 bg-slate-50 rounded-xl text-slate-400 gap-2 border border-dashed border-slate-200">
                    <ImageIcon className="w-8 h-8" />
                    <p className="text-xs">কোনো ব্যানার সেট করা নেই</p>
                  </div>
                )}

                {/* Drag and drop upload zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOverBanner(true); }}
                  onDragLeave={() => setDragOverBanner(false)}
                  onDrop={handleBannerDrop}
                  onClick={() => bannerInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                    dragOverBanner
                      ? "border-teal-500 bg-teal-50 scale-[1.01]"
                      : "border-slate-200 bg-slate-50/50 hover:border-teal-400 hover:bg-teal-50/40"
                  }`}
                >
                  {uploadingBanner ? (
                    <>
                      <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                      <p className="text-xs font-semibold text-teal-600">আপলোড হচ্ছে...</p>
                    </>
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-teal-600" />
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-700">ছবি ড্র্যাগ করুন অথবা ক্লিক করুন</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP · সর্বোচ্চ ৫MB</p>
                      </div>
                    </>
                  )}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) await processBanner(file);
                    }}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                <button
                  onClick={resetBanner}
                  disabled={previewBannerUrl === currentBannerUrl || uploadingBanner || savingBanner}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  আগের ছবিতে ফিরে যান
                </button>
                <button
                  onClick={saveBanner}
                  disabled={previewBannerUrl === currentBannerUrl || uploadingBanner || savingBanner}
                  className="inline-flex items-center gap-1 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  সংরক্ষণ করুন
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Info Guide */}
      <div className="bg-sky-50 border border-sky-100 rounded-2xl p-5 text-xs text-sky-700 space-y-1.5">
        <p className="font-bold text-sky-800">📌 সেটিংস পরিবর্তন গাইড:</p>
        <ul className="list-disc list-inside space-y-1 text-sky-600">
          <li>লোগো, ফেভিকন এবং ব্যানার আপলোড করার পর <strong>সংরক্ষণ করুন</strong> বাটনটি ক্লিক করুন।</li>
          <li>নতুন লোগো এবং ব্যানার হোমপেজ ও অ্যাডমিন প্যানেলে তাৎক্ষণিকভাবে আপডেট হবে।</li>
          <li>ফেভিকন সংরক্ষণের সাথে সাথে আপনার ব্রাউজারের ট্যাবে এর পরিবর্তন দেখা যাবে।</li>
        </ul>
      </div>
    </div>
  );
}
