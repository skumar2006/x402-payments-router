"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header Nav */}
      <nav className="w-full p-6 flex items-center justify-center">
        <Link 
          href="/integrations" 
          className="text-base font-medium text-gray-900 hover:text-gray-600 transition-colors active:scale-[0.98]"
        >
          integrations
        </Link>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <a href="sms:+15109773150?body=hey%2C%20whats%20Flip%3F">
          <Button
            className="active:scale-[0.98] bg-black text-white hover:bg-gray-800 text-xl px-8 py-6 rounded-full font-normal font-averia"
            draggable={false}
          >
            Text Flip
          </Button>
        </a>
      </div>
    </div>
  );
}
