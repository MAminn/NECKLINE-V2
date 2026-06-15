/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Scent, QuizQuestion } from '../../types/nickline';
import { useCart } from '../../hooks/useCart';
import { QUIZ_QUESTIONS, getQuizResult } from '../../data/products';
import { easeOutExpo } from '../../lib/motion';

interface ScentQuizProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (scent: Scent, quantity?: number) => void;
  scents?: Scent[];
}

export default function ScentQuiz({ isOpen, onClose, onAddToCart, scents = [] }: ScentQuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [direction, setDirection] = useState(1);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(QUIZ_QUESTIONS);
  const { addItem } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/quiz')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setQuizQuestions(data);
        }
      })
      .catch(() => {
        // keep local questions
      });
  }, [isOpen]);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      setStep(0);
      setAnswers([]);
      setDirection(1);
      setQuizQuestions(QUIZ_QUESTIONS);
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const handleSelect = useCallback(
    (optionId: string) => {
      const newAnswers = [...answers, optionId];
      setAnswers(newAnswers);
      if (step < quizQuestions.length - 1) {
        setDirection(1);
        setStep((prev) => prev + 1);
      } else {
        setDirection(1);
        setStep((prev) => prev + 1);
      }
    },
    [answers, step, quizQuestions.length]
  );

  const handleBack = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep((prev) => prev - 1);
      setAnswers((prev) => prev.slice(0, -1));
    }
  }, [step]);

  const handleAddToCart = useCallback(() => {
    const result = getQuizResult(answers);
    if (result) {
      const apiScent = scents.find((s) => s.id === result.id);
      const scentToAdd = apiScent || result;
      if (onAddToCart) {
        onAddToCart(scentToAdd, 1);
      } else {
        addItem(scentToAdd.id, 1);
      }
    }
    handleClose();
  }, [answers, scents, onAddToCart, addItem, handleClose]);

  const progress = (step / quizQuestions.length) * 100;
  const result = step >= quizQuestions.length ? getQuizResult(answers) : null;

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div onClick={handleClose} className="absolute inset-0 bg-noir/70 backdrop-blur-md" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: easeOutExpo }}
            className="relative w-full max-w-[560px] max-h-[90vh] overflow-y-auto glass-card-strong rounded-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-glass-border">
              <div className="flex items-center gap-2">
                <span className="text-crimson text-xs">&#10022;</span>
                <span className="text-overline text-warm-white">NECKLINE AURA FINDER</span>
              </div>
              <div className="flex items-center gap-4">
                {step < quizQuestions.length && (
                  <span className="font-mono text-xs text-muted">
                    {Math.min(step + 1, quizQuestions.length)} / {quizQuestions.length}
                  </span>
                )}
                <button
                  onClick={handleClose}
                  className="p-1 text-muted hover:text-warm-white transition-colors"
                  aria-label="Close quiz"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            {step < quizQuestions.length && (
              <div className="h-[2px] bg-glass-border">
                <motion.div
                  className="h-full bg-crimson"
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: easeOutExpo }}
                />
              </div>
            )}

            {/* Content */}
            <div className="p-6 min-h-[400px]">
              <AnimatePresence mode="wait" custom={direction}>
                {result ? (
                  /* Result screen */
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center"
                  >
                    <span className="text-overline text-crimson mb-4 block">YOUR SIGNATURE SCENT</span>
                    <img
                      src={result.image}
                      alt={result.name}
                      className="w-48 h-48 object-cover rounded-md mx-auto mb-6"
                    />
                    <h3 className="font-display font-semibold text-2xl text-warm-white mb-2">
                      {result.name}
                    </h3>
                    <p className="text-muted text-sm mb-2 max-w-sm mx-auto">{result.description}</p>
                    <p className="font-mono text-lg text-warm-white mb-6">
                      {result.price.toLocaleString()} {result.currency}
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleAddToCart}
                        className="h-12 px-8 bg-crimson text-warm-white font-display font-semibold text-sm tracking-[0.12em] uppercase rounded-sm hover:bg-crimson-light transition-colors"
                      >
                        SHOP THIS SCENT
                      </button>
                      <button
                        onClick={handleClose}
                        className="h-12 px-8 border border-glass-border text-warm-white font-display font-semibold text-sm tracking-[0.12em] uppercase rounded-sm hover:bg-crimson-glow transition-colors"
                      >
                        CLOSE
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* Question screen */
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4, ease: easeOutExpo }}
                  >
                    <h3 className="font-display font-semibold text-xl text-warm-white mb-6 leading-tight">
                      {quizQuestions[step]?.question}
                    </h3>
                    <div className="space-y-3">
                      {quizQuestions[step]?.options.map((option, i) => (
                        <motion.button
                          key={option.value}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => handleSelect(option.value)}
                          className="w-full text-left p-4 rounded-md border border-glass-border bg-transparent hover:bg-crimson-glow hover:border-crimson/30 transition-all duration-200 group"
                        >
                          <div className="flex items-start gap-4">
                            <span className="font-mono text-sm text-crimson mt-0.5">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <div>
                              <span className="font-display font-medium text-sm text-warm-white tracking-wide uppercase block mb-1">
                                {option.label}
                              </span>
                              <span className="text-xs text-muted">{option.description}</span>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                    {step > 0 && (
                      <button
                        onClick={handleBack}
                        className="mt-6 font-display font-medium text-xs tracking-[0.1em] text-muted hover:text-warm-white uppercase transition-colors"
                      >
                        BACK
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
