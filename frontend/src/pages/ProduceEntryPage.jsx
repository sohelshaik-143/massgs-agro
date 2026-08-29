import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { farmerApi, marketApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import VoiceInputModal from '../components/VoiceInputModal';
import {
  Sprout, Mic, Sparkles, AlertCircle, ArrowRight, ArrowLeft,
  Truck, User, Calendar, MapPin, Scale, HelpCircle, Check, Database, Search
} from 'lucide-react';

export default function ProduceEntryPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    farmerName: '',
    contactPhone: '',
    cropName: 'Tomato',
    varietyName: 'FAQ',
    quantityValue: '',
    quantityUnit: 'tonne', // kg, quintal, tonne
    district: 'Guntur',
    state: 'Andhra Pradesh',
    readyDate: new Date().toISOString().split('T')[0],
    qualityGrade: 'A',
    userProvidedTransportCostPerKg: '',
  });

  // Dynamic Metadata
  const [districts, setDistricts] = useState(['Guntur', 'Chittoor', 'Kurnool', 'Krishna']);
  const [localRates, setLocalRates] = useState([]);
  const [loadingRates, setLoadingRates] = useState(false);

  // Autocomplete crop search states
  const [searchQuery, setSearchQuery] = useState(formData.cropName || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isValidCrop, setIsValidCrop] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    // Load AP districts
    marketApi.getApDistricts()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setDistricts(res.data);
          // Set default to first district
          setFormData(prev => ({ ...prev, district: res.data[0] }));
        }
      })
      .catch((err) => console.error('Error fetching AP districts:', err));
  }, []);

  // Debounced search for crops
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSuggestions([]);
      setIsValidCrop(false);
      return;
    }

    setSearching(true);
    const delayDebounce = setTimeout(() => {
      marketApi.searchCrops(searchQuery)
        .then((res) => {
          setSuggestions(res.data);
          const match = res.data.some(c => 
            c.name.toLowerCase() === searchQuery.trim().toLowerCase()
          );
          setIsValidCrop(match);
          setSearching(false);
        })
        .catch((err) => {
          console.error('Error matching crops:', err);
          setSearching(false);
        });
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Fetch local rates when Step 4 is reached
  useEffect(() => {
    if (currentStep === 4) {
      setLoadingRates(true);
      marketApi.getLatestRates(formData.district, null)
        .then((res) => {
          const cropRates = res.data.filter(p => p.cropName.toLowerCase() === formData.cropName.toLowerCase());
          setLocalRates(cropRates);
          setLoadingRates(false);
        })
        .catch((err) => {
          console.error('Error loading rates:', err);
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

  const handleNext = () => {
    if (currentStep === 1 && !isValidCrop) {
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

    // Standardize quantity to KG
    let quantityKg = parseFloat(formData.quantityValue);
    if (formData.quantityUnit === 'tonne') quantityKg *= 1000;
    else if (formData.quantityUnit === 'quintal') quantityKg *= 100;

    let transportCost = null;
    if (formData.userProvidedTransportCostPerKg && !isNaN(parseFloat(formData.userProvidedTransportCostPerKg))) {
      transportCost = parseFloat(formData.userProvidedTransportCostPerKg);
    }

    try {
      const res = await farmerApi.createListing({
        farmerName: formData.farmerName || 'Registered Farmer',
        contactPhone: formData.contactPhone,
        cropName: formData.cropName,
        varietyName: formData.varietyName,
        quantityKg: quantityKg,
        readyDate: formData.readyDate,
        district: formData.district,
        state: formData.state,
        qualityGrade: formData.qualityGrade,
        userProvidedTransportCostPerKg: transportCost,
      });

      navigate(`/recommendation/${res.data.id}`);
    } catch (err) {
      console.error('Error submitting produce listing:', err);
      setError(language === 'en' ? 'Failed to submit produce listing. Please check connection.' : 'సమర్పించడం విఫలమైంది. దయచేసి కనెక్షన్ తనిఖీ చేయండి.');
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-between pb-6 border-b border-earth-100">
        <div>
          <span className="text-xs font-bold text-agri-700 uppercase tracking-wider">
            {t('stepHeader', { step: currentStep })}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
            {currentStep === 1 && t('whatCrop')}
            {currentStep === 2 && t('howMuch')}
            {currentStep === 3 && t('whereCrop')}
            {currentStep === 4 && t('nearbyRates')}
            {currentStep === 5 && t('compareOptions')}
            {currentStep === 6 && t('bestOption')}
          </h1>
        </div>
      </div>
    );
  };

  const renderHelpBox = (toDo, infoNeeded, next) => {
    return (
      <div className="bg-earth-50 rounded-2xl p-4 border border-earth-200 text-xs text-slate-600 space-y-2">
        <div>
          <span className="font-extrabold uppercase text-agri-800 block mb-0.5">{t('whatToDoNow')}</span>
          <p>{toDo}</p>
        </div>
        <div>
          <span className="font-extrabold uppercase text-slate-500 block mb-0.5">{t('whatInfoNeeded')}</span>
          <p>{infoNeeded}</p>
        </div>
        <div>
          <span className="font-extrabold uppercase text-slate-500 block mb-0.5">{t('whatHappensNext')}</span>
          <p>{next}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-200 shadow-sm space-y-6">
        
        {renderStepIndicator()}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-800 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: What Crop */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-2 relative">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                {language === 'en' ? 'Type the crop you have...' : 'మీ దగ్గర ఉన్న పంట పేరు టైప్ చేయండి...'}
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-11 rounded-xl border border-earth-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-600"
                  placeholder={language === 'en' ? "e.g. Tomato, Chilli, Rice..." : "ఉదా. టమోటా, మిరపకాయ, బియ్యం..."}
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
                      className="w-full flex items-center px-4 py-2.5 hover:bg-earth-50 text-left text-xs font-semibold text-slate-800 transition"
                    >
                      <Sprout className="w-4 h-4 mr-2 text-agri-600 shrink-0" />
                      <span>{c.name} ({c.category})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Invalid Crop Warning */}
            {!isValidCrop && !searching && searchQuery.trim().length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-2 text-amber-900 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {language === 'en' 
                    ? `No current market data found for "${searchQuery}". We only support verified real market commodities.` 
                    : `"${searchQuery}" కొరకు తాజా మార్కెట్ వివరాలు లభించలేదు. మేము ధృవీకరించబడిన నిజమైన మార్కెట్ పంటలను మాత్రమే చూపిస్తాము.`}
                </span>
              </div>
            )}

            {/* Selected Crop Badge */}
            {isValidCrop && formData.cropName && (
              <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3.5 py-2 rounded-xl border border-emerald-200 text-xs font-bold w-fit">
                <Check className="w-4 h-4" />
                <span>{language === 'en' ? 'Selected Crop:' : 'ఎంచుకున్న పంట:'} {formData.cropName}</span>
              </div>
            )}

            {renderHelpBox(
              language === 'en' ? "Search and select your crop." : "మీ పంటను వెతికి ఎంచుకోండి.",
              language === 'en' ? "Real crop name from the database." : "డేటాబేస్ లోని నిజమైన పంట పేరు.",
              language === 'en' ? "Step 2: Enter harvest weight." : "దశ 2: పంట బరువును నమోదు చేయండి."
            )}
          </div>
        )}

        {/* STEP 2: How Much */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  {t('quantityLabel')}
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={formData.quantityValue}
                    onChange={(e) => setFormData({ ...formData, quantityValue: e.target.value })}
                    className="flex-grow px-4 py-3 rounded-l-xl border border-earth-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-600"
                    placeholder="e.g. 10"
                    min="0"
                  />
                  <select
                    value={formData.quantityUnit}
                    onChange={(e) => setFormData({ ...formData, quantityUnit: e.target.value })}
                    className="px-4 py-3 rounded-r-xl border-t border-b border-r border-earth-300 bg-earth-50 text-sm font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="tonne">{language === 'en' ? 'Tonnes' : 'టన్నులు'}</option>
                    <option value="quintal">{language === 'en' ? 'Quintals' : 'క్వింటాళ్లు'}</option>
                    <option value="kg">{language === 'en' ? 'Kgs' : 'కిలోలు'}</option>
                  </select>
                </div>
              </div>
            </div>

            {renderHelpBox(
              language === 'en' ? "Enter total harvest weight and unit." : "మొత్తం పంట పరిమాణాన్ని నమోదు చేయండి.",
              language === 'en' ? "Weight values and unit (kgs/tonnes/quintals)." : "బరువు మరియు బరువు ప్రమాణం (కిలోలు/టన్నులు/క్వింటాళ్లు).",
              language === 'en' ? "Step 3: Define crop storage location." : "దశ 3: పంట నిల్వ స్థలాన్ని ఎంచుకోండి."
            )}
          </div>
        )}

        {/* STEP 3: Where is your crop */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  {t('locationLabel')} (District)
                </label>
                <select
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-earth-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-600"
                >
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Farmer Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.farmerName}
                    onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-earth-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none"
                    placeholder="e.g. Ramesh"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Contact Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-earth-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none"
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
              </div>
            </div>

            {renderHelpBox(
              language === 'en' ? "Select crop loading/harvest location district." : "పంట ఉన్న జిల్లాను ఎంచుకోండి.",
              language === 'en' ? "Andhra Pradesh district." : "ఆంధ్రప్రదేశ్ జిల్లా పేరు.",
              language === 'en' ? "Step 4: Check regional market rates." : "దశ 4: మీ ప్రాంత మండి ధరలను పరిశీలించండి."
            )}
          </div>
        )}

        {/* STEP 4: Mandi Rates */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border border-earth-200 rounded-2xl overflow-hidden bg-earth-50/30 p-4 min-h-32 flex flex-col justify-center">
              {loadingRates ? (
                <div className="text-center space-y-2 py-4">
                  <div className="inline-block w-6 h-6 border-2 border-agri-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-500 font-semibold">{language === 'en' ? 'Fetching regional rates...' : 'మండి ధరలను సేకరిస్తోంది...'}</p>
                </div>
              ) : localRates.length === 0 ? (
                <div className="text-center py-4 space-y-1 text-slate-600 text-xs">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                  <p className="font-bold">{language === 'en' ? 'No recent verified rates found.' : 'తాజా ధరల వివరాలు లేవు.'}</p>
                  <p>{language === 'en' ? `No verified ${formData.cropName} prices in ${formData.district} district in past 48 hours.` : `${formData.district} జిల్లాలో గత 48 గంటల్లో ఎటువంటి ధరల నమోదు కాలేదు.`}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('todaysMandiRates')} ({formData.district})</h4>
                  {localRates.map(r => (
                    <div key={r.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-earth-200 text-xs">
                      <div>
                        <strong className="text-slate-800 block">{r.mandiName}</strong>
                        <span className="text-[10px] text-slate-400">Date: {r.arrivalDate}</span>
                      </div>
                      <div className="text-right">
                        <strong className="text-agri-950 font-black text-sm block">₹{r.modalPricePerKg} / kg</strong>
                        <span className="text-[10px] text-emerald-700 font-bold uppercase">{r.dataQualityStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {renderHelpBox(
              language === 'en' ? "Verify regional market rates before calculating net options." : "మీ ప్రాంత ధరలను నిర్ధారించుకోండి.",
              language === 'en' ? "Mandi price data (modal, min, max)." : "మండి సమాచారం.",
              language === 'en' ? "Step 5: Enter custom transport / storage details." : "దశ 5: రవాణా / నిల్వ వివరాలను నమోదు చేయండి."
            )}
          </div>
        )}

        {/* STEP 5: Compare Options */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center">
                  <Truck className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Custom Transport Quote per KG (Optional)
                </label>
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  value={formData.userProvidedTransportCostPerKg}
                  onChange={(e) => setFormData({ ...formData, userProvidedTransportCostPerKg: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-earth-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-600"
                  placeholder="e.g. 1.50"
                />
                <p className="text-[10px] text-slate-400">Leave blank to use verified default regional quotes.</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Harvest Ready Date
                </label>
                <input
                  type="date"
                  value={formData.readyDate}
                  onChange={(e) => setFormData({ ...formData, readyDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-earth-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            {renderHelpBox(
              language === 'en' ? "Optionally specify your private transport quote or date parameters." : "రవాణా మరియు సిద్ధంగా ఉన్న తేదీ నమోదు చేయండి (ఐచ్ఛికం).",
              language === 'en' ? "Transport cost per kg and ready date." : "రవాణా ధర మరియు పంట చేతికి వచ్చే తేదీ.",
              language === 'en' ? "Step 6: Review and get net realization recommendation." : "దశ 6: సమీక్షించి ఉత్తమ విక్రయ ఎంపికను పొందండి."
            )}
          </div>
        )}

        {/* STEP 6: Final Review */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="bg-earth-50 rounded-2xl p-6 border border-earth-200 space-y-4 text-xs">
              <h3 className="font-extrabold uppercase text-slate-700 tracking-wider">Final Verification</h3>
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
                  <span className="text-slate-400 block">{t('locationLabel')}</span>
                  <strong className="text-slate-900 text-sm font-bold">{formData.district}, {formData.state}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Transport Quote</span>
                  <strong className="text-slate-900 text-sm font-bold">
                    {formData.userProvidedTransportCostPerKg ? `₹${formData.userProvidedTransportCostPerKg}/kg` : 'Using system defaults'}
                  </strong>
                </div>
              </div>
            </div>

            {renderHelpBox(
              language === 'en' ? "Verify all entries and click submit." : "అన్ని వివరాలను ధృవీకరించి సమర్పించండి.",
              language === 'en' ? "Final summary review." : "సారాంశం సమీక్ష.",
              language === 'en' ? "View Expected Net Realization on next page." : "తదుపరి పేజీలో ఉత్తమ విక్రయ ఎంపికను చూడండి."
            )}
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
              className="inline-flex items-center px-8 py-3.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black hover:bg-emerald-400 shadow-lg shadow-emerald-900/10 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin mr-1.5"></div>
                  {language === 'en' ? 'Evaluating...' : 'లెక్కలు వేస్తోంది...'}
                </>
              ) : (
                <>
                  {language === 'en' ? 'Get Selling Report ➔' : 'నివేదికను పొందండి ➔'}
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
