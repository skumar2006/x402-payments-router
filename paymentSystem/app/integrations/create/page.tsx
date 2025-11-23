"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, Send, Terminal, Globe, Search, Cpu, Check, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressiveBlur } from "@/components/core/progressive-blur";

const STEPS = [
  {
    id: 'init',
    title: 'Initialize URL Builder Agent',
    icon: Terminal,
    details: [
      "Booting up agent environment...",
      "Loading navigation modules...",
      "Connecting to secure browser instance...",
      "Agent ready."
    ]
  },
  {
    id: 'nav',
    title: 'Navigate to site',
    icon: Globe,
    details: [
      "Resolving DNS...",
      "Establishing secure connection...",
      "Waiting for DOM load...",
      "Site loaded successfully."
    ]
  },
  {
    id: 'explore',
    title: 'Explore pages',
    icon: Search,
    details: [
      "Scanning navigation structure...",
      "Identifying interactive elements...",
      "Mapping user flows...",
      "Found 3 primary interaction points."
    ]
  },
  {
    id: 'gen',
    title: 'Generate Integration',
    icon: Cpu,
    details: [
      "Compiling interaction patterns...",
      "Generating x402 compatibility layer...",
      "Validating payment routes...",
      "Finalizing integration package..."
    ]
  },
];

const TypewriterLog = ({ lines, onComplete }: { lines: string[], onComplete: () => void }) => {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let currentIndex = 0;
    
    // Initial delay before starting
    const startTimeout = setTimeout(() => {
      interval = setInterval(() => {
        if (currentIndex >= lines.length) {
          clearInterval(interval);
          if (!hasCompletedRef.current) {
            hasCompletedRef.current = true;
            // Small delay before signaling completion
            setTimeout(() => onCompleteRef.current?.(), 500);
          }
          return;
        }
        setVisibleLines(prev => [...prev, lines[currentIndex]]);
        currentIndex++;
      }, 600); // Speed of log lines
    }, 300);

    return () => {
      clearTimeout(startTimeout);
      if (interval) clearInterval(interval);
    };
  }, [lines]);

  return (
    <div className="font-mono text-xs text-gray-500 space-y-1 mt-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
      {visibleLines.map((line, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}>
          <span className="text-blue-500 mr-2">{">"}</span>{line}
        </motion.div>
      ))}
      <motion.div 
        animate={{ opacity: [0, 1, 0] }} 
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="w-1.5 h-3 bg-blue-500 inline-block ml-1 align-middle"
      />
    </div>
  );
};

export default function CreateIntegrationPage() {
  const [inputValue, setInputValue] = useState("");
  const [pendingLink, setPendingLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // New state for initialization flow
  const [isInitializing, setIsInitializing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const cleanUrl = (url: string) => {
    return url
      .replace(/^https?:\/\//, '') // Remove http:// or https://
      .replace(/^www\./, '') // Remove www.
      .replace(/\/$/, ''); // Remove trailing slash
  };

  const handleSubmit = async () => {
    if (inputValue.trim()) {
      const link = inputValue.trim();
      setInputValue("");
      setIsLoading(true);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsLoading(false);
      setPendingLink(link);
    }
  };

  const handleConfirm = () => {
    setIsInitializing(true);
    setCurrentStepIndex(0);
  };

  const handleStepComplete = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCompletedSteps(prev => [...prev, STEPS[currentStepIndex].id]);
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setCompletedSteps(prev => [...prev, STEPS[currentStepIndex].id]);
      setCurrentStepIndex(-1); // No more active steps
      setTimeout(() => setShowSuccess(true), 800);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center py-20" style={{ backgroundImage: 'url(/bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden flex flex-col h-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative flex items-center justify-center p-4 pt-6 border-gray-100/50 shrink-0 z-10 bg-white">
          <Link href="/integrations" className="absolute left-4 top-1/2 -translate-y-1/2">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 active:scale-[0.98]">
              <ChevronLeft className="h-5 w-5" />
            </button>
          </Link>
          <h1 className="text-xl font-normal tracking-tight font-averia">Integrations</h1>
          <Link href="/" className="absolute right-4 top-1/2 -translate-y-1/2">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 active:scale-[0.98]">
              <X className="h-5 w-5" />
            </button>
          </Link>
        </div>

        {/* Content Container */}
        <div className="flex flex-col h-full overflow-hidden relative">
          <div className="flex-1 overflow-y-auto px-10 pb-6 space-y-6">
            {/* Custom Integrations Card - Disappears on Initialize */}
            <AnimatePresence mode="popLayout">
              {!isInitializing && (
                <motion.div 
                  key="hero-card"
                  initial={{ opacity: 1, y: 0, height: '18rem', marginBottom: '1.5rem' }}
                  exit={{ opacity: 0, y: -50, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="relative overflow-hidden rounded-2xl bg-gray-100 shrink-0"
                >
                  <img 
                    src="/custom-integration-placeholder2.png" 
                    alt="Custom Integrations Background" 
                    className="pointer-events-none h-full w-full object-cover"
                  />
                  <ProgressiveBlur
                    className="pointer-events-none absolute bottom-0 left-0 h-[50%] w-full"
                    blurIntensity={6}
                  />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between z-20">
                    <div className="-gap-3 flex flex-col">
                      <h2 className="text-left text-base font-medium leading-snug text-white">Custom Integrations</h2>
                      <p className="text-left text-sm leading-snug text-gray-100">Ask Flip to create one directly instead</p>
                    </div>
                    <button 
                      className="overflow-hidden cursor-pointer transition-[box-shadow,background-color,transform] duration-[125ms] ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-white focus-visible:ring-offset-2 disabled:cursor-not-allowed shadow-[inset_0_0_0_1px_rgba(0,0,0,0.75),0px_2px_5.6px_0px_rgba(0,0,0,0.08),inset_0px_0px_3px_0px_rgba(255,255,255,0.75)] [background:linear-gradient(180deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0.00)_38.33%),linear-gradient(180deg,rgba(0,0,0,0.00)_52.94%,rgba(0,0,0,0.75)_100%),#1B1B1B] hover:[background:linear-gradient(180deg,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0.10)_38.33%),linear-gradient(180deg,rgba(0,0,0,0.00)_52.94%,rgba(0,0,0,0.75)_100%),#1B1B1B] rounded-full px-3.5 py-2 text-sm font-medium leading-none text-white" 
                      type="button"
                    >
                      Message
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Input Bar - Moves up */}
            <motion.div layout className="relative flex items-center shrink-0">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputValue.trim()) {
                    handleSubmit();
                  }
                }}
                placeholder="Paste the site you want Flip to interact with..."
                disabled={isInitializing || !!pendingLink}
                className="w-full bg-gray-50 border border-gray-200 rounded-full py-3 pl-4 pr-12 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus-visible:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
              />
              <AnimatePresence>
                {inputValue.trim().length > 0 && !isInitializing && !pendingLink && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8, x: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 10 }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    onClick={handleSubmit}
                    className="absolute right-2 p-2 bg-black text-white rounded-full hover:bg-black/90 transition-colors active:scale-[0.98]"
                  >
                    <Send className="h-4 w-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Chat Messages Area */}
            <div className="flex flex-col gap-4 pb-4">
              {/* Loading Bubble */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-2xl w-fit"
                >
                  <div className="flex gap-1">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                  </div>
                </motion.div>
              )}

              {/* Confirmation Card */}
              <AnimatePresence>
                {pendingLink && !isLoading && !isInitializing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    className="flex flex-col gap-2.5 overflow-hidden"
                  >
                    <div className="bg-gray-100 rounded-2xl px-4 py-2.5">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Just to confirm, you want me to build an integration for{" "}
                        <span className="font-medium text-gray-900">{cleanUrl(pendingLink)}</span>?
                      </p>
                    </div>
                    <div className="flex items-center gap-2 justify-end mr-1">
                      <button
                        onClick={() => setPendingLink(null)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors active:scale-[0.98]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirm}
                        className="overflow-hidden cursor-pointer transition-[box-shadow,background-color,transform] duration-[125ms] ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-white focus-visible:ring-offset-2 disabled:cursor-not-allowed shadow-[inset_0_0_0_1px_rgba(0,0,0,0.75),0px_2px_5.6px_0px_rgba(0,0,0,0.08),inset_0px_0px_3px_0px_rgba(255,255,255,0.75)] [background:linear-gradient(180deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0.00)_38.33%),linear-gradient(180deg,rgba(0,0,0,0.00)_52.94%,rgba(0,0,0,0.75)_100%),#1B1B1B] hover:[background:linear-gradient(180deg,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0.10)_38.33%),linear-gradient(180deg,rgba(0,0,0,0.00)_52.94%,rgba(0,0,0,0.75)_100%),#1B1B1B] rounded-full px-4 py-2 text-sm font-medium leading-none text-white"
                      >
                        Confirm
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Initialization Steps */}
              <AnimatePresence mode="popLayout">
                {isInitializing && STEPS.map((step, index) => {
                  const isActive = index === currentStepIndex;
                  const isCompleted = completedSteps.includes(step.id);
                  
                  if (!isActive && !isCompleted) return null;

                  return (
                    <motion.div
                      key={step.id}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                      className={`rounded-2xl border overflow-hidden ${
                        isActive 
                          ? 'bg-white border-gray-200 shadow-sm' 
                          : 'bg-gray-50 border-transparent'
                      }`}
                    >
                      <div className="p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            isActive ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {isActive ? (
                              <step.icon className="h-4 w-4" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                              {step.title}
                            </h3>
                          </div>
                          {isActive && (
                            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                          )}
                        </div>

                        {/* Expanded Details for Active Step */}
                        {isActive && (
                          <TypewriterLog 
                            lines={step.details} 
                            onComplete={handleStepComplete}
                          />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Success Card */}
              <AnimatePresence>
                {showSuccess && pendingLink && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", bounce: 0.3 }}
                    className="bg-green-50 border border-green-100 rounded-2xl p-5 shadow-sm mt-2"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-green-100 p-2.5 rounded-full shrink-0">
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="text-base font-medium text-green-900">Integration Ready</h3>
                        <p className="text-sm text-green-800/80 leading-relaxed">
                          Successfully created x402 interface for <span className="font-semibold">{cleanUrl(pendingLink)}</span>. Agents can now interact with this service.
                        </p>
                        
                        <div className="mt-4 flex items-center gap-2 bg-white/60 p-2 rounded-lg border border-green-100/50">
                          <div className="bg-green-100/50 p-1.5 rounded-md">
                            <Globe className="h-3.5 w-3.5 text-green-700" />
                          </div>
                          <code className="flex-1 text-xs font-mono text-green-900 truncate">
                            x402://{cleanUrl(pendingLink)}/v1/interact
                          </code>
                          <button className="p-1.5 hover:bg-green-100 rounded-md text-green-700 transition-colors active:scale-[0.95]">
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="pt-3 flex gap-3">
                          <Button 
                            variant="default" 
                            className="h-9 text-sm bg-green-600 hover:bg-green-700 text-white shadow-none active:scale-[0.98]"
                          >
                            Test Integration
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="h-9 text-sm text-green-700 hover:text-green-800 hover:bg-green-100 active:scale-[0.98]"
                            onClick={() => {
                                // Reset flow
                                setIsInitializing(false);
                                setPendingLink(null);
                                setShowSuccess(false);
                                setCompletedSteps([]);
                                setCurrentStepIndex(-1);
                            }}
                          >
                            Done
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
