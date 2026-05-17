import { Link } from 'react-router-dom';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Mail, 
  Phone, 
  MapPin, 
  Github 
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">K</div>
              <div>
                <p className="font-black text-white text-lg tracking-tight leading-none">KrishiVoice</p>
                <p className="text-primary text-[10px] font-bold">कृषि आवाज़</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Empowering Indian farmers through voice-first technology. List products, check mandi prices, and find transport in your local language.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="hover:text-primary transition-colors"><Facebook size={20} /></a>
              <a href="#" className="hover:text-primary transition-colors"><Twitter size={20} /></a>
              <a href="#" className="hover:text-primary transition-colors"><Instagram size={20} /></a>
              <a href="#" className="hover:text-primary transition-colors"><Github size={20} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-6">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="hover:text-primary transition-colors">Home / मुख्य पृष्ठ</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">Buyer Dashboard / डैशबोर्ड</Link></li>
              <li><Link to="/search" className="hover:text-primary transition-colors">Search Listings / खोज</Link></li>
              <li><Link to="/transport" className="hover:text-primary transition-colors">Logistics Insight / परिवहन</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold mb-6">Support & Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Help Center / सहायता केंद्र</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Safety Tips / सुरक्षा टिप्स</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service / नियम</a></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy / गोपनीयता</Link></li>
              <li><a href="mailto:aasingh49864@gmail.com" className="hover:text-primary transition-colors">Contact Us / संपर्क</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-bold mb-6">Connect With Us</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="text-primary shrink-0" size={18} />
                <span>Patna 800001, Bihar, India</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-primary shrink-0" size={18} />
                <span>+91 62022 81425</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-primary shrink-0" size={18} />
                <span>aasingh49864@gmail.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Strip */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 font-medium">
          <p>© 2026 KrishiVoice Social Enterprise. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Made with ❤️ for Indian Farmers</span>
            <div className="flex items-center gap-1.5 grayscale opacity-50">
              <span className="bg-white text-black px-1.5 py-0.5 rounded font-bold">Safe Payments</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
