"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react";

interface Teacher {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  teacher_id: string | null;
  teachers?: {
    name: string;
  } | null;
}

export default function SubjectsPage() {
  const supabase = createClient();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [name, setName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch subjects with their assigned teacher's name
      const { data: subjectsData, error: subjectsErr } = await supabase
        .from("subjects")
        .select(`
          id, 
          name, 
          teacher_id,
          teachers:teachers!subjects_teacher_id_fkey(name)
        `)
        .order("name", { ascending: true });

      if (subjectsErr) throw subjectsErr;

      // 2. Fetch all teachers for the dropdown selection
      const { data: teachersData, error: teachersErr } = await supabase
        .from("teachers")
        .select("id, name")
        .order("name", { ascending: true });

      if (teachersErr) throw teachersErr;

      const mappedSubjects = (subjectsData || []).map((sub: any) => ({
        id: sub.id,
        name: sub.name,
        teacher_id: sub.teacher_id,
        teachers: Array.isArray(sub.teachers) ? sub.teachers[0] : sub.teachers,
      }));

      setSubjects(mappedSubjects);
      setTeachers(teachersData || []);
    } catch (err: any) {
      setError(err.message || "বিষয় ও শিক্ষক তালিকা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingSubject(null);
    setName("");
    setTeacherId("");
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setName(subject.name);
    setTeacherId(subject.teacher_id || "");
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("অনুগ্রহ করে বিষয়ের নাম লিখুন।");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        name,
        teacher_id: teacherId === "" ? null : teacherId,
      };

      if (editingSubject) {
        // Update
        const { error: updateErr } = await supabase
          .from("subjects")
          .update(payload)
          .eq("id", editingSubject.id);

        if (updateErr) throw updateErr;
        setSuccess("বিষয়টি সফলভাবে আপডেট করা হয়েছে।");
      } else {
        // Insert
        const { error: insertErr } = await supabase
          .from("subjects")
          .insert([payload]);

        if (insertErr) throw insertErr;
        setSuccess("নতুন বিষয় সফলভাবে যুক্ত করা হয়েছে।");
      }

      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (err.message.includes("unique") || err.message.includes("duplicate key")) {
        setError("এই নামের একটি বিষয় ইতিমধ্যে যুক্ত করা আছে।");
      } else {
        setError(err.message || "সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (subject: Subject) => {
    setSubjectToDelete(subject);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!subjectToDelete) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: deleteErr } = await supabase
        .from("subjects")
        .delete()
        .eq("id", subjectToDelete.id);

      if (deleteErr) {
        if (deleteErr.message.includes("foreign key")) {
          throw new Error("এই বিষয়টি পরীক্ষা, ফলাফল, রুটিন বা সাজেশনসের সাথে যুক্ত রয়েছে। তাই এটি মুছে ফেলা সম্ভব নয়।");
        }
        throw deleteErr;
      }

      setSuccess("বিষয়টি সফলভাবে মুছে ফেলা হয়েছে।");
      setDeleteConfirmOpen(false);
      setSubjectToDelete(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || "মুছে ফেলতে সমস্যা হয়েছে।");
      setDeleteConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-slate-500 text-sm">কোচিং সেন্টারের সমস্ত পাঠ্য বিষয় এবং শিক্ষক বন্টন তালিকা</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন বিষয় যোগ করুন</span>
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

      {/* Main Content Card */}
      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">বিষয় তালিকা লোড হচ্ছে...</p>
          </div>
        ) : subjects.length > 0 ? (
          <div className="overflow-x-auto" dir="ltr">
            <table className="w-full text-left border-collapse text-sm" dir="ltr">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-500 font-semibold">
                  <th className="px-6 py-4">বিষয়ের নাম</th>
                  <th className="px-6 py-4">নিযুক্ত শিক্ষক</th>
                  <th className="px-6 py-4">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((subject) => (
                  <tr key={subject.id} className="text-slate-700 hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-900">{subject.name}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      {subject.teachers?.name ? (
                        <span className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-100 rounded-lg text-xs font-semibold">
                          {subject.teachers.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">শিক্ষক নিযুক্ত নেই</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-start gap-2">
                        <button
                          onClick={() => openEditModal(subject)}
                          className="p-1.5 hover:bg-teal-50 hover:text-teal-600 rounded-lg text-slate-400 transition-colors"
                          title="সম্পাদনা করুন"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(subject)}
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
            কোন বিষয় যুক্ত করা হয়নি। নতুন বিষয় যুক্ত করতে উপরে ক্লিক করুন।
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between h-14 px-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingSubject ? "বিষয় তথ্য সংশোধন" : "নতুন বিষয় যুক্ত করুন"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                  বিষয়ের নাম (যেমন: বাংলা / ইংরেজি / যুক্তিবিদ্যা)
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="বিষয়ের নাম লিখুন"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                  শিক্ষক নিয়োগ
                </label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                >
                  <option value="">-- শিক্ষক নির্বাচন করুন --</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  * নতুন কোনো শিক্ষক তালিকাভুক্ত করতে চাইলে প্রথমে শিক্ষক প্যানেল থেকে শিক্ষক যোগ করুন।
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={submitting}
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
              <p className="text-slate-500 text-xs leading-relaxed">
                আপনি কি নিশ্চিতভাবে **&quot;{subjectToDelete?.name}&quot;** বিষয়টি মুছে ফেলতে চান? এটি মুছে ফেললে ডাটাবেজ থেকে এর সমস্ত বিবরণ স্থায়ীভাবে মুছে যাবে।
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
