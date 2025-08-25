'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedHeadingGlow } from "@/components/ui/AnimatedHeadingGlow";
import { AnimatedDivider } from "@/components/ui/AnimatedDivider";
import { InteractiveBackground } from "@/components/ui/InteractiveBackground";
import { Button } from "@/components/ui/button";
import { ExternalLink, Building, Zap, Globe, Award, TrendingUp } from "lucide-react";

interface Partner {
  id: string;
  name: string;
  description: string;
  logo?: string;
  website: string;
  category: string;
  collaboration: string;
}

interface Opportunity {
  id: string;
  name: string;
  type: 'accelerator' | 'grant' | 'program';
  description: string;
  funding?: string;
  website: string;
  deadline?: string;
  status: 'researching' | 'applying' | 'considering';
}

const currentPartners: Partner[] = [
  {
    id: 'founders-forge',
    name: 'Founders Forge',
    description: 'An organization dedicated to supporting entrepreneurs through mentorship, resources, and community engagement. Founders Forge provides comprehensive support for startups at various stages of development.',
    website: 'https://foundersforge.com',
    category: 'Accelerator',
    collaboration: 'Mentorship and strategic guidance for platform development and go-to-market strategy.'
  },
  {
    id: 'flow',
    name: 'Flow Blockchain',
    description: 'A blockchain platform designed for building decentralized applications and digital assets, known for its scalability and developer-friendly environment. Flow powers major NFT platforms and games.',
    website: 'https://flow.com',
    category: 'Infrastructure',
    collaboration: 'Technical partnership for blockchain infrastructure and smart contract deployment.'
  },
  {
    id: 'protocol-labs',
    name: 'Protocol Labs',
    description: 'An open-source research and development company that has created the InterPlanetary File System (IPFS) and Filecoin, focusing on decentralized web protocols and storage solutions.',
    website: 'https://protocol.ai',
    category: 'Technology',
    collaboration: 'Integration of IPFS for decentralized storage and collaboration on Web3 infrastructure.'
  }
];

const opportunities: Opportunity[] = [
  {
    id: 'y-combinator',
    name: 'Y Combinator',
    type: 'accelerator',
    description: 'A renowned startup accelerator that has launched over 5,000 companies, including Airbnb and Dropbox. They offer seed funding, mentorship, and resources to early-stage startups.',
    funding: '$500K',
    website: 'https://ycombinator.com',
    status: 'considering'
  },
  {
    id: 'techstars',
    name: 'Techstars',
    type: 'accelerator',
    description: 'A global accelerator providing capital, mentorship, and support for early-stage entrepreneurs. Techstars has funded over 4,100 companies, including Uber and Twilio.',
    funding: '$120K',
    website: 'https://techstars.com',
    status: 'researching'
  },
  {
    id: 'berkeley-skydeck',
    name: 'Berkeley SkyDeck',
    type: 'accelerator',
    description: 'An accelerator program affiliated with the University of California, Berkeley, offering funding, mentorship, and resources to startups. Notable alumni include Lime and Kiwi Campus.',
    funding: '$100K',
    website: 'https://skydeck.berkeley.edu',
    status: 'researching'
  },
  {
    id: 'sbir',
    name: 'Small Business Innovation Research (SBIR)',
    type: 'grant',
    description: 'A U.S. government initiative that provides funding to small businesses for research and development projects with commercialization potential.',
    funding: 'Up to $1.7M',
    website: 'https://sbir.gov',
    status: 'researching'
  },
  {
    id: 'ethereum-foundation',
    name: 'Ethereum Foundation Grants',
    type: 'grant',
    description: 'Supporting projects that contribute to the Ethereum ecosystem, including infrastructure, developer tools, and research initiatives.',
    funding: 'Varies',
    website: 'https://ethereum.foundation/grants',
    status: 'considering'
  },
  {
    id: 'web3-foundation',
    name: 'Web3 Foundation Grants',
    type: 'grant',
    description: 'Funding projects that advance the decentralized web and contribute to the Web3 ecosystem.',
    funding: 'Up to $100K',
    website: 'https://web3.foundation/grants',
    status: 'researching'
  }
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'researching':
      return <Globe className="w-4 h-4 text-blue-400" />;
    case 'applying':
      return <TrendingUp className="w-4 h-4 text-yellow-400" />;
    case 'considering':
      return <Award className="w-4 h-4 text-green-400" />;
    default:
      return <Building className="w-4 h-4 text-gray-400" />;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'accelerator':
      return <Zap className="w-5 h-5 text-purple-400" />;
    case 'grant':
      return <Award className="w-5 h-5 text-green-400" />;
    case 'program':
      return <Building className="w-5 h-5 text-blue-400" />;
    default:
      return <Building className="w-5 h-5 text-gray-400" />;
  }
};

export default function PartnersPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-b from-slate-900 via-slate-900/20 to-black overflow-visible">
      {/* Interactive 3D Background */}
      <InteractiveBackground />
      
      {/* Static gradient overlay for depth and readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/40 to-black/60 pointer-events-none z-10"></div>
      
      <main className="relative z-20 flex-grow overflow-visible">
        <div className="container mx-auto px-4 py-16 max-w-6xl">
          {/* Header Section */}
          <div className="text-center mb-16">
            <AnimatedHeadingGlow className="text-4xl md:text-6xl font-bold mb-6">
              Our Partners
            </AnimatedHeadingGlow>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              We collaborate with leading organizations in the Web3 ecosystem to build the future of decentralized domain tokenization.
            </p>
            <AnimatedDivider />
          </div>

          {/* Current Partners Section */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Current Partners</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentPartners.map((partner) => (
                <GlassCard key={partner.id} className="p-6 hover:scale-105 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{partner.name}</h3>
                      <span className="inline-block px-3 py-1 text-xs font-medium bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                        {partner.category}
                      </span>
                    </div>
                    <Building className="w-6 h-6 text-gray-400" />
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                    {partner.description}
                  </p>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-white mb-2">Collaboration:</h4>
                    <p className="text-gray-400 text-sm">
                      {partner.collaboration}
                    </p>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-white/5 border-white/20 hover:bg-white/10 text-white"
                    onClick={() => window.open(partner.website, '_blank')}
                  >
                    Visit Website
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </GlassCard>
              ))}
            </div>
          </section>

          {/* Opportunities Section */}
          <section>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Growth Opportunities</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                We're actively exploring grants, accelerators, and partnership opportunities to accelerate our growth and impact in the Web3 space.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {opportunities.map((opportunity) => (
                <GlassCard key={opportunity.id} className="p-6 hover:scale-105 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(opportunity.type)}
                      <div>
                        <h3 className="text-lg font-bold text-white">{opportunity.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(opportunity.status)}
                          <span className="text-xs text-gray-400 capitalize">
                            {opportunity.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    {opportunity.funding && (
                      <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 rounded border border-yellow-500/30">
                        {opportunity.funding}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                    {opportunity.description}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-white/5 border-white/20 hover:bg-white/10 text-white"
                      onClick={() => window.open(opportunity.website, '_blank')}
                    >
                      Learn More
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>

          {/* Call to Action */}
          <section className="text-center mt-20">
            <GlassCard className="p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-4">
                Interested in Partnering?
              </h3>
              <p className="text-gray-300 mb-6">
                We're always looking for strategic partners who share our vision of revolutionizing domain ownership through blockchain technology.
              </p>
              <Button 
                className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white px-8 py-3"
                onClick={() => window.open('mailto:partnerships@densofi.com', '_blank')}
              >
                Get in Touch
              </Button>
            </GlassCard>
          </section>
        </div>
      </main>
    </div>
  );
}