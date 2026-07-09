"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, User, BookOpen, GraduationCap } from "lucide-react";
import Image from "next/image";

interface PublicTeacher {
  id: string;
  name: string;
  photo_url: string | null;
  qualification: string;
  subject_name: string | null;
  batch_name: string | null;
}

export default function PublicTeachersPage() {
  const supabase = createClient();

  const [teachers, setTeachers] = useState<PublicTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("view_public_teachers")
        .select("*")
        .order("name", { ascending: true });

      if (fetchErr) throw fetchErr;
      setTeachers(data || []);
    } catch (err: any) {
      setError(err.message || "শিক্ষক তালিকা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-5 py-8 md:py-12">
    <div className="space-y-8 text-left font-sans">
      <div>
        <h1 className="text-2xl font-black text-slate-800">শিক্ষক মণ্ডলী</h1>
        <p className="text-slate-400 text-xs mt-1">মানবিক কলেজ কোচিং সেন্টারের অভিজ্ঞ ও দক্ষ মেন্টরবৃন্দ</p>
      </div>

      {/* Teacher Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 bg-white border border-slate-200/60 rounded-2xl shadow-xs">
          <Loader2 className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-xs">শিক্ষক প্যানেল প্রস্তুত হচ্ছে...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl text-xs">
          {error}
        </div>
      ) : teachers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-xs flex flex-col items-center text-center transition-all md:hover:shadow-md md:hover:scale-[1.01]"
            >
              {/* Photo */}
              <div className="w-20 h-20 rounded-full overflow-hidden relative bg-slate-50 border border-slate-100 mb-4">
                <Image
                  src={teacher.photo_url || "/images/demo/avatar_teacher.png"}
                  alt={teacher.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Title & Qualification */}
              <h3 className="font-bold text-slate-900 text-sm mb-1">{teacher.name}</h3>
              <p className="text-slate-500 text-xs flex items-center justify-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{teacher.qualification}</span>
              </p>

              {/* Subject Tag */}
              <div className="mt-4 pt-3 border-t border-slate-50 w-full flex items-center justify-center gap-1.5 text-slate-600 text-xs font-semibold">
                <BookOpen className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>
                  বিষয়:{" "}
                  <span className="text-teal-700 font-bold">
                    {teacher.subject_name || "নিযুক্ত নেই"}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-400 text-sm bg-white border border-slate-200/60 rounded-2xl shadow-xs">
          কোন শিক্ষক যুক্ত করা হয়নি।
        </div>
      )}
    </div>
    </div>
  );
}
