"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, GraduationCap, LayoutDashboard, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [hidePublicStudents, setHidePublicStudents] = useState<boolean>(false);
  const [siteTitle, setSiteTitle] = useState<string>("বিজ্ঞান কলেজ কোচিং সেন্টার");

  useEffect(() => {
    const supabase = createClient();
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("key, value");
        if (data) {
          const logo = data.find(s => s.key === "logo_url")?.value || null;
          const favicon = data.find(s => s.key === "favicon_url")?.value || null;
          const hideStudents = data.find(s => s.key === "hide_public_students")?.value === "true";
          
          const title = data.find(s => s.key === "site_title")?.value || "বিজ্ঞান কলেজ কোচিং সেন্টার";
          setLogoUrl(logo);
          setHidePublicStudents(hideStudents);
          setSiteTitle(title);

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
        console.error("Error loading settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const menuItems = [
    { name: "হোম",              href: "/" },
    ...(!hidePublicStudents ? [{ name: "শিক্ষার্থী তালিকা", href: "/students" }] : []),
    { name: "শিক্ষক মণ্ডলী",    href: "/teachers" },
    { name: "পরিচালকবৃন্দ",      href: "/directors" },
    { name: "ক্লাস রুটিন",       href: "/routine" },
    { name: "পরীক্ষার সময়সূচী",  href: "/exam-schedule" },
    { name: "সাজেশন",           href: "/suggestion" },
    { name: "ফলাফল অনুসন্ধান",  href: "/result" },
  ];

  return (
    <div
      className="min-h-screen flex text-[#1E2B40] font-sans text-left"
      style={{ background: "var(--background)" }}
    >
      {/* =============================================
          DESKTOP SIDEBAR — deep sky blue theme
         ============================================= */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-30 animate-fade-in-left"
        style={{
          background: "linear-gradient(160deg, #2F5A8A 0%, #3B6FA8 55%, #5B8EC0 100%)",
          borderRight: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "4px 0 32px rgba(59,111,168,0.18)",
        }}
      >
        {/* Floating cloud blob decorations */}
        <div className="absolute top-8 right-4 w-24 h-24 rounded-full opacity-10 animate-float-cloud"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }} />
        <div className="absolute bottom-40 left-2 w-16 h-16 rounded-full opacity-10 animate-float-cloud stagger-3"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }} />

        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center gap-3 relative z-10"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}
        >
          {logoUrl ? (
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shrink-0">
              <Image
                src={logoUrl}
                alt="Logo"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
              style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}
            >
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
          )}
          <span className="font-extrabold text-xs text-white leading-snug">
            {siteTitle}
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1 relative z-10">
          {menuItems.map((item, i) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`animate-fade-in-left flex items-center px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "text-white font-bold"
                    : "text-sky-100 hover:text-white"
                }`}
                style={{
                  animationDelay: `${i * 0.06}s`,
                  ...(isActive ? {
                    background: "rgba(255,255,255,0.20)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
                    backdropFilter: "blur(8px)",
                  } : {}),
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "";
                  }
                }}
              >
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin Redirect Button */}
        <div className="p-4 relative z-10" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          <Link
            href="/admin/login"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:scale-[1.03]"
            style={{
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.22)",
              backdropFilter: "blur(8px)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.22)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.14)";
            }}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>অ্যাডমিন প্যানেল</span>
          </Link>
        </div>
      </aside>

      {/* =============================================
          MOBILE TOP BAR
         ============================================= */}
      <div
        className="md:hidden w-full h-14 fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 animate-slide-down rounded-b-2xl border-b border-slate-200/60 shadow-xs bg-white"
      >
        <Link href="/" className="flex items-center gap-2.5">
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
            <div className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: "#3B6FA8" }}
            >
              <GraduationCap className="w-4.5 h-4.5 text-white" />
            </div>
          )}
          <span className="font-extrabold text-xs" style={{ color: "#2F5A8A" }}>
            {siteTitle}
          </span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "#3B6FA8" }}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-45 md:hidden animate-fade-in"
          style={{ background: "rgba(30,43,64,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 z-50 flex flex-col md:hidden transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "linear-gradient(160deg, #2F5A8A 0%, #3B6FA8 55%, #5B8EC0 100%)",
          borderRight: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "4px 0 32px rgba(59,111,168,0.22)",
        }}
      >
        <div className="h-14 px-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white/70" />
            <span className="font-bold text-xs text-white">নেভিগেশন মেনু</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 rounded-lg text-sky-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive ? "text-white" : "text-sky-100 hover:text-white"
                }`}
                style={isActive ? {
                  background: "rgba(255,255,255,0.20)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
                } : {}}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          <Link
            href="/admin/login"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all"
            style={{
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.22)",
            }}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>অ্যাডমিন প্যানেল</span>
          </Link>
        </div>
      </aside>

      {/* =============================================
          MAIN CONTENT AREA
         ============================================= */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 pt-14 md:pt-0">
        <main className="flex-1 w-full overflow-x-hidden">
          {children}
        </main>

        {/* FOOTER */}
        <footer
          className="w-full py-10 text-center mt-auto"
          style={{
            background: "linear-gradient(to right, #1E2B40, #2F5A8A)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "2rem 2rem 0 0",
          }}
        >
          <div className="space-y-2 px-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              {logoUrl ? (
                <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white/10 p-0.5 flex items-center justify-center shrink-0">
                  <Image
                    src={logoUrl}
                    alt="Logo"
                    width={28}
                    height={28}
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.12)" }}
                >
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <p className="text-xs font-bold text-white">{siteTitle}</p>
            <p className="text-[10px]" style={{ color: "#E2E8F0" }}>
              এইচএসসি বিজ্ঞান শাখার শিক্ষার্থীদের জন্য একটি বিশেষায়িত কোচিং সেন্টার
            </p>
            <p className="text-[10px] pt-2" style={{ color: "rgba(226, 232, 240, 0.7)" }}>
              &copy; {new Date().getFullYear()} {siteTitle}। সর্বস্বত্ব সংরক্ষিত।
            </p>
            <p className="text-[10px] font-semibold" style={{ color: "#E2E8F0" }}>
              Developed with 💙 by Saddam Bin Mazid
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
