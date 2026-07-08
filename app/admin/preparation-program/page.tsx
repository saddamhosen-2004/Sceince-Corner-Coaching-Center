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
  TrendingUp,
  UserPlus,
  Phone,
  DollarSign,
  ChevronRight,
  Target,
  Users,
  X,
} from "lucide-react";

interface PrepProgram {
  id: string;
  program_name: string;
  session_year: string;
}

interface Enrollment {
  id: string;
  program_id: string;
  student_name: string;
  guardian_phone: string;
  amount_paid: number;
  enrollment_date: string;
}

export default function PreparationProgramPage() {
  const supabase = createClient();

  const [programs, setPrograms] = useState<PrepProgram[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Program Modal States
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<PrepProgram | null>(null);
  const [programName, setProgramName] = useState("");
  const [sessionYear, setSessionYear] = useState(new Date().getFullYear().toString());

  // Enrollment Modal States
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split("T")[0]);

  // Selected Program Dashboard State
  const [selectedProgram, setSelectedProgram] = useState<PrepProgram | null>(null);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<PrepProgram | null>(null);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from("preparation_programs")
        .select("*")
        .order("session_year", { ascending: false });

      if (fetchErr) throw fetchErr;
      setPrograms(data || []);
      
      if (data && data.length > 0 && !selectedProgram) {
        setSelectedProgram(data[0]);
      }
    } catch (err: any) {
      setError(err.message || "প্রোগ্রাম তালিকা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  // Fetch enrollments when selected program changes
  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!selectedProgram) {
        setEnrollments([]);
        return;
      }

      setLoadingEnrollments(true);
      try {
        const { data, error: enrollErr } = await supabase
          .from("preparation_enrollments")
          .select("*")
          .eq("program_id", selectedProgram.id)
          .order("created_at", { ascending: false });

        if (enrollErr) throw enrollErr;
        setEnrollments(data || []);
      } catch (err: any) {
        setError(err.message || "ভর্তি তালিকা লোড করতে সমস্যা হয়েছে।");
      } finally {
        setLoadingEnrollments(false);
      }
    };

    fetchEnrollments();
  }, [selectedProgram, supabase]);

  const openProgramModal = (program: PrepProgram | null = null) => {
    setEditingProgram(program);
    setProgramName(program ? program.program_name : "");
    setSessionYear(program ? program.session_year : new Date().getFullYear().toString());
    setError(null);
    setProgramModalOpen(true);
  };

  const handleProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!programName.trim() || !sessionYear) {
      setError("অনুগ্রহ করে সব তথ্য সঠিকভাবে পূরণ করুন।");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        program_name: programName,
        session_year: sessionYear,
      };

      if (editingProgram) {
        const { error: updateErr } = await supabase
          .from("preparation_programs")
          .update(payload)
          .eq("id", editingProgram.id);

        if (updateErr) throw updateErr;
        setSuccess("প্রোগ্রাম আপডেট করা হয়েছে।");
        setSelectedProgram({ ...editingProgram, ...payload });
      } else {
        const { error: insertErr } = await supabase
          .from("preparation_programs")
          .insert([payload]);

        if (insertErr) throw insertErr;
        setSuccess("নতুন প্রস্তুতি প্রোগ্রাম তৈরি করা হয়েছে।");
      }

      setProgramModalOpen(false);
      fetchPrograms();
    } catch (err: any) {
      setError(err.message || "সংরক্ষণ করতে সমস্যা হয়েছে।");
    } finally {
      setSubmitting(false);
    }
  };

  const openEnrollModal = () => {
    setStudentName("");
    setGuardianPhone("");
    setAmountPaid("");
    setEnrollmentDate(new Date().toISOString().split("T")[0]);
    setError(null);
    setEnrollModalOpen(true);
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!studentName.trim() || !guardianPhone.trim() || !amountPaid || !enrollmentDate) {
      setError("অনুগ্রহ করে সব তথ্য সঠিকভাবে পূরণ করুন।");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        program_id: selectedProgram.id,
        student_name: studentName,
        guardian_phone: guardianPhone,
        amount_paid: parseFloat(amountPaid),
        enrollment_date: enrollmentDate,
      };

      const { error: insertErr } = await supabase
        .from("preparation_enrollments")
        .insert([payload]);

      if (insertErr) throw insertErr;

      setSuccess("প্রস্তুতি প্রোগ্রামে নতুন শিক্ষার্থী ভর্তি সফল হয়েছে।");
      setEnrollModalOpen(false);

      // Refresh enrollments list
      const { data, error: enrollErr } = await supabase
        .from("preparation_enrollments")
        .select("*")
        .eq("program_id", selectedProgram.id)
        .order("created_at", { ascending: false });

      if (enrollErr) throw enrollErr;
      setEnrollments(data || []);
    } catch (err: any) {
      setError(err.message || "ভর্তি রেকর্ড সংরক্ষণ করতে সমস্যা হয়েছে।");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteProgram = (e: React.MouseEvent, program: PrepProgram) => {
    e.stopPropagation();
    setProgramToDelete(program);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteProgram = async () => {
    if (!programToDelete) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: deleteErr } = await supabase
        .from("preparation_programs")
        .delete()
        .eq("id", programToDelete.id);

      if (deleteErr) throw deleteErr;

      setSuccess("প্রোগ্রামটি সফলভাবে মুছে ফেলা হয়েছে।");
      setDeleteConfirmOpen(false);
      setProgramToDelete(null);
      if (selectedProgram?.id === programToDelete.id) {
        setSelectedProgram(null);
      }
      fetchPrograms();
    } catch (err: any) {
      setError(err.message || "মুছে ফেলতে সমস্যা হয়েছে।");
      setDeleteConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations
  const totalEnrolled = enrollments.length;
  const totalCollected = enrollments.reduce((sum, e) => sum + Number(e.amount_paid), 0);

  return (
    <div className="space-y-6 text-left">
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

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Programs List Directory (col: 4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">প্রস্তুতি প্রোগ্রামসমূহ</h3>
            <button
              onClick={() => openProgramModal(null)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন প্রোগ্রাম</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-2xl shadow-xs overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-xs">প্রোগ্রাম লোড হচ্ছে...</p>
              </div>
            ) : programs.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {programs.map((prog) => {
                  const isSelected = selectedProgram?.id === prog.id;
                  return (
                    <div
                      key={prog.id}
                      onClick={() => setSelectedProgram(prog)}
                      className={`p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-slate-50 text-left ${
                        isSelected ? "bg-slate-50 border-r-4 border-teal-600" : ""
                      }`}
                      dir="ltr"
                    >
                      <div className="flex-1 text-left">
                        <h4 className="font-bold text-slate-900 text-xs leading-snug">
                          {prog.program_name}
                        </h4>
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                          <Target className="w-3 h-3 text-teal-600 shrink-0" />
                          সেশন: {prog.session_year}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" dir="ltr">
                        <button
                          onClick={(e) => { e.stopPropagation(); openProgramModal(prog); }}
                          className="p-1 hover:bg-slate-200 hover:text-teal-600 rounded text-slate-400"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => confirmDeleteProgram(e, prog)}
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
                কোনো প্রোগ্রাম তৈরি করা হয়নি।
              </div>
            )}
          </div>
        </div>

        {/* Right: Enrolled Students & Tracking statistics Dashboard (col: 8) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedProgram ? (
            <div className="space-y-6">
              {/* Program Statistics cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">মোট কালেকশন</span>
                    <p className="text-xl font-bold text-slate-800">৳ {totalCollected.toLocaleString("bn-BD")}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <DollarSign className="w-5 h-5 shrink-0" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">মোট ভর্তিকৃত শিক্ষার্থী</span>
                    <p className="text-xl font-bold text-slate-800">{totalEnrolled.toLocaleString("bn-BD")} জন</p>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Users className="w-5 h-5 shrink-0" />
                  </div>
                </div>
              </div>

              {/* Students Table */}
              <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h4 className="font-bold text-slate-800 text-sm">
                    {selectedProgram.program_name} - ভর্তি তালিকা
                  </h4>
                  <button
                    onClick={openEnrollModal}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>শিক্ষার্থী ভর্তি করুন</span>
                  </button>
                </div>

                {loadingEnrollments ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-2">
                    <Loader2 className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-xs font-medium">ভর্তি ডাটা লোড হচ্ছে...</p>
                  </div>
                ) : enrollments.length > 0 ? (
                  <div className="overflow-x-auto" dir="ltr">
                    <table className="w-full text-left border-collapse text-xs" dir="ltr">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                          <th className="pb-3 text-left">শিক্ষার্থীর নাম</th>
                          <th className="pb-3 text-left">মোবাইল নম্বর</th>
                          <th className="pb-3 text-left">পরিশোধিত টাকা</th>
                          <th className="pb-3 text-left">ভর্তির তারিখ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {enrollments.map((enr) => (
                          <tr key={enr.id} className="text-slate-700 hover:bg-slate-50/50">
                            <td className="py-3 font-bold text-slate-900">{enr.student_name}</td>
                            <td className="py-3 font-mono text-slate-500">{enr.guardian_phone}</td>
                            <td className="py-3 font-bold text-slate-900">
                              ৳ {Number(enr.amount_paid).toLocaleString("bn-BD")}
                            </td>
                            <td className="py-3 text-slate-500">
                              {new Date(enr.enrollment_date).toLocaleDateString("bn-BD")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="py-12 text-center text-slate-400 text-xs italic">
                    এই প্রস্তুতি প্রোগ্রামে এখনও কোনো শিক্ষার্থী ভর্তি করা হয়নি।
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/60 rounded-2xl py-20 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Target className="w-12 h-12 text-slate-200" />
              <span>বামে তালিকা থেকে একটি প্রস্তুতি প্রোগ্রাম নির্বাচন করুন।</span>
            </div>
          )}
        </div>

      </div>

      {/* Program Create/Edit Modal */}
      {programModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between h-14 px-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingProgram ? "প্রোগ্রাম তথ্য সংশোধন" : "নতুন প্রস্তুতি প্রোগ্রাম তৈরি"}
              </h3>
              <button
                onClick={() => setProgramModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProgramSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                  প্রোগ্রামের নাম (যেমন: প্রস্তুতি প্রোগ্রাম ২০২৬)
                </label>
                <input
                  type="text"
                  required
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  placeholder="প্রোগ্রামের নাম লিখুন"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                  সেশন বছর
                </label>
                <select
                  value={sessionYear}
                  onChange={(e) => setSessionYear(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                >
                  <option value={new Date().getFullYear().toString()}>
                    {new Date().getFullYear().toString()}
                  </option>
                  <option value={(new Date().getFullYear() + 1).toString()}>
                    {(new Date().getFullYear() + 1).toString()}
                  </option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setProgramModalOpen(false)}
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

      {/* Program Enrollment Modal */}
      {enrollModalOpen && selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between h-14 px-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                শিক্ষার্থী ভর্তি - {selectedProgram.program_name}
              </h3>
              <button
                onClick={() => setEnrollModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                  শিক্ষার্থীর নাম
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="নাম লিখুন"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                  অভিভাবকের মোবাইল নম্বর
                </label>
                <input
                  type="tel"
                  required
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  placeholder="মোবাইল নম্বর লিখুন"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs text-left"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    পরিশোধিত ভর্তি ফি (৳)
                  </label>
                  <input
                    type="number"
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="যেমন: ৩০০০"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    ভর্তির তারিখ
                  </label>
                  <input
                    type="date"
                    required
                    value={enrollmentDate}
                    onChange={(e) => setEnrollmentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setEnrollModalOpen(false)}
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
                      <span>ভর্তি করা হচ্ছে...</span>
                    </>
                  ) : (
                    <span>ভর্তি সম্পন্ন করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Program Delete Confirmation Modal */}
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
                আপনি কি নিশ্চিতভাবে **&quot;{programToDelete?.program_name}&quot;** প্রস্তুতি প্রোগ্রামটি মুছে ফেলতে চান? এর সাথে যুক্ত সকল শিক্ষার্থীর ভর্তি ডাটা চিরতরে মুছে যাবে।
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
                onClick={handleDeleteProgram}
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
