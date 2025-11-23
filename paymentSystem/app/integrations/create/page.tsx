"use client";

import React from "react";
import Link from "next/link";
import { X, ChevronLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressiveBlur } from "@/components/core/progressive-blur";

export default function CreateIntegrationPage() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center py-20">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden flex flex-col h-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative flex items-center justify-center p-4 pt-6 border-gray-100/50">
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
            {/* Custom Integrations Card */}
            <div className="relative h-72 overflow-hidden rounded-2xl bg-gray-100">
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
            </div>

            {/* Chat Messages Area (Empty for now) */}
            <div className="flex flex-col gap-4">
              {/* Messages would go here */}
            </div>
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Paste a URL to create an automation..."
                className="w-full bg-gray-50 border-none rounded-full py-3 pl-4 pr-12 text-sm focus:ring-1 focus:ring-black/5 placeholder:text-gray-400"
              />
              <button className="absolute right-2 p-2 bg-black text-white rounded-full hover:bg-black/90 transition-colors active:scale-95">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

