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
  Search,
  Filter,
  User,
  Phone,
  BookOpen,
  Calendar,
  DollarSign,
  MapPin,
  Camera,
  X,
  CreditCard,
  ClipboardList,
} from "lucide-react";
import Image from "next/image";

interface Batch {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  photo_url: string | null;
  father_name: string;
  mother_name: string;
  guardian_phone: string;
  address: string;
  college_name: string;
  college_year: "1st Year" | "2nd Year";
  batch_id: string;
  admission_date: string;
  monthly_fee: number;
  student_id: string; // Auto-generated roll
  batches?: {
    name: string;
  } | null;
}

interface FeeRecord {
  id: string;
  month: string;
  year: number;
  amount: number;
  paid_date: string;
  receipt_number: string;
}

interface ResultRecord {
  id: string;
  marks_obtained: number;
  exams?: {
    name: string;
    total_marks: number;
    exam_date: string;
  } | null;
  subjects?: {
    name: string;
  } | null;
}

export default function StudentsPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBatch, setFilterBatch] = useState("");

  // Form Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [address, setAddress] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [collegeYear, setCollegeYear] = useState<"1st Year" | "2nd Year">("1st Year");
  const [batchId, setBatchId] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  
  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Profile View Overlay State
  const [profileOverlayOpen, setProfileOverlayOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [resultRecords, setResultRecords] = useState<ResultRecord[]>([]);
  const [loadingProfileDetails, setLoadingProfileDetails] = useState(false);

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch students
      const { data: studentsData, error: studentsErr } = await supabase
        .from("students")
        .select("*, batches(name)")
        .order("created_at", { ascending: false });

      if (studentsErr) throw studentsErr;

      // 2. Fetch batches
      const { data: batchesData, error: batchesErr } = await supabase
        .from("batches")
        .select("id, name")
        .order("name", { ascending: true });

      if (batchesErr) throw batchesErr;

      const mappedStudents = (studentsData || []).map((s: any) => ({
        ...s,
        batches: Array.isArray(s.batches) ? s.batches[0] : s.batches,
      }));

      setStudents(mappedStudents);
      setBatches(batchesData || []);
    } catch (err: any) {
      setError(err.message || "শিক্ষার্থী তালিকা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Photo Upload directly to ImageKit
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size (limit to 2MB)
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
      const url = await uploadImageToImageKit(file, "students");
      setPhotoUrl(url);
      setSuccess("ছবি সফলভাবে আপলোড করা হয়েছে।");
    } catch (err: any) {
      setError("ছবি আপলোড করতে ব্যর্থ হয়েছে: " + (err.message || "সার্ভার এরর।"));
    } finally {
      setUploadingImage(false);
    }
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setName("");
    setFatherName("");
    setMotherName("");
    setGuardianPhone("");
    setAddress("");
    setCollegeName("");
    setCollegeYear("1st Year");
    setBatchId("");
    setAdmissionDate(new Date().toISOString().split("T")[0]);
    setMonthlyFee("");
    setPhotoUrl(null);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation(); // Prevent opening profile overlay
    setEditingStudent(student);
    setName(student.name);
    setFatherName(student.father_name);
    setMotherName(student.mother_name);
    setGuardianPhone(student.guardian_phone);
    setAddress(student.address);
    setCollegeName(student.college_name);
    setCollegeYear(student.college_year);
    setBatchId(student.batch_id);
    setAdmissionDate(student.admission_date);
    setMonthlyFee(student.monthly_fee.toString());
    setPhotoUrl(student.photo_url);
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
      !fatherName.trim() ||
      !motherName.trim() ||
      !guardianPhone.trim() ||
      !address.trim() ||
      !collegeName.trim() ||
      !batchId ||
      !admissionDate ||
      !monthlyFee
    ) {
      setError("অনুগ্রহ করে সব তথ্য সঠিকভাবে পূরণ করুন।");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        name,
        father_name: fatherName,
        mother_name: motherName,
        guardian_phone: guardianPhone,
        address,
        college_name: collegeName,
        college_year: collegeYear,
        batch_id: batchId,
        admission_date: admissionDate,
        monthly_fee: parseFloat(monthlyFee),
        photo_url: photoUrl,
      };

      if (editingStudent) {
        const { error: updateErr } = await supabase
          .from("students")
          .update(payload)
          .eq("id", editingStudent.id);

        if (updateErr) throw updateErr;
        setSuccess("শিক্ষার্থীর তথ্য সফলভাবে আপডেট করা হয়েছে।");
      } else {
        const { error: insertErr } = await supabase
          .from("students")
          .insert([payload]);

        if (insertErr) throw insertErr;
        setSuccess("নতুন শিক্ষার্থী সফলভাবে যুক্ত করা হয়েছে।");
      }

      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || "সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  // Open full profile overlay and fetch billing + results
  const openProfileOverlay = async (student: Student) => {
    setSelectedStudent(student);
    setProfileOverlayOpen(true);
    setLoadingProfileDetails(true);
    setFeeRecords([]);
    setResultRecords([]);

    try {
      // 1. Fetch fee collections
      const { data: feesData, error: feesErr } = await supabase
        .from("fee_collections")
        .select("id, month, year, amount, paid_date, receipt_number")
        .eq("student_id", student.id)
        .order("year", { ascending: false })
        .order("created_at", { ascending: false });

      if (feesErr) throw feesErr;

      // 2. Fetch results
      const { data: resultsData, error: resultsErr } = await supabase
        .from("results")
        .select(`
          id,
          marks_obtained,
          exams(name, total_marks, exam_date),
          subjects(name)
        `)
        .eq("student_id", student.id)
        .order("created_at", { ascending: false });

      if (resultsErr) throw resultsErr;

      const mappedResults = (resultsData || []).map((res: any) => ({
        id: res.id,
        marks_obtained: res.marks_obtained,
        exams: Array.isArray(res.exams) ? res.exams[0] : res.exams,
        subjects: Array.isArray(res.subjects) ? res.subjects[0] : res.subjects,
      }));

      setFeeRecords(feesData || []);
      setResultRecords(mappedResults);
    } catch (err: any) {
      console.error("Error loading profile details:", err);
    } finally {
      setLoadingProfileDetails(false);
    }
  };

  const openDeleteConfirm = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation(); // Prevent opening profile overlay
    setStudentToDelete(student);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: deleteErr } = await supabase
        .from("students")
        .delete()
        .eq("id", studentToDelete.id);

      if (deleteErr) throw deleteErr;

      setSuccess("শিক্ষার্থী ফাইল সফলভাবে মুছে ফেলা হয়েছে।");
      setDeleteConfirmOpen(false);
      setStudentToDelete(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || "মুছে ফেলতে সমস্যা হয়েছে।");
      setDeleteConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.college_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBatch = filterBatch === "" || student.batch_id === filterBatch;
    return matchesSearch && matchesBatch;
  });

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-slate-500 text-sm">ভর্তিকৃত সকল শিক্ষার্থীর তালিকা এবং তথ্যাবলী পরিচালনা করুন</p>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন শিক্ষার্থী ভর্তি করুন</span>
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

      {/* Filters & Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-slate-200/60 rounded-2xl shadow-xs">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="শিক্ষার্থীর নাম, রোল আইডি বা কলেজ সার্চ করুন..."
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs text-left"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            ব্যাচ ফিল্টার:
          </span>
          <select
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
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

      {/* Students Directory Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-slate-200/60 rounded-2xl">
          <Loader2 className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">শিক্ষার্থী তালিকা লোড হচ্ছে...</p>
        </div>
      ) : filteredStudents.length > 0 ? (
        <>
          {/* Desktop Table / List Format */}
          <div className="hidden md:block bg-white border border-slate-200/60 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="px-5 py-3 text-left">ছবি</th>
                    <th className="px-5 py-3 text-left">রোল আইডি</th>
                    <th className="px-5 py-3 text-left">নাম</th>
                    <th className="px-5 py-3 text-left">কলেজ ও বর্ষ</th>
                    <th className="px-5 py-3 text-left">ব্যাচ</th>
                    <th className="px-5 py-3 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      onClick={() => openProfileOverlay(student)}
                      className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="w-10 h-10 rounded-lg overflow-hidden relative bg-slate-100 border border-slate-100">
                          {student.photo_url ? (
                            <Image
                              src={student.photo_url}
                              alt={student.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 rounded-md text-[10px] font-bold font-mono">
                          {student.student_id}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 text-sm">
                        {student.name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        <div className="font-semibold">{student.college_name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{student.college_year}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-medium">
                        {student.batches?.name || <span className="text-slate-400 italic font-normal">নির্ধারিত নেই</span>}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => openEditModal(e, student)}
                            className="p-1.5 hover:bg-slate-100 hover:text-teal-600 rounded-lg text-slate-400 transition-colors"
                            title="সংশোধন"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => openDeleteConfirm(e, student)}
                            className="p-1.5 hover:bg-slate-100 hover:text-rose-600 rounded-lg text-slate-400 transition-colors"
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
          </div>

          {/* Mobile Card Format */}
          <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                onClick={() => openProfileOverlay(student)}
                className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs transition-all cursor-pointer flex gap-4 group"
              >
                {/* Photo */}
                <div className="w-20 h-20 rounded-xl overflow-hidden relative bg-slate-100 shrink-0 border border-slate-100">
                  {student.photo_url ? (
                    <Image
                      src={student.photo_url}
                      alt={student.name}
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
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 rounded-md text-[10px] font-bold">
                        {student.student_id}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm truncate">
                        {student.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 truncate">
                      {student.college_name} • {student.college_year}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      ব্যাচ: {student.batches?.name || "নির্ধারিত নেই"}
                    </p>
                  </div>

                  {/* Card footer actions */}
                  <div className="flex items-center justify-start gap-2 pt-2 border-t border-slate-50 mt-2">
                    <button
                      onClick={(e) => openEditModal(e, student)}
                      className="p-1 hover:bg-slate-100 hover:text-teal-600 rounded text-slate-400 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => openDeleteConfirm(e, student)}
                      className="p-1 hover:bg-slate-100 hover:text-rose-600 rounded text-slate-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="py-20 text-center text-slate-400 text-sm bg-white border border-slate-200/60 rounded-2xl shadow-xs">
          কোন শিক্ষার্থী পাওয়া যায়নি।
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8 animate-scale-up">
            <div className="flex items-center justify-between h-14 px-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingStudent ? "শিক্ষার্থীর তথ্য সংশোধন" : "নতুন শিক্ষার্থী ভর্তি ফরম"}
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
                      alt="Uploaded student photo"
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
                    শিক্ষার্থীর নাম
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
                    অভিভাবকের মোবাইল নম্বর
                  </label>
                  <input
                    type="tel"
                    required
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="যেমন: ০১XXXXXXXXX"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    পিতার নাম
                  </label>
                  <input
                    type="text"
                    required
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="পিতার নাম লিখুন"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    মাতার নাম
                  </label>
                  <input
                    type="text"
                    required
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    placeholder="মাতার নাম লিখুন"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    কলেজের নাম
                  </label>
                  <input
                    type="text"
                    required
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="যেমন: সরকারি বাংলা কলেজ"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                      কলেজ বর্ষ
                    </label>
                    <select
                      value={collegeYear}
                      onChange={(e) => setCollegeYear(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                    >
                      <option value="1st Year">১ম বর্ষ (1st Year)</option>
                      <option value="2nd Year">২য় বর্ষ (2nd Year)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                      ব্যাচ নির্বাচন
                    </label>
                    <select
                      value={batchId}
                      required
                      onChange={(e) => setBatchId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                    >
                      <option value="">নির্বাচন করুন</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                      মাসিক প্যাকেজ ফি (৳)
                    </label>
                    <input
                      type="number"
                      required
                      value={monthlyFee}
                      onChange={(e) => setMonthlyFee(e.target.value)}
                      placeholder="যেমন: ১৫০০"
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
                      value={admissionDate}
                      onChange={(e) => setAdmissionDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                    />
                  </div>
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
                      <span>ভর্তি করা হচ্ছে...</span>
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
                আপনি কি নিশ্চিতভাবে **&quot;{studentToDelete?.name}&quot;** শিক্ষার্থীর ফাইলটি মুছে ফেলতে চান? এর সাথে যুক্ত তার পূর্বের সকল আর্থিক ও পরীক্ষার তথ্য স্থায়ীভাবে ডাটাবেজ থেকে মুছে যাবে।
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
      {profileOverlayOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs">
          {/* Overlay background close trigger */}
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
                  {selectedStudent.photo_url ? (
                    <Image
                      src={selectedStudent.photo_url}
                      alt={selectedStudent.name}
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
                  <h3 className="font-bold text-sm leading-tight">{selectedStudent.name}</h3>
                  <span className="text-[10px] text-teal-400 font-semibold">{selectedStudent.student_id}</span>
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
              {/* Detailed student info */}
              <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-5 space-y-3.5 text-left">
                <h4 className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-2">
                  ব্যক্তিগত বিবরণী
                </h4>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">পিতার নাম:</span>
                    <span className="font-medium text-slate-800">{selectedStudent.father_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">মাতার নাম:</span>
                    <span className="font-medium text-slate-800">{selectedStudent.mother_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">অভিভাবকের মোবাইল:</span>
                    <span className="font-medium text-slate-800 flex items-center justify-end gap-1">
                      <Phone className="w-3.5 h-3.5 text-teal-600" />
                      {selectedStudent.guardian_phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">কলেজ বর্ষ:</span>
                    <span className="font-medium text-slate-800">{selectedStudent.college_year}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">কলেজের নাম:</span>
                    <span className="font-medium text-slate-800">{selectedStudent.college_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">ব্যাচ সময়সূচী:</span>
                    <span className="font-medium text-slate-800">
                      {selectedStudent.batches?.name || "নির্ধারিত নেই"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">মাসিক ফি:</span>
                    <span className="font-bold text-slate-900">৳ {selectedStudent.monthly_fee}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">ভর্তির তারিখ:</span>
                    <span className="font-medium text-slate-800">
                      {new Date(selectedStudent.admission_date).toLocaleDateString("bn-BD")}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/50 text-xs">
                  <span className="text-slate-400 block mb-0.5">বর্তমান ঠিকানা:</span>
                  <span className="font-medium text-slate-800 flex items-center justify-end gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    {selectedStudent.address}
                  </span>
                </div>
              </div>

              {/* Tabs for Financial History & Exam Results */}
              <div className="space-y-4">
                {/* 1. Fee history */}
                <div className="border border-slate-200/60 rounded-2xl p-5 bg-white">
                  <h4 className="font-bold text-slate-800 text-xs mb-3 flex items-center justify-end gap-1.5">
                    <span>ফি সংগ্রহের ইতিহাস</span>
                    <CreditCard className="w-4 h-4 text-teal-600" />
                  </h4>

                  {loadingProfileDetails ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                    </div>
                  ) : feeRecords.length > 0 ? (
                    <div className="divide-y divide-slate-100 text-xs max-h-60 overflow-y-auto pr-2">
                      {feeRecords.map((fee) => (
                        <div key={fee.id} className="py-2.5 flex items-center justify-between text-left">
                          <span className="font-mono text-slate-400 text-[10px]">রিসিট: {fee.receipt_number}</span>
                          <div>
                            <p className="font-bold text-slate-900">
                              ৳ {Number(fee.amount).toLocaleString("bn-BD")}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              তারিখ: {new Date(fee.paid_date).toLocaleDateString("bn-BD")}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md font-semibold text-[10px]">
                            {fee.month} {fee.year.toString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-6 text-slate-400 text-xs italic">
                      কোনো পেমেন্ট রেকর্ড নেই।
                    </p>
                  )}
                </div>

                {/* 2. Results list */}
                <div className="border border-slate-200/60 rounded-2xl p-5 bg-white">
                  <h4 className="font-bold text-slate-800 text-xs mb-3 flex items-center justify-end gap-1.5">
                    <span>পরীক্ষা ও ফলাফল বিবরণী</span>
                    <ClipboardList className="w-4 h-4 text-indigo-600" />
                  </h4>

                  {loadingProfileDetails ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                    </div>
                  ) : resultRecords.length > 0 ? (
                    <div className="divide-y divide-slate-100 text-xs max-h-60 overflow-y-auto pr-2">
                      {resultRecords.map((result) => {
                        const obtained = Number(result.marks_obtained);
                        const total = Number(result.exams?.total_marks || 100);
                        const isPass = obtained >= total * 0.33; // Mock pass criteria
                        return (
                          <div key={result.id} className="py-2.5 flex items-center justify-between text-left">
                            <span
                              className={`px-2 py-0.5 border rounded-md font-bold text-[10px] ${
                                isPass
                                  ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                                  : "bg-rose-50 border-rose-100 text-rose-700"
                              }`}
                            >
                              {isPass ? "পাস" : "ফেল"}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-800">
                                {result.subjects?.name || "বিষয়"}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {result.exams?.name || "পরীক্ষা"} (
                                {result.exams?.exam_date
                                  ? new Date(result.exams.exam_date).toLocaleDateString("bn-BD")
                                  : ""}
                                )
                              </p>
                            </div>
                            <span className="font-bold text-slate-900 text-sm">
                              {obtained.toLocaleString("bn-BD")} / {total.toLocaleString("bn-BD")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center py-6 text-slate-400 text-xs italic">
                      কোনো পরীক্ষার ফলাফল পাওয়া যায়নি।
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
