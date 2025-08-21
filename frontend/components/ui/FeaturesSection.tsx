'use client';

export function FeaturesSection() {
  const features = [
    {
      title: "Fractional Ownership",
      description: "Convert domain names into fungible tokens that can be traded on open markets, unlocking value and liquidity.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      gradient: "from-blue-500 to-indigo-600",
      hoverColor: "blue",
    },
    {
      title: "Liquidity Pools",
      description: "Automatic market making ensures ongoing price discovery and instant liquidity for domain token traders.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: "from-teal-500 to-emerald-600",
      hoverColor: "teal",
    },
    {
      title: "Subdomain Utility",
      description: "Token holders with significant stakes can register valuable subdomains, creating additional revenue streams.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      gradient: "from-purple-500 to-pink-600",
      hoverColor: "purple",
    },
  ];

  return (
    <div className="container mx-auto px-4 mt-16">
      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {features.map((feature, index) => {
          const isBlue = index === 0;
          const isTeal = index === 1;
          const isPurple = index === 2;
          
          return (
            <div key={index} className="relative group">
              <div className={`relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-4 md:p-8 border border-slate-700/50 transition-all duration-500 backdrop-blur-sm hover:shadow-xl hover:-translate-y-2 ${
                isBlue ? 'hover:border-blue-500/30 hover:shadow-blue-500/10' :
                isTeal ? 'hover:border-teal-500/30 hover:shadow-teal-500/10' :
                'hover:border-purple-500/30 hover:shadow-purple-500/10'
              }`}>
                {/* Background glow */}
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                  isBlue ? 'bg-gradient-to-br from-blue-500/5 to-indigo-500/5' :
                  isTeal ? 'bg-gradient-to-br from-teal-500/5 to-emerald-500/5' :
                  'bg-gradient-to-br from-purple-500/5 to-pink-500/5'
                }`}></div>
                
                {/* Icon */}
                <div className="relative mb-4 md:mb-6 flex justify-center">
                  <div className={`h-12 w-12 md:h-16 md:w-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
                    isBlue ? 'group-hover:shadow-lg group-hover:shadow-blue-500/40' :
                    isTeal ? 'group-hover:shadow-lg group-hover:shadow-teal-500/40' :
                    'group-hover:shadow-lg group-hover:shadow-purple-500/40'
                  }`}>
                    {feature.icon}
                  </div>
                  <div className={`absolute inset-0 rounded-2xl blur-xl -z-10 transition-all duration-300 ${
                    isBlue ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 group-hover:from-blue-500/30 group-hover:to-indigo-500/30' :
                    isTeal ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/20 group-hover:from-teal-500/30 group-hover:to-emerald-500/30' :
                    'bg-gradient-to-r from-purple-500/20 to-pink-500/20 group-hover:from-purple-500/30 group-hover:to-pink-500/30'
                  }`}></div>
                </div>
                
                {/* Content */}
                <div className="relative z-10 text-center">
                  <h3 className={`text-xl md:text-2xl font-bold text-white mb-4 transition-colors duration-300 ${
                    isBlue ? 'group-hover:text-blue-300' :
                    isTeal ? 'group-hover:text-teal-300' :
                    'group-hover:text-purple-300'
                  }`}>
                    {feature.title}
                  </h3>
                  <div className={`w-12 h-0.5 mx-auto mb-4 opacity-50 group-hover:opacity-100 transition-opacity duration-300 ${
                    isBlue ? 'bg-gradient-to-r from-blue-400 to-indigo-400' :
                    isTeal ? 'bg-gradient-to-r from-teal-400 to-emerald-400' :
                    'bg-gradient-to-r from-purple-400 to-pink-400'
                  }`}></div>
                  <p className="text-sm md:text-base text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
                
                {/* Corner accent */}
                <div className={`absolute top-4 right-4 w-2 h-2 rounded-full transition-colors duration-300 ${
                  isBlue ? 'bg-blue-400/30 group-hover:bg-blue-400/60' :
                  isTeal ? 'bg-teal-400/30 group-hover:bg-teal-400/60' :
                  'bg-purple-400/30 group-hover:bg-purple-400/60'
                }`}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}