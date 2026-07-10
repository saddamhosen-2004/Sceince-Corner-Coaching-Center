"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  Plus,
  Printer,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Receipt,
  User,
  Calendar,
  DollarSign,
  X,
} from "lucide-react";

interface Batch {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  student_id: string; // Roll ID
  monthly_fee: number;
  batch_id?: string | null;
  batches?: {
    id?: string;
    name: string;
  } | null;
}

interface FeeCollection {
  id: string;
  student_id: string;
  month: string;
  year: number;
  amount: number;
  paid_date: string;
  receipt_number: string;
  students?: {
    name: string;
    student_id: string;
    batches?: {
      name: string;
    } | null;
  } | null;
}

export default function FeesPage() {
  const supabase = createClient();

  const [collections, setCollections] = useState<FeeCollection[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("all");
  const [modalSelectedBatchId, setModalSelectedBatchId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Collect Fee Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [month, setMonth] = useState("জানুয়ারি");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [amount, setAmount] = useState("");
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  // Receipt Printing State
  const [receiptToPrint, setReceiptToPrint] = useState<FeeCollection | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const { data: logoData } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "logo_url")
          .single();
        if (logoData?.value) {
          setLogoUrl(logoData.value);
        }
      } catch (err) {
        console.error("Failed to load logo in fees page:", err);
      }
    };
    fetchLogo();
  }, []);

  const banglaMonths = [
    "জানুয়ারি",
    "ফেব্রুয়ারি",
    "মার্চ",
    "এপ্রিল",
    "মে",
    "জুন",
    "জুলাই",
    "আগস্ট",
    "সেপ্টেম্বর",
    "অক্টোবর",
    "নভেম্বর",
    "ডিসেম্বর",
  ];

  const fetchCollections = async () => {
    setLoading(true);
    try {
      // 1. Fetch fee collections with student details
      const { data: colData, error: colErr } = await supabase
        .from("fee_collections")
        .select(`
          id,
          student_id,
          month,
          year,
          amount,
          paid_date,
          receipt_number,
          students (
            name,
            student_id,
            batches ( name )
          )
        `)
        .order("created_at", { ascending: false });

      if (colErr) throw colErr;

      // 2. Fetch all students for the dropdown select
      const { data: stdData, error: stdErr } = await supabase
        .from("students")
        .select("id, name, student_id, monthly_fee, batch_id, batches(id, name)")
        .order("name", { ascending: true });

      if (stdErr) throw stdErr;

      // 3. Fetch all batches for filtering
      const { data: batchData, error: batchErr } = await supabase
        .from("batches")
        .select("id, name")
        .order("name", { ascending: true });

      if (batchErr) throw batchErr;

      const mappedCollections = (colData || []).map((col: any) => {
        const studentRaw = Array.isArray(col.students) ? col.students[0] : col.students;
        const studentBatchesRaw = studentRaw ? (Array.isArray(studentRaw.batches) ? studentRaw.batches[0] : studentRaw.batches) : null;
        
        return {
          id: col.id,
          student_id: col.student_id,
          month: col.month,
          year: col.year,
          amount: col.amount,
          paid_date: col.paid_date,
          receipt_number: col.receipt_number,
          students: studentRaw ? {
            name: studentRaw.name,
            student_id: studentRaw.student_id,
            batches: studentBatchesRaw ? {
              name: studentBatchesRaw.name
            } : null
          } : null
        };
      });

      const mappedStudents = (stdData || []).map((std: any) => {
        const studentBatchesRaw = Array.isArray(std.batches) ? std.batches[0] : std.batches;
        return {
          id: std.id,
          name: std.name,
          student_id: std.student_id,
          monthly_fee: std.monthly_fee,
          batch_id: std.batch_id,
          batches: studentBatchesRaw ? {
            id: studentBatchesRaw.id,
            name: studentBatchesRaw.name
          } : null,
        };
      });

      setCollections(mappedCollections);
      setStudents(mappedStudents);
      setBatches(batchData || []);
    } catch (err: any) {
      setError(err.message || "ফি কালেকশন হিস্ট্রি লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  // Update amount automatically when a student is selected in the modal
  useEffect(() => {
    if (selectedStudentId) {
      const student = students.find((s) => s.id === selectedStudentId);
      if (student) {
        setAmount(student.monthly_fee.toString());
      }
    } else {
      setAmount("");
    }
  }, [selectedStudentId, students]);

  const handleCollectFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!selectedStudentId || !month || !year || !amount || !paidDate) {
      setError("অনুগ্রহ করে সমস্ত ঘর সঠিকভাবে পূরণ করুন।");
      setSubmitting(false);
      return;
    }

    try {
      // Generate a unique receipt number: REC + YYMMDD + HHMMSS
      const d = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const receiptNum = `REC-${d.getFullYear().toString().slice(-2)}${pad(
        d.getMonth() + 1
      )}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(
        d.getSeconds()
      )}`;

      const payload = {
        student_id: selectedStudentId,
        month,
        year: parseInt(year),
        amount: parseFloat(amount),
        paid_date: paidDate,
        receipt_number: receiptNum,
      };

      const { data: insertedData, error: insertErr } = await supabase
        .from("fee_collections")
        .insert([payload])
        .select(`
          id,
          student_id,
          month,
          year,
          amount,
          paid_date,
          receipt_number,
          students (
            name,
            student_id,
            batches ( name )
          )
        `);

      if (insertErr) throw insertErr;

      setSuccess("পেমেন্ট সফলভাবে সংরক্ষণ করা হয়েছে।");
      setModalOpen(false);
      fetchCollections();

      // Automatically set the new collection for printing
      if (insertedData && insertedData.length > 0) {
        const rawCol = insertedData[0];
        const studentRaw = Array.isArray(rawCol.students) ? rawCol.students[0] : rawCol.students;
        const studentBatchesRaw = studentRaw ? (Array.isArray(studentRaw.batches) ? studentRaw.batches[0] : studentRaw.batches) : null;
        
        const mappedCol: FeeCollection = {
          id: rawCol.id,
          student_id: rawCol.student_id,
          month: rawCol.month,
          year: rawCol.year,
          amount: rawCol.amount,
          paid_date: rawCol.paid_date,
          receipt_number: rawCol.receipt_number,
          students: studentRaw ? {
            name: studentRaw.name,
            student_id: studentRaw.student_id,
            batches: studentBatchesRaw ? {
              name: studentBatchesRaw.name
            } : null
          } : null
        };
        handleTriggerPrint(mappedCol);
      }
    } catch (err: any) {
      if (err.message.includes("unique") || err.message.includes("duplicate key")) {
        setError("এই রসিদ নম্বর বা পেমেন্ট রেকর্ডটি ডাটাবেজে ইতিমধ্যে রয়েছে।");
      } else {
        setError(err.message || "সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerPrint = (record: FeeCollection) => {
    setReceiptToPrint(record);
    // Let state register before triggering window print
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Search and Batch Filter
  const filteredCollections = collections.filter((col) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      col.students?.name.toLowerCase().includes(term) ||
      col.students?.student_id.toLowerCase().includes(term) ||
      col.receipt_number.toLowerCase().includes(term)
    );
    
    const matchesBatch = selectedBatchId === "all" ||
      col.students?.batches?.name === batches.find(b => b.id === selectedBatchId)?.name;
      
    return matchesSearch && matchesBatch;
  });

  // Filter students inside the Collect Fee modal based on modalSelectedBatchId
  const filteredModalStudents = students.filter((student) => {
    if (modalSelectedBatchId === "all") return true;
    return student.batch_id === modalSelectedBatchId || student.batches?.id === modalSelectedBatchId;
  });

  return (
    <div className="space-y-6">
      {/* Printable Receipt Layout - HIDDEN ON DISPLAY, SHOWN ONLY ON PRINT */}
      {receiptToPrint && (
        <div className="hidden print:block print-area p-8 border-2 border-slate-900 rounded-2xl max-w-lg mx-auto text-left font-sans">
          <div className="text-center pb-4 border-b-2 border-slate-800 flex flex-col items-center">
            {logoUrl ? (
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white border border-slate-200/60 p-1 flex items-center justify-center shrink-0 mb-2">
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-600 text-white font-bold text-lg shrink-0 mb-2">
                ম
              </div>
            )}
            <h2 className="text-xl font-bold">মানবিক কলেজ কোচিং সেন্টার</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">এইচএসসি মানবিক বিভাগের নির্ভরযোগ্য শিক্ষা প্রতিষ্ঠান</p>
            <p className="text-[10px] text-slate-400">মোবাইল: ০১XXXXXXX • ঢাকা, বাংলাদেশ</p>
          </div>

          <div className="flex items-center justify-between py-4 text-xs">
            <span className="font-mono font-bold">রসিদ নং: {receiptToPrint.receipt_number}</span>
            <span>তারিখ: {new Date(receiptToPrint.paid_date).toLocaleDateString("bn-BD")}</span>
          </div>

          <div className="border-t border-b border-slate-200 py-3 my-2 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">ছাত্র/ছাত্রীর নাম:</span>
              <span className="font-bold text-slate-800">{receiptToPrint.students?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">রোল/আইডি:</span>
              <span className="font-mono font-bold text-slate-800">{receiptToPrint.students?.student_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ব্যাচ:</span>
              <span className="font-semibold text-slate-800">{receiptToPrint.students?.batches?.name || "নির্ধারিত নেই"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">পরিশোধিত মাস:</span>
              <span className="font-bold text-slate-800">{receiptToPrint.month} {receiptToPrint.year}</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-4 bg-slate-50 border-2 border-dashed border-slate-300 px-4 rounded-xl my-6">
            <span className="font-bold text-xs">মোট পরিশোধিত টাকা:</span>
            <span className="text-lg font-bold text-slate-900">৳ {Number(receiptToPrint.amount).toLocaleString("bn-BD")}</span>
          </div>

          <div className="flex justify-between items-end pt-12 text-xs">
            <div className="text-center w-36 border-t border-slate-400 pt-1">
              <span>অভিভাবকের স্বাক্ষর</span>
            </div>
            <div className="text-center w-36 border-t border-slate-400 pt-1">
              <span>কর্তৃপক্ষের স্বাক্ষর</span>
            </div>
          </div>
        </div>
      )}

      {/* Screen Interface Wrapper (Hidden on print) */}
      <div className="print:hidden space-y-6">
        {/* Header and Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-slate-500 text-sm">শিক্ষার্থীদের মাসিক ফিস কালেকশন হিস্ট্রি ও নতুন ফি রসিদ তৈরি</p>
          </div>
          <button
            onClick={() => {
              setSelectedStudentId("");
              setModalSelectedBatchId("all");
              setError(null);
              setModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>ফি সংগ্রহ করুন</span>
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

        {/* Search & Batch Filter header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white border border-slate-200/60 rounded-2xl shadow-xs">
          <div className="relative flex-1 w-full">
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="শিক্ষার্থীর নাম, রোল আইডি বা রসিদ নম্বর লিখে সার্চ করুন..."
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs text-left"
            />
          </div>
          <div className="w-full sm:w-48 shrink-0">
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs font-semibold text-left"
            >
              <option value="all">সব ব্যাচ</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Collections Table Card */}
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">হিসাব তালিকা লোড হচ্ছে...</p>
            </div>
          ) : filteredCollections.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-500 font-semibold">
                    <th className="px-6 py-4">প্রিন্ট</th>
                    <th className="px-6 py-4">পরিশোধের তারিখ</th>
                    <th className="px-6 py-4">পরিশোধিত টাকা</th>
                    <th className="px-6 py-4">মাসের নাম</th>
                    <th className="px-6 py-4">ব্যাচ</th>
                    <th className="px-6 py-4">রোল/আইডি</th>
                    <th className="px-6 py-4">নাম</th>
                    <th className="px-6 py-4">রসিদ নম্বর</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCollections.map((col) => (
                    <tr key={col.id} className="text-slate-700 hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleTriggerPrint(col)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>রসিদ</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(col.paid_date).toLocaleDateString("bn-BD")}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        ৳ {Number(col.amount).toLocaleString("bn-BD")}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-teal-50 border border-teal-100 text-teal-700 rounded-md font-semibold text-[10px]">
                          {col.month} {col.year}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {col.students?.batches?.name || "নির্ধারিত নেই"}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {col.students?.student_id}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {col.students?.name}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-400 text-xs">
                        {col.receipt_number}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 text-sm">
              ফি সংগ্রহের কোনো ডাটা পাওয়া যায়নি।
            </div>
          )}
        </div>

        {/* Collect Fee Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-scale-up">
              <div className="flex items-center justify-between h-14 px-6 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-teal-600" />
                  <span>ফি সংগ্রহ ফরম</span>
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
                  title="বন্ধ করুন"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCollectFee} className="p-6 space-y-4">
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    ব্যাচ অনুযায়ী ফিল্টার করুন
                  </label>
                  <select
                    value={modalSelectedBatchId}
                    onChange={(e) => {
                      setModalSelectedBatchId(e.target.value);
                      setSelectedStudentId(""); // reset student select when batch changes
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  >
                    <option value="all">সব ব্যাচ</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    শিক্ষার্থী নির্বাচন করুন
                  </label>
                  <select
                    value={selectedStudentId}
                    required
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  >
                    <option value="">-- শিক্ষার্থী নির্বাচন করুন --</option>
                    {filteredModalStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.student_id} -{" "}
                        {student.batches?.name || "ব্যাচ নেই"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                      পরিশোধিত মাস
                    </label>
                    <select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                    >
                      {banglaMonths.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                      বছর
                    </label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                    >
                      <option value={new Date().getFullYear() - 1}>
                        {(new Date().getFullYear() - 1).toString()}
                      </option>
                      <option value={new Date().getFullYear()}>
                        {new Date().getFullYear().toString()}
                      </option>
                      <option value={new Date().getFullYear() + 1}>
                        {(new Date().getFullYear() + 1).toString()}
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                      টাকার পরিমাণ (৳)
                    </label>
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="প্যাকেজ ফি"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                      পরিশোধের তারিখ
                    </label>
                    <input
                      type="date"
                      required
                      value={paidDate}
                      onChange={(e) => setPaidDate(e.target.value)}
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
                    বাতিল
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
                      <span>সংরক্ষণ ও রসিদ তৈরি</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
