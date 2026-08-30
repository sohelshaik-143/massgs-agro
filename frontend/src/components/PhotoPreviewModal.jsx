import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { X, AlertCircle, Eye } from 'lucide-react';
import { getMediaUrl } from '../services/api';

export default function PhotoPreviewModal({ isOpen, onClose, photoUrl, cropName, farmerName, location }) {
  const { t, language } = useLanguage();
  if (!isOpen || !photoUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-earth-200 relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-earth-100 bg-slate-50">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-agri-700" />
              <span>{cropName} — {language === 'en' ? 'Seller Visual Evidence' : 'విక్రేత పంట ఫోటో నిదర్శనం'}</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              {farmerName} • {location}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Photo Container */}
        <div className="p-4 bg-slate-900 flex items-center justify-center overflow-auto flex-grow max-h-[60vh]">
          <img
            src={getMediaUrl(photoUrl)}
            alt={cropName}
            className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
          />
        </div>

        {/* Mandatory Quality / Visual Evidence Disclaimer */}
        <div className="p-4 px-6 bg-amber-50 border-t border-amber-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-amber-900 leading-relaxed">
            {language === 'en'
              ? 'Uploaded photo is visual evidence submitted directly by the seller, NOT a laboratory quality certification. Buyers should inspect physical produce upon delivery or pickup.'
              : 'అప్‌లోడ్ చేసిన ఫోటో విక్రేత నేరుగా సమర్పించిన వాస్తవ దృశ్య నిదర్శనం మాత్రమే, నాణ్యతా పరీక్ష ధృవీకరణ పత్రం కాదు. కొనుగోలుదారులు డెలివరీ లేదా పికప్ సమయంలో పంటను స్వయంగా తనిఖీ చేసుకోవాలి.'}
          </p>
        </div>
      </div>
    </div>
  );
}
