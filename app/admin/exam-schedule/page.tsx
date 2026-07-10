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
  CalendarCheck,
  X,
  Clock,
  MapPin,
  BookOpen,
  Layers,
  StickyNote,
  CheckSquare,
  Square,
} from "lucide-react";

interface Batch   { id: string; name: string }
interface Subject { id: string; name: string }

interface ExamSlot {
  id: string;
  exam_title: string;
  subject_id: string | null;
  batch_id: string;
  exam_date: string;
  start_time: string | null;
  venue: string | null;
  notes: string | null;
  subjects?: { name: string } | null;
  batches?: { name: string } | null;
}

const EMPTY_FORM = {
  exam_title: "",
  subject_id: "",
  exam_date: "",
  start_time: "",
  venue: "",
  notes: "",
};

export default function AdminExamSchedulePage() {
  const supabase = createClient();

  const [slots, setSlots]       = useState<ExamSlot[]>([]);
  const [batches, setBatches]   = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  const [modalOpen, setModalOpen]     = useState(false);
  const [editingSlot, setEditingSlot] = useState<ExamSlot | null>(null);
  const [form, setForm]               = useState({ ...EMPTY_FORM });

  /* Multi-batch state */
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [allBatches, setAllBatches]             = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<ExamSlot | null>(null);
  const [deleting, setDeleting]         = useState(false);

  const [filterBatch, setFilterBatch] = useState("all");

  /* ─────────────────── fetch ─────────────────── */
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [{ data: batchData }, { data: subjectData }, { data: slotData, error: slotErr }] =
        await Promise.all([
          supabase.from("batches").select("id, name").order("name"),
          supabase.from("subjects").select("id, name").order("name"),
          supabase
            .from("exam_schedule")
            .select("*, subjects(name), batches(name)")
            .order("exam_date", { ascending: true })
            .order("start_time", { ascending: true }),
        ]);
      if (slotErr) throw slotErr;
      setBatches(batchData || []);
      setSubjects(subjectData || []);
      const mapped = (slotData || []).map((s: any) => ({
        ...s,
        subjects: Array.isArray(s.subjects) ? s.subjects[0] : s.subjects,
        batches:  Array.isArray(s.batches)  ? s.batches[0]  : s.batches,
      }));
      setSlots(mapped);
    } catch (err: any) {
      setError(err.message || "ডেটা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => { setSuccess(null); setError(null); }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  /* ─────────────────── batch toggle helpers ─────────────────── */
  const toggleBatch = (id: string) => {
    setSelectedBatchIds(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
    setAllBatches(false);
  };

  const toggleAllBatches = () => {
    if (allBatches) {
      setAllBatches(false);
      setSelectedBatchIds([]);
    } else {
      setAllBatches(true);
      setSelectedBatchIds(batches.map(b => b.id));
    }
  };

  /* Keep allBatches in sync when individual toggles cover all */
  useEffect(() => {
    if (batches.length > 0 && selectedBatchIds.length === batches.length) {
      setAllBatches(true);
    } else {
      setAllBatches(false);
    }
  }, [selectedBatchIds, batches]);

  /* ─────────────────── modal helpers ─────────────────── */
  const openAdd = () => {
    setEditingSlot(null);
    setForm({ ...EMPTY_FORM });
    setSelectedBatchIds([]);
    setAllBatches(false);
    setModalOpen(true);
  };

  const openEdit = (slot: ExamSlot) => {
    setEditingSlot(slot);
    setForm({
      exam_title: slot.exam_title,
      subject_id: slot.subject_id || "",
      exam_date:  slot.exam_date,
      start_time: slot.start_time || "",
      venue:      slot.venue || "",
      notes:      slot.notes || "",
    });
    setSelectedBatchIds([slot.batch_id]);
    setAllBatches(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSlot(null);
    setSelectedBatchIds([]);
    setAllBatches(false);
  };

  /* ─────────────────── save ─────────────────── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.exam_title.trim())   { setError("পরীক্ষার নাম দিন।"); return; }
    if (selectedBatchIds.length === 0) { setError("অন্তত একটি ব্যাচ বাছাই করুন।"); return; }
    if (!form.exam_date)           { setError("পরীক্ষার তারিখ দিন।"); return; }

    setSubmitting(true);
    setError(null);
    try {
      const basePayload = {
        exam_title: form.exam_title.trim(),
        subject_id: form.subject_id || null,
        exam_date:  form.exam_date,
        start_time: form.start_time || null,
        venue:      form.venue.trim() || null,
        notes:      form.notes.trim() || null,
      };

      if (editingSlot) {
        /* Edit: update only the single row, keep its batch */
        const { error: e } = await supabase
          .from("exam_schedule")
          .update({ ...basePayload, batch_id: selectedBatchIds[0] })
          .eq("id", editingSlot.id);
        if (e) throw e;
        setSuccess("পরীক্ষার সময়সূচী আপডেট হয়েছে।");
      } else {
        /* Add: insert one row per selected batch */
        const rows = selectedBatchIds.map(batch_id => ({ ...basePayload, batch_id }));
        const { error: e } = await supabase.from("exam_schedule").insert(rows);
        if (e) throw e;
        const label = allBatches
          ? "সকল ব্যাচে"
          : selectedBatchIds.length > 1
          ? `${selectedBatchIds.length}টি ব্যাচে`
          : "১টি ব্যাচে";
        setSuccess(`নতুন পরীক্ষা ${label} যোগ করা হয়েছে।`);
      }
      closeModal();
      fetchAll();
    } catch (err: any) {
      setError(err.message || "সংরক্ষণ করতে সমস্যা হয়েছে।");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─────────────────── delete ─────────────────── */
  const handleDelete = async () => {
    if (!slotToDelete) return;
    setDeleting(true);
    try {
      const { error: e } = await supabase.from("exam_schedule").delete().eq("id", slotToDelete.id);
      if (e) throw e;
      setSuccess("পরীক্ষার এন্ট্রি মুছে ফেলা হয়েছে।");
      setDeleteOpen(false);
      setSlotToDelete(null);
      fetchAll();
    } catch (err: any) {
      setError(err.message || "মুছতে সমস্যা হয়েছে।");
    } finally {
      setDeleting(false);
    }
  };

  /* ─────────────────── filtered + grouped ─────────────────── */
  const filtered = filterBatch === "all"
    ? slots
    : slots.filter(s => s.batch_id === filterBatch);

  const grouped: Record<string, ExamSlot[]> = {};
  filtered.forEach(s => {
    if (!grouped[s.exam_title]) grouped[s.exam_title] = [];
    grouped[s.exam_title].push(s);
  });

  const formatTime = (t: string | null) => {
    if (!t) return null;
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("bn-BD", { weekday: "short", day: "numeric", month: "long", year: "numeric" });

  /* ─────────────────── UI ─────────────────── */
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

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          পরীক্ষার তারিখ, বিষয়, সময় ও কক্ষ নির্ধারণ করুন — একাধিক ব্যাচে একসাথে যোগ করা যাবে
        </p>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          নতুন পরীক্ষা যোগ করুন
        </button>
      </div>

      {/* Batch filter tabs */}
      {!loading && batches.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterBatch("all")}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            style={filterBatch === "all"
              ? { background: "#0f766e", color: "#fff" }
              : { background: "#fff", color: "#0f766e", border: "1.5px solid #0f766e" }}
          >
            সকল ব্যাচ
          </button>
          {batches.map(b => (
            <button
              key={b.id}
              onClick={() => setFilterBatch(b.id)}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              style={filterBatch === b.id
                ? { background: "#0f766e", color: "#fff" }
                : { background: "#fff", color: "#0f766e", border: "1.5px solid #0f766e" }}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 bg-white border border-slate-200/60 rounded-2xl shadow-xs">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-slate-400 text-xs">লোড হচ্ছে...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-dashed border-slate-300 rounded-2xl">
          <CalendarCheck className="w-10 h-10 text-slate-300" />
          <p className="text-slate-400 text-sm font-medium">কোনো পরীক্ষার সময়সূচী নেই</p>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> প্রথম পরীক্ষা যোগ করুন
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([examTitle, slotList]) => (
            <div key={examTitle} className="bg-white border border-slate-200/60 rounded-2xl shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-teal-600" />
                  <h3 className="font-bold text-slate-800 text-sm">{examTitle}</h3>
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-[10px] font-bold">
                    {slotList.length}টি এন্ট্রি
                  </span>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 font-semibold border-b border-slate-100">
                      <th className="px-5 py-3">বিষয়</th>
                      <th className="px-5 py-3">তারিখ</th>
                      <th className="px-5 py-3">সময়</th>
                      <th className="px-5 py-3">স্থান / কক্ষ</th>
                      <th className="px-5 py-3">ব্যাচ</th>
                      <th className="px-5 py-3">নোট</th>
                      <th className="px-5 py-3 text-right">কার্যক্রম</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {slotList.map(slot => (
                      <tr key={slot.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 font-semibold text-slate-800">
                          {slot.subjects?.name || <span className="text-slate-300 italic">—</span>}
                        </td>
                        <td className="px-5 py-3 text-slate-600">{formatDate(slot.exam_date)}</td>
                        <td className="px-5 py-3 text-slate-600">
                          {formatTime(slot.start_time) || <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {slot.venue || <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-lg text-[10px] font-semibold">
                            {slot.batches?.name || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-400 max-w-xs truncate">
                          {slot.notes || <span className="text-slate-200">—</span>}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(slot)}
                              className="p-1.5 hover:bg-slate-100 hover:text-teal-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
                              title="সম্পাদনা"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setSlotToDelete(slot); setDeleteOpen(true); }}
                              className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
                              title="মুছুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
                {slotList.map(slot => (
                  <div key={slot.id} className="p-4 space-y-3 text-left">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-teal-50 border border-teal-100 text-teal-700 rounded-lg text-[10px] font-semibold">
                        {slot.batches?.name || "—"}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md text-[10px] font-semibold font-mono">
                        <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        {formatTime(slot.start_time) || "—"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 text-sm">
                        বিষয়: {slot.subjects?.name || "—"}
                      </h4>
                      <p className="text-xs text-slate-500">
                        তারিখ: {formatDate(slot.exam_date)}
                      </p>
                      {slot.venue && (
                        <p className="text-xs text-slate-500">
                          স্থান/কক্ষ: {slot.venue}
                        </p>
                      )}
                      {slot.notes && (
                        <p className="text-xs text-slate-400 italic">
                          নোট: {slot.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                      <button
                        onClick={() => openEdit(slot)}
                        className="p-1.5 hover:bg-slate-100 hover:text-teal-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
                        title="সম্পাদনা"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setSlotToDelete(slot); setDeleteOpen(true); }}
                        className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
                        title="মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════ ADD/EDIT MODAL ══════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 bg-teal-600 text-white shrink-0">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5" />
                <h2 className="font-bold text-sm">
                  {editingSlot ? "পরীক্ষার এন্ট্রি সম্পাদনা" : "নতুন পরীক্ষার সময়সূচী যোগ করুন"}
                </h2>
              </div>
              <button onClick={closeModal} className="p-1 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Exam title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <CalendarCheck className="w-3.5 h-3.5 text-teal-600" />
                  পরীক্ষার নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: অর্ধবার্ষিক পরীক্ষা ২০২৬"
                  value={form.exam_title}
                  onChange={e => setForm(f => ({ ...f, exam_title: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                />
              </div>

              {/* ── BATCH MULTI-SELECT ── */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-600" />
                  ব্যাচ <span className="text-rose-500">*</span>
                  {!editingSlot && (
                    <span className="ml-1 text-[10px] text-slate-400 font-normal">
                      (একাধিক বা সব বাছাই করা যাবে)
                    </span>
                  )}
                </label>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  {/* All Batches toggle */}
                  {!editingSlot && (
                    <button
                      type="button"
                      onClick={toggleAllBatches}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer border-b border-slate-100 ${
                        allBatches
                          ? "bg-teal-50 text-teal-700"
                          : "bg-slate-50 text-slate-600 hover:bg-teal-50/50"
                      }`}
                    >
                      {allBatches
                        ? <CheckSquare className="w-4 h-4 text-teal-600 shrink-0" />
                        : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
                      সকল ব্যাচ
                      <span className="ml-auto text-[10px] font-normal text-teal-600 bg-teal-100 px-1.5 py-0.5 rounded-full">
                        All
                      </span>
                    </button>
                  )}

                  {/* Individual batches */}
                  {batches.map((b, i) => {
                    const checked = selectedBatchIds.includes(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => editingSlot
                          ? setSelectedBatchIds([b.id])
                          : toggleBatch(b.id)
                        }
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs transition-colors cursor-pointer ${
                          i < batches.length - 1 ? "border-b border-slate-100" : ""
                        } ${
                          checked
                            ? "bg-teal-50 text-teal-700 font-semibold"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {checked
                          ? <CheckSquare className="w-4 h-4 text-teal-600 shrink-0" />
                          : <Square className="w-4 h-4 text-slate-300 shrink-0" />}
                        {b.name}
                      </button>
                    );
                  })}
                </div>

                {/* Selected summary */}
                {selectedBatchIds.length > 0 && (
                  <p className="text-[10px] text-teal-600 font-medium">
                    ✓{" "}
                    {allBatches
                      ? "সকল ব্যাচ নির্বাচিত"
                      : `${selectedBatchIds.length}টি ব্যাচ নির্বাচিত: ${
                          batches
                            .filter(b => selectedBatchIds.includes(b.id))
                            .map(b => b.name)
                            .join(", ")
                        }`}
                  </p>
                )}
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                  বিষয় (ঐচ্ছিক)
                </label>
                <select
                  value={form.subject_id}
                  onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all bg-white"
                >
                  <option value="">— বিষয় বাছাই করুন —</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5 text-teal-600" />
                    তারিখ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.exam_date}
                    onChange={e => setForm(f => ({ ...f, exam_date: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    শুরুর সময়
                  </label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              {/* Venue */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  স্থান / কক্ষ নম্বর
                </label>
                <input
                  type="text"
                  placeholder="যেমন: কক্ষ নং ১, প্রধান মিলনায়তন"
                  value={form.venue}
                  onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <StickyNote className="w-3.5 h-3.5 text-teal-600" />
                  বিশেষ নোট (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  placeholder="যেমন: সিলেবাস অনুযায়ী প্রস্তুতি নিন..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingSlot ? "আপডেট করুন" : "সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ DELETE CONFIRM MODAL ══════════════ */}
      {deleteOpen && slotToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-fade-in-up">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">এন্ট্রি মুছে ফেলবেন?</h3>
                <p className="text-slate-500 text-xs mt-1">
                  <strong>{slotToDelete.exam_title}</strong> –{" "}
                  {slotToDelete.subjects?.name || "বিষয় নেই"} ({slotToDelete.batches?.name}) এন্ট্রিটি স্থায়ীভাবে মুছে যাবে।
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteOpen(false); setSlotToDelete(null); }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                বাতিল
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                হ্যাঁ, মুছুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
