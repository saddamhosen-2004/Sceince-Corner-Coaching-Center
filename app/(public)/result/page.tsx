"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Loader2, FileBadge, AlertCircle, Printer, Download, BookOpen } from "lucide-react";
import { toPng } from "html-to-image";

interface MarksheetRecord {
  result_id: string;
  exam_name: string;
  exam_date: string;
  total_marks: number;
  subject_name: string;
  marks_obtained: number;
  student_name: string;
  student_roll: string;
  student_rank: number;
}

export default function PublicResultSearchPage() {
  const supabase = createClient();

  const [rollId, setRollId] = useState("");
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<MarksheetRecord[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        console.error("Failed to load logo in result:", err);
      }
    };
    fetchLogo();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollId.trim()) {
      setError("অনুগ্রহ করে আপনার রোল/স্টুডেন্ট আইডি লিখুন।");
      return;
    }

    setLoading(true);
    setError(null);
    setRecords([]);
    setSearched(false);

    try {
      // Call the secure postgres RPC function
      const { data, error: rpcError } = await supabase.rpc(
        "get_student_results_by_roll",
        { roll_id: rollId.trim() }
      );

      if (rpcError) throw rpcError;

      setRecords(data || []);
      setSearched(true);
    } catch (err: any) {
      setError(err.message || "ফলাফল অনুসন্ধান করতে সমস্যা হয়েছে। অনুগ্রহ করে আইডি যাচাই করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownloadImage = async (examId: string) => {
    const element = document.getElementById(`marksheet-${examId}`);
    if (!element) return;

    setDownloading(examId);

    // 1. Create a wrapper positioned invisibly within viewport bounds to ensure mobile browser paints it
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.top = "0px";
    wrapper.style.left = "0px";
    wrapper.style.width = "720px";
    wrapper.style.opacity = "0.01";
    wrapper.style.pointerEvents = "none";
    wrapper.style.zIndex = "-9999";

    // 2. Clone the element
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.position = "relative";
    clone.style.top = "0px";
    clone.style.left = "0px";
    clone.style.width = "100%";

    // 3. Append clone to wrapper, and wrapper to body
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // Remove animations to prevent elements starting at opacity-0 in html-to-image
    [clone, ...clone.querySelectorAll("*")].forEach((el) => {
      const classes = Array.from(el.classList);
      classes.forEach((c) => {
        if (c.startsWith("animate-") || c.startsWith("stagger-")) {
          el.classList.remove(c);
        }
      });
    });

    try {
      // 4. Generate PNG from the clone (not the wrapper)
      const dataUrl = await toPng(clone, {
        backgroundColor: "#ffffff",
        style: {
          padding: "32px",
          borderRadius: "0px",
          boxShadow: "none",
          border: "none",
        },
        filter: (node: any) => {
          if (node.classList && node.classList.contains("exclude-from-image")) {
            return false;
          }
          return true;
        },
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `marksheet_${examId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating marksheet image:", err);
    } finally {
      // 5. Clean up the wrapper from the DOM
      document.body.removeChild(wrapper);
      setDownloading(null);
    }
  };

  const formatRankBengali = (rank: number) => {
    const bnNums = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    const toBn = (num: number) =>
      String(num)
        .split("")
        .map(d => bnNums[Number(d)] || d)
        .join("");

    if (rank === 1) return "১ম";
    if (rank === 2) return "২য়";
    if (rank === 3) return "৩য়";
    if (rank === 4) return "৪র্থ";
    if (rank === 5) return "৫ম";
    if (rank === 6) return "৬ষ্ঠ";
    if (rank === 7) return "৭ম";
    if (rank === 8) return "৮ম";
    if (rank === 9) return "৯ম";
    if (rank === 10) return "১০ম";
    return `${toBn(rank)}তম`;
  };

  // Group records by exam name so we can render multiple exam marksheet cards
  const examsGrouped = records.reduce((acc, curr) => {
    if (!acc[curr.exam_name]) {
      acc[curr.exam_name] = {
        exam_date: curr.exam_date,
        total_marks: curr.total_marks,
        student_name: curr.student_name,
        student_roll: curr.student_roll,
        student_rank: curr.student_rank,
        subjects: [],
      };
    }
    acc[curr.exam_name].subjects.push({
      subject_name: curr.subject_name,
      marks_obtained: curr.marks_obtained,
    });
    return acc;
  }, {} as Record<string, { exam_date: string; total_marks: number; student_name: string; student_roll: string; student_rank: number; subjects: Array<{ subject_name: string; marks_obtained: number }> }>);

  return (
    <div className="max-w-5xl mx-auto px-5 py-8 md:py-12">
    <div className="space-y-8 text-left font-sans">
      {/* Page Header (Hidden on print) */}
      <div className="print:hidden text-left">
        <h1 className="text-2xl font-black text-slate-800">পরীক্ষার ফলাফল</h1>
        <p className="text-slate-400 text-xs mt-1">আপনার রোল বা স্টুডেন্ট আইডি দিয়ে ব্যক্তিগত রেজাল্ট শিট ডাউনলোড করুন</p>
      </div>

      {/* Search Input Box (Hidden on print) */}
      <div className="print:hidden max-w-xl mx-auto p-6 bg-white border border-slate-200/60 rounded-3xl shadow-xs space-y-4 text-left">
        <h3 className="font-bold text-slate-800 text-sm">রোল/আইডি দিয়ে সার্চ করুন</h3>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            required
            value={rollId}
            onChange={(e) => setRollId(e.target.value)}
            placeholder="যেমন: MCCC-1001"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs font-mono font-bold text-left"
          />

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-600/70 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>অনুসন্ধান করুন</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-[11px] leading-relaxed">
            <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Marksheet Display Area */}
      {searched && (
        <div className="space-y-6">
          {Object.keys(examsGrouped).length > 0 ? (
            <div className="space-y-8">
              {/* Toolbar action buttons (Hidden on print) */}
              <div className="print:hidden flex items-center justify-start gap-3 max-w-2xl mx-auto">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>মার্কশিট প্রিন্ট করুন</span>
                </button>
              </div>

              {/* Loop through each exam group (Print-optimized structure) */}
              {Object.entries(examsGrouped).map(([examName, data]) => {
                const totalObtained = data.subjects.reduce((sum, s) => sum + s.marks_obtained, 0);
                const averageMark = totalObtained / data.subjects.length;
                const isPassed = data.subjects.every((s) => s.marks_obtained >= data.total_marks * 0.33); // Simple criteria
                const examId = examName.replace(/\s+/g, "_");

                return (
                  <div
                    key={examName}
                    id={`marksheet-${examId}`}
                    className="print-area max-w-2xl mx-auto bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-xs space-y-6 text-left"
                  >
                    {/* Card Actions Panel (Hidden on Print & excluded from Image output) */}
                    <div className="exclude-from-image print:hidden flex justify-between items-center border-b border-slate-100 pb-3 mb-2">
                      <span className="text-slate-400 text-[10px] font-semibold">ফলাফল শিট অপশন:</span>
                      <button
                        onClick={() => handleDownloadImage(examId)}
                        disabled={downloading === examId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-600/70 text-white rounded-xl text-[10px] font-bold shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                      >
                        {downloading === examId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>ইমেজ ডাউনলোড</span>
                      </button>
                    </div>

                    {/* Header */}
                    <div className="text-center pb-4 border-b-2 border-slate-800 space-y-1.5 flex flex-col items-center">
                      {logoUrl ? (
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-white border border-slate-200/60 p-1 flex items-center justify-center shrink-0 mb-1">
                          <img
                            src={logoUrl}
                            alt="Logo"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-600 text-white font-bold text-xl shrink-0 mb-1">
                          ম
                        </div>
                      )}
                      <h2 className="text-lg font-black text-slate-800">মানবিক কলেজ কোচিং সেন্টার</h2>
                      <p className="text-slate-500 text-[10px]">শিক্ষা ও অগ্রগতির পথে আমাদের যাত্রা</p>
                      <h3 className="font-bold text-teal-700 text-xs mt-3 pt-1 border-t border-slate-100 w-full">
                        একাডেমিক ট্রান্সক্রিপ্ট / মার্কশিট
                      </h3>
                    </div>

                    {/* Meta info columns */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs pt-2">
                      <div>
                        <span className="text-slate-400 block mb-0.5">পরীক্ষার নাম:</span>
                        <span className="font-bold text-slate-800">{examName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">শিক্ষার্থীর নাম:</span>
                        <span className="font-bold text-slate-800">{data.student_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">মেধা স্থান (Rank):</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg font-extrabold text-xs bg-amber-50 text-amber-700 border border-amber-200">
                          {formatRankBengali(data.student_rank)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">তারিখ:</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(data.exam_date).toLocaleDateString("bn-BD")}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">রোল/স্টুডেন্ট আইডি:</span>
                        <span className="font-mono font-bold text-slate-800">{data.student_roll}</span>
                      </div>
                    </div>

                    {/* Marks breakdown Table */}
                    <div className="pt-4">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                            <th className="px-4 py-2 text-left">বিষয়</th>
                            <th className="px-4 py-2 text-center">পূর্ণমান</th>
                            <th className="px-4 py-2 text-center">প্রাপ্ত নম্বর</th>
                            <th className="px-4 py-2 text-center">মন্তব্য</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.subjects.map((sub, idx) => {
                            const passMark = data.total_marks * 0.33;
                            const passStatus = sub.marks_obtained >= passMark;
                            return (
                              <tr key={idx} className="text-slate-700 hover:bg-slate-50/20">
                                <td className="px-4 py-3 font-bold text-slate-900 text-left">
                                  {sub.subject_name}
                                </td>
                                <td className="px-4 py-3 text-slate-400 text-center">
                                  {data.total_marks.toLocaleString("bn-BD")}
                                </td>
                                <td className="px-4 py-3 font-bold text-slate-800 text-center">
                                  {sub.marks_obtained.toLocaleString("bn-BD")}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-md font-bold text-[9px] ${
                                      passStatus
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-rose-50 text-rose-700"
                                    }`}
                                  >
                                    {passStatus ? "পাস" : "ফেল"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Total stats summary card */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 my-4 gap-3 text-xs font-semibold">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">ফলাফল:</span>
                          <span
                            className={`font-bold ${isPassed ? "text-emerald-600" : "text-rose-600"}`}
                          >
                            {isPassed ? "কৃতকার্য" : "অকৃতকার্য"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">মেধা স্থান:</span>
                          <span className="font-bold text-amber-600">
                            {formatRankBengali(data.student_rank)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">গড় নম্বর:</span>
                          <span className="font-bold text-slate-800">
                            {averageMark.toFixed(1).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">মোট প্রাপ্ত নম্বর:</span>
                          <span className="font-bold text-slate-900">
                            {totalObtained.toLocaleString("bn-BD")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Print signature padding */}
                    <div className="hidden print:flex justify-between items-end pt-16 text-xs">
                      <div className="text-center w-36 border-t border-slate-400 pt-1">
                        <span>অভিভাবকের স্বাক্ষর</span>
                      </div>
                      <div className="text-center w-36 border-t border-slate-400 pt-1">
                        <span>কর্তৃপক্ষের স্বাক্ষর</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center bg-white border border-slate-200/60 rounded-3xl max-w-xl mx-auto shadow-xs space-y-3">
              <FileBadge className="w-12 h-12 text-slate-200 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">কোনো ফলাফল পাওয়া যায়নি!</h4>
              <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                আপনার দেওয়া রোল/আইডি **&quot;{rollId}&quot;** এর বিপরীতে কোনো পরীক্ষার ফলাফল ডাটাবেজে পাওয়া যায়নি। রোল আইডি সঠিক আছে কিনা অ্যাডমিনের সাথে যোগাযোগ করুন।
              </p>
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
