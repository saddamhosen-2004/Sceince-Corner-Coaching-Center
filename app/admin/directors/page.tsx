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
  MapPin,
  Camera,
  UserCheck,
  X,
} from "lucide-react";
import Image from "next/image";

interface Director {
  id: string;
  name: string;
  position: string;
  phone: string;
  address: string;
  photo_url: string | null;
}

export default function DirectorsPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDirector, setEditingDirector] = useState<Director | null>(null);
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Delete states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [directorToDelete, setDirectorToDelete] = useState<Director | null>(null);

  const fetchDirectors = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from("directors")
        .select("*")
        .order("created_at", { ascending: true });

      if (fetchErr) throw fetchErr;
      setDirectors(data || []);
    } catch (err: any) {
      setError(err.message || "পরিচালক তালিকা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectors();
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
      const url = await uploadImageToImageKit(file, "directors");
      setPhotoUrl(url);
      setSuccess("ছবি সফলভাবে আপলোড করা হয়েছে।");
    } catch (err: any) {
      setError("ছবি আপলোড করতে ব্যর্থ হয়েছে: " + (err.message || "সার্ভার এরর।"));
    } finally {
      setUploadingImage(false);
    }
  };

  const openAddModal = () => {
    setEditingDirector(null);
    setName("");
    setPosition("");
    setPhone("");
    setAddress("");
    setPhotoUrl(null);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (director: Director) => {
    setEditingDirector(director);
    setName(director.name);
    setPosition(director.position);
    setPhone(director.phone);
    setAddress(director.address);
    setPhotoUrl(director.photo_url);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!name.trim() || !position.trim() || !phone.trim() || !address.trim()) {
      setError("অনুগ্রহ করে সব তথ্য সঠিকভাবে পূরণ করুন।");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        name,
        position,
        phone,
        address,
        photo_url: photoUrl,
      };

      if (editingDirector) {
        const { error: updateErr } = await supabase
          .from("directors")
          .update(payload)
          .eq("id", editingDirector.id);

        if (updateErr) throw updateErr;
        setSuccess("পরিচালকের তথ্য সফলভাবে আপডেট করা হয়েছে।");
      } else {
        const { error: insertErr } = await supabase
          .from("directors")
          .insert([payload]);

        if (insertErr) throw insertErr;
        setSuccess("নতুন পরিচালক সফলভাবে যুক্ত করা হয়েছে।");
      }

      setModalOpen(false);
      fetchDirectors();
    } catch (err: any) {
      setError(err.message || "সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (director: Director) => {
    setDirectorToDelete(director);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!directorToDelete) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: deleteErr } = await supabase
        .from("directors")
        .delete()
        .eq("id", directorToDelete.id);

      if (deleteErr) throw deleteErr;

      setSuccess("পরিচালককে সফলভাবে মুছে ফেলা হয়েছে।");
      setDeleteConfirmOpen(false);
      setDirectorToDelete(null);
      fetchDirectors();
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
          <p className="text-slate-500 text-sm">কোচিং সেন্টারের পরিচালনা পর্ষদ ও ডিরেক্টর প্যানেল পরিচালনা করুন</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন পরিচালক যোগ করুন</span>
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

      {/* Content directory */}
      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">পরিচালক তালিকা লোড হচ্ছে...</p>
          </div>
        ) : directors.length > 0 ? (
          <div className="overflow-x-auto" dir="ltr">
            <table className="w-full text-left border-collapse text-sm" dir="ltr">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-500 font-semibold">
                  <th className="px-6 py-4">নাম</th>
                  <th className="px-6 py-4">পদবী</th>
                  <th className="px-6 py-4">মোবাইল নম্বর</th>
                  <th className="px-6 py-4">ঠিকানা</th>
                  <th className="px-6 py-4">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {directors.map((director) => (
                  <tr key={director.id} className="text-slate-700 hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <div className="flex items-center justify-start gap-3">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          {director.photo_url ? (
                            <Image
                              src={director.photo_url}
                              alt={director.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <User className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <span>{director.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-semibold">{director.position}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">{director.phone}</td>
                    <td className="px-6 py-4 text-slate-500">{director.address}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-start gap-2">
                        <button
                          onClick={() => openEditModal(director)}
                          className="p-1.5 hover:bg-teal-50 hover:text-teal-600 rounded-lg text-slate-400 transition-colors"
                          title="সম্পাদনা করুন"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(director)}
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
            পরিচালনা পর্ষদে এখনও কোনো পরিচালক যুক্ত করা হয়নি।
          </div>
        )}
      </div>

      {/* Add / Edit Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8 animate-scale-up">
            <div className="flex items-center justify-between h-14 px-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-teal-600" />
                <span>{editingDirector ? "পরিচালক তথ্য সংশোধন" : "নতুন পরিচালক যুক্ত করুন"}</span>
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
              {/* Photo Upload Section */}
              <div className="flex flex-col items-center justify-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-24 h-24 rounded-full overflow-hidden relative bg-slate-100 border-2 border-slate-200">
                  {photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt="Uploaded director photo"
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

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                  পরিচালকের নাম
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
                  পদবী (যেমন: প্রধান পরিচালক / সহকারী পরিচালক)
                </label>
                <input
                  type="text"
                  required
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="যেমন: প্রধান পরিচালক"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs text-left"
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
                  placeholder="মোবাইল নম্বর লিখুন"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs text-left"
                />
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
                  placeholder="ঠিকানা লিখুন"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                />
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
              <p className="text-slate-500 text-xs leading-relaxed text-center">
                আপনি কি নিশ্চিতভাবে **&quot;{directorToDelete?.name}&quot;** পরিচালককে মুছে ফেলতে চান? ডাটাবেজ থেকে এর বিবরণ স্থায়ীভাবে মুছে যাবে।
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
