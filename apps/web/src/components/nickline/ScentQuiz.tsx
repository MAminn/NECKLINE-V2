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
            console.error("Invalid quiz data format", data);
          }
        })
        .catch(err => console.error("Error fetching quiz data:", err));
    }
  }, [isOpen]);

  // Deterministic scoring algorithm to recommend a matched Neckline Scent Aura
  const calculateResult = (userAnswers: Record<number, string>) => {
    if (!scents || scents.length === 0) return null;

    let bestMatch = scents[0];
    let highestScore = -1;

    const answerValues = Object.values(userAnswers).map(v => v.toLowerCase());

    scents.forEach(scent => {
      let score = 0;
      
      const searchableText = [
        scent.name,
        scent.subtitle,
        scent.description,
        scent.longDescription,
        scent.vibe,
        scent.category,
        scent.tag,
        ...(scent.notes ? Object.values(scent.notes) : []),
        ...(scent.ingredients || [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      answerValues.forEach(val => {
        if (searchableText.includes(val)) {
          score += 3;
        }
        
        if (scent.id.toLowerCase().includes(val)) {
          score += 5; 
        }

        if (val === "low" && scent.intensity <= 2) score += 2;
        if (val === "medium" && scent.intensity === 3) score += 2;
        if (val === "high" && scent.intensity >= 4) score += 2;
      });

      if (score > highestScore) {
        highestScore = score;
        bestMatch = scent;
      }
    });

    return bestMatch;
  };

  const handleOptionSelect = (optionValue: string) => {
    if (quizQuestions.length === 0) return;
    const questionId = quizQuestions[currentStep].id;
    const updatedAnswers = { ...answers, [questionId]: optionValue };
    setAnswers(updatedAnswers);

    if (currentStep < quizQuestions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Completed, calculate matched perfume
      const matched = calculateResult(updatedAnswers);
      setResultScent(matched);
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-pointer"
          />

          {/* Quiz Container Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-xl overflow-hidden border shadow-2xl z-10 p-6 md:p-8 rounded-2xl text-left
              dark:bg-[#0D0506]/90 dark:backdrop-blur-2xl dark:border-white/[0.08] light:bg-[#FAF8F5]/90 light:backdrop-blur-xl light:border-stone-200"
            id="scent-aura-quiz-modal"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Close Scent Finder"
            >
              <X className="w-4 h-4" />
            </button>

            {/* IF SHOWING RESULTS */}
            {resultScent ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-4"
                id="quiz-result-view"
              >
                <div className="flex justify-center mb-2">
                  <div className="p-2.5 bg-[#D21B27]/10 rounded-full border border-[#D21B27]/30 text-[#D21B27] animate-pulse">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>

                <span className="text-[10px] font-bold tracking-[0.3em] text-[#C29F68] uppercase block">
                  Match Compatibility: 98% Match
                </span>
                
                <h3 className="text-3xl font-serif tracking-[0.1em] font-semibold text-neutral-900 dark:text-white mt-1 uppercase">
                  Scent Match: {resultScent.name}
                </h3>
                
                <p className="text-xs text-[#D21B27] italic tracking-wider mb-6">
                  {resultScent.subtitle}
                </p>

                {/* Scent Visual */}
                <div className="w-48 h-48 mx-auto rounded-sm overflow-hidden border border-neutral-100 dark:border-zinc-900 shadow-xl mb-6 relative">
                  <img
                    src={resultScent.image}
                    alt={resultScent.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-0.5 px-2 py-0.5 bg-black/60 rounded-full text-[8.5px] text-amber-500 font-bold border border-amber-500/20">
                    <Star className="w-2.5 h-2.5 fill-amber-500" /> RECOMMENDED
                  </div>
                </div>

                <div className="max-w-md mx-auto mb-6 bg-black/25 dark:bg-black/40 light:bg-stone-100 p-4 border border-zinc-900/10 dark:border-zinc-800/40 text-left">
                  <p className="text-xs dark:text-stone-300 light:text-stone-700 leading-relaxed font-light mb-4">
                    Based on your sensory profile, <strong className="text-white uppercase font-serif">{resultScent.name}</strong> was matched to provide a sensory aura that emphasizes intimacy.
                  </p>
                  <div className="text-[10px] font-mono dark:text-neutral-400 light:text-stone-500">
                    <strong>Primary Scent Notes:</strong> {resultScent.notes.top} • {resultScent.notes.heart} • {resultScent.notes.base}
                  </div>
                </div>

                {/* Interaction buttons */}
                <div className="space-y-3 max-w-sm mx-auto">
                  <button
                    onClick={() => {
                      onAddToCart(resultScent);
                      onClose();
                    }}
                    className="w-full py-3 bg-[#D21B27] hover:bg-[#B0151E] text-white text-xs tracking-[0.25em] font-extrabold uppercase transition-all duration-300 shadow-lg cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Claim matched aura & add
                  </button>
                  
                  <button
                    onClick={resetQuiz}
                    className="w-full py-2 bg-transparent hover:bg-neutral-500/10 text-neutral-400 hover:text-white text-[10px] tracking-[0.2em] font-semibold uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" /> Re-take sensory quiz
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ACTIVE QUIZ STEP */
              <div id="quiz-active-step">
                {quizQuestions.length > 0 && (
                  <>
                    {/* Progress bar info */}
                    <div className="mb-6 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-900/40 pb-4">
                      <div>
                        <span className="text-[#D21B27] font-serif text-lg mr-2">✦</span>
                        <span className="text-[10px] font-bold tracking-[0.25em] text-neutral-400 uppercase">
                          Neckline Aura Finder
                        </span>
                      </div>
                      <span className="text-[10px] whitespace-nowrap font-mono text-neutral-500">
                        Question {currentStep + 1} of {quizQuestions.length}
                      </span>
                    </div>

                    {/* Progress bar visual */}
                    <div className="w-full bg-zinc-900 h-1 mb-8 overflow-hidden rounded-full">
                      <div 
                        className="bg-[#D21B27] h-full transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / quizQuestions.length) * 100}%` }}
                      />
                    </div>

                    {/* Display Question */}
                    <h4 className="text-xl md:text-2xl font-serif text-neutral-900 dark:text-white tracking-wide mb-6">
                      {quizQuestions[currentStep].question}
                    </h4>

                    {/* List Options */}
                    <div className="space-y-4">
                      {quizQuestions[currentStep].options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(opt.value)}
                      className="w-full p-4 border text-left rounded-xl cursor-pointer flex justify-between items-center transition-all duration-300
                        dark:bg-white/[0.02] dark:backdrop-blur-md dark:border-white/[0.05] dark:hover:border-[#D21B27]/50 dark:hover:bg-red-950/10
                        light:bg-stone-50/70 light:backdrop-blur-md light:border-stone-200 light:hover:border-stone-400 light:hover:bg-stone-100/50"
                      id={`quiz-opt-${idx}`}
                    >
                      <div>
                        <span className="text-xs uppercase tracking-widest text-[#D21B27] block mb-1">
                          0{idx + 1}. {opt.label}
                        </span>
                        <p className="text-[11px] dark:text-neutral-400 light:text-stone-600 font-light font-sans max-w-sm">
                          {opt.description}
                        </p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-transparent border border-neutral-400 dark:group-hover:bg-[#D21B27]" />
                    </button>
                  ))}
                    </div>
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
