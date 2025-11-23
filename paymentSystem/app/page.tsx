"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <a href="sms:+15109773150?body=hey%2C%20whats%20Flip%3F">
        <Button
          className="active:scale-[0.98] bg-black text-white hover:bg-gray-800 text-xl px-8 py-6 rounded-full font-normal font-averia"
          draggable={false}
        >
          Text Flip
        </Button>
      </a>
    </div>
  );
}
