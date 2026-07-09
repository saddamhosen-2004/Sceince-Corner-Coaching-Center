"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, User, Search, Filter, Layers, Lock } from "lucide-react";
import Image from "next/image";

interface PublicStudent {
  id: string;
  name: string;
  photo_url: string | null;
  batch_id: string;
  college_name: string;
  college_year: string;
  student_id: string;
  batch_name: string;
}

interface Batch {
  id: string;
  name: string;
}

export default function PublicStudentsPage() {
  const supabase = createClient();

  const [students, setStudents] = useState<PublicStudent[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hidePublicStudents, setHidePublicStudents] = useState<boolean>(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBatch, setFilterBatch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch privacy settings
      const { data: settingsData } = await supabase
        .from("site_settings")
        .select("key, value");
      
      const hideStudents = settingsData?.find(s => s.key === "hide_public_students")?.value === "true";
      setHidePublicStudents(hideStudents);

      if (hideStudents) {
        setLoading(false);
        return;
      }

      // 2. Fetch public students view (only public columns)
      const { data: stdData, error: stdErr } = await supabase
        .from("view_public_students")
        .select("*")
        .order("name", { ascending: true });

      if (stdErr) throw stdErr;

      // 3. Fetch batches
      const { data: batchData, error: batchErr } = await supabase
        .from("batches")
        .select("id, name")
        .order("name", { ascending: true });

      if (batchErr) throw batchErr;

      setStudents(stdData || []);
      setBatches(batchData || []);
    } catch (err: any) {
      setError(err.message || "শিক্ষার্থী তালিকা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredStudents = students.filter((student) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      student.name.toLowerCase().includes(term) ||
      student.student_id.toLowerCase().includes(term) ||
      student.college_name.toLowerCase().includes(term);
    const matchesBatch = filterBatch === "" || student.batch_id === filterBatch;
    return matchesSearch && matchesBatch;
  });

  if (!loading && hidePublicStudents) {
    return (
      <div className="max-w-5xl mx-auto px-5 py-8 md:py-12">
        <div className="py-20 text-center bg-white border border-slate-200/60 rounded-3xl max-w-xl mx-auto shadow-xs space-y-4 p-6 font-sans">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-50 border border-slate-100 text-slate-400">
            <Lock className="w-6 h-6 text-teal-600" />
          </div>
          <h2 className="text-lg font-black text-slate-800">তথ্যটি গোপন রাখা হয়েছে</h2>
          <p className="text-slate-500 text-xs max-w-xs mx-auto leading-relaxed">
            কোচিং পলিসি ও শিক্ষার্থীদের ব্যক্তিগত সুরক্ষার স্বার্থে শিক্ষার্থী তালিকাটি পাবলিক ওয়েবসাইট থেকে গোপন রাখা হয়েছে।
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-8 md:py-12">
    <div className="space-y-8 text-left">
      <div>
        <h1 className="text-2xl font-black text-slate-800 font-sans">শিক্ষার্থী তালিকা</h1>
        <p className="text-slate-400 text-xs mt-1">মানবিক কলেজ কোচিং সেন্টারের নিবন্ধিত শিক্ষার্থীদের সংক্ষিপ্ত বিবরণী</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-slate-200/60 rounded-2xl shadow-xs">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="শিক্ষার্থীর নাম, রোল আইডি বা কলেজ সার্চ করুন..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs text-left"
          />
        </div>

        <div className="flex items-center justify-start gap-2">
          <span className="text-slate-400 text-xs shrink-0 flex items-center gap-1 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            ব্যাচ ফিল্টার:
          </span>
          <select
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs font-semibold"
          >
            <option value="">সকল ব্যাচ</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Cards Directory */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 bg-white border border-slate-200/60 rounded-2xl shadow-xs">
          <Loader2 className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-xs">শিক্ষার্থী তালিকা প্রস্তুত করা হচ্ছে...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl text-xs">
          {error}
        </div>
      ) : filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-xs flex flex-col items-center text-center transition-all md:hover:shadow-md md:hover:scale-[1.01]"
            >
              {/* Photo */}
              <div className="w-20 h-20 rounded-full overflow-hidden relative bg-slate-50 border border-slate-100 mb-4">
                <Image
                  src={student.photo_url || "/images/demo/avatar_student.png"}
                  alt={student.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Identity */}
              <span className="px-2 py-0.5 bg-teal-50 border border-teal-100 text-teal-700 rounded-md font-bold text-[10px] mb-2 font-mono">
                {student.student_id}
              </span>
              <h3 className="font-bold text-slate-900 text-sm mb-1">{student.name}</h3>
              <p className="text-slate-500 text-xs">{student.college_name}</p>
              <p className="text-slate-400 text-[10px] mt-0.5">{student.college_year}</p>

              {/* Batch label */}
              <div className="mt-4 pt-3 border-t border-slate-50 w-full flex items-center justify-center gap-1.5 text-slate-500 text-xs font-semibold">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>ব্যাচ: {student.batch_name || "নির্ধারিত নেই"}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-400 text-sm bg-white border border-slate-200/60 rounded-2xl shadow-xs">
          কোন শিক্ষার্থী পাওয়া যায়নি।
        </div>
      )}
    </div>
    </div>
  );
}
