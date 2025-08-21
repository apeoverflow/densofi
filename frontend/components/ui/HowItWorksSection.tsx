'use client';

import { AnimatedNumberCircle } from "./AnimatedNumberCircle";
import { AnimatedDivider } from "./AnimatedDivider";

export function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      title: "Verify Domain",
      description: "Prove ownership of your domain using DNS TXT records",
      icon: "🔍"
    },
    {
      number: 2,
      title: "Mint NFT",
      description: "Convert your domain into an ERC1155 NFT on the blockchain",
      icon: "🎨"
    },
    {
      number: 3,
      title: "Create Tokens",
      description: "Transform your NFT into 1M tradeable ERC20 tokens",
      icon: "🪙"
    },
    {
      number: 4,
      title: "Launch Market",
      description: "Deploy to PunchSwap V3 with automated liquidity",
      icon: "🚀"
    }
  ];

  return (
    <section className="py-20 relative z-10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            How It <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Transform your domain names into liquid, tradeable assets in just four simple steps
          </p>
        </div>

        <AnimatedDivider />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          {steps.map((step, index) => (
            <div key={step.number} className="relative group">
              {/* Connecting line (except for last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-blue-500/30 to-purple-500/30 transform translate-x-4 -translate-y-1/2 z-0"></div>
              )}
              
              <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-slate-700/50 hover:border-blue-500/30 transition-all duration-500 backdrop-blur-sm hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-2 text-center">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Step number with animation */}
                <div className="relative mb-6 flex justify-center">
                  <AnimatedNumberCircle number={step.number} />
                </div>
                
                {/* Icon */}
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>
                
                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                    {step.description}
                  </p>
                </div>
                
                {/* Corner accent */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400/30 rounded-full group-hover:bg-blue-400/60 transition-colors duration-300"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-400 mb-6">Ready to tokenize your domain?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-8 py-3 rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105">
              Get Started
            </button>
            <button className="border border-white/20 hover:border-white/30 hover:bg-white/10 text-white font-medium px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-white/10 transition-all duration-300">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}