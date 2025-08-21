'use client';

import { EmailSignup } from "./EmailSignup";
import { GlassCard } from "./GlassCard";

export function NewsletterSection() {
  return (
    <section className="py-16 relative z-10">
      <div className="container mx-auto px-4">
        <GlassCard className="max-w-4xl mx-auto p-8 md:p-12 text-center">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-teal-500/5 rounded-2xl"></div>
          
          {/* Decorative elements */}
          <div className="absolute top-6 left-6 w-2 h-2 bg-blue-400/30 rounded-full"></div>
          <div className="absolute top-6 right-6 w-2 h-2 bg-purple-400/30 rounded-full"></div>
          <div className="absolute bottom-6 left-6 w-2 h-2 bg-teal-400/30 rounded-full"></div>
          <div className="absolute bottom-6 right-6 w-2 h-2 bg-cyan-400/30 rounded-full"></div>
          
          <div className="relative z-10">
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Join the <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Future</span> of Domain Finance
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Be the first to know about new features, token launches, and exclusive opportunities in the domain tokenization space.
              </p>
            </div>
            
            <EmailSignup className="max-w-lg mx-auto" />
            
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Weekly updates</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Early access to features</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>No spam, unsubscribe anytime</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}