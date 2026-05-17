import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-body)' }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-600 text-white py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-4xl mx-auto flex flex-col items-start z-10">
          <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-emerald-100 hover:text-white transition-colors">
            <ArrowLeft size={18} />
            <span className="font-semibold">Back</span>
          </button>
          <h1 className="text-4xl md:text-5xl font-black mb-3">Privacy Policy</h1>
          <p className="text-emerald-100 font-medium text-lg">Last Updated: {new Date().toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 space-y-10 text-gray-700">
          
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Shield size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">1. Introduction</h2>
            </div>
            <p className="leading-relaxed">
              Welcome to KrishiVoice ("we," "our," or "us"). We respect the privacy of our farmers, buyers, and transport partners. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our voice-assisted agricultural marketplace.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Eye size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">2. Information We Collect</h2>
            </div>
            <p className="leading-relaxed mb-3">We may collect information about you in a variety of ways, including:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li><strong className="text-gray-800">Personal Data:</strong> Your name, phone number, email address, state, and district collected during registration or profile setup.</li>
              <li><strong className="text-gray-800">Agricultural Data:</strong> Crop details, quantities, pricing, and harvest dates that you list on the platform.</li>
              <li><strong className="text-gray-800">Logistics Data:</strong> Vehicle details, regional operating zones, and contact numbers provided for transport services.</li>
              <li><strong className="text-gray-800">Voice Data:</strong> Temporary audio streams and transcripts processed by our AI (Krishi Saathi) to assist you with navigation and listing, which are heavily protected and not used for independent profiling.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <FileText size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">3. How We Use Your Information</h2>
            </div>
            <p className="leading-relaxed mb-3">Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you to:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Create and manage your KrishiVoice account.</li>
              <li>Facilitate direct connections between farmers, buyers, and transporters.</li>
              <li>Process your voice commands via Krishi Saathi in Hindi, Bhojpuri, or English.</li>
              <li>Resolve disputes, troubleshoot problems, and respond to product and customer service requests.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Lock size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">4. Data Security</h2>
            </div>
            <p className="leading-relaxed">
              We use administrative, technical, and physical security measures to help protect your personal information. Your authentication is securely managed via OTP and industry-standard encryption. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
            </p>
          </section>

          <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Contact Us</h2>
            <p className="leading-relaxed mb-4">If you have questions or comments about this Privacy Policy, please contact us at:</p>
            <div className="space-y-1 font-semibold text-gray-800">
              <p>Email: <a href="mailto:aasingh49864@gmail.com" className="text-emerald-600 hover:underline">aasingh49864@gmail.com</a></p>
              <p>Phone: +91 62022 81425</p>
              <p>Address: Patna 800001, Bihar, India</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
