"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { X, ChevronDown, Plus, ShoppingBag, Utensils, Car, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Category = "All" | "Food" | "Transport" | "Clothes" | "Shopping";

interface Integration {
  id: string;
  title: string;
  description: string;
  category: Category;
  icon: React.ReactNode;
  color: string;
}

const integrations: Integration[] = [
  {
    id: "1",
    title: "Auto-order Lunch",
    description: "Automatically orders your favorite lunch based on your calendar schedule and preferences.",
    category: "Food",
    icon: <Image src="/uber.jpg" alt="Uber" width={18} height={18} className="rounded-lg" />,
    color: "",
  },
  {
    id: "2",
    title: "Ride Receipt Sync",
    description: "Syncs all your Uber and Lyft receipts directly to your expense tracker instantly.",
    category: "Transport",
    icon: <Car className="h-4 w-4" />,
    color: "text-blue-500",
  },
  {
    id: "3",
    title: "Wardrobe Refresh",
    description: "Get notified when your favorite brands drop new collections that match your style.",
    category: "Clothes",
    icon: <Shirt className="h-4 w-4" />,
    color: "text-purple-500",
  },
  {
    id: "4",
    title: "Smart Shopping List",
    description: "Automatically adds items to your shopping list when you run out of essentials.",
    category: "Shopping",
    icon: <ShoppingBag className="h-4 w-4" />,
    color: "text-green-500",
  },
  {
    id: "5",
    title: "Grocery Restock",
    description: "Schedule weekly grocery deliveries for your staple items.",
    category: "Food",
    icon: <Utensils className="h-4 w-4" />,
    color: "text-orange-500",
  },
];

export default function IntegrationsPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const categories: Category[] = ["All", "Food", "Transport", "Clothes", "Shopping"];

  const filteredIntegrations = integrations.filter(
    (item) => activeCategory === "All" || item.category === activeCategory
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center py-20" style={{ backgroundImage: 'url(/bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} >
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden flex flex-col h-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative flex items-center justify-center p-4 py-8  border-gray-100/50">
          <Link href="/" className="absolute left-4 top-1/2 -translate-y-1/2">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 active:scale-[0.98]">
              <X className="h-5 w-5" />
            </button>
          </Link>
          <h1 className="text-xl font-normal tracking-tight font-averia">Integrations</h1>
          <Link href="/integrations/create" className="absolute right-4 top-1/2 -translate-y-1/2">
            <button
              type="button"
              className="overflow-hidden cursor-pointer transition-[box-shadow,background-color,transform] duration-[125ms] ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-white focus-visible:ring-offset-2 disabled:cursor-not-allowed shadow-[inset_0_0_0_1px_rgba(0,0,0,0.75),0px_2px_5.6px_0px_rgba(0,0,0,0.08),inset_0px_0px_3px_0px_rgba(255,255,255,0.75)] [background:linear-gradient(180deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0.00)_38.33%),linear-gradient(180deg,rgba(0,0,0,0.00)_52.94%,rgba(0,0,0,0.75)_100%),#1B1B1B] hover:[background:linear-gradient(180deg,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0.10)_38.33%),linear-gradient(180deg,rgba(0,0,0,0.00)_52.94%,rgba(0,0,0,0.75)_100%),#1B1B1B] flex flex-row items-center gap-2 rounded-full px-3 py-1 text-sm font-medium text-white"
            >
              <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3">
                <path d="M12 4V12M12 12V20M12 12H4M12 12H20" stroke="currentColor" strokeWidth="3" strokeLinecap="round"></path>
              </svg>
              Add
            </button>
          </Link>
        </div>

        {/* Content Container */}
        <div className="relative flex flex-col h-full overflow-hidden">
          {/* Filters */}
          <div className="px-6 py-4 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              {/* Category Pills */}
              <div className="relative flex items-center gap-1 overflow-x-auto scrollbar-hide no-scrollbar mask-gradient pr-4">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat;
                  
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat as Category)}
                      className={cn(
                        "relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-150 z-10",
                        isActive
                          ? "text-gray-900"
                          : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="activeTab"
                          className="absolute inset-0 -z-10 rounded-full bg-gray-100"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-6 pb-32 space-y-4">
            {filteredIntegrations.map((integration) => (
              <div
                key={integration.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex items-center justify-center w-8 h-8", integration.color)}>
                        {integration.icon}
                      </div>
                      <h3 className="font-medium text-gray-900 leading-none">
                        {integration.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {integration.description}
                    </p>
                  </div>
                  <ChevronDown className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                </div>
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent z-10" />
        </div>
      </div>
    </div>
  );
}

