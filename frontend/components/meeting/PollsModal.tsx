"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, ArrowRight, Play, Square, CheckSquare } from "lucide-react";
import { toast } from "sonner";

interface PollsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PollQuestion {
  id: string;
  question: string;
  options: string[];
}

interface PollResults {
  questionId: string;
  votes: Record<string, number>;
}

export default function PollsModal({ isOpen, onClose }: PollsModalProps) {
  const [step, setStep] = useState<"create" | "active" | "results">("create");
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<PollQuestion[]>([
    { id: "q-1", question: "How would you rate this candidate's interview session?", options: ["Excellent", "Good", "Needs Improvement", "Poor"] },
  ]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [results, setResults] = useState<PollResults[]>([]);
  const [hasVoted, setHasVoted] = useState<Record<string, string>>({}); // option index voted

  if (!isOpen) return null;

  const handleAddOption = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        return {
          ...q,
          options: [...q.options, `Option ${q.options.length + 1}`],
        };
      })
    );
  };

  const handleRemoveOption = (qId: string, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        return {
          ...q,
          options: q.options.filter((_, idx) => idx !== optIdx),
        };
      })
    );
  };

  const handleLaunchPoll = () => {
    if (!title.trim()) {
      toast.error("Please provide a poll title first.");
      return;
    }
    // Set initial mock votes
    const initialResults: PollResults[] = questions.map((q) => {
      const votes: Record<string, number> = {};
      q.options.forEach((opt) => {
        votes[opt] = 0;
      });
      return { questionId: q.id, votes };
    });

    setResults(initialResults);
    setStep("active");
    toast.success("Poll launched! Waiting for participants to vote.");
  };

  const handleOptionVote = (qId: string, option: string) => {
    setHasVoted((prev) => ({ ...prev, [qId]: option }));
    setResults((prev) =>
      prev.map((res) => {
        if (res.questionId !== qId) return res;
        const newVotes = { ...res.votes };
        newVotes[option] = (newVotes[option] || 0) + 1;
        return { ...res, votes: newVotes };
      })
    );
    toast.success("Vote registered successfully.");
  };

  const handleEndPoll = () => {
    setStep("results");
    toast.info("Poll ended. Displaying final results.");
  };

  const handleResetPoll = () => {
    setStep("create");
    setHasVoted({});
    setResults([]);
    toast.info("Resetting poll fields.");
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-[500px] rounded-2xl bg-white p-6 shadow-modal text-[#1F1F1F] animate-in zoom-in-95 duration-150 border border-[#E5E5E5] m-4 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F3F3F3] pb-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-[#1F1F1F]">Polls & Quizzes</h3>
            <p className="text-xs text-[#747487]">Collect instant feedback from meeting participants</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#747487] hover:bg-[#F3F3F3] hover:text-[#1F1F1F] transition-all"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-sm">
          {step === "create" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-xs text-[#747487] uppercase">Poll Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Evaluation Assessment Poll"
                  className="w-full rounded-lg border border-[#E5E5E5] p-2.5 bg-white focus:outline-none focus:border-[#0B5CFF] text-sm text-[#1F1F1F]"
                />
              </div>

              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-xs text-[#747487] uppercase">Question {idx + 1}</label>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) =>
                        setQuestions((prev) =>
                          prev.map((item) => (item.id === q.id ? { ...item, question: e.target.value } : item))
                        )
                      }
                      className="w-full rounded-lg border border-[#E5E5E5] p-2 bg-white text-xs font-semibold text-[#1F1F1F]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-[10px] text-[#747487] uppercase">Options</label>
                    {q.options.map((option, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuestions((prev) =>
                              prev.map((item) => {
                                if (item.id !== q.id) return item;
                                const newOpts = [...item.options];
                                newOpts[optIdx] = val;
                                return { ...item, options: newOpts };
                              })
                            );
                          }}
                          className="flex-1 rounded border border-[#E5E5E5] px-2 py-1 text-xs text-[#1F1F1F]"
                        />
                        {q.options.length > 2 && (
                          <button
                            onClick={() => handleRemoveOption(q.id, optIdx)}
                            className="text-[#747487] hover:text-[#E34040] p-1"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {q.options.length < 5 && (
                      <button
                        onClick={() => handleAddOption(q.id)}
                        className="text-xs font-bold text-[#0B5CFF] hover:underline flex items-center gap-1 mt-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Option
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === "active" && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 text-xs font-bold text-[#0B5CFF] rounded-lg border border-blue-100 flex items-center gap-2">
                <span className="h-2 w-2 bg-[#0B5CFF] rounded-full animate-ping" />
                <span>POLL IS CURRENTLY LIVE IN THE MEETING SESSION</span>
              </div>

              <h4 className="font-bold text-base text-[#1F1F1F]">{title}</h4>
              {questions.map((q) => {
                const isVoted = hasVoted[q.id];
                return (
                  <div key={q.id} className="rounded-xl border border-[#E5E5E5] p-4 bg-[#FDFDFD] space-y-3.5">
                    <p className="font-bold text-sm text-[#1F1F1F]">{q.question}</p>
                    <div className="space-y-2 flex flex-col">
                      {q.options.map((opt) => (
                        <button
                          key={opt}
                          disabled={!!isVoted}
                          onClick={() => handleOptionVote(q.id, opt)}
                          className={`w-full text-left rounded-xl p-3 border text-xs font-bold transition-all flex items-center justify-between ${
                            isVoted === opt
                              ? "bg-[#0B5CFF]/10 border-[#0B5CFF] text-[#0B5CFF]"
                              : "border-[#E5E5E5] bg-white text-[#1F1F1F] hover:bg-[#F8F8F8]"
                          }`}
                        >
                          <span>{opt}</span>
                          {isVoted === opt && <CheckSquare className="h-4 w-4 text-[#0B5CFF]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {step === "results" && (
            <div className="space-y-4">
              <h4 className="font-bold text-base text-[#1F1F1F]">{title} (Results)</h4>
              {questions.map((q) => {
                const res = results.find((r) => r.questionId === q.id);
                const totalVotes = Object.values(res?.votes || {}).reduce((a, b) => a + b, 0);

                return (
                  <div key={q.id} className="rounded-xl border border-[#E5E5E5] p-4 bg-[#FDFDFD] space-y-4">
                    <p className="font-bold text-sm text-[#1F1F1F]">{q.question}</p>
                    <div className="space-y-3">
                      {q.options.map((opt) => {
                        const optVotes = res?.votes[opt] || 0;
                        const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;

                        return (
                          <div key={opt} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold text-[#1F1F1F]">
                              <span>{opt}</span>
                              <span>
                                {optVotes} {optVotes === 1 ? "vote" : "votes"} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-[#F3F3F3] overflow-hidden">
                              <div
                                className="h-full bg-[#0B5CFF] rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-5 border-t border-[#F3F3F3] pt-4 flex gap-2.5 w-full">
          {step === "create" && (
            <>
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-[#E5E5E5] bg-white h-[44px] text-xs font-bold text-[#1F1F1F] hover:bg-[#F3F3F3] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleLaunchPoll}
                className="flex-1 rounded-lg bg-[#0B5CFF] h-[44px] text-xs font-bold text-white hover:bg-[#0E72ED] transition-all flex items-center justify-center gap-1.5"
              >
                Launch Poll <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {step === "active" && (
            <button
              onClick={handleEndPoll}
              className="w-full rounded-lg bg-[#E34040] h-[44px] text-xs font-bold text-white hover:bg-[#C93333] transition-all flex items-center justify-center gap-1.5"
            >
              <Square className="h-4 w-4" /> End Poll
            </button>
          )}

          {step === "results" && (
            <>
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-[#E5E5E5] bg-white h-[44px] text-xs font-bold text-[#1F1F1F] hover:bg-[#F3F3F3] transition-all"
              >
                Done
              </button>
              <button
                onClick={handleResetPoll}
                className="flex-1 rounded-lg bg-[#0B5CFF] h-[44px] text-xs font-bold text-white hover:bg-[#0E72ED] transition-all flex items-center justify-center gap-1.5"
              >
                Reset & New Poll
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
