"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Calendar, Clock, BookOpen, User, Layers, Download } from "lucide-react";
import { toPng } from "html-to-image";
import Image from "next/image";

interface Routine {
  id: string;
  batch_id: string;
  day_of_week: string;
  time: string;
  subject_id: string;
  teacher_id: string;
  batches?: {
    name: string;
  } | null;
  subjects?: {
    name: string;
  } | null;
  teachers?: {
    name: string;
  } | null;
}

interface Batch {
  id: string;
  name: string;
}

export default function PublicRoutinePage() {
  const supabase = createClient();
  const routineRef = useRef<HTMLDivElement>(null);

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const daysOfWeek = [
    "শনিবার",
    "রবিবার",
    "সোমবার",
    "মঙ্গলবার",
    "বুধবার",
    "বৃহস্পতিবার",
    "শুক্রবার",
  ];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch routines
      const { data: routineData, error: routineErr } = await supabase
        .from("routines")
        .select(`
          id,
          batch_id,
          day_of_week,
          time,
          subject_id,
          teacher_id,
          batches ( name ),
          subjects ( name ),
          teachers ( name )
        `);

      if (routineErr) throw routineErr;

      // 2. Fetch batches
      const { data: batchData, error: batchErr } = await supabase
        .from("batches")
        .select("id, name")
        .order("name", { ascending: true });

      if (batchErr) throw batchErr;

      // 3. Fetch logo
      try {
        const { data: logoData } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "logo_url")
          .single();
        if (logoData?.value) {
          setLogoUrl(logoData.value);
        }
      } catch (err) {
        console.error("Failed to load logo in routine:", err);
      }

      const mappedRoutines = (routineData || []).map((r: any) => ({
        id: r.id,
        batch_id: r.batch_id,
        day_of_week: r.day_of_week,
        time: r.time,
        subject_id: r.subject_id,
        teacher_id: r.teacher_id,
        batches: Array.isArray(r.batches) ? r.batches[0] : r.batches,
        subjects: Array.isArray(r.subjects) ? r.subjects[0] : r.subjects,
        teachers: Array.isArray(r.teachers) ? r.teachers[0] : r.teachers,
      }));

      setRoutines(mappedRoutines);
      setBatches(batchData || []);
      
      if (batchData && batchData.length > 0) {
        setSelectedBatchId(batchData[0].id);
      }
    } catch (err: any) {
      setError(err.message || "রুটিন লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const downloadRoutineImage = async () => {
    if (!routineRef.current) return;
    setDownloading(true);
    
    // 1. Create a 1px container with overflow:hidden to hide it from view without using opacity/visibility
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "0px";
    container.style.left = "0px";
    container.style.width = "1px";
    container.style.height = "1px";
    container.style.overflow = "hidden";
    container.style.zIndex = "-9999";
    container.style.pointerEvents = "none";

    const wrapper = document.createElement("div");
    wrapper.style.width = "768px";
    
    // 2. Clone the element
    const clone = routineRef.current.cloneNode(true) as HTMLElement;
    clone.style.position = "relative";
    clone.style.top = "0px";
    clone.style.left = "0px";
    clone.style.width = "768px";
    clone.style.minWidth = "768px";
    clone.style.maxWidth = "768px";
    
    // 3. Append to DOM
    wrapper.appendChild(clone);
    container.appendChild(wrapper);
    document.body.appendChild(container);
    
    // 4. Reveal branding header and footer on the clone
    const header = clone.querySelector(".branding-header");
    const footer = clone.querySelector(".branding-footer");
    if (header) header.classList.remove("hidden");
    if (footer) footer.classList.remove("hidden");
    
    // Remove animations to prevent elements starting at opacity-0 in html-to-image
    [clone, ...clone.querySelectorAll("*")].forEach((el) => {
      const classes = Array.from(el.classList);
      classes.forEach((c) => {
        if (c.startsWith("animate-") || c.startsWith("stagger-")) {
          el.classList.remove(c);
        }
      });
    });

    // Strip lazy-loading and add crossorigin to image elements in the clone to prevent CORS canvas tainting
    clone.querySelectorAll("img").forEach((img) => {
      img.removeAttribute("loading");
      img.setAttribute("loading", "eager");
      img.setAttribute("crossorigin", "anonymous");
    });

    // Disable dark mode temporarily on document root during capture to prevent dark theme inversion
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    const hadDarkHTML = htmlElement.classList.contains("dark");
    const hadDarkBody = bodyElement.classList.contains("dark");
    if (hadDarkHTML) htmlElement.classList.remove("dark");
    if (hadDarkBody) bodyElement.classList.remove("dark");
    
    try {
      // 5. Generate PNG from the clone (not the wrapper)
      const dataUrl = await toPng(clone, {
        cacheBust: true,
        fontEmbedCSS: "", // Skip font embedding to prevent mobile Safari freezes/blank renders
        backgroundColor: "#f8fafc",
        style: {
          padding: "24px",
          borderRadius: "0px",
        }
      });
      
      const link = document.createElement("a");
      const batchName = batches.find(b => b.id === selectedBatchId)?.name || "Routine";
      link.download = `Routine-${batchName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating routine image:", err);
      alert("রুটিন ইমেজ তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      // Restore dark mode if it was enabled
      if (hadDarkHTML) htmlElement.classList.add("dark");
      if (hadDarkBody) bodyElement.classList.add("dark");

      // Clean up DOM
      document.body.removeChild(container);
      setDownloading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter routines by selected batch
  const filteredRoutines = routines.filter((r) => r.batch_id === selectedBatchId);

  // Group routines by day of the week
  const getRoutinesForDay = (day: string) => {
    return filteredRoutines.filter(
      (r) => r.day_of_week.trim() === day.trim()
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-5 py-8 md:py-12">
    <div className="space-y-8 text-left font-sans">
      <div>
        <h1 className="text-2xl font-black text-slate-800">ক্লাস রুটিন</h1>
        <p className="text-slate-400 text-xs mt-1">ব্যাচভিত্তিক সাপ্তাহিক ক্লাসের সময়সূচী</p>
      </div>

      {/* Batch selector tabs & download button */}
      {batches.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex flex-wrap items-center justify-start gap-2">
            {batches.map((batch) => (
              <button
                key={batch.id}
                onClick={() => setSelectedBatchId(batch.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                  selectedBatchId === batch.id
                    ? "bg-teal-600 text-white shadow-md shadow-teal-500/10"
                    : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-600"
                }`}
              >
                {batch.name}
              </button>
            ))}
          </div>

          {selectedBatchId && (
            <button
              onClick={downloadRoutineImage}
              disabled={downloading}
              className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-[1.02] disabled:opacity-50 cursor-pointer self-start sm:self-auto"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ছবি তৈরি হচ্ছে...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  রুটিন ডাউনলোড
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Routine Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 bg-white border border-slate-200/60 rounded-2xl shadow-xs">
          <Loader2 className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-xs">রুটিন লোড হচ্ছে...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl text-xs">
          {error}
        </div>
      ) : selectedBatchId ? (
        <div ref={routineRef} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200/50 space-y-6">
          
          {/* Download Branding Header */}
          <div className="branding-header hidden flex items-center justify-between border-b border-slate-200/60 pb-5">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-white border border-slate-200/60 p-1 flex items-center justify-center shrink-0">
                  <Image
                    src={logoUrl}
                    alt="Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-600 text-white font-bold text-xl shrink-0">
                  ম
                </div>
              )}
              <div>
                <h2 className="font-black text-slate-800 text-base leading-snug">মানবিক কলেজ কোচিং সেন্টার</h2>
                <p className="text-slate-500 text-xs mt-0.5">এইচএসসি মানবিক বিভাগের বিশেষায়িত কোচিং</p>
              </div>
            </div>
            
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold rounded-full">
                ব্যাচ: {batches.find(b => b.id === selectedBatchId)?.name || ""}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">সাপ্তাহিক ক্লাস রুটিন</p>
            </div>
          </div>

          {/* Days list */}
          <div className="space-y-4">
            {daysOfWeek.map((day) => {
              const dayRoutines = getRoutinesForDay(day);
              return (
                <div
                  key={day}
                  className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-start gap-2 md:w-36 shrink-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 text-teal-600">
                      <Calendar className="w-4 h-4 shrink-0" />
                    </div>
                    <span className="font-bold text-slate-800 text-sm">{day}</span>
                  </div>

                  {/* Day Classes Schedule list */}
                  <div className="flex-1">
                    {dayRoutines.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dayRoutines.map((routine) => (
                          <div
                            key={routine.id}
                            className="bg-slate-50 border border-slate-200/40 rounded-xl p-3.5 space-y-2 text-left"
                          >
                            <div className="flex items-center justify-start gap-1.5 text-xs text-slate-500">
                              <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span className="font-semibold">{routine.time}</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm">
                              {routine.subjects?.name}
                            </h4>
                            <p className="text-[10px] text-slate-400 flex items-center justify-start gap-1">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>শিক্ষক: {routine.teachers?.name || "নিযুক্ত নেই"}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs italic py-2 md:text-left">এই দিনে কোনো ক্লাস নেই</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Download Branding Footer */}
          <div className="branding-footer hidden flex items-center justify-between border-t border-slate-200/60 pt-4 text-[10px] text-slate-400 font-medium">
            <span>© ২০২৬ মানবিক কলেজ কোচিং সেন্টার। সর্বস্বত্ব সংরক্ষিত।</span>
            <span>Developed with ❤️ by Saddam Bin Mazid</span>
          </div>

        </div>
      ) : (
        <div className="py-20 text-center text-slate-400 text-sm bg-white border border-slate-200/60 rounded-2xl shadow-xs">
          রুটিন দেখার জন্য আগে অ্যাডমিন প্যানেলে ব্যাচ তৈরি করুন।
        </div>
      )}
    </div>
    </div>
  );
}
