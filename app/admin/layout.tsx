"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarDays,
  BookOpen,
  FileText,
  FileBadge,
  UserCheck,
  TrendingUp,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Wallet,
  Coins,
  Receipt,
  BarChart3,
  Loader2,
  LayoutList,
  CalendarCheck,
  Eye,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Get logged-in user email
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
      }
    };
    getUser();

    // Get institutional settings
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("key, value");
        if (data) {
          const logo = data.find(s => s.key === "logo_url")?.value || null;
          const favicon = data.find(s => s.key === "favicon_url")?.value || null;
          setLogoUrl(logo);

          // Dynamically update head favicon tag on mount
          if (favicon) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel='icon']");
            if (!link) {
              link = document.createElement("link");
              link.rel = "icon";
              document.head.appendChild(link);
            }
            link.href = favicon;
          }
        }
      } catch (err) {
        console.error("Error loading admin settings:", err);
      }
    };
    fetchSettings();

    // Auto-expand finance tab if inside /finance path
    if (pathname.startsWith("/admin/finance")) {
      setFinanceOpen(true);
    }
  }, [pathname, supabase]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  };

  const navItems = [
    { name: "ড্যাশবোর্ড", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "শিক্ষার্থী ব্যবস্থাপনা", href: "/admin/students", icon: Users },
    { name: "শিক্ষক ব্যবস্থাপনা", href: "/admin/teachers", icon: GraduationCap },
    { name: "ব্যাচ ব্যবস্থাপনা", href: "/admin/batches", icon: LayoutList },
    { name: "বিষয় ব্যবস্থাপনা", href: "/admin/subjects", icon: BookOpen },
    { name: "পরিচালকবৃন্দ", href: "/admin/directors", icon: UserCheck },
    { name: "প্রস্তুতি প্রোগ্রাম", href: "/admin/preparation-program", icon: TrendingUp },
    { name: "পরীক্ষার সময়সূচী", href: "/admin/exam-schedule", icon: CalendarCheck },
    { name: "পরীক্ষার ফলাফল", href: "/admin/exams", icon: FileBadge },
    { name: "সাজেশনস", href: "/admin/suggestions", icon: FileText },
    { name: "ক্লাস রুটিন", href: "/admin/routines", icon: CalendarDays },
    { name: "সাইট সেটিংস", href: "/admin/settings", icon: Settings },
  ];

  const financeItems = [
    { name: "ফি সংগ্রহ", href: "/admin/finance/fees", icon: Receipt },
    { name: "শিক্ষক বেতন", href: "/admin/finance/salary", icon: Coins },
    { name: "অন্যান্য খরচ", href: "/admin/finance/expenses", icon: Wallet },
    { name: "আর্থিক রিপোর্ট", href: "/admin/finance/reports", icon: BarChart3 },
  ];

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-slate-900 border-r border-slate-800 text-slate-300 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950 border-b border-slate-800">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            {logoUrl ? (
              <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
                <Image
                  src={logoUrl}
                  alt="Logo"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500 text-white font-bold shrink-0">
                ম
              </div>
            )}
            <span className="font-bold text-md text-white tracking-wide">
              মানবিক কলেজ কোচিং সেন্টার
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-teal-600 text-white shadow-md shadow-teal-500/10"
                    : "hover:bg-slate-800/60 hover:text-white text-slate-400"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Collapsible Finance Section */}
          <div className="space-y-1 pt-2">
            <button
              onClick={() => setFinanceOpen(!financeOpen)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-slate-400 hover:bg-slate-800/60 hover:text-white`}
            >
              <div className="flex items-center gap-3">
                <Wallet className="w-4 h-4 shrink-0" />
                <span>অর্থ ব্যবস্থাপনা</span>
              </div>
              {financeOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {financeOpen && (
              <div className="pl-4 pr-1 py-1 space-y-1 bg-slate-950/40 rounded-xl border border-slate-800/20">
                {financeItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-slate-800 text-teal-400"
                          : "hover:bg-slate-800/30 hover:text-white text-slate-500"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Admin Footer / Logout */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-3 rounded-lg bg-slate-900/50 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-teal-500 text-sm font-semibold uppercase">
              {userEmail ? userEmail.charAt(0) : "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                সুপার অ্যাডমিন
              </p>
              <p className="text-[10px] text-slate-500 truncate">{userEmail || "loading..."}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-950/40 hover:bg-rose-900/30 active:scale-[0.98] border border-rose-900/20 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            {loggingOut ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>লগআউট হচ্ছে...</span>
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট করুন</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="font-bold text-slate-800 text-lg leading-tight">
              {pathname === "/admin/dashboard"
                ? "ড্যাশবোর্ড"
                : pathname === "/admin/students"
                ? "শিক্ষার্থী তালিকা"
                : pathname === "/admin/teachers"
                ? "শিক্ষক তালিকা"
                : pathname === "/admin/batches"
                ? "ব্যাচ ব্যবস্থাপনা"
                : pathname === "/admin/subjects"
                ? "বিষয় ব্যবস্থাপনা"
                : pathname === "/admin/directors"
                ? "পরিচালকবৃন্দ"
                : pathname === "/admin/preparation-program"
                ? "প্রস্তুতি প্রোগ্রাম"
                : pathname === "/admin/exam-schedule"
                ? "পরীক্ষার সময়সূচী"
                : pathname === "/admin/exams"
                ? "পরীক্ষার ফলাফল"
                : pathname === "/admin/suggestions"
                ? "সাজেশনস"
                : pathname === "/admin/routines"
                ? "ক্লাস রুটিন"
                : pathname === "/admin/settings"
                ? "সাইট সেটিংস"
                : pathname === "/admin/finance/fees"
                ? "ফি সংগ্রহ"
                : pathname === "/admin/finance/salary"
                ? "শিক্ষক বেতন পরিশোধ"
                : pathname === "/admin/finance/expenses"
                ? "অন্যান্য খরচ"
                : pathname === "/admin/finance/reports"
                ? "আর্থিক বিবরণী"
                : "কোচিং ম্যানেজমেন্ট সিস্টেম"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Direct link to public site */}
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center justify-center w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
              title="ওয়েবসাইট দেখুন"
            >
              <Eye className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}
