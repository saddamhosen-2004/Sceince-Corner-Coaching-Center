"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Loader2, AlertCircle, CheckCircle2, CalendarDays, Clock } from "lucide-react";

interface Batch {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
}

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

export default function RoutinesPage() {
  const supabase = createClient();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  
  const [batchId, setBatchId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [time, setTime] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null);

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
      // 1. Fetch routines with join tables
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

      // 3. Fetch subjects
      const { data: subjectData, error: subjectErr } = await supabase
        .from("subjects")
        .select("id, name")
        .order("name", { ascending: true });

      if (subjectErr) throw subjectErr;

      // 4. Fetch teachers
      const { data: teacherData, error: teacherErr } = await supabase
        .from("teachers")
        .select("id, name")
        .order("name", { ascending: true });

      if (teacherErr) throw teacherErr;

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
      setSubjects(subjectData || []);
      setTeachers(teacherData || []);
    } catch (err: any) {
      setError(err.message || "রুটিন তালিকা ও প্রয়োজনীয় ডেটা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingRoutine(null);
    setBatchId(batches[0]?.id || "");
    setDayOfWeek(daysOfWeek[0]);
    setTime("");
    setSubjectId(subjects[0]?.id || "");
    setTeacherId(teachers[0]?.id || "");
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (routine: Routine) => {
    setEditingRoutine(routine);
    setBatchId(routine.batch_id);
    setDayOfWeek(routine.day_of_week.trim());
    setTime(routine.time);
    setSubjectId(routine.subject_id);
    setTeacherId(routine.teacher_id);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!batchId) {
      setError("অনুগ্রহ করে একটি ব্যাচ সিলেক্ট করুন।");
      setSubmitting(false);
      return;
    }
    if (!dayOfWeek) {
      setError("অনুগ্রহ করে একটি দিন সিলেক্ট করুন।");
      setSubmitting(false);
      return;
    }
    if (!time.trim()) {
      setError("অনুগ্রহ করে ক্লাসের সময় নির্ধারণ করুন (যেমন: 09:00 AM - 10:30 AM)।");
      setSubmitting(false);
      return;
    }
    if (!subjectId) {
      setError("অনুগ্রহ করে একটি বিষয় সিলেক্ট করুন।");
      setSubmitting(false);
      return;
    }
    if (!teacherId) {
      setError("অনুগ্রহ করে একজন শিক্ষক সিলেক্ট করুন।");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        batch_id: batchId,
        day_of_week: dayOfWeek,
        time: time.trim(),
        subject_id: subjectId,
        teacher_id: teacherId,
      };

      if (editingRoutine) {
        // Update
        const { error: updateErr } = await supabase
          .from("routines")
          .update(payload)
          .eq("id", editingRoutine.id);

        if (updateErr) throw updateErr;
        setSuccess("ক্লাস রুটিনটি সফলভাবে আপডেট করা হয়েছে।");
      } else {
        // Insert
        const { error: insertErr } = await supabase
          .from("routines")
          .insert([payload]);

        if (insertErr) throw insertErr;
        setSuccess("নতুন ক্লাস রুটিন সফলভাবে যুক্ত করা হয়েছে।");
      }

      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || "সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirm = (routine: Routine) => {
    setRoutineToDelete(routine);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!routineToDelete) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: delErr } = await supabase
        .from("routines")
        .delete()
        .eq("id", routineToDelete.id);

      if (delErr) throw delErr;

      setSuccess("ক্লাস রুটিনটি সফলভাবে মুছে ফেলা হয়েছে।");
      setDeleteConfirmOpen(false);
      setRoutineToDelete(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || "মুছে ফেলতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">ক্লাস রুটিন ব্যবস্থাপনা</h1>
          <p className="text-slate-400 text-xs mt-1">ব্যাচভিত্তিক সাপ্তাহিক ক্লাসের সময়সূচী ও রুটিন আপডেট করুন</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন রুটিন যুক্ত করুন</span>
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs font-semibold">
          <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Loader2 className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-xs">রুটিন তালিকা লোড হচ্ছে...</p>
        </div>
      ) : routines.length > 0 ? (
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="px-6 py-4">ব্যাচের নাম</th>
                  <th className="px-6 py-4">দিন</th>
                  <th className="px-6 py-4">সময়</th>
                  <th className="px-6 py-4">বিষয়</th>
                  <th className="px-6 py-4">শিক্ষক</th>
                  <th className="px-6 py-4 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {routines.map((routine) => (
                  <tr key={routine.id} className="text-slate-700 hover:bg-slate-50/20">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {routine.batches?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-medium text-[10px]">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        {routine.day_of_week}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md text-[10px]">
                        <Clock className="w-3 h-3 text-teal-600 shrink-0" />
                        {routine.time}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {routine.subjects?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {routine.teachers?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(routine)}
                          className="p-1.5 hover:bg-slate-100 text-indigo-600 rounded-lg transition-all cursor-pointer"
                          title="সম্পাদনা"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(routine)}
                          className="p-1.5 hover:bg-slate-100 text-rose-600 rounded-lg transition-all cursor-pointer"
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

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-slate-100">
            {routines.map((routine) => (
              <div key={routine.id} className="p-4 space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-teal-50 border border-teal-100 text-teal-700 rounded-lg text-[10px] font-semibold">
                    {routine.batches?.name || "N/A"}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md text-[10px] font-semibold font-mono">
                    <Clock className="w-3 h-3 text-teal-600 shrink-0" />
                    {routine.time}
                  </span>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">
                    বিষয়: {routine.subjects?.name || "N/A"}
                  </h4>
                  <p className="text-xs text-slate-500">
                    শিক্ষক: {routine.teachers?.name || "N/A"}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md text-[10px] font-semibold">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    {routine.day_of_week}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(routine)}
                      className="p-1.5 hover:bg-slate-100 text-indigo-600 rounded-lg transition-all cursor-pointer"
                      title="সম্পাদনা"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(routine)}
                      className="p-1.5 hover:bg-slate-100 text-rose-600 rounded-lg transition-all cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-slate-400 text-sm bg-white border border-slate-200/60 rounded-2xl shadow-xs">
          কোন ক্লাস রুটিন যুক্ত করা হয়নি। শুরু করতে নতুন রুটিন যুক্ত করুন।
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-xl overflow-hidden text-left p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingRoutine ? "রুটিন পরিবর্তন করুন" : "নতুন রুটিন তৈরি করুন"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Batch Select */}
              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">ব্যাচ নির্বাচন করুন</label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all font-semibold"
                >
                  <option value="" disabled>সিলেক্ট করুন...</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Day of Week */}
              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">দিন নির্বাচন করুন</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all font-semibold"
                >
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              {/* Time */}
              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">সময় লিখুন</label>
                <input
                  type="text"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="যেমন: 09:00 AM - 10:30 AM"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-left font-mono font-bold"
                />
              </div>

              {/* Subject Select */}
              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">বিষয় নির্বাচন করুন</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all font-semibold"
                >
                  <option value="" disabled>সিলেক্ট করুন...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Teacher Select */}
              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">শিক্ষক নির্বাচন করুন</label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all font-semibold"
                >
                  <option value="" disabled>সিলেক্ট করুন...</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-600/70 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingRoutine ? "হালনাগাদ করুন" : "সংরক্ষণ করুন"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm shadow-xl p-6 space-y-4 text-left">
            <h3 className="text-base font-bold text-slate-900">রুটিন মুছে ফেলতে চান?</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              আপনি কি নিশ্চিত যে এই ক্লাস রুটিনটি মুছে ফেলতে চান? এই অ্যাকশনটি পূর্বাবস্থায় ফিরিয়ে আনা সম্ভব নয়।
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/70 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>হ্যাঁ, মুছে ফেলুন</span>
              </button>
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
