"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react";

interface Batch {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  capacity: number;
}

export default function BatchesPage() {
  const supabase = createClient();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("40");
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from("batches")
        .select("*")
        .order("created_at", { ascending: true });

      if (fetchErr) throw fetchErr;
      setBatches(data || []);
    } catch (err: any) {
      setError(err.message || "ব্যাচ তালিকা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const openAddModal = () => {
    setEditingBatch(null);
    setName("");
    setStartTime("");
    setEndTime("");
    setCapacity("40");
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (batch: Batch) => {
    setEditingBatch(batch);
    setName(batch.name);
    setStartTime(batch.start_time);
    setEndTime(batch.end_time);
    setCapacity(batch.capacity.toString());
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!name.trim() || !startTime || !endTime || !capacity) {
      setError("অনুগ্রহ করে সব তথ্য সঠিকভাবে পূরণ করুন।");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        name,
        start_time: startTime,
        end_time: endTime,
        capacity: parseInt(capacity),
      };

      if (editingBatch) {
        // Update
        const { error: updateErr } = await supabase
          .from("batches")
          .update(payload)
          .eq("id", editingBatch.id);

        if (updateErr) throw updateErr;
        setSuccess("ব্যাচটি সফলভাবে আপডেট করা হয়েছে।");
      } else {
        // Insert
        const { error: insertErr } = await supabase
          .from("batches")
          .insert([payload]);

        if (insertErr) throw insertErr;
        setSuccess("নতুন ব্যাচ সফলভাবে যুক্ত করা হয়েছে।");
      }

      setModalOpen(false);
      fetchBatches();
    } catch (err: any) {
      if (err.message.includes("unique_name") || err.message.includes("duplicate key")) {
        setError("এই নামের একটি ব্যাচ ইতিমধ্যে তৈরি করা আছে।");
      } else {
        setError(err.message || "সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (batch: Batch) => {
    setBatchToDelete(batch);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!batchToDelete) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: deleteErr } = await supabase
        .from("batches")
        .delete()
        .eq("id", batchToDelete.id);

      if (deleteErr) {
        if (deleteErr.message.includes("foreign key")) {
          throw new Error("এই ব্যাচে শিক্ষার্থী বা শিক্ষক তালিকাভুক্ত রয়েছে। তাই এটি মুছে ফেলা সম্ভব নয়।");
        }
        throw deleteErr;
      }

      setSuccess("ব্যাচটি সফলভাবে মুছে ফেলা হয়েছে।");
      setDeleteConfirmOpen(false);
      setBatchToDelete(null);
      fetchBatches();
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
          <p className="text-slate-500 text-sm">কোচিং সেন্টারের নিয়মিত ব্যাচ সমূহের তালিকা এবং সময়সূচী</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন ব্যাচ তৈরি করুন</span>
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
            <p className="text-slate-400 text-sm">ব্যাচ তালিকা লোড হচ্ছে...</p>
          </div>
        ) : batches.length > 0 ? (
          <div className="overflow-x-auto" dir="ltr">
            <table className="w-full text-left border-collapse text-sm" dir="ltr">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-500 font-semibold">
                  <th className="px-6 py-4">ব্যাচের নাম</th>
                  <th className="px-6 py-4">শুরুর সময়</th>
                  <th className="px-6 py-4">শেষের সময়</th>
                  <th className="px-6 py-4">ধারণক্ষমতা</th>
                  <th className="px-6 py-4">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((batch) => (
                  <tr key={batch.id} className="text-slate-700 hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-900">{batch.name}</td>
                    <td className="px-6 py-4 text-slate-500">{batch.start_time}</td>
                    <td className="px-6 py-4 text-slate-500">{batch.end_time}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {batch.capacity.toLocaleString("bn-BD")} জন
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-start gap-2">
                        <button
                          onClick={() => openEditModal(batch)}
                          className="p-1.5 hover:bg-teal-50 hover:text-teal-600 rounded-lg text-slate-400 transition-colors"
                          title="সম্পাদনা করুন"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(batch)}
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
            কোন ব্যাচ তৈরি করা হয়নি। নতুন ব্যাচ তৈরি করতে উপরে ক্লিক করুন।
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between h-14 px-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingBatch ? "ব্যাচ তথ্য সংশোধন" : "নতুন ব্যাচ তৈরি করুন"}
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
                  ব্যাচের নাম (যেমন: সকাল ১ / সকাল ২)
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ব্যাচের নাম লিখুন"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    শুরুর সময়
                  </label>
                  <input
                    type="text"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="যেমন: ০৮:০০ AM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                    শেষের সময়
                  </label>
                  <input
                    type="text"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="যেমন: ১০:০০ AM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                  ধারণক্ষমতা (জন)
                </label>
                <input
                  type="number"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="যেমন: ৪০"
                  min="1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                />
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
                আপনি কি নিশ্চিতভাবে **&quot;{batchToDelete?.name}&quot;** ব্যাচটি মুছে ফেলতে চান? এটি মুছে ফেললে ডাটাবেজ থেকে এর সমস্ত বিবরণ স্থায়ীভাবে মুছে যাবে।
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
