import Link from 'next/link';
import { Scale, MapPin, Phone, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-16 px-6 border-t border-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <Link href="/" className="flex items-center gap-3 mb-6">
            <Scale className="text-[#B4935E]" size={28} />
            <span className="font-serif font-bold text-xl tracking-tight text-slate-50 uppercase">
              EagleNest Legal Solutions <span className="text-[#B4935E]"></span>
            </span>
          </Link>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-6">
            Relentless representation and strategic counsel for businesses and individuals in Khyber Pakhtunkhwa. Your rights, secured.
          </p>
          <p className="text-sm">© {new Date().getFullYear()} EagleNest Legal Solutions Solutions. All rights reserved.</p>
        </div>

        <div>
          <h4 className="font-serif text-slate-50 text-lg mb-6">Contact</h4>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="text-[#B4935E] shrink-0 mt-0.5" size={18} />
              <span>Bar Association Road, Mingora,<br/>Swat, Khyber Pakhtunkhwa</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="text-[#B4935E] shrink-0" size={18} />
              <span>+92 300 123 4567</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="text-[#B4935E] shrink-0" size={18} />
              <span>contact@eaglenestlegalsolutions.com</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-slate-50 text-lg mb-6">Legal</h4>
          <ul className="space-y-3 text-sm">
            <li><Link href="/privacy" className="hover:text-[#B4935E] transition-colors duration-200">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-[#B4935E] transition-colors duration-200">Terms of Service</Link></li>
            <li><Link href="/disclaimer" className="hover:text-[#B4935E] transition-colors duration-200">Legal Disclaimer</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
