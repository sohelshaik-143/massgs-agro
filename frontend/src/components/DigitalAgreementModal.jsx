import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { marketplaceApi } from '../services/api';
import { FileCheck, X, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DigitalAgreementModal({ isOpen, onClose, agreement, onAccepted }) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !agreement) return null;

  const isFarmer = user?.role === 'ROLE_FARMER' || user?.massgsId === agreement.farmerMassgsId;
  const alreadySigned = isFarmer ? agreement.farmerAccepted : agreement.buyerAccepted;
  const isFullySigned = agreement.status === 'FULLY_SIGNED' || (agreement.farmerAccepted && agreement.buyerAccepted);

  const handleAccept = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await marketplaceApi.acceptAgreement(agreement.id);
      if (onAccepted) onAccepted(res.data);
      alert(language === 'en'
        ? 'Digital Agreement signed successfully! Transaction is now active.'
        : 'డిజిటల్ ఒప్పందం విజయవంతంగా సంతకం చేయబడింది! లావాదేవీ ఇప్పుడు క్రియాశీలంగా ఉంది.');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept agreement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-earth-200 relative flex flex-col max-h-[85vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-3 w-max">
          <ShieldCheck className="w-4 h-4" />
          <span>{agreement.agreementCode} • {isFullySigned ? 'FULLY SIGNED' : 'PENDING SIGNATURES'}</span>
        </div>

        <h3 className="text-lg font-black text-slate-900">
          {t('agreementTitle')}
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          {language === 'en'
            ? 'Plain-language commitments binding both parties to honest trading and standard weights.'
            : 'నిజాయితీ వ్యాపారం మరియు సరైన తూకాలను నిర్ధారించే సరళమైన డిజిటల్ ఒప్పందం.'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Financial Summary */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-3 gap-3 text-center mb-4">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase font-bold">{t('cropNameLabel')}</span>
            <strong className="text-xs font-black text-slate-900">{agreement.cropName}</strong>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 uppercase font-bold">{t('quantityLabel')}</span>
            <strong className="text-xs font-black text-slate-900">{agreement.quantityKg} kg</strong>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 uppercase font-bold">Total Agreed</span>
            <strong className="text-xs font-black text-agri-800">₹{agreement.totalAmount}</strong>
          </div>
        </div>

        {/* Agreement Text */}
        <div className="overflow-y-auto p-4 bg-earth-50/50 rounded-2xl border border-earth-200 text-xs text-slate-700 space-y-3 whitespace-pre-line leading-relaxed font-medium flex-grow mb-6">
          {agreement.termsSummary}
        </div>

        {/* Signatures status */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-6 px-1">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${agreement.farmerAccepted ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            <span>Farmer ({agreement.farmerMassgsId}): {agreement.farmerAccepted ? '✓ Signed' : 'Pending'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${agreement.buyerAccepted ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            <span>Buyer ({agreement.buyerMassgsId}): {agreement.buyerAccepted ? '✓ Signed' : 'Pending'}</span>
          </div>
        </div>

        {/* Action button */}
        {alreadySigned ? (
          <div className="w-full py-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              {language === 'en'
                ? isFullySigned ? 'Agreement Fully Signed by Both Parties' : 'You have already signed this agreement. Waiting for other party.'
                : isFullySigned ? 'ఉభయ పక్షాలు ఒప్పందంపై సంతకం చేశాయి' : 'మీరు ఇప్పటికే సంతకం చేశారు. అవతలి పక్షం సంతకం కోసం నిరీక్షణ.'}
            </span>
          </div>
        ) : (
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-agri-800 hover:bg-agri-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>{t('agreementAcceptBtn')}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
