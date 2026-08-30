import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { farmerApi, marketApi, locationApi, mediaApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  Sprout, Sparkles, AlertCircle, ArrowRight, ArrowLeft,
  Truck, Calendar, MapPin, Check, Search, Camera, Upload, Eye, HelpCircle, ShieldCheck
} from 'lucide-react';

export default function ProduceEntryPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    farmerName: user?.fullName || '',
    contactPhone: user?.phoneNumber || '',
    cropName: 'Chilli',
    varietyName: 'Red Teja / Grade A',
    quantityValue: '1000',
    quantityUnit: 'kg', // kg, quintal, tonne
    expectedPricePerUnit: '220',
    priceUnit: 'kg', // kg, quintal
    district: user?.district || 'Guntur',
    mandal: 'Guntur Rural',
    village: 'Nallapadu',
    state: 'Andhra Pradesh',
    readyDate: new Date().toISOString().split('T')[0],
    qualityGrade: 'A',
    description: 'Dry red chilli with bright red color, moisture under 10%.',
    photoUrl: '',
    userProvidedTransportCostPerKg: '',
  });

  // Dynamic Metadata
  const [districts, setDistricts] = useState(['Guntur', 'Chittoor', 'Kurnool', 'Krishna', 'Tirupati', 'West Godavari']);
  const [localRates, setLocalRates] = useState([]);
  const [loadingRates, setLoadingRates] = useState(false);

  // Autocomplete crop search states
  const [searchQuery, setSearchQuery] = useState(formData.cropName || '');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionPrompt, setSuggestionPrompt] = useState(null);
  const [isValidCrop, setIsValidCrop] = useState(true);
  const [searching, setSearching] = useState(false);

  // Photo upload states
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    locationApi.getDistricts('Andhra Pradesh')
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setDistricts(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Debounced search for crops
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSuggestions([]);
      setSuggestionPrompt(null);
      setIsValidCrop(false);
      return;
    }

    setSearching(true);
    const delayDebounce = setTimeout(() => {
      marketApi.searchCrops(searchQuery)
        .then((res) => {
          setSuggestions(res.data || []);
          const match = (res.data || []).some(c => 
            c.name.toLowerCase() === searchQuery.trim().toLowerCase() ||
            (c.teluguName && c.teluguName.toLowerCase() === searchQuery.trim().toLowerCase())
          );
          setIsValidCrop(match || (res.data && res.data.length > 0));
          setSearching(false);
        })
        .catch((err) => {
          setSearching(false);
        });
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Fetch local rates when Step 5 is reached
  useEffect(() => {
    if (currentStep === 5) {
      setLoadingRates(true);
      marketApi.getLatestRates(formData.district, null)
        .then((res) => {
          const cropRates = (res.data || []).filter(p => 
            p.cropName.toLowerCase() === formData.cropName.toLowerCase()
          );
          setLocalRates(cropRates.length > 0 ? cropRates : (res.data || []).slice(0, 3));
          setLoadingRates(false);
        })
        .catch(() => {
          setLoadingRates(false);
        });
    }
  }, [currentStep, formData.cropName, formData.district]);

  const selectSuggestedCrop = (crop) => {
    setFormData({ ...formData, cropName: crop.name });
    setSearchQuery(crop.name);
    setSuggestions([]);
    setIsValidCrop(true);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(language === 'en' ? 'Photo size exceeds 5MB limit.' : 'ఫోటో పరిమాణం 5MB కంటే ఎక్కువ ఉండకూడదు.');
      return;
    }

    setUploadingPhoto(true);
    setError(null);
    try {
      const res = await mediaApi.upload(file);
      const url = res.data.url;
      setFormData(prev => ({ ...prev, photoUrl: url }));
      setPhotoPreview(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !isValidCrop && !formData.cropName) {
      setError(language === 'en' 
        ? 'Please enter or select a valid crop from suggestions.' 
        : 'దయచేసి సూచించిన వాటి నుండి సరైన పంటను ఎంచుకోండి.');
      return;
    }
    if (currentStep === 2 && (!formData.quantityValue || isNaN(parseFloat(formData.quantityValue)) || parseFloat(formData.quantityValue) <= 0)) {
      setError(language === 'en' ? 'Please enter a valid quantity' : 'దయచేసి సరైన పరిమాణాన్ని నమోదు చేయండి');
      return;
    }
    setError(null);
    setCurrentStep(prev => Math.min(prev + 1, 6));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    let quantityKg = parseFloat(formData.quantityValue);
    if (formData.quantityUnit === 'tonne') quantityKg *= 1000;
    else if (formData.quantityUnit === 'quintal') quantityKg *= 100;

    let transportCost = null;
    if (formData.userProvidedTransportCostPerKg && !isNaN(parseFloat(formData.userProvidedTransportCostPerKg))) {
      transportCost = parseFloat(formData.userProvidedTransportCostPerKg);
    }

    let expectedPrice = null;
    if (formData.expectedPricePerUnit && !isNaN(parseFloat(formData.expectedPricePerUnit))) {
      expectedPrice = parseFloat(formData.expectedPricePerUnit);
    }

    try {
      const res = await farmerApi.createListing({
        farmerName: formData.farmerName || user?.fullName || 'Registered Farmer',
        contactPhone: formData.contactPhone || user?.phoneNumber,
        cropName: formData.cropName,
        varietyName: formData.varietyName,
        quantityKg: quantityKg,
        quantityUnit: formData.quantityUnit,
        expectedPricePerUnit: expectedPrice,
        priceUnit: formData.priceUnit,
        readyDate: formData.readyDate,
        village: formData.village,
        mandal: formData.mandal,
        district: formData.district,
        state: formData.state,
        qualityGrade: formData.qualityGrade,
        description: formData.description,
        photoUrl: formData.photoUrl,
        userProvidedTransportCostPerKg: transportCost,
      });

      navigate(`/recommendation/${res.data.id}`);
    } catch (err) {
      console.error('Error submitting produce listing:', err);
      setError(language === 'en' ? 'Failed to submit produce listing. Please check connection.' : 'సమర్పించడం విఫలమైంది. దయచేసి కనెక్షన్ తనిఖీ చేయండి.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-200 shadow-sm space-y-6">
        
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between pb-6 border-b border-earth-100">
          <div>
            <span className="text-xs font-black text-agri-700 uppercase tracking-wider">
              {t('stepHeader', { step: currentStep })}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {currentStep === 1 && t('whatCrop')}
              {currentStep === 2 && t('howMuch')}
              {currentStep === 3 && t('whereCrop')}
              {currentStep === 4 && (language === 'en' ? '4. Add Product Photo (Visual Evidence)' : '4. పంట వాస్తవ ఫోటోను జోడించండి')}
              {currentStep === 5 && t('nearbyRates')}
              {currentStep === 6 && t('bestOption')}
            </h1>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2 text-red-800 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: What Crop */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-2 relative">
              <label className="block text-xs font-bold text-slate-700">
                {language === 'en' ? 'Search Crop (English or తెలుగు)...' : 'పంట పేరు (English లేదా తెలుగు)...'}
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-11 rounded-xl border border-earth-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-600"
                  placeholder={language === 'en' ? "e.g. Tomato, Chilli, వరి, మిరప..." : "ఉదా. టమోటా, మిరపకాయ, వరి, పత్తి..."}
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                {searching && (
                  <div className="absolute right-3.5 top-3.5">
                    <div className="w-4 h-4 border-2 border-agri-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1.5 rounded-2xl bg-white border border-earth-200 shadow-xl py-2 z-20 max-h-48 overflow-y-auto">
                  {suggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectSuggestedCrop(c)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-earth-50 text-left text-xs font-semibold text-slate-800 transition"
                    >
                      <div className="flex items-center gap-2">
                        <Sprout className="w-4 h-4 text-agri-600 shrink-0" />
                        <span><strong>{c.name}</strong> {c.teluguName ? `(${c.teluguName})` : ''}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{c.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {language === 'en' ? 'Variety Name / Lot Specification' : 'రకం పేరు / వివరాలు'}
              </label>
              <input
                type="text"
                value={formData.varietyName}
                onChange={(e) => setFormData({ ...formData, varietyName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-earth-300 bg-white text-xs font-bold text-slate-800 focus:outline-none"
                placeholder="e.g. Teja Red / BPT 5204"
              />
            </div>

            {isValidCrop && formData.cropName && (
              <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3.5 py-2 rounded-xl border border-emerald-200 text-xs font-bold w-fit">
                <Check className="w-4 h-4" />
                <span>{language === 'en' ? 'Selected Canonical Crop:' : 'ఎంచుకున్న పంట:'} {formData.cropName}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Quantity & Expected Price */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {t('quantityLabel')}
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={formData.quantityValue}
                    onChange={(e) => setFormData({ ...formData, quantityValue: e.target.value })}
                    className="flex-grow px-4 py-3 rounded-l-xl border border-earth-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-600"
                    placeholder="e.g. 1000"
                    min="0"
                  />
                  <select
                    value={formData.quantityUnit}
                    onChange={(e) => setFormData({ ...formData, quantityUnit: e.target.value })}
                    className="px-4 py-3 rounded-r-xl border-t border-b border-r border-earth-300 bg-earth-50 text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="kg">kg (కిలోలు)</option>
                    <option value="quintal">Quintal (క్వింటాళ్లు)</option>
                    <option value="tonne">Tonne (టన్నులు)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {t('expectedPriceLabel')} ({language === 'en' ? 'Your Asking Price' : 'మీరు ఆశించే ధర'})
                </label>
                <div className="flex">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.expectedPricePerUnit}
                    onChange={(e) => setFormData({ ...formData, expectedPricePerUnit: e.target.value })}
                    className="flex-grow px-4 py-3 rounded-l-xl border border-earth-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-600"
                    placeholder="e.g. 220.00"
                  />
                  <select
                    value={formData.priceUnit}
                    onChange={(e) => setFormData({ ...formData, priceUnit: e.target.value })}
                    className="px-4 py-3 rounded-r-xl border-t border-b border-r border-earth-300 bg-earth-50 text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="kg">Per kg</option>
                    <option value="quintal">Per Quintal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('qualityGradeLabel')}
                </label>
                <select
                  value={formData.qualityGrade}
                  onChange={(e) => setFormData({ ...formData, qualityGrade: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300 text-xs font-bold bg-white focus:outline-none"
                >
                  <option value="A">Grade A (Premium)</option>
                  <option value="B">Grade B (FAQ Standard)</option>
                  <option value="C">Grade C (Commercial)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Where is your crop */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {t('districtLabel')}
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-earth-300 bg-white text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {t('mandalLabel')}
                  </label>
                  <input
                    type="text"
                    value={formData.mandal}
                    onChange={(e) => setFormData({ ...formData, mandal: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-earth-300 bg-white text-xs font-bold text-slate-800 focus:outline-none"
                    placeholder="e.g. Guntur Rural"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {t('villageLabel')}
                  </label>
                  <input
                    type="text"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-earth-300 bg-white text-xs font-bold text-slate-800 focus:outline-none"
                    placeholder="e.g. Nallapadu"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {t('readyDateLabel')}
                  </label>
                  <input
                    type="date"
                    value={formData.readyDate}
                    onChange={(e) => setFormData({ ...formData, readyDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-earth-300 bg-white text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {t('descriptionLabel')}
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-earth-300 bg-white text-xs focus:outline-none"
                  placeholder="e.g. Harvested 3 days ago, sun-dried, packed in gunny bags..."
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Product Photo Upload */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-700">
                {t('uploadPhotoLabel')}
              </label>

              <div className="p-6 border-2 border-dashed border-earth-300 rounded-2xl bg-earth-50/50 text-center space-y-3">
                {photoPreview || formData.photoUrl ? (
                  <div className="space-y-3">
                    <img
                      src={photoPreview || formData.photoUrl}
                      alt="Crop Preview"
                      className="w-44 h-44 object-cover mx-auto rounded-2xl border shadow-sm"
                    />
                    <div className="flex justify-center gap-3">
                      <label className="cursor-pointer px-4 py-2 rounded-xl bg-agri-800 text-white text-xs font-bold hover:bg-agri-700 transition">
                        <span>Change Photo</span>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 rounded-full bg-agri-100 text-agri-700 flex items-center justify-center mx-auto">
                      <Camera className="w-8 h-8 text-agri-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">
                        {language === 'en' ? 'Upload authentic photo of your produce' : 'మీ పంట యొక్క వాస్తవ ఫోటోను అప్‌లోడ్ చేయండి'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{t('photoUploadHelper')}</p>
                    </div>

                    <label className="inline-flex items-center gap-2 cursor-pointer px-5 py-2.5 rounded-xl bg-agri-800 hover:bg-agri-700 text-white text-xs font-black transition shadow-sm">
                      <Upload className="w-4 h-4" />
                      <span>{uploadingPhoto ? 'Uploading...' : 'Choose Photo from Device'}</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
                    </label>
                  </div>
                )}
              </div>

              {/* Visual Evidence Notice */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-semibold text-amber-900">
                ℹ️ {t('visualEvidenceDisclaimer')}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Mandi Rates & Transport */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="border border-earth-200 rounded-2xl overflow-hidden bg-earth-50/30 p-4 space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                {t('todaysMandiRates')} ({formData.district})
              </h4>

              {loadingRates ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading verified mandi benchmarks...</div>
              ) : localRates.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500 font-bold">{t('noDataAvailable')}</div>
              ) : (
                <div className="space-y-2">
                  {localRates.map(r => (
                    <div key={r.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-earth-200 text-xs">
                      <div>
                        <strong className="text-slate-800 block">{r.mandiName}</strong>
                        <span className="text-[10px] text-slate-400">Date: {r.arrivalDate}</span>
                      </div>
                      <div className="text-right">
                        <strong className="text-agri-950 font-black text-sm block">₹{r.modalPricePerKg}/kg</strong>
                        <span className="text-[10px] text-emerald-700 font-bold uppercase">{r.dataQualityStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Custom Transport Quote per kg (Optional)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.userProvidedTransportCostPerKg}
                  onChange={(e) => setFormData({ ...formData, userProvidedTransportCostPerKg: e.target.value })}
                  placeholder="e.g. 1.20"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Final Review */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="bg-earth-50 rounded-2xl p-6 border border-earth-200 space-y-4 text-xs">
              <h3 className="font-black uppercase text-slate-700 tracking-wider">Review Produce Listing</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block">{t('cropLabel')}</span>
                  <strong className="text-slate-900 text-sm font-bold">{formData.cropName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">{t('quantityLabel')}</span>
                  <strong className="text-slate-900 text-sm font-bold">{formData.quantityValue} {formData.quantityUnit}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">{t('expectedPriceLabel')}</span>
                  <strong className="text-agri-800 text-sm font-bold">₹{formData.expectedPricePerUnit}/{formData.priceUnit}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">{t('locationLabel')}</span>
                  <strong className="text-slate-900 text-sm font-bold">{formData.village}, {formData.district}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-earth-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="inline-flex items-center px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-bold hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              {language === 'en' ? 'Back' : 'వెనుకకు'}
            </button>
          ) : (
            <div />
          )}

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center px-6 py-3 rounded-xl bg-agri-800 text-white text-xs font-extrabold hover:bg-agri-700 shadow-sm transition"
            >
              {language === 'en' ? 'Next' : 'తరువాత'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center px-8 py-3.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black hover:bg-emerald-400 shadow-lg transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin mr-1.5"></div>
                  {language === 'en' ? 'Publishing...' : 'ప్రచురిస్తోంది...'}
                </>
              ) : (
                <>
                  {language === 'en' ? 'Publish & View Decision Report ➔' : 'ప్రచురించి నివేదికను చూడండి ➔'}
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
