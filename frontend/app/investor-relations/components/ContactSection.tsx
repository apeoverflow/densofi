'use client';

import { motion } from 'framer-motion';
import { Mail, MessageCircle, Twitter, ExternalLink, Calendar, FileText } from 'lucide-react';

export default function ContactSection() {
  const contactMethods = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Direct Email",
      description: "For investment inquiries and partnerships",
      contact: "chimera_defi@protonmail.com",
      action: "mailto:chimera_defi@protonmail.com?subject=Investment Inquiry - Densofi",
      primary: true
    },
    {
      icon: <Twitter className="w-6 h-6" />,
      title: "Social Media",
      description: "Follow our updates and announcements",
      contact: "@DensoFi",
      action: "https://twitter.com/DensoFi",
      primary: false
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Discord Community",
      description: "Join our developer and investor community",
      contact: "Discord Server",
      action: "https://discord.gg/densofi",
      primary: false
    }
  ];

  const resources = [
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Technical Documentation",
      description: "Smart contract architecture and API docs",
      action: "https://github.com/your-org/densofi" // Update with actual repo
    },
    {
      icon: <ExternalLink className="w-5 h-5" />,
      title: "Live Platform",
      description: "Experience the platform firsthand",
      action: "https://densofi.com"
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: "Schedule Demo",
      description: "Book a personalized platform walkthrough",
      action: "mailto:chimera_defi@protonmail.com?subject=Demo Request - Densofi"
    }
  ];

  return (
    <section id="contact" className="py-16 px-4 bg-gradient-to-br from-gray-900 to-black">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Get in Touch
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Interested in investing or partnering with Densofi? We'd love to hear from you. 
            Reach out to discuss opportunities in the domain tokenization space.
          </p>
        </motion.div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {contactMethods.map((method, index) => (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`group cursor-pointer ${
                method.primary 
                  ? 'bg-blue-600/10 border-blue-500/30 hover:border-blue-500/50' 
                  : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600/50'
              } backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 hover:scale-105`}
              onClick={() => window.open(method.action, '_blank')}
            >
              <div className={`${method.primary ? 'text-blue-400' : 'text-gray-400'} mb-4`}>
                {method.icon}
              </div>
              
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors duration-200">
                {method.title}
              </h3>
              
              <p className="text-gray-300 text-sm mb-3">
                {method.description}
              </p>
              
              <div className={`font-medium ${method.primary ? 'text-blue-400' : 'text-gray-300'}`}>
                {method.contact}
              </div>

              {method.primary && (
                <div className="mt-3 text-xs text-blue-300 opacity-75">
                  Primary contact for investors
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Additional Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            Additional Resources
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resources.map((resource, index) => (
              <motion.button
                key={resource.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.open(resource.action, '_blank')}
                className="flex items-start gap-4 p-4 bg-gray-700/30 hover:bg-gray-700/50 rounded-lg transition-all duration-200 text-left"
              >
                <div className="text-blue-400 mt-1">
                  {resource.icon}
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1">
                    {resource.title}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {resource.description}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Investment Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 p-6 bg-yellow-600/10 border border-yellow-600/20 rounded-xl"
        >
          <h4 className="text-yellow-400 font-semibold mb-2">Investment Disclaimer</h4>
          <p className="text-yellow-200/80 text-sm leading-relaxed">
            This information is for educational purposes only and does not constitute investment advice. 
            Cryptocurrency and blockchain investments carry significant risks. Values marked with "?" are 
            estimates and should be verified. Please conduct your own research and consult with qualified 
            financial advisors before making any investment decisions.
          </p>
        </motion.div>
      </div>
    </section>
  );
}