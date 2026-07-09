"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileBadge,
  Calendar,
  Layers,
  Users,
  Save,
  ChevronRight,
  BookOpen,
  X,
} from "lucide-react";

interface Batch {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Exam {
  id: string;
  name: string;
  batch_id: string;
  exam_date: string;
  total_marks: number;
  batches?: {
    name: string;
  } | null;
}

interface StudentWithMark {
  id: string;
  name: string;
  student_id: string; // Roll ID
  marks_obtained: string; // Text field for input
}

export default function ExamsPage() {
  const supabase = createClient();

  const [exams, setExams] = useState<Exam[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [name, setName] = useState("");
  const [batchId, setBatchId] = useState("");
  const [examDate, setExamDate] = useState("");
  const [totalMarks, setTotalMarks] = useState("100");
  const [submitting, setSubmitting] = useState(false);

  // Marks Entry Interface States
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [studentsWithMarks, setStudentsWithMarks] = useState<StudentWithMark[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch exams
      const { data: examsData, error: examsErr } = await supabase
        .from("exams")
        .select("*, batches(name)")
        .order("exam_date", { ascending: false });

      if (examsErr) throw examsErr;

      // 2. Fetch batches
      const { data: batchesData, error: batchesErr } = await supabase
        .from("batches")
        .select("id, name")
        .order("name", { ascending: true });

      if (batchesErr) throw batchesErr;

      // 3. Fetch subjects
      const { data: subjectsData, error: subjectsErr } = await supabase
        .from("subjects")
        .select("id, name")
        .order("name", { ascending: true });

      if (subjectsErr) throw subjectsErr;

      const mappedExams = (examsData || []).map((e: any) => ({
        ...e,
        batches: Array.isArray(e.batches) ? e.batches[0] : e.batches,
      }));

      setExams(mappedExams);
      setBatches(batchesData || []);
      setSubjects(subjectsData || []);
    } catch (err: any) {
      setError(err.message || "পরীক্ষার তালিকা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch students and existing marks when exam or subject changes
  useEffect(() => {
    const fetchStudentsAndMarks = async () => {
      if (!selectedExam || !selectedSubjectId) {
        setStudentsWithMarks([]);
        return;
      }

      setLoadingStudents(true);
      setError(null);
      try {
        // 1. Fetch students in the exam's batch
        const { data: studentsData, error: stdErr } = await supabase
          .from("students")
          .select("id, name, student_id")
          .eq("batch_id", selectedExam.batch_id)
          .order("name", { ascending: true });

        if (stdErr) throw stdErr;

        // 2. Fetch existing marks for this exam and subject
        const { data: resultsData, error: resErr } = await supabase
          .from("results")
          .select("student_id, marks_obtained")
          .eq("exam_id", selectedExam.id)
          .eq("subject_id", selectedSubjectId);

        if (resErr) throw resErr;

        // 3. Map students and existing marks
        const mapped: StudentWithMark[] = (studentsData || []).map((student) => {
          const matchedResult = resultsData?.find(
            (r) => r.student_id === student.id
          );
          return {
            id: student.id,
            name: student.name,
            student_id: student.student_id,
            marks_obtained: matchedResult
              ? matchedResult.marks_obtained.toString()
              : "",
          };
        });

        setStudentsWithMarks(mapped);
      } catch (err: any) {
        setError(err.message || "শিক্ষার্থী নম্বর তালিকা লোড করতে সমস্যা হয়েছে।");
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudentsAndMarks();
  }, [selectedExam, selectedSubjectId, supabase]);

  const openAddModal = () => {
    setEditingExam(null);
    setName("");
    setBatchId("");
    setExamDate(new Date().toISOString().split("T")[0]);
    setTotalMarks("100");
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, exam: Exam) => {
    e.stopPropagation();
    setEditingExam(exam);
    setName(exam.name);
    setBatchId(exam.batch_id);
    setExamDate(exam.exam_date);
    setTotalMarks(exam.total_marks.toString());
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!name.trim() || !batchId || !examDate || !totalMarks) {
      setError("অনুগ্রহ করে সব তথ্য সঠিকভাবে পূরণ করুন।");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        name,
        batch_id: batchId,
        exam_date: examDate,
        total_marks: parseFloat(totalMarks),
      };

      if (editingExam) {
        const { error: updateErr } = await supabase
          .from("exams")
          .update(payload)
          .eq("id", editingExam.id);

        if (updateErr) throw updateErr;
        setSuccess("পরীক্ষার তথ্য সফলভাবে আপডেট করা হয়েছে।");
      } else {
        const { error: insertErr } = await supabase
          .from("exams")
          .insert([payload]);

        if (insertErr) throw insertErr;
        setSuccess("নতুন পরীক্ষা সফলভাবে যুক্ত করা হয়েছে।");
      }

      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || "সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirm = (e: React.MouseEvent, exam: Exam) => {
    e.stopPropagation();
    setExamToDelete(exam);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!examToDelete) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: deleteErr } = await supabase
        .from("exams")
        .delete()
        .eq("id", examToDelete.id);

      if (deleteErr) throw deleteErr;

      setSuccess("পরীক্ষার ফাইল সফলভাবে মুছে ফেলা হয়েছে।");
      setDeleteConfirmOpen(false);
      setExamToDelete(null);
      if (selectedExam?.id === examToDelete.id) {
        setSelectedExam(null);
      }
      fetchData();
    } catch (err: any) {
      setError(err.message || "মুছে ফেলতে সমস্যা হয়েছে।");
      setDeleteConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Mark Change
  const handleMarkChange = (studentId: string, val: string) => {
    setStudentsWithMarks((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, marks_obtained: val } : student
      )
    );
  };

  // Save Marks to Database
  const handleSaveMarks = async () => {
    if (!selectedExam || !selectedSubjectId) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Build upsert payload
      const upsertPayload = studentsWithMarks
        .filter((s) => s.marks_obtained !== "") // Only save entered marks
        .map((student) => ({
          exam_id: selectedExam.id,
          student_id: student.id,
          subject_id: selectedSubjectId,
          marks_obtained: parseFloat(student.marks_obtained),
        }));

      if (upsertPayload.length === 0) {
        setError("অনুগ্রহ করে অন্তত একজন শিক্ষার্থীর নম্বর ইনপুট দিন।");
        setSubmitting(false);
        return;
      }

      // Execute upsert (due to unique constraint on exam_id, student_id, subject_id, it will update/insert correctly)
      const { error: upsertErr } = await supabase
        .from("results")
        .upsert(upsertPayload, { onConflict: "exam_id,student_id,subject_id" });

      if (upsertErr) throw upsertErr;

      setSuccess("পরীক্ষার ফলাফল সফলভাবে সংরক্ষণ করা হয়েছে।");
    } catch (err: any) {
      setError(err.message || "ফলাফল সংরক্ষণ করতে সমস্যা হয়েছে।");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Main Grid: Left Side Exams List, Right Side Marks Entry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Exams Directory (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">পরীক্ষা তালিকা</h3>
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন পরীক্ষা</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-2xl shadow-xs overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-xs">পরীক্ষা লোড হচ্ছে...</p>
              </div>
            ) : exams.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {exams.map((exam) => {
                  const isSelected = selectedExam?.id === exam.id;
                  return (
                    <div
                      key={exam.id}
                      onClick={() => {
                        setSelectedExam(exam);
                        setSelectedSubjectId("");
                      }}
                      className={`p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-slate-50 text-left ${
                        isSelected ? "bg-slate-50 border-l-4 border-teal-600" : ""
                      }`}
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs leading-snug">
                          {exam.name}
                        </h4>
                        <div className="flex items-center justify-start gap-3 mt-1.5 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {exam.batches?.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(exam.exam_date).toLocaleDateString("bn-BD")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => openEditModal(e, exam)}
                          className="p-1 hover:bg-slate-200 hover:text-teal-600 rounded text-slate-400"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => openDeleteConfirm(e, exam)}
                          className="p-1 hover:bg-slate-200 hover:text-rose-600 rounded text-slate-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-400 ml-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                কোনো পরীক্ষার তালিকা পাওয়া যায়নি।
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Marks Entry console (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">নম্বর ইনপুট প্যানেল</h3>

          {selectedExam ? (
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-xs space-y-6">
              {/* Exam Info Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-teal-50/50 border border-teal-100 rounded-xl text-left">
                <div>
                  <h4 className="font-bold text-teal-900 text-sm leading-tight">
                    {selectedExam.name}
                  </h4>
                  <p className="text-[11px] text-teal-700/80 mt-1">
                    ব্যাচ: {selectedExam.batches?.name} • পূর্ণমান: {selectedExam.total_marks.toLocaleString("bn-BD")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs shrink-0 flex items-center gap-1 font-semibold">
                    <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                    বিষয় নির্বাচন:
                  </span>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-teal-200 rounded-xl text-slate-800 font-semibold focus:outline-hidden text-xs"
                  >
                    <option value="">-- বিষয় নির্বাচন করুন --</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Students marks list */}
              {selectedSubjectId ? (
                loadingStudents ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-2">
                    <Loader2 className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-xs">শিক্ষার্থী তালিকা প্রস্তুত হচ্ছে...</p>
                  </div>
                ) : studentsWithMarks.length > 0 ? (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                            <th className="pb-3 text-left">শিক্ষার্থীর নাম</th>
                            <th className="pb-3 text-left">রোল আইডি</th>
                            <th className="pb-3 text-left">প্রাপ্ত নম্বর (পূর্ণমান {selectedExam.total_marks})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {studentsWithMarks.map((student) => (
                            <tr key={student.id} className="text-slate-700 hover:bg-slate-50/50">
                              <td className="py-2.5 font-bold text-slate-900">
                                {student.name}
                              </td>
                              <td className="py-2.5 font-semibold text-slate-500">
                                {student.student_id}
                              </td>
                              <td className="py-2.5">
                                <input
                                  type="number"
                                  value={student.marks_obtained}
                                  onChange={(e) =>
                                    handleMarkChange(student.id, e.target.value)
                                  }
                                  min="0"
                                  max={selectedExam.total_marks}
                                  placeholder="নম্বর লিখুন"
                                  className="w-28 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center text-slate-800 placeholder-slate-300 focus:outline-hidden focus:ring-1 focus:ring-teal-600 focus:bg-white transition-all text-xs"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-4 flex items-center justify-end border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleSaveMarks}
                        disabled={submitting}
                        className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-600/70 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md cursor-pointer transition-all"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>সংরক্ষণ হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>ফলাফল সংরক্ষণ করুন</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="py-12 text-center text-slate-400 text-xs italic">
                    এই ব্যাচে কোনো শিক্ষার্থী ভর্তি করা নেই।
                  </p>
                )
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <FileBadge className="w-10 h-10 text-slate-300" />
                  <span>নম্বর ইনপুট দিতে অনুগ্রহ করে প্রথমে ডান পাশের ড্রপডাউন থেকে বিষয় নির্বাচন করুন।</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200/60 rounded-2xl py-20 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <FileBadge className="w-12 h-12 text-slate-200" />
              <span>বামে তালিকা থেকে পরীক্ষা সিলেক্ট করুন।</span>
            </div>
          )}
        </div>

      </div>

      {/* Add / Edit Exam Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between h-14 px-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingExam ? "পরীক্ষা তথ্য সংশোধন" : "নতুন পরীক্ষা তৈরি"}
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
                  পরীক্ষার নাম (যেমন: সাপ্তাহিক পরীক্ষা ১ / মডেল টেস্ট ২)
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="পরীক্ষার নাম লিখুন"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                  কোন ব্যাচের পরীক্ষা
                </label>
                <select
                  value={batchId}
                  required
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                >
                  <option value="">-- ব্যাচ নির্বাচন করুন --</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    মোট নম্বর (পূর্ণমান)
                  </label>
                  <input
                    type="number"
                    required
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    placeholder="যেমন: ১০০"
                    min="1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    পরীক্ষার তারিখ
                  </label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  />
                </div>
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
                আপনি কি নিশ্চিতভাবে **&quot;{examToDelete?.name}&quot;** পরীক্ষা ফাইলটি মুছে ফেলতে চান? এর সাথে যুক্ত সকল শিক্ষার্থীর পরীক্ষার নম্বর বিবরণী ডাটাবেজ থেকে চিরতরে মুছে যাবে।
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
