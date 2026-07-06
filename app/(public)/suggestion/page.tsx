"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, FileDown, BookOpen, Clock, FileText, ChevronDown, ChevronUp, Filter } from "lucide-react";

interface Batch {
  id: string;
  name: string;
}

interface Suggestion {
  id: string;
  subject_id: string;
  batch_id: string | null;
  exam_name: string;
  content_text: string | null;
  file_url: string | null;
  created_at: string;
  subjects?: {
    name: string;
  } | null;
  batches?: {
    name: string;
  } | null;
}

export default function PublicSuggestionsPage() {
  const supabase = createClient();

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filterBatch, setFilterBatch] = useState("");
  
  // Track expanded suggestion text cards
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch suggestions with subjects and batches relations
      const { data: sugData, error: fetchErr } = await supabase
        .from("suggestions")
        .select("*, subjects(name), batches(name)")
        .order("created_at", { ascending: false });

      if (fetchErr) throw fetchErr;

      // 2. Fetch batches
      const { data: batchData, error: batchErr } = await supabase
        .from("batches")
        .select("id, name")
        .order("name", { ascending: true });

      if (batchErr) throw batchErr;

      const mapped = (sugData || []).map((sug: any) => ({
        ...sug,
        subjects: Array.isArray(sug.subjects) ? sug.subjects[0] : sug.subjects,
        batches: Array.isArray(sug.batches) ? sug.batches[0] : sug.batches,
      }));

      setSuggestions(mapped);
      setBatches(batchData || []);
    } catch (err: any) {
      setError(err.message || "সাজেশন তালিকা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Filter logic: show match or general suggestion
  const filteredSuggestions = suggestions.filter((sug) => {
    if (filterBatch === "") return true;
    return sug.batch_id === filterBatch || sug.batch_id === null;
  });

  return (
    <div className="max-w-5xl mx-auto px-5 py-8 md:py-12">
    <div className="space-y-8 text-left font-sans">
      <div>
        <h1 className="text-2xl font-black text-slate-800">পরীক্ষার সাজেশন</h1>
        <p className="text-slate-400 text-xs mt-1">এইচএসসি বোর্ড ও অন্যান্য ফাইনাল পরীক্ষার অধ্যায়ভিত্তিক বিশেষ সাজেশন সমূহ</p>
      </div>

      {/* Filters */}
      {!loading && !error && batches.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-slate-200/60 rounded-2xl shadow-xs">
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
      )}

      {/* Suggestions Roster */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 bg-white border border-slate-200/60 rounded-2xl shadow-xs">
          <Loader2 className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-xs">সাজেশন তৈরি হচ্ছে...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl text-xs">
          {error}
        </div>
      ) : filteredSuggestions.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto">
          {filteredSuggestions.map((sug) => {
            const isExpanded = expandedId === sug.id;
            return (
              <div
                key={sug.id}
                className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-xs space-y-4 transition-all hover:shadow-md"
              >
                {/* Header card info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Title & Icon (Left side) */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 text-teal-600 shrink-0">
                      <BookOpen className="w-5 h-5 shrink-0" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {sug.subjects?.name} সাজেশন
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                        <span>পরীক্ষা: {sug.exam_name}</span>
                        {sug.batches?.name ? (
                          <span className="px-1.5 py-0.5 bg-teal-50 border border-teal-100 text-teal-700 rounded-md font-bold text-[9px]">
                            ব্যাচ: {sug.batches.name}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-md font-semibold text-[9px]">
                            সাধারণ সাজেশন
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(sug.created_at).toLocaleDateString("bn-BD")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons (Right side) */}
                  <div className="flex items-center gap-2">
                    {sug.content_text && (
                      <button
                        onClick={() => toggleExpand(sug.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            <span>বিবরণ লুকান</span>
                            <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            <span>বিবরণ দেখুন</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    )}

                    {sug.file_url ? (
                      <a
                        href={sug.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>ডাউনলোড PDF</span>
                      </a>
                    ) : (
                      sug.content_text && null
                    )}
                  </div>

                </div>

                {/* Expanded text details */}
                {isExpanded && sug.content_text && (
                  <div className="pt-4 border-t border-slate-100 text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-xl text-left whitespace-pre-line animate-fade-in">
                    {sug.content_text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-400 text-sm bg-white border border-slate-200/60 rounded-2xl shadow-xs">
          আপাতত কোনো বিষয়ের সাজেশন প্রকাশিত হয়নি। নিয়মিত আপডেট পেতে চোখ রাখুন।
        </div>
      )}
    </div>
    </div>
  );
}
