"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  GraduationCap,
  Users,
  Calendar,
  BookOpen,
  FileText,
  Search,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Star,
} from "lucide-react";

interface Batch {
  id: string;
  name: string;
}

/* ── tiny hook to animate a number counting up ── */
function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    // Always set to target immediately if 0 (no animation needed)
    if (target === 0) { setValue(0); return; }
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) raf.current = requestAnimationFrame(step);
      else setValue(target);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}


export default function PublicHomePage() {

  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroBannerUrl, setHeroBannerUrl] = useState("/images/hero_banner.png");
  const [isBannerLoaded, setIsBannerLoaded] = useState(false);

  useEffect(() => {
    const supabaseClient = createClient();
    const fetchStats = async () => {
      try {
        const [stdRes, teachRes, batchRes, settingsRes] = await Promise.all([
          supabaseClient.from("view_public_students").select("id", { count: "exact", head: true }),
          supabaseClient.from("view_public_teachers").select("id", { count: "exact", head: true }),
          supabaseClient.from("batches").select("id, name").limit(10),
          supabaseClient.from("site_settings").select("value").eq("key", "hero_banner_url").single(),
        ]);
        if (stdRes.error) console.error("students count error:", stdRes.error);
        if (teachRes.error) console.error("teachers count error:", teachRes.error);
        if (batchRes.error) console.error("batches error:", batchRes.error);
        setStudentCount(stdRes.count ?? 0);
        setTeacherCount(teachRes.count ?? 0);
        setBatches(batchRes.data || []);
        
        if (settingsRes.data?.value) {
          const newUrl = settingsRes.data.value;
          // Preload the custom banner image in the background
          const img = new window.Image();
          img.src = newUrl;
          img.onload = () => {
            setIsBannerLoaded(false); // start fade-out transition
            setTimeout(() => {
              setHeroBannerUrl(newUrl); // swap image once fully transparent
            }, 300);
          };
          img.onerror = () => {
            setHeroBannerUrl(newUrl); // fallback directly on error
          };
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStudents = useCountUp(studentCount);
  const animTeachers = useCountUp(teacherCount);
  const animBatches  = useCountUp(batches.length);

  const features = [
    {
      icon: BookOpen,
      title: "বিশেষায়িত মানবিক গাইডেন্স",
      desc: "এইচএসসি মানবিক শাখার সাধারণ ও ঐচ্ছিক সকল বিষয়ের জন্য আলাদা টিচার গাইডেন্স।",
      color: "#3B6FA8",
      bg: "rgba(59,111,168,0.08)",
    },
    {
      icon: FileText,
      title: "সাপ্তাহিক ও মাসিক পরীক্ষা",
      desc: "অধ্যায় ভিত্তিক মডেল ও নিয়মিত পরীক্ষা গ্রহণের মাধ্যমে শিক্ষার্থীদের প্রস্তুতি মজবুতকরণ।",
      color: "#5B8EC0",
      bg: "rgba(91,142,192,0.08)",
    },
    {
      icon: Calendar,
      title: "সুবিধাজনক ব্যাচ ও শিডিউল",
      desc: "সকাল এবং বিকালের সুবিধাজনক সময়ে আমাদের রয়েছে একাধিক ডায়নামিক ব্যাচ।",
      color: "#2F5A8A",
      bg: "rgba(47,90,138,0.08)",
    },
    {
      icon: TrendingUp,
      title: "এইচএসসি প্রস্তুতি প্রোগ্রাম",
      desc: "পরীক্ষার ৩ মাস পূর্বে বাহিরের শিক্ষার্থীদের ভর্তির সুবিধা সহ বিশেষ প্রিপারেশন কোর্স।",
      color: "#7FA8D1",
      bg: "rgba(127,168,209,0.10)",
    },
  ];

  return (
    <div className="text-left">

      {/* =============================================
          HERO SECTION — true full-bleed
         ============================================= */}
      <section
        className="relative overflow-hidden text-white shadow-2xl"
        style={{
          minHeight: "460px",
          boxShadow: "0 24px 64px rgba(59,111,168,0.28), 0 4px 16px rgba(59,111,168,0.14)",
          borderRadius: "0 0 2rem 2rem",
        }}
      >
        {/* ── Full-bleed background image ── */}
        <div className="absolute inset-0 bg-[#0E1E3A]">
          <img
            src={heroBannerUrl}
            alt="Hero Banner"
            onLoad={() => setIsBannerLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${
              isBannerLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-105 blur-xs"
            }`}
          />
        </div>

        {/* ── Sky-blue colour wash so the image has the right palette ── */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(30,43,64,0.38)", mixBlendMode: "multiply" }}
        />

        {/* ── Bottom-to-top dark gradient for text legibility ── */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(15,27,54,0.88) 0%, rgba(15,27,54,0.55) 45%, rgba(15,27,54,0.15) 75%, transparent 100%)",
          }}
        />

        {/* ── Floating cloud blob accents ── */}
        <div
          className="absolute top-[-40px] right-[-40px] w-64 h-64 rounded-full animate-float-cloud opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(127,168,209,0.6) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-60px] left-[8%] w-48 h-48 rounded-full animate-float-cloud stagger-4 opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #7FA8D1 0%, transparent 70%)" }}
        />

        {/* ── Subtle grid texture ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* ── Content pinned to the bottom ── */}
        <div className="relative z-10 flex flex-col justify-end h-full min-h-[420px] p-7 md:p-12 space-y-5">
          {/* badge */}
          <span
            className="animate-fade-in-up self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
            style={{
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.26)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse-soft" />
            এইচএসসি প্রস্তুতি ২০২৬
          </span>

          <h1
            className="animate-fade-in-up stagger-1 text-3xl md:text-5xl font-black leading-tight max-w-2xl"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.45)" }}
          >
            মানবিক বিভাগের জন্য ত্রিশালের সেরা কলেজ কোচিং সেন্টার
          </h1>

          <p
            className="animate-fade-in-up stagger-2 text-sm md:text-base leading-relaxed max-w-xl"
            style={{ color: "rgba(255,255,255,0.85)", textShadow: "0 1px 8px rgba(0,0,0,0.3)" }}
          >
            বাংলা, ইংরেজি, ইতিহাস, যুক্তিবিদ্যা, পৌরনীতি, অর্থনীতি ও সমাজবিজ্ঞানসহ মানবিক বিভাগের
            সকল বিষয়ের বিশেষায়িত ও মানসম্মত শিক্ষাদান।
          </p>

          <div className="animate-fade-in-up stagger-3 flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/result"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-[#2F5A8A] transition-all duration-200 hover:scale-[1.04] hover:shadow-xl"
              style={{
                background: "rgba(255,255,255,0.96)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.22)",
              }}
            >
              <Search className="w-4 h-4" />
              পরীক্ষার ফলাফল খুঁজুন
            </Link>
            <Link
              href="/routine"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:scale-[1.04]"
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.30)",
                backdropFilter: "blur(10px)",
              }}
            >
              ক্লাস রুটিন দেখুন
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* floating star */}
        <Star className="absolute top-6 right-8 w-6 h-6 text-white/20 animate-spin-slow pointer-events-none hidden md:block" />
      </section>

      {/* All remaining sections in a centered, padded container */}
      <div className="max-w-5xl mx-auto px-5 pb-12 space-y-16 pt-12">
      {/* =============================================
          STATS COUNTER SECTION
         ============================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in-up stagger-2">
        {[
          { icon: Users,         count: animStudents, label: "ভর্তিকৃত শিক্ষার্থী",  accent: "#3B6FA8" },
          { icon: GraduationCap, count: animTeachers, label: "অভিজ্ঞ শিক্ষক মণ্ডলী", accent: "#5B8EC0" },
          { icon: Calendar,      count: animBatches,  label: "সক্রিয় ব্যাচ সমূহ",    accent: "#2F5A8A" },
        ].map(({ icon: Icon, count, label, accent }, i) => (
          <div
            key={label}
            className={`glass-card rounded-2xl p-7 flex flex-col items-center text-center gap-3 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg animate-count-up stagger-${i + 1}`}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `${accent}18`, color: accent }}
            >
              <Icon className="w-6 h-6" />
            </div>
            <p className="text-3xl font-extrabold" style={{ color: accent }}>
              {loading ? "—" : count.toLocaleString("bn-BD")}+
            </p>
            <p className="text-xs font-semibold text-slate-500">{label}</p>
          </div>
        ))}
      </section>

      {/* =============================================
          FEATURES GRID
         ============================================= */}
      <section className="space-y-8">
        <div className="text-center space-y-2 animate-fade-in-up">
          <h2 className="text-2xl font-bold" style={{ color: "#1E2B40" }}>আমাদের অনন্য সেবাসমূহ</h2>
          <p className="text-slate-400 text-xs max-w-lg mx-auto leading-relaxed">
            এইচএসসি পরীক্ষায় মানবিক বিভাগের শিক্ষার্থীদের শতভাগ জিপিএ-৫ অর্জনের লক্ষ্যে আধুনিক ও বৈজ্ঞানিক শিক্ষা পদ্ধতি।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon: Icon, title, desc, color, bg }, i) => (
            <div
              key={title}
              className={`glass-card rounded-2xl p-6 space-y-3.5 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg cursor-default animate-fade-in-up stagger-${i + 1}`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: bg, color }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm" style={{ color: "#1E2B40" }}>{title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =============================================
          RESULT CTA BANNER
         ============================================= */}
      <section
        className="relative overflow-hidden rounded-3xl p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in-up"
        style={{
          background: `
            radial-gradient(ellipse 80% 70% at 90% 50%, rgba(127,168,209,0.18) 0%, transparent 60%),
            linear-gradient(135deg, #1E2B40 0%, #2F5A8A 60%, #3B6FA8 100%)
          `,
          boxShadow: "0 16px 48px rgba(59,111,168,0.22)",
        }}
      >
        {/* cloud blob */}
        <div
          className="absolute right-0 top-0 w-64 h-full pointer-events-none opacity-10"
          style={{
            background: "radial-gradient(ellipse at 100% 50%, #fff 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 space-y-2">
          <p className="text-xs font-bold text-sky-300 uppercase tracking-widest">ফলাফল পোর্টাল</p>
          <h2 className="text-xl font-bold text-white font-sans">
            অনলাইনে আপনার পরীক্ষার মার্কশিট খুঁজছেন?
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(127,168,209,0.85)" }}>
            কোচিং সেন্টারে অনুষ্ঠিত পরীক্ষার ফলাফল রোল বা স্টুডেন্ট আইডি দিয়ে খুব সহজেই সংগ্রহ করুন।
          </p>
        </div>

        <Link
          href="/result"
          className="relative z-10 inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-[1.04] shrink-0"
          style={{
            background: "rgba(255,255,255,0.96)",
            color: "#2F5A8A",
            boxShadow: "0 4px 20px rgba(0,0,0,0.16)",
          }}
        >
          <span>রেজাল্ট অনুসন্ধান করুন</span>
          <Search className="w-4 h-4 shrink-0" />
        </Link>
      </section>
      </div>
    </div>
  );
}
