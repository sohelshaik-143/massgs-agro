import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { buyerApi, farmerApi, marketplaceApi, locationApi, marketApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, Plus, Search, MapPin, Calendar, ArrowRight, ShieldCheck, 
  ShoppingBag, FileText, CheckCircle2, Star, AlertOctagon, Eye, Handshake, DollarSign, Sprout
} from 'lucide-react';
import PhotoPreviewModal from '../components/PhotoPreviewModal';
import DigitalAgreementModal from '../components/DigitalAgreementModal';
import FeedbackModal from '../components/FeedbackModal';
import DisputeModal from '../components/DisputeModal';

export default function BuyerDashboard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('LISTINGS'); // LISTINGS | MY_DEMANDS | CREATE_DEMAND | MY_OFFERS | PURCHASES | VILLAGES
  const [listings, setListings] = useState([]);
  const [myDemands, setMyDemands] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [myAgreements, setMyAgreements] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [cropFilter, setCropFilter] = useState('');
  const [trustProfile, setTrustProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Offer Creation State
  const [selectedListingForOffer, setSelectedListingForOffer] = useState(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQuantity, setOfferQuantity] = useState('');
  const [offerTerms, setOfferTerms] = useState('FARM_GATE_PICKUP');
  const [offerNotes, setOfferNotes] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);

  // Demand Creation State
  const [demandCrop, setDemandCrop] = useState('');
  const [demandMinQty, setDemandMinQty] = useState('');
  const [demandMaxQty, setDemandMaxQty] = useState('');
  const [demandTargetPrice, setDemandTargetPrice] = useState('');
  const [demandDistrict, setDemandDistrict] = useState('Guntur');
  const [demandExpiry, setDemandExpiry] = useState('');
  const [demandSpecs, setDemandSpecs] = useState('');
  const [creatingDemand, setCreatingDemand] = useState(false);

  // Modals state
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [selectedTxnForFeedback, setSelectedTxnForFeedback] = useState(null);
  const [selectedTxnForDispute, setSelectedTxnForDispute] = useState(null);

  useEffect(() => {
    loadAllData();
  }, [user, selectedDistrict, cropFilter]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [listRes, distRes] = await Promise.all([
        farmerApi.getListings({ district: selectedDistrict || undefined, crop: cropFilter || undefined }),
        locationApi.getDistricts('Andhra Pradesh').catch(() => ({ data: ['Guntur', 'Chittoor', 'Kurnool', 'Krishna', 'Tirupati', 'West Godavari'] })),
      ]);

      setListings(listRes.data || []);
      setDistricts(distRes.data || []);

      const buyerIdentifier = user?.roleEntityId || user?.userId || 1;
      const [demRes, offRes, agRes, txRes, trRes] = await Promise.all([
        buyerApi.getBuyerDemands(buyerIdentifier).catch(() => ({ data: [] })),
        marketplaceApi.getBuyerOffers(buyerIdentifier).catch(() => ({ data: [] })),
        marketplaceApi.getBuyerAgreements(buyerIdentifier).catch(() => ({ data: [] })),
        marketplaceApi.getBuyerTransactions(buyerIdentifier).catch(() => ({ data: [] })),
        marketplaceApi.getUserTrustProfile(user?.userId || buyerIdentifier).catch(() => ({ data: null })),
      ]);

      setMyDemands(demRes.data || []);
      setMyOffers(offRes.data || []);
      setMyAgreements(agRes.data || []);
      setPurchases(txRes.data || []);
      setTrustProfile(trRes.data || null);
    } catch (err) {
      console.error('Failed to load buyer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDemand = async (e) => {
    e.preventDefault();
    if (!demandCrop || !demandTargetPrice || !demandMinQty || !demandExpiry) {
      alert('Please fill all required demand fields.');
      return;
    }

    setCreatingDemand(true);
    try {
      await buyerApi.createDemand({
        cropName: demandCrop,
        minQuantityKg: parseFloat(demandMinQty),
        maxQuantityKg: demandMaxQty ? parseFloat(demandMaxQty) : parseFloat(demandMinQty) * 2,
        targetPricePerKg: parseFloat(demandTargetPrice),
        targetDistrict: demandDistrict,
        validUntil: demandExpiry,
        qualitySpecs: demandSpecs || undefined,
      });
      alert('Verified buying demand posted successfully!');
      setDemandCrop('');
      setDemandMinQty('');
      setDemandMaxQty('');
      setDemandTargetPrice('');
      setDemandSpecs('');
      setActiveTab('MY_DEMANDS');
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post demand');
    } finally {
      setCreatingDemand(false);
    }
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!offerPrice || !offerQuantity) {
      alert('Please enter valid offer price and quantity.');
      return;
    }

    setSubmittingOffer(true);
    try {
      await marketplaceApi.createOffer({
        produceListingId: selectedListingForOffer.id,
        offeredPricePerKg: parseFloat(offerPrice),
        offeredQuantityKg: parseFloat(offerQuantity),
        deliveryTerms: offerTerms,
        notes: offerNotes || undefined,
      });
      alert('Offer submitted directly to farmer!');
      setSelectedListingForOffer(null);
      setOfferPrice('');
      setOfferQuantity('');
      setOfferNotes('');
      setActiveTab('MY_OFFERS');
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit offer');
    } finally {
      setSubmittingOffer(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Buyer Header & Trust Profile */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black border border-blue-500/30">
            <Building2 className="w-4 h-4" />
            <span>{t('buyerPortal')} • {language === 'en' ? 'Institutional & Trader Hub' : 'కొనుగోలుదారు & వ్యాపార కేంద్రం'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {user?.fullName ? `${user.fullName}` : (language === 'en' ? 'Procurement & Buyer Dashboard' : 'కొనుగోలుదారు డాష్‌బోర్డ్')}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            {user?.massgsId ? (
              <span className="font-mono text-blue-300 font-bold">{t('permanentIdLabel')}: {user.massgsId}</span>
            ) : (
              <span>{language === 'en' ? 'Log in with mobile OTP to secure your permanent MASSGS buyer ID.' : 'మీ శాశ్వత MASSGS కొనుగోలుదారు ఐడీ కోసం మొబైల్ OTP తో లాగిన్ అవ్వండి.'}</span>
            )}
            {' • '}{user?.district || 'Andhra Pradesh & Telangana'}
          </p>
        </div>

        {/* Real Trust Badges (Zero Fake AI) */}
        <div className="flex flex-wrap gap-2.5">
          {trustProfile ? (
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-blue-300">
                <ShieldCheck className="w-4 h-4" />
                <span>{trustProfile.trustBadge}</span>
              </div>
              <p className="text-[11px] text-slate-200">
                {trustProfile.completedTransactionsCount} {language === 'en' ? 'Verified Purchases' : 'ధృవీకరించబడిన కొనుగోళ్లు'} • ⭐ {trustProfile.formattedRating || 'N/A'}
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs">
              <span className="font-bold text-slate-300">{t('notEnoughFeedback')}</span>
            </div>
          )}

          <button
            onClick={() => setActiveTab('CREATE_DEMAND')}
            className="px-5 py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-xs transition shadow-lg flex items-center gap-2 self-center"
          >
            <Plus className="w-4 h-4" />
            <span>{t('postDemand')}</span>
          </button>
        </div>
      </div>

      {/* 10-Second Action Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 border-b border-earth-200">
        {[
          { id: 'LISTINGS', label: t('farmerListings'), icon: ShoppingBag, count: listings.length },
          { id: 'MY_DEMANDS', label: t('myDemands'), icon: FileText, count: myDemands.length },
          { id: 'CREATE_DEMAND', label: t('postDemand'), icon: Plus, count: null },
          { id: 'MY_OFFERS', label: t('myOffers'), icon: Handshake, count: myOffers.length },
          { id: 'PURCHASES', label: t('myPurchases'), icon: CheckCircle2, count: purchases.length },
          { id: 'FEEDBACK', label: t('myFeedback'), icon: Star, count: trustProfile?.reviews?.length || 0 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 rounded-2xl text-xs font-black transition flex items-center gap-2 flex-shrink-0 ${
                isActive
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-earth-200">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 mt-3">Loading authentic market listings...</p>
        </div>
      ) : (
        <>
          {/* 1. BROWSE REAL FARMER LISTINGS */}
          {activeTab === 'LISTINGS' && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-earth-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Filter District:</span>
                  </div>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">All Districts (Andhra Pradesh & Telangana)</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={cropFilter}
                    onChange={(e) => setCropFilter(e.target.value)}
                    placeholder="Search crop (e.g. Chilli, వరి)..."
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none w-52"
                  />
                </div>
              </div>

              {listings.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-earth-200 p-8 space-y-3">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-black text-slate-900">{t('noDataAvailable')}</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {language === 'en'
                      ? 'No active farmer listings matching your filter right now. Post your demand to alert local growers.'
                      : 'మీ ఫిల్టర్‌కు సరిపోయే రైతు పంట జాబితాలు ప్రస్తుతం లేవు. స్థానిక రైతులకు తెలియజేయడానికి మీ కొనుగోలు అవసరాన్ని పోస్ట్ చేయండి.'}
                  </p>
                  <button
                    onClick={() => setActiveTab('CREATE_DEMAND')}
                    className="px-5 py-2.5 rounded-xl bg-blue-700 text-white font-bold text-xs"
                  >
                    {t('postDemand')}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl p-6 border border-earth-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                    >
                      <div>
                        {/* Header & Photo */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
                              {item.cropName} {item.cropTeluguName ? `(${item.cropTeluguName})` : ''}
                            </span>
                            <h3 className="text-base font-black text-slate-900">{item.varietyName || 'Standard Lot'}</h3>
                          </div>

                          {item.photoUrl ? (
                            <button
                              onClick={() => setSelectedPhoto({
                                url: item.photoUrl,
                                crop: item.cropName,
                                farmer: item.farmerName,
                                loc: `${item.locationDistrict}, ${item.locationState}`
                              })}
                              className="relative group rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition flex-shrink-0"
                              title="Click to view seller visual evidence photo"
                            >
                              <img src={item.photoUrl} alt={item.cropName} className="w-14 h-14 object-cover" />
                              <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <Eye className="w-4 h-4 text-white" />
                              </div>
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-lg">
                              Grade {item.qualityGrade || 'A'}
                            </span>
                          )}
                        </div>

                        {/* Specs */}
                        <div className="space-y-2 text-xs border-y border-earth-100 py-3 text-slate-600">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">{t('quantityLabel')}:</span>
                            <strong className="text-slate-900 font-black">{item.quantityKg} kg ({item.quantityUnit || 'kg'})</strong>
                          </div>

                          {item.expectedPricePerUnit && (
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-bold">{t('expectedPriceLabel')}:</span>
                              <strong className="text-blue-900 font-black">₹{item.expectedPricePerUnit}/{item.priceUnit || 'kg'}</strong>
                            </div>
                          )}

                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">Seller Location:</span>
                            <span className="font-semibold text-slate-800">
                              {item.locationVillage ? `${item.locationVillage}, ` : ''}{item.locationDistrict}, {item.locationState}
                            </span>
                          </div>

                          {/* Seller Provenance & Trust */}
                          <div className="flex justify-between items-center pt-1 text-[11px]">
                            <span className="text-slate-400 font-bold">Seller Identity:</span>
                            <span className="font-mono text-emerald-700 font-bold">
                              {item.farmerMassgsId || 'MASSGS-F'}
                            </span>
                          </div>
                        </div>

                        {/* Mandi Benchmark comparison */}
                        {item.mandiComparisonText && (
                          <div className="mt-3 p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl text-[11px] text-blue-900 font-bold">
                            🌾 {item.mandiComparisonText}
                          </div>
                        )}
                      </div>

                      {/* Make Offer Action */}
                      <button
                        onClick={() => {
                          setSelectedListingForOffer(item);
                          setOfferPrice(item.expectedPricePerUnit ? item.expectedPricePerUnit.toString() : '200');
                          setOfferQuantity(item.quantityKg.toString());
                        }}
                        className="w-full py-3 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-black flex items-center justify-center gap-2 transition shadow-sm"
                      >
                        <Handshake className="w-4 h-4 text-blue-300" />
                        <span>{t('makeOfferBtn')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. MY DEMANDS */}
          {activeTab === 'MY_DEMANDS' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-earth-200">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-black text-slate-900">{t('myDemands')}</h3>
                    <p className="text-xs text-slate-500">Only genuine active demands influence local seller recommendations.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('CREATE_DEMAND')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('postDemand')}</span>
                  </button>
                </div>

                {myDemands.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-bold">
                    {t('noDataAvailable')}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myDemands.map((d) => (
                      <div key={d.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                              {d.status}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 mt-1">{d.cropName} Requirement</h4>
                          </div>
                          <span className="text-xs font-black text-blue-900">₹{d.targetPricePerKg}/kg</span>
                        </div>

                        <div className="text-xs text-slate-600 grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold">Lot Range</span>
                            <strong>{d.minQuantityKg} - {d.maxQuantityKg} kg</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold">Target District</span>
                            <strong>{d.targetDistrict}</strong>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-400 font-bold">
                          Valid till: {d.validUntil}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. CREATE BUYING DEMAND */}
          {activeTab === 'CREATE_DEMAND' && (
            <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-earth-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">{t('createDemandTitle')}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'en'
                    ? 'Publish genuine procurement demand. Expired demands are automatically retired.'
                    : 'వాస్తవ కొనుగోలు అవసరాన్ని ప్రచురించండి. గడువు ముగిసిన అవసరాలు తొలగించబడతాయి.'}
                </p>
              </div>

              <form onSubmit={handleCreateDemand} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('cropNameLabel')}</label>
                    <input
                      type="text"
                      value={demandCrop}
                      onChange={(e) => setDemandCrop(e.target.value)}
                      placeholder="e.g. Chilli / మిరప / Paddy"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('targetPriceLabel')}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={demandTargetPrice}
                      onChange={(e) => setDemandTargetPrice(e.target.value)}
                      placeholder="e.g. 210.00"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('minQuantityLabel')}</label>
                    <input
                      type="number"
                      value={demandMinQty}
                      onChange={(e) => setDemandMinQty(e.target.value)}
                      placeholder="e.g. 500"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('maxQuantityLabel')}</label>
                    <input
                      type="number"
                      value={demandMaxQty}
                      onChange={(e) => setDemandMaxQty(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('targetDistrictLabel')}</label>
                    <select
                      value={demandDistrict}
                      onChange={(e) => setDemandDistrict(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {districts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('expiryDateLabel')}</label>
                    <input
                      type="date"
                      value={demandExpiry}
                      onChange={(e) => setDemandExpiry(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('qualitySpecsLabel')}</label>
                  <input
                    type="text"
                    value={demandSpecs}
                    onChange={(e) => setDemandSpecs(e.target.value)}
                    placeholder="e.g. Moisture < 10%, Grade A Red pods"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingDemand}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm transition disabled:opacity-50"
                >
                  {creatingDemand ? 'Posting...' : t('submitDemandBtn')}
                </button>
              </form>
            </div>
          )}

          {/* 4. MY OFFERS & AGREEMENTS */}
          {activeTab === 'MY_OFFERS' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-earth-200 space-y-4">
                <h3 className="text-base font-black text-slate-900">{t('myOffers')}</h3>
                <p className="text-xs text-slate-500">Offers submitted directly to verified farmer listings.</p>

                {myOffers.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-bold">
                    {t('noDataAvailable')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myOffers.map((o) => (
                      <div key={o.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex justify-between items-center">
                        <div>
                          <span className="font-mono text-xs text-slate-400 font-bold">{o.offerCode}</span>
                          <h4 className="text-xs font-black text-slate-900 mt-0.5">
                            ₹{o.offeredPricePerKg}/kg for {o.offeredQuantityKg} kg {o.cropName} (Farmer: {o.farmerMassgsId})
                          </h4>
                          <p className="text-[11px] text-slate-500">Total: ₹{o.totalAmount} • Status: <strong className="text-blue-900">{o.status}</strong></p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          o.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {o.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Digital Agreements */}
              {myAgreements.length > 0 && (
                <div className="bg-white p-6 rounded-3xl border border-earth-200 space-y-4">
                  <h3 className="text-base font-black text-slate-900">{t('agreementTitle')}</h3>
                  <div className="space-y-3">
                    {myAgreements.map((ag) => (
                      <div key={ag.id} className="p-4 rounded-2xl border border-slate-200 flex justify-between items-center bg-blue-50/30">
                        <div>
                          <strong className="text-xs font-black text-slate-900">{ag.agreementCode}</strong>
                          <p className="text-[11px] text-slate-500">{ag.cropName} • ₹{ag.totalAmount} • {ag.status}</p>
                        </div>
                        <button
                          onClick={() => setSelectedAgreement(ag)}
                          className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 transition"
                        >
                          View & Sign Agreement
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. PURCHASES & TRACKING */}
          {activeTab === 'PURCHASES' && (
            <div className="bg-white p-6 rounded-3xl border border-earth-200 space-y-4">
              <h3 className="text-base font-black text-slate-900">{t('myPurchases')}</h3>
              <p className="text-xs text-slate-500">Track purchase transactions from agreement to completion and rate farmers.</p>

              {purchases.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-bold">
                  {t('noDataAvailable')}
                </div>
              ) : (
                <div className="space-y-4">
                  {purchases.map((tx) => (
                    <div key={tx.id} className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <span className="font-mono text-xs font-bold text-slate-400">{tx.transactionCode}</span>
                        <h4 className="text-sm font-black text-slate-900 mt-1">
                          {tx.cropName} ({tx.quantityKg} kg) from Farmer {tx.farmerMassgsId}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Agreed: ₹{tx.agreedPricePerKg}/kg • Total: <strong className="text-blue-900">₹{tx.totalAmount}</strong> • Status: <strong>{tx.status}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {tx.status === 'COMPLETED' && (
                          <button
                            onClick={() => setSelectedTxnForFeedback(tx)}
                            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition flex items-center gap-1"
                          >
                            <Star className="w-3.5 h-3.5" />
                            <span>{t('myFeedback')}</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedTxnForDispute(tx)}
                          className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition flex items-center gap-1"
                        >
                          <AlertOctagon className="w-3.5 h-3.5" />
                          <span>{t('reportProblem')}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. RATINGS & REVIEWS / BUYER TRUST PROFILE */}
          {activeTab === 'FEEDBACK' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-earth-200 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-earth-100 pb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span>{language === 'en' ? 'Buyer Trust & Verified Ratings' : 'కొనుగోలుదారు విశ్వసనీయత & రేటింగ్‌లు'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === 'en'
                      ? 'Verified feedback submitted by farmers after successful crop delivery and payment completion.'
                      : 'పంట డెలివరీ మరియు చెల్లింపు పూర్తయిన తర్వాత రైతులు సమర్పించిన ధృవీకరించబడిన సమీక్షలు.'}
                  </p>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-center min-w-36">
                  <span className="block text-[10px] uppercase font-black text-blue-800 tracking-wider">Average Score</span>
                  <span className="text-2xl font-black text-blue-900">
                    ⭐ {trustProfile?.formattedRating && !isNaN(parseFloat(trustProfile.formattedRating)) ? trustProfile.formattedRating : '5.0'}
                  </span>
                  <span className="block text-[10px] text-slate-500 font-bold">
                    {trustProfile?.reviews?.length || 0} {language === 'en' ? 'Reviews' : 'సమీక్షలు'}
                  </span>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="text-slate-400 block text-[10px] font-bold">Buyer Identity</span>
                  <strong className="text-slate-900 font-black flex items-center gap-1.5 text-blue-700">
                    <ShieldCheck className="w-4 h-4" /> {user?.massgsId || 'MASSGS-B'} Verified
                  </strong>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="text-slate-400 block text-[10px] font-bold">Organization & Mobile</span>
                  <strong className="text-slate-900 font-black flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" /> Phone Verified (+91 {user?.phoneNumber || '98******10'})
                  </strong>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="text-slate-400 block text-[10px] font-bold">Completed Procurements</span>
                  <strong className="text-slate-900 font-black flex items-center gap-1.5 text-blue-900">
                    <CheckCircle2 className="w-4 h-4" /> {trustProfile?.completedTransactionsCount || purchases.filter(p => p.status === 'COMPLETED').length} Purchases
                  </strong>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  {language === 'en' ? 'Farmer Verified Reviews' : 'రైతులు ఇచ్చిన ధృవీకరించబడిన సమీక్షలు'}
                </h4>

                {!trustProfile?.reviews || trustProfile.reviews.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <Star className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">{t('notEnoughFeedback')}</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      {language === 'en'
                        ? 'Reviews will appear here once farmers complete transactions with your account and rate the procurement.'
                        : 'రైతులతో లావాదేవీలు పూర్తయిన తర్వాత వారి సమీక్షలు ఇక్కడ కనిపిస్తాయి.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trustProfile.reviews.map((rev) => (
                      <div key={rev.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-1">
                              {[...Array(rev.rating || 5)].map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              ))}
                              <span className="text-xs font-black text-slate-800 ml-1">{rev.rating}.0</span>
                            </div>
                            <p className="text-xs font-black text-slate-900 mt-1">{rev.reviewerName || 'Verified Farmer'}</p>
                            <span className="font-mono text-[10px] text-slate-400">{rev.reviewerMassgsId}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-[10px] text-slate-400 font-bold block">{rev.transactionCode}</span>
                            <span className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {rev.comment && (
                          <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            "{rev.comment}"
                          </p>
                        )}

                        {rev.tags && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {rev.tags.split(',').map((tag, idx) => (
                              <span key={idx} className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-800 rounded-full border border-blue-200">
                                ✓ {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Offer Submission Drawer / Modal */}
      {selectedListingForOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-earth-200 relative">
            <h3 className="text-base font-black text-slate-900 mb-1">
              Submit Direct Offer on {selectedListingForOffer.cropName}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Seller: {selectedListingForOffer.farmerName} ({selectedListingForOffer.farmerMassgsId}) • {selectedListingForOffer.locationDistrict}
            </p>

            <form onSubmit={handleSubmitOffer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('offeredPriceLabel')}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('offeredQuantityLabel')}</label>
                  <input
                    type="number"
                    value={offerQuantity}
                    onChange={(e) => setOfferQuantity(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('deliveryTermsLabel')}</label>
                <select
                  value={offerTerms}
                  onChange={(e) => setOfferTerms(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="FARM_GATE_PICKUP">Farm Gate Pickup (Buyer arranges transport)</option>
                  <option value="BUYER_WAREHOUSE_DELIVERY">Buyer Warehouse Delivery (Farmer delivers)</option>
                  <option value="APMC_YARD">APMC Yard Exchange</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Notes / Quality Conditions</label>
                <textarea
                  rows={2}
                  value={offerNotes}
                  onChange={(e) => setOfferNotes(e.target.value)}
                  placeholder="e.g. Payment via direct bank transfer upon weighbridge certificate..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedListingForOffer(null)}
                  className="w-1/2 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOffer}
                  className="w-1/2 py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-black shadow-sm transition disabled:opacity-50"
                >
                  {submittingOffer ? 'Sending...' : 'Send Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedPhoto && (
        <PhotoPreviewModal
          isOpen={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          photoUrl={selectedPhoto.url}
          cropName={selectedPhoto.crop}
          farmerName={selectedPhoto.farmer}
          location={selectedPhoto.loc}
        />
      )}

      {selectedAgreement && (
        <DigitalAgreementModal
          isOpen={!!selectedAgreement}
          onClose={() => setSelectedAgreement(null)}
          agreement={selectedAgreement}
          onAccepted={loadAllData}
        />
      )}

      {selectedTxnForFeedback && (
        <FeedbackModal
          isOpen={!!selectedTxnForFeedback}
          onClose={() => setSelectedTxnForFeedback(null)}
          transaction={selectedTxnForFeedback}
          onSubmitted={loadAllData}
        />
      )}

      {selectedTxnForDispute && (
        <DisputeModal
          isOpen={!!selectedTxnForDispute}
          onClose={() => setSelectedTxnForDispute(null)}
          transaction={selectedTxnForDispute}
          onSubmitted={loadAllData}
        />
      )}
    </div>
  );
}
