/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Scent, QuizQuestion } from "../../types/nickline";
import { X, Sparkles, ShoppingBag, RefreshCw, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ScentQuizProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (scent: Scent) => void;
  scents: Scent[];
}


export default function ScentQuiz({ isOpen, onClose, onAddToCart, scents }: ScentQuizProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [resultScent, setResultScent] = useState<Scent | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    if (isOpen && quizQuestions.length === 0) {
      fetch("/api/quiz")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setQuizQuestions(data);
          } else {
            setQuizQuestions([]);
          }
        })
        .catch(() => setQuizQuestions([]));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const calculateResult = (userAnswers: Record<number, string>) => {
    if (!scents?.length) return null;

    const answerWords = Object.values(userAnswers)
      .flatMap(v => v.toLowerCase().split(/\s+/));

    const keywords = (s: Scent) =>
      `${s.name} ${s.subtitle} ${s.vibe} ${s.category} ${s.tag} ${Object.values(s.notes).join(' ')}`.toLowerCase();

    let best = scents[0];
    let bestScore = -1;

    for (const scent of scents) {
      let score = 0;
      const text = keywords(scent);
      for (const word of answerWords) {
        if (text.includes(word)) score += 3;
        if (scent.id.toLowerCase().includes(word)) score += 5;
        if (word === 'low' && scent.intensity <= 2) score += 2;
        if (word === 'medium' && scent.intensity === 3) score += 2;
        if (word === 'high' && scent.intensity >= 4) score += 2;
      }
      if (score > bestScore) {
        bestScore = score;
        best = scent;
      }
    }
    return best;
  };

  const handleOptionSelect = (optionValue: string) => {
    if (quizQuestions.length === 0) return;
    const questionId = quizQuestions[currentStep].id;
    const updatedAnswers = { ...answers, [questionId]: optionValue };
    setAnswers(updatedAnswers);

    if (currentStep < quizQuestions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setResultScent(calculateResult(updatedAnswers));
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers({});
    setResultScent(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          {/* Backdrop — no backdrop-blur, GPU opacity only */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 cursor-pointer"
          />

          {/* Quiz panel — solid bg, no backdrop-blur */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
            className="relative w-full max-w-xl overflow-hidden border border-white/[0.08] shadow-2xl z-10 p-6 md:p-8 rounded-2xl text-left bg-[#0D0506]"
            id="scent-aura-quiz-modal"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-1.5 rounded-full bg-white/5 border border-white/[0.08] text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Close Scent Finder"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>

            {/* RESULT SCREEN */}
            {resultScent ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="text-center py-4"
                id="quiz-result-view"
              >
                <div className="flex justify-center mb-2">
                  <div className="p-2.5 bg-[#D21B27]/10 rounded-full border border-[#D21B27]/30 text-[#D21B27]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>

                <span className="text-xs font-bold tracking-[0.3em] text-[#C29F68] uppercase block">
                  Your Scent Match
                </span>

                <h3 className="text-2xl md:text-3xl font-serif tracking-[0.08em] font-semibold text-white mt-2 uppercase">
                  {resultScent.name}
                </h3>

                <p className="text-sm text-[#D21B27] italic tracking-wider mb-6 mt-1">
                  {resultScent.subtitle}
                </p>

                <div className="w-48 h-48 mx-auto rounded-sm overflow-hidden border border-zinc-800 shadow-xl mb-6 relative">
                  <img
                    src={resultScent.image}
                    alt={resultScent.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-0.5 px-2 py-0.5 bg-black/70 rounded-full text-[8.5px] text-amber-400 font-bold border border-amber-500/20">
                    <Star className="w-2.5 h-2.5 fill-amber-400" /> MATCHED
                  </div>
                </div>

                <div className="max-w-md mx-auto mb-6 bg-white/[0.03] border border-white/[0.06] p-4 text-left rounded-sm">
                  <p className="text-xs text-stone-300 leading-relaxed font-light mb-4">
                    Based on your sensory profile,{' '}
                    <strong className="text-white uppercase font-serif">{resultScent.name}</strong>{' '}
                    was matched to emphasize intimacy closest to your skin.
                  </p>
                  <div className="text-[10px] font-mono text-neutral-500">
                    <strong className="text-neutral-400">Notes:</strong>{' '}
                    {resultScent.notes.top} · {resultScent.notes.heart} · {resultScent.notes.base}
                  </div>
                </div>

                <div className="space-y-3 max-w-sm mx-auto">
                  <button
                    onClick={() => { onAddToCart(resultScent); onClose(); }}
                    className="w-full py-3 bg-[#D21B27] hover:bg-[#B0151E] text-white text-xs tracking-[0.25em] font-extrabold uppercase transition-colors duration-200 shadow-lg cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" /> Add to Cart
                  </button>

                  <button
                    onClick={resetQuiz}
                    className="w-full py-2 bg-transparent hover:bg-white/5 text-neutral-400 hover:text-white text-[10px] tracking-[0.2em] font-semibold uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retake Quiz
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ACTIVE QUIZ STEP */
              <div id="quiz-active-step">
                {quizQuestions.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 mx-auto mb-4 rounded-full border-2 border-[#D21B27]/30 border-t-[#D21B27] animate-spin" />
                    <p className="text-sm text-neutral-400 tracking-wide">Loading your profile…</p>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="mb-5 flex items-center justify-between border-b border-white/[0.06] pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[#D21B27] font-serif text-xl leading-none">✦</span>
                        <span className="text-xs font-bold tracking-[0.25em] text-neutral-400 uppercase">
                          Neckline Aura Finder
                        </span>
                      </div>
                      <span className="text-xs font-mono text-neutral-500">
                        {currentStep + 1} / {quizQuestions.length}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-white/[0.06] h-1 mb-7 overflow-hidden rounded-full">
                      <div
                        className="bg-[#D21B27] h-full transition-all duration-300 ease-out rounded-full"
                        style={{ width: `${((currentStep + 1) / quizQuestions.length) * 100}%` }}
                      />
                    </div>

                    {/* Question + options — slide on step change */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                      >
                        <h4 className="text-xl md:text-2xl font-serif text-white tracking-wide mb-7 leading-snug">
                          {quizQuestions[currentStep].question}
                        </h4>

                        <div className="space-y-3">
                          {quizQuestions[currentStep].options.map((opt, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleOptionSelect(opt.value)}
                              className="group w-full p-4 border border-white/[0.07] bg-white/[0.02] text-left rounded-xl cursor-pointer flex justify-between items-center
                                transition-colors duration-150 hover:border-[#D21B27]/50 hover:bg-[#D21B27]/5"
                            >
                              <div>
                                <span className="text-sm uppercase tracking-widest text-[#D21B27] block mb-1 font-semibold">
                                  0{idx + 1}. {opt.label}
                                </span>
                                <p className="text-xs text-neutral-400 font-light max-w-sm leading-relaxed">
                                  {opt.description}
                                </p>
                              </div>
                              <div className="w-3 h-3 rounded-full border border-neutral-600 group-hover:border-[#D21B27] group-hover:bg-[#D21B27]/20 transition-all duration-150 shrink-0 ml-4" />
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
