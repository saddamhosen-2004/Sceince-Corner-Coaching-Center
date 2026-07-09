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
  User,
  Phone,
  BookOpen,
  Calendar,
  DollarSign,
  MapPin,
  Camera,
  X,
  CreditCard,
  GraduationCap,
} from "lucide-react";
import Image from "next/image";

interface Subject {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
  photo_url: string | null;
  phone: string;
  address: string;
  qualification: string;
  subject_id: string | null;
  batch_id: string | null;
  monthly_salary: number;
  joining_date: string;
  subjects?: {
    name: string;
  } | null;
  batches?: {
    name: string;
  } | null;
}

interface SalaryRecord {
  id: string;
  month: string;
  year: number;
  amount: number;
  paid_date: string;
}

export default function TeachersPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [qualification, setQualification] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Upload/Submit loader state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Profile View Overlay State
  const [profileOverlayOpen, setProfileOverlayOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [loadingSalaryDetails, setLoadingSalaryDetails] = useState(false);

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch teachers
      const { data: teachersData, error: teachersErr } = await supabase
        .from("teachers")
        .select("*, subjects:subjects!teachers_subject_id_fkey(name), batches(name)")
        .order("created_at", { ascending: false });

      if (teachersErr) throw teachersErr;

      // 2. Fetch subjects
      const { data: subjectsData, error: subjectsErr } = await supabase
        .from("subjects")
        .select("id, name")
        .order("name", { ascending: true });

      if (subjectsErr) throw subjectsErr;

      // 3. Fetch batches
      const { data: batchesData, error: batchesErr } = await supabase
        .from("batches")
        .select("id, name")
        .order("name", { ascending: true });

      if (batchesErr) throw batchesErr;

      const mappedTeachers = (teachersData || []).map((t: any) => ({
        ...t,
        subjects: Array.isArray(t.subjects) ? t.subjects[0] : t.subjects,
        batches: Array.isArray(t.batches) ? t.batches[0] : t.batches,
      }));

      setTeachers(mappedTeachers);
      setSubjects(subjectsData || []);
      setBatches(batchesData || []);
    } catch (err: any) {
      setError(err.message || "শিক্ষক তালিকা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("অনুগ্রহ করে শুধুমাত্র ইমেজ ফাইল আপলোড করুন।");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("ছবির সাইজ ২MB এর বেশি হওয়া যাবে না।");
      return;
    }

    setUploadingImage(true);
    setError(null);
    try {
      const url = await uploadImageToImageKit(file, "teachers");
      setPhotoUrl(url);
      setSuccess("ছবি সফলভাবে আপলোড করা হয়েছে।");
    } catch (err: any) {
      setError("ছবি আপলোড করতে ব্যর্থ হয়েছে: " + (err.message || "সার্ভার এরর।"));
    } finally {
      setUploadingImage(false);
    }
  };

  const openAddModal = () => {
    setEditingTeacher(null);
    setName("");
    setPhone("");
    setAddress("");
    setQualification("");
    setSubjectId("");
    setBatchId("");
    setMonthlySalary("");
    setJoiningDate(new Date().toISOString().split("T")[0]);
    setPhotoUrl(null);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, teacher: Teacher) => {
    e.stopPropagation();
    setEditingTeacher(teacher);
    setName(teacher.name);
    setPhone(teacher.phone);
    setAddress(teacher.address);
    setQualification(teacher.qualification);
    setSubjectId(teacher.subject_id || "");
    setBatchId(teacher.batch_id || "");
    setMonthlySalary(teacher.monthly_salary.toString());
    setJoiningDate(teacher.joining_date);
    setPhotoUrl(teacher.photo_url);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (
      !name.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !qualification.trim() ||
      !monthlySalary ||
      !joiningDate
    ) {
      setError("অনুগ্রহ করে সব তথ্য সঠিকভাবে পূরণ করুন।");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        name,
        phone,
        address,
        qualification,
        subject_id: subjectId === "" ? null : subjectId,
        batch_id: batchId === "" ? null : batchId,
        monthly_salary: parseFloat(monthlySalary),
        joining_date: joiningDate,
        photo_url: photoUrl,
      };

      if (editingTeacher) {
        const { error: updateErr } = await supabase
          .from("teachers")
          .update(payload)
          .eq("id", editingTeacher.id);

        if (updateErr) throw updateErr;
        setSuccess("শিক্ষকের তথ্য সফলভাবে আপডেট করা হয়েছে।");
      } else {
        const { error: insertErr } = await supabase
          .from("teachers")
          .insert([payload]);

        if (insertErr) throw insertErr;
        setSuccess("নতুন শিক্ষক সফলভাবে যুক্ত করা হয়েছে।");
      }

      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || "সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  const openProfileOverlay = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setProfileOverlayOpen(true);
    setLoadingSalaryDetails(true);
    setSalaryRecords([]);

    try {
      const { data, error: salaryErr } = await supabase
        .from("teacher_salaries")
        .select("id, month, year, amount, paid_date")
        .eq("teacher_id", teacher.id)
        .order("year", { ascending: false })
        .order("created_at", { ascending: false });

      if (salaryErr) throw salaryErr;
      setSalaryRecords(data || []);
    } catch (err: any) {
      console.error("Error fetching salary history:", err);
    } finally {
      setLoadingSalaryDetails(false);
    }
  };

  const openDeleteConfirm = (e: React.MouseEvent, teacher: Teacher) => {
    e.stopPropagation();
    setTeacherToDelete(teacher);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!teacherToDelete) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: deleteErr } = await supabase
        .from("teachers")
        .delete()
        .eq("id", teacherToDelete.id);

      if (deleteErr) {
        if (deleteErr.message.includes("foreign key")) {
          throw new Error("এই শিক্ষক রুটিন, বিষয় অথবা বেতন চালানের সাথে যুক্ত রয়েছেন। তাই তাকে তালিকা থেকে মুছে ফেলা সম্ভব নয়।");
        }
        throw deleteErr;
      }

      setSuccess("শিক্ষক ফাইল সফলভাবে মুছে ফেলা হয়েছে।");
      setDeleteConfirmOpen(false);
      setTeacherToDelete(null);
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
        <p className="text-slate-500 text-sm">কোচিং সেন্টারের নিয়মিত শিক্ষকগণের তালিকা এবং তথ্যাবলী পরিচালনা করুন</p>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন শিক্ষক যোগ করুন</span>
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

      {/* Teachers Directory Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-slate-200/60 rounded-2xl shadow-xs">
          <Loader2 className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">শিক্ষক তালিকা লোড হচ্ছে...</p>
        </div>
      ) : teachers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              onClick={() => openProfileOverlay(teacher)}
              className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs md:hover:shadow-md md:hover:scale-[1.01] transition-all cursor-pointer flex gap-4 group"
            >
              {/* Photo */}
              <div className="w-20 h-20 rounded-xl overflow-hidden relative bg-slate-100 shrink-0 border border-slate-100">
                {teacher.photo_url ? (
                  <Image
                    src={teacher.photo_url}
                    alt={teacher.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>

              {/* Basic Details */}
              <div className="flex-1 min-w-0 flex flex-col justify-between text-left">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {teacher.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 truncate">
                    যোগ্যতা: {teacher.qualification}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    বিষয়: {teacher.subjects?.name || "নির্ধারিত নেই"}
                  </p>
                </div>

                {/* Card footer actions */}
                <div className="flex items-center justify-start gap-2 pt-2 border-t border-slate-50 mt-2">
                  <button
                    onClick={(e) => openEditModal(e, teacher)}
                    className="p-1 hover:bg-slate-100 hover:text-teal-600 rounded text-slate-400 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => openDeleteConfirm(e, teacher)}
                    className="p-1 hover:bg-slate-100 hover:text-rose-600 rounded text-slate-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-400 text-sm bg-white border border-slate-200/60 rounded-2xl shadow-xs">
          কোন শিক্ষক যুক্ত করা হয়নি।
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8 animate-scale-up">
            <div className="flex items-center justify-between h-14 px-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingTeacher ? "শিক্ষক তথ্য সংশোধন" : "নতুন শিক্ষক যুক্ত করুন"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Photo Upload Section */}
              <div className="flex flex-col items-center justify-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-24 h-24 rounded-full overflow-hidden relative bg-slate-100 border-2 border-slate-200">
                  {photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt="Uploaded teacher photo"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <User className="w-12 h-12" />
                    </div>
                  )}
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>ছবি আপলোড করুন</span>
                </button>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    শিক্ষকের নাম
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="নাম লিখুন"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="যেমন: ০১XXXXXXXXX"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    শিক্ষাগত যোগ্যতা (ডিগ্রি/ইনস্টিটিউট)
                  </label>
                  <input
                    type="text"
                    required
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="যেমন: এম.এ (বাংলা), ঢাকা বিশ্ববিদ্যালয়"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    পঠিত বিষয়
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  >
                    <option value="">নির্বাচন করুন (যদি থাকে)</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    বরাদ্দকৃত ব্যাচ
                  </label>
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  >
                    <option value="">নির্বাচন করুন (যদি থাকে)</option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    মাসিক বেতন (৳)
                  </label>
                  <input
                    type="number"
                    required
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    placeholder="যেমন: ১২০০০"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    যোগদানের তারিখ
                  </label>
                  <input
                    type="date"
                    required
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    ঠিকানা
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="বর্তমান ঠিকানা লিখুন"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  />
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
                  disabled={submitting || uploadingImage}
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
                আপনি কি নিশ্চিতভাবে **&quot;{teacherToDelete?.name}&quot;** শিক্ষকের ফাইলটি মুছে ফেলতে চান? ডাটাবেজ থেকে তার পূর্বের সমস্ত বেতনের ইতিহাস স্থায়ীভাবে মুছে যাবে।
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

      {/* Full Profile Overlay Slide-out */}
      {profileOverlayOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs">
          <div
            className="absolute inset-0"
            onClick={() => setProfileOverlayOpen(false)}
          />

          {/* Slideout Content */}
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-in-right overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-800 shrink-0">
                  {selectedTeacher.photo_url ? (
                    <Image
                      src={selectedTeacher.photo_url}
                      alt={selectedTeacher.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-sm leading-tight">{selectedTeacher.name}</h3>
                  <span className="text-[10px] text-teal-400 font-semibold">শিক্ষক পরিচিতি</span>
                </div>
              </div>
              <button
                onClick={() => setProfileOverlayOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile body scroll */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Detailed teacher info */}
              <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-5 space-y-3.5 text-left">
                <h4 className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-2">
                  ব্যক্তিগত বিবরণী
                </h4>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">শিক্ষাগত যোগ্যতা:</span>
                    <span className="font-medium text-slate-800">{selectedTeacher.qualification}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">মোবাইল নম্বর:</span>
                    <span className="font-medium text-slate-800 flex items-center justify-end gap-1">
                      <Phone className="w-3.5 h-3.5 text-teal-600" />
                      {selectedTeacher.phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">পঠিত বিষয়:</span>
                    <span className="font-medium text-slate-800">
                      {selectedTeacher.subjects?.name || "নির্ধারিত নেই"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">বরাদ্দকৃত ব্যাচ:</span>
                    <span className="font-medium text-slate-800">
                      {selectedTeacher.batches?.name || "নির্ধারিত নেই"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">মাসিক বেতন:</span>
                    <span className="font-bold text-slate-900">৳ {Number(selectedTeacher.monthly_salary).toLocaleString("bn-BD")}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">যোগদানের তারিখ:</span>
                    <span className="font-medium text-slate-800">
                      {new Date(selectedTeacher.joining_date).toLocaleDateString("bn-BD")}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/50 text-xs">
                  <span className="text-slate-400 block mb-0.5">বর্তমান ঠিকানা:</span>
                  <span className="font-medium text-slate-800 flex items-center justify-end gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    {selectedTeacher.address}
                  </span>
                </div>
              </div>

              {/* Salary Records History */}
              <div className="border border-slate-200/60 rounded-2xl p-5 bg-white">
                <h4 className="font-bold text-slate-800 text-xs mb-3 flex items-center justify-end gap-1.5">
                  <span>বেতন প্রদানের ইতিহাস</span>
                  <CreditCard className="w-4 h-4 text-teal-600" />
                </h4>

                {loadingSalaryDetails ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                  </div>
                ) : salaryRecords.length > 0 ? (
                  <div className="divide-y divide-slate-100 text-xs max-h-80 overflow-y-auto pr-2">
                    {salaryRecords.map((salary) => (
                      <div key={salary.id} className="py-2.5 flex items-center justify-between text-left">
                        <div>
                          <p className="font-bold text-slate-900">
                            ৳ {Number(salary.amount).toLocaleString("bn-BD")}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            তারিখ: {new Date(salary.paid_date).toLocaleDateString("bn-BD")}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-teal-50 border border-teal-100 text-teal-700 rounded-lg font-semibold text-[10px]">
                          {salary.month} {salary.year.toString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-6 text-slate-400 text-xs italic">
                    বেতন প্রদানের কোনো রেকর্ড পাওয়া যায়নি।
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
