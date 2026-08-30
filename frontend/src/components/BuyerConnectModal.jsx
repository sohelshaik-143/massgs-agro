import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Phone, 
  MessageSquare, 
  Truck, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Send, 
  ExternalLink,
  DollarSign
} from 'lucide-react';

export default function BuyerConnectModal({ isOpen, onClose, demand, farmerLocation }) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [inquiryText, setInquiryText] = useState('');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen || !demand) return null;

  // Logistics & Distance Simulation based on districts
  const farmerDistrict = farmerLocation?.district || user?.district || 'Guntur';
  const buyerDistrict = demand.targetDistrict || 'Guntur';
  const isSameDistrict = farmerDistrict.toLowerCase() === buyerDistrict.toLowerCase();

  const estimatedDistanceKm = isSameDistrict ? 28 : 85;
  const estimatedLoadingTime = isSameDistrict ? '1 - 1.5 hrs' : '2 - 3 hrs';
  const estimatedTransitTime = isSameDistrict ? '45 mins' : '2.5 hrs';
  const estimatedFreightPerKg = isSameDistrict ? 1.40 : 2.60;
  const netFarmerRealization = (demand.targetPricePerKg - estimatedFreightPerKg).toFixed(2);

  const buyerPhone = demand.contactPhone || '9876543210';
  const buyerEmail = demand.contactEmail || 'procurement@massgs.in';

  const defaultMessage = language === 'en'
    ? `Namaste, I saw your verified demand for ${demand.cropName} (${demand.minQuantityKg}-${demand.maxQuantityKg} kg) at ₹${demand.targetPricePerKg}/kg. I have stock available in ${farmerLocation?.village || farmerDistrict}. Let's coordinate pickup.`
    : `నమస్తే, నేను ₹${demand.targetPricePerKg}/కిలో వద్ద ${demand.cropName} (${demand.minQuantityKg}-${demand.maxQuantityKg} కిలోలు) కోసం మీ అవసరాన్ని చూశాను. నా దగ్గర ${farmerLocation?.village || farmerDistrict} లో పంట సిద్ధంగా ఉంది. రవాణా ఏర్పాట్లు చేద్దాం.`;

  const handleSendMessage = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        onClose();
      }, 2000);
    }, 600);
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(inquiryText || defaultMessage);
    window.open(`https://wa.me/91${buyerPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-earth-200 relative flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold w-max mb-3">
          <Building2 className="w-4 h-4 text-blue-600" />
          <span>{demand.buyerMassgsId || 'MASSGS-B-VERIFIED'} • {language === 'en' ? 'Verified Buyer Hub' : 'ధృవీకరించబడిన కొనుగోలుదారు'}</span>
        </div>

        <h3 className="text-xl font-black text-slate-900">
          {demand.organizationName || 'Verified Institutional Buyer'}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5 mb-5">
          {language === 'en'
            ? 'Direct transparent communication layer and estimated transport metrics for this demand.'
            : 'ఈ కొనుగోలు అవసరం కోసం ప్రత్యక్ష సంభాషణ మరియు రవాణా దూర గణన.'}
        </p>

        {/* Buyer Verification Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
            <span className="text-slate-400 block text-[10px] font-bold">Verification Status</span>
            <strong className="text-emerald-700 font-black flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4" /> Platform Verified
            </strong>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
            <span className="text-slate-400 block text-[10px] font-bold">Procurement District</span>
            <strong className="text-slate-900 font-black flex items-center gap-1.5 text-xs">
              <MapPin className="w-4 h-4 text-blue-600" /> {demand.targetDistrict}, {demand.targetState || 'AP'}
            </strong>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
            <span className="text-slate-400 block text-[10px] font-bold">Buying Price</span>
            <strong className="text-agri-800 font-black flex items-center gap-1.5 text-sm">
              ₹{demand.targetPricePerKg}/kg
            </strong>
          </div>
        </div>

        {/* Logistics & Transit Calculator Card */}
        <div className="bg-gradient-to-br from-earth-50 to-amber-50/40 p-5 rounded-2xl border border-earth-200 space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
              <Truck className="w-4 h-4 text-agri-700" />
              <span>{language === 'en' ? 'Logistics & Transit Estimation' : 'రవాణా & దూర గణన'}</span>
            </h4>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-white rounded border text-slate-600">
              {farmerDistrict} ➔ {buyerDistrict}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-earth-100">
              <span className="text-slate-400 block text-[10px] font-bold">Road Distance</span>
              <strong className="text-slate-900 font-black">~{estimatedDistanceKm} km</strong>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-earth-100">
              <span className="text-slate-400 block text-[10px] font-bold">Transit Time</span>
              <strong className="text-slate-900 font-black flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> {estimatedTransitTime}
              </strong>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-earth-100">
              <span className="text-slate-400 block text-[10px] font-bold">Loading / Unloading</span>
              <strong className="text-slate-900 font-black">{estimatedLoadingTime}</strong>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-earth-100">
              <span className="text-slate-400 block text-[10px] font-bold">Est. Net Return</span>
              <strong className="text-emerald-700 font-black">₹{netFarmerRealization}/kg</strong>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            * Transport benchmark: ~₹{estimatedFreightPerKg.toFixed(2)}/kg for {estimatedDistanceKm} km. Loading pickup at farm-gate or delivery yard can be finalized via direct communication below.
          </p>
        </div>

        {/* Direct Contact Channels */}
        <div className="space-y-3 mb-5">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
            {language === 'en' ? 'Direct Communication Channels' : 'ప్రత్యక్ష సంప్రదింపు మార్గాలు'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={`tel:${buyerPhone}`}
              className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Phone className="w-4 h-4" />
              <span>{language === 'en' ? 'Direct Call' : 'ఫోన్ కాల్ చేయండి'} (+91 {buyerPhone})</span>
            </a>

            <button
              onClick={openWhatsApp}
              className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>{language === 'en' ? 'Chat on WhatsApp' : 'వాట్సాప్ ద్వారా సంప్రదించండి'}</span>
            </button>
          </div>
        </div>

        {/* In-App Direct Message / Supply Proposal Builder */}
        <form onSubmit={handleSendMessage} className="space-y-3 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700">
            {language === 'en' ? 'Send In-App Fulfillment Proposal' : 'అనువర్తనంలో సరఫరా సందేశం పంపండి'}
          </label>

          <textarea
            rows={3}
            value={inquiryText || defaultMessage}
            onChange={(e) => setInquiryText(e.target.value)}
            className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />

          {sentSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{language === 'en' ? 'Proposal sent to buyer successfully!' : 'కొనుగోలుదారునికి ప్రతిపాదన విజయవంతంగా పంపబడింది!'}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={sending || sentSuccess}
            className="w-full py-3 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 text-blue-300" />
                <span>{language === 'en' ? 'Submit Proposal to Buyer' : 'ప్రతిపాదనను సమర్పించండి'}</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
