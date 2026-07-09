"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, User, Award } from "lucide-react";
import Image from "next/image";

interface PublicDirector {
  id: string;
  name: string;
  position: string;
  photo_url: string | null;
}

export default function PublicDirectorsPage() {
  const supabase = createClient();

  const [directors, setDirectors] = useState<PublicDirector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDirectors = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("view_public_directors")
        .select("*")
        .order("name", { ascending: true });

      if (fetchErr) throw fetchErr;
      setDirectors(data || []);
    } catch (err: any) {
      setError(err.message || "পরিচালক তালিকা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectors();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-5 py-8 md:py-12">
    <div className="space-y-8 text-left font-sans">
      <div>
        <h1 className="text-2xl font-black text-slate-800">পরিচালনা পর্ষদ</h1>
        <p className="text-slate-400 text-xs mt-1">মানবিক কলেজ কোচিং সেন্টারের স্বপ্নদ্রষ্টা ও পরিচালকবৃন্দ</p>
      </div>

      {/* Directors Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 bg-white border border-slate-200/60 rounded-2xl shadow-xs">
          <Loader2 className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-xs">পরিচালক তালিকা প্রস্তুত হচ্ছে...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl text-xs animate-fade-in">
          {error}
        </div>
      ) : directors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {directors.map((director) => (
            <div
              key={director.id}
              className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-xs flex flex-col items-center text-center transition-all md:hover:shadow-md md:hover:scale-[1.01]"
            >
              {/* Photo */}
              <div className="w-20 h-20 rounded-full overflow-hidden relative bg-slate-50 border border-slate-100 mb-3 shadow-sm animate-fade-in">
                <Image
                  src={director.photo_url || "/images/demo/avatar_director.png"}
                  alt={director.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Title & Position */}
              <h3 className="font-bold text-slate-900 text-sm mb-0.5">{director.name}</h3>
              
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 w-full flex items-center justify-center gap-1 text-slate-600 text-xs font-semibold">
                <Award className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>{director.position}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-400 text-sm bg-white border border-slate-200/60 rounded-2xl shadow-xs">
          কোনো পরিচালকের বিবরণ পাওয়া যায়নি।
        </div>
      )}
    </div>
    </div>
  );
}
