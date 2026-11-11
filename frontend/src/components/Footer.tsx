import React from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import { ShieldCheck, Banknote, MapPin, Wrench } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 3D Value Prop Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-10 border-b border-slate-800 perspective-1000">
          <div className="tile-3d preserve-3d p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-sm flex items-center gap-3.5 hover:border-emerald-500/40">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-800 to-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner shrink-0 animate-float-3d">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                <span>{t.badges.cashOnly}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{t.badges.zeroCostNotice}</p>
            </div>
          </div>
          <div className="tile-3d preserve-3d p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-sm flex items-center gap-3.5 hover:border-emerald-500/40">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-800 to-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner shrink-0 animate-float-3d">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">{t.badges.verifiedPros}</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">National ID & police verified profile vetting</p>
            </div>
          </div>
          <div className="tile-3d preserve-3d p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-sm flex items-center gap-3.5 hover:border-emerald-500/40">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-800 to-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner shrink-0 animate-float-3d">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">{t.badges.coverage}</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{t.footer.dhakaNotice}</p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-gray-400">{t.brandName}</span>
            <span>—</span>
            <span>{t.tagline}</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-gray-300 transition-colors">
              {t.footer.privacy}
            </a>
            <a href="#terms" className="hover:text-gray-300 transition-colors">
              {t.footer.terms}
            </a>
            <span>{t.footer.copyright}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
