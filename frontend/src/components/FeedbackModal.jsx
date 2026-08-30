import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { marketplaceApi } from '../services/api';
import { Star, X, CheckCircle2 } from 'lucide-react';

export default function FeedbackModal({ isOpen, onClose, transaction, onSubmitted }) {
  const { t, language } = useLanguage();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !transaction) return null;

  const availableTags = [
    'Timely Payment',
    'Accurate Quality',
    'Punctual Delivery',
    'Fair Negotiation',
    'Honest Weight',
    'Professional Communication'
  ];

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await marketplaceApi.submitFeedback({
        transactionId: transaction.id,
        rating,
        comment: comment.trim() || undefined,
        tags: selectedTags.join(', '),
      });
      if (onSubmitted) onSubmitted(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-earth-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-black text-slate-900">
          {t('rateTransactionTitle')}
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          {transaction.transactionCode} • {transaction.cropName} ({transaction.quantityKg} kg)
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star Rating */}
          <div className="text-center space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              {t('ratingLabel')}
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-2xl transition hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoverRating || rating) >= star
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-black text-slate-700">
              {rating} / 5 Stars
            </span>
          </div>

          {/* Quick Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              {t('reviewTagsLabel')}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                      isSelected
                        ? 'bg-agri-800 text-white border-agri-800'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('reviewCommentsLabel')}
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={language === 'en' ? 'Share your genuine experience with this transaction...' : 'ఈ లావాదేవీతో మీ వాస్తవ అనుభవాన్ని పంచుకోండి...'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-agri-500 focus:border-transparent outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-agri-800 hover:bg-agri-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>{t('submitFeedbackBtn')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
