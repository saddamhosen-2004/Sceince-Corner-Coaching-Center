"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadImageToImageKit } from "@/lib/imagekit";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  BookOpen,
  FileDown,
  UploadCloud,
  File,
  X,
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
}

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
  subjects?: {
    name: string;
  } | null;
  batches?: {
    name: string;
  } | null;
}

export default function SuggestionsPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);
  const [subjectId, setSubjectId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [examName, setExamName] = useState("");
  const [contentText, setContentText] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Loaders
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Delete states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [suggestionToDelete, setSuggestionToDelete] = useState<Suggestion | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch suggestions
      const { data: sugData, error: sugErr } = await supabase
        .from("suggestions")
        .select("*, subjects(name), batches(name)")
        .order("created_at", { ascending: false });

      if (sugErr) throw sugErr;

      // 2. Fetch subjects
      const { data: subData, error: subErr } = await supabase
        .from("subjects")
        .select("id, name")
        .order("name", { ascending: true });

      if (subErr) throw subErr;

      // 3. Fetch batches
      const { data: batchData, error: batchErr } = await supabase
        .from("batches")
        .select("id, name")
        .order("name", { ascending: true });

      if (batchErr) throw batchErr;

      const mappedSuggestions = (sugData || []).map((sug: any) => ({
        ...sug,
        subjects: Array.isArray(sug.subjects) ? sug.subjects[0] : sug.subjects,
        batches: Array.isArray(sug.batches) ? sug.batches[0] : sug.batches,
      }));

      setSuggestions(mappedSuggestions);
      setSubjects(subData || []);
      setBatches(batchData || []);
    } catch (err: any) {
      setError(err.message || "সাজেশন তালিকা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle PDF/Document upload directly to ImageKit
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate: PDF or Images
    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      setError("অনুগ্রহ করে শুধুমাত্র PDF অথবা ইমেজ ফাইল আপলোড করুন।");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("ফাইলের সাইজ ৫MB এর বেশি হওয়া যাবে না।");
      return;
    }

    setUploadingFile(true);
    setError(null);
    try {
      const url = await uploadImageToImageKit(file, "suggestions");
      setFileUrl(url);
      setFileName(file.name);
      setSuccess("ফাইল সফলভাবে আপলোড করা হয়েছে।");
    } catch (err: any) {
      setError("ফাইল আপলোড করতে ব্যর্থ হয়েছে: " + (err.message || "সার্ভার এরর।"));
    } finally {
      setUploadingFile(false);
    }
  };

  const openAddModal = () => {
    setEditingSuggestion(null);
    setSubjectId("");
    setBatchId("");
    setExamName("");
    setContentText("");
    setFileUrl(null);
    setFileName(null);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (suggestion: Suggestion) => {
    setEditingSuggestion(suggestion);
    setSubjectId(suggestion.subject_id);
    setBatchId(suggestion.batch_id || "");
    setExamName(suggestion.exam_name);
    setContentText(suggestion.content_text || "");
    setFileUrl(suggestion.file_url);
    setFileName(suggestion.file_url ? "সংযুক্ত ফাইল" : null);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!subjectId || !examName.trim()) {
      setError("অনুগ্রহ করে বিষয় এবং পরীক্ষার নাম পূরণ করুন।");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        subject_id: subjectId,
        batch_id: batchId === "" ? null : batchId,
        exam_name: examName,
        content_text: contentText === "" ? null : contentText,
        file_url: fileUrl,
      };

      if (editingSuggestion) {
        const { error: updateErr } = await supabase
          .from("suggestions")
          .update(payload)
          .eq("id", editingSuggestion.id);

        if (updateErr) throw updateErr;
        setSuccess("সাজেশন সফলভাবে আপডেট করা হয়েছে।");
      } else {
        const { error: insertErr } = await supabase
          .from("suggestions")
          .insert([payload]);

        if (insertErr) throw insertErr;
        setSuccess("নতুন সাজেশন সফলভাবে যুক্ত করা হয়েছে।");
      }

      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || "সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (suggestion: Suggestion) => {
    setSuggestionToDelete(suggestion);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!suggestionToDelete) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: deleteErr } = await supabase
        .from("suggestions")
        .delete()
        .eq("id", suggestionToDelete.id);

      if (deleteErr) throw deleteErr;

      setSuccess("সাজেশনটি সফলভাবে মুছে ফেলা হয়েছে।");
      setDeleteConfirmOpen(false);
      setSuggestionToDelete(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || "মুছে ফেলতে সমস্যা হয়েছে।");
      setDeleteConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-slate-500 text-sm">বিভিন্ন বিষয়ের পরীক্ষার জন্য রিলিজকৃত সাজেশন প্যানেল</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন সাজেশন তৈরি করুন</span>
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Suggestion List table */}
      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">সাজেশন তালিকা লোড হচ্ছে...</p>
          </div>
        ) : suggestions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-500 font-semibold">
                  <th className="px-6 py-4">বিষয়</th>
                  <th className="px-6 py-4">ব্যাচ</th>
                  <th className="px-6 py-4">পরীক্ষার নাম</th>
                  <th className="px-6 py-4">ফাইল লিংক</th>
                  <th className="px-6 py-4">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suggestions.map((sug) => (
                  <tr key={sug.id} className="text-slate-700 hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-900">{sug.subjects?.name}</td>
                    <td className="px-6 py-4 font-bold text-teal-700">{sug.batches?.name || "সকল ব্যাচ"}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{sug.exam_name}</td>
                    <td className="px-6 py-4">
                      {sug.file_url ? (
                        <a
                          href={sug.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>ডাউনলোড PDF</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs italic">ফাইল সংযুক্ত নেই</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-start gap-2">
                        <button
                          onClick={() => openEditModal(sug)}
                          className="p-1.5 hover:bg-teal-50 hover:text-teal-600 rounded-lg text-slate-400 transition-colors"
                          title="সম্পাদনা করুন"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(sug)}
                          className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400 text-sm">
            কোন সাজেশন্স রিলিজ করা হয়নি।
          </div>
        )}
      </div>

      {/* Add / Edit Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8 animate-scale-up">
            <div className="flex items-center justify-between h-14 px-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>{editingSuggestion ? "সাজেশন তথ্য সংশোধন" : "নতুন সাজেশন তৈরি করুন"}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    বিষয় নির্বাচন
                  </label>
                  <select
                    value={subjectId}
                    required
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs font-bold"
                  >
                    <option value="">বিষয় নির্বাচন করুন</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    ব্যাচ নির্বাচন (ঐচ্ছিক)
                  </label>
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs font-bold"
                  >
                    <option value="">সকল ব্যাচ</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                  পরীক্ষার নাম (যেমন: প্রি-টেস্ট পরীক্ষা / ফাইনাল পরীক্ষা)
                </label>
                <input
                  type="text"
                  required
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="যেমন: নির্বাচনী পরীক্ষা"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                  সাজেশন সংক্ষিপ্ত বিবরণী / টেক্সট
                </label>
                <textarea
                  rows={4}
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder="এখানে সাজেশনের বিবরণ বা গুরুত্বপূর্ণ টপিক সমূহের নাম লিখতে পারেন..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                />
              </div>

              {/* PDF Document Upload directly to ImageKit */}
              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                  পিডিএফ / ছবি সংযুক্তকরণ (PDF or Images)
                </label>
                
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="application/pdf,image/*"
                    className="hidden"
                  />

                  {fileUrl ? (
                    <div className="flex-1 flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800">
                      <button
                        type="button"
                        onClick={() => {
                          setFileUrl(null);
                          setFileName(null);
                        }}
                        className="p-1 hover:bg-indigo-100 rounded text-indigo-600 cursor-pointer"
                      >
                        <X className="w-4 h-4 shrink-0" />
                      </button>
                      <span className="font-semibold truncate max-w-xs">{fileName || "ফাইল আপলোড করা আছে"}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={uploadingFile}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex flex-col items-center justify-center py-4 border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50 hover:bg-white text-slate-500 hover:text-teal-600 rounded-xl cursor-pointer transition-all"
                    >
                      {uploadingFile ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mb-1 text-teal-600" />
                          <span className="text-[10px]">ফাইল প্রসেস হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-6 h-6 mb-1" />
                          <span className="text-xs font-semibold">ডকুমেন্ট আপলোড করুন (PDF/Image)</span>
                          <span className="text-[9px] text-slate-400 mt-0.5">সাইজ সর্বোচ্চ ৫MB</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingFile}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-600/70 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <span>সংরক্ষণ করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-scale-up">
            <div className="p-6 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-rose-500 mb-2">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">
                আপনি কি নিশ্চিত মুছে ফেলতে চান?
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed text-center">
                আপনি কি নিশ্চিতভাবে এই সাজেশন রেকর্ডটি মুছে ফেলতে চান? এটি মুছে ফেললে ডাটাবেজ থেকে এর পিডিএফ ও সমস্ত বিবরণ স্থায়ীভাবে মুছে যাবে।
              </p>
            </div>

            <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
              >
                না, বাতিল
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                {submitting ? "মুছা হচ্ছে..." : "হ্যাঁ, মুছে ফেলুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
