import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { marketplaceApi } from '../services/api';
import { AlertOctagon, X, Send } from 'lucide-react';

export default function DisputeModal({ isOpen, onClose, transaction, onSubmitted }) {
  const { t, language } = useLanguage();
  const [category, setCategory] = useState('PRODUCT_NOT_AS_DESCRIBED');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !transaction) return null;

  const categories = [
    { value: 'PRODUCT_NOT_AS_DESCRIBED', label: language === 'en' ? 'Product Not As Described / Quality Issue' : 'నాణ్యత వివరణ ప్రకారం లేదు' },
    { value: 'QUANTITY_MISMATCH', label: language === 'en' ? 'Quantity / Weight Mismatch' : 'తూకం / పరిమాణంలో తేడా' },
    { value: 'PAYMENT_ISSUE', label: language === 'en' ? 'Payment Delay / Default' : 'చెల్లింపు సమస్య' },
    { value: 'AGREEMENT_BREACH', label: language === 'en' ? 'Agreement Terms Breached' : 'ఒప్పంద ఉల్లంఘన' },
    { value: 'MISLEADING_LISTING', label: language === 'en' ? 'Misleading Listing / Fake Photos' : 'తప్పుదారి పట్టించే వివరాలు / ఫోటోలు' },
    { value: 'OTHER', label: language === 'en' ? 'Other Issue' : 'ఇతర సమస్య' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError(language === 'en' ? 'Please describe the problem' : 'దయచేసి సమస్య వివరాలను నమోదు చేయండి');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await marketplaceApi.reportProblem({
        transactionId: transaction.id,
        category,
        description: description.trim(),
        evidenceUrl: evidenceUrl.trim() || undefined,
      });
      if (onSubmitted) onSubmitted(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit problem report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-earth-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold mb-3 w-max">
          <AlertOctagon className="w-4 h-4" />
          <span>{language === 'en' ? 'Dispute & Mediation' : 'ఫిర్యాదు & మధ్యవర్తిత్వం'}</span>
        </div>

        <h3 className="text-lg font-black text-slate-900">
          {t('disputeTitle')}
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          {transaction.transactionCode} • {transaction.cropName} ({transaction.quantityKg} kg)
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('disputeCategoryLabel')}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition bg-white"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('disputeDescLabel')}
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'en' ? 'State precisely what happened...' : 'ఏమి జరిగిందో స్పష్టంగా వివరించండి...'}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('disputeEvidenceLabel')} ({language === 'en' ? 'Optional' : 'ఐచ్ఛికం'})
            </label>
            <input
              type="text"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="e.g. Weighbridge receipt link / photo link"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{t('submitDisputeBtn')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
