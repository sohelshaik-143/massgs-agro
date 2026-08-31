import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    appTitle: "MASSGS AGRO",
    appTagline: "Decision & Verified Supply Marketplace",
    farmerPortal: "Farmer Portal",
    buyerPortal: "Buyer Portal",
    marketIntelligence: "Mandi Rates",
    unifiedSearchPlaceholder: "Search crop (వరి, Chilli), village (Guntur), mandi or buyer...",
    searchBtn: "Search",
    loginBtn: "OTP Login",
    logoutBtn: "Logout",
    permanentIdLabel: "Permanent ID",
    zeroFakeData: "Zero Fake Data Guarantee",
    zeroFakeDataBadge: "100% Verified Records • Zero Fake Data",
    noDataAvailable: "No verified data available.",
    notEnoughFeedback: "Not enough verified feedback yet.",
    visualEvidenceDisclaimer: "Uploaded photo is visual evidence submitted by the seller, not a laboratory quality certification.",

    // Nav & Dashboard actions
    checkTodaysPrice: "🌾 Check Today's Price",
    sellMyCrop: "📦 Sell My Crop",
    findBuyers: "👥 Find Buyers",
    myOffers: "🤝 Buyer Offers",
    myTransactions: "📊 My Transactions",
    myFeedback: "⭐ My Feedback",
    reportProblem: "🚨 Report a Problem",

    findCrops: "🔎 Find Crops",
    searchVillages: "📍 Search Villages",
    farmerListings: "📦 Farmer Listings",
    myDemands: "📢 My Demands",
    myPurchases: "📊 My Purchases",
    postDemand: "Post Buying Demand",

    // Farmer Listing Form
    listCropTitle: "List Your Harvest for Sale",
    cropNameLabel: "Crop Name (English or తెలుగు)",
    quantityLabel: "Quantity",
    unitLabel: "Unit",
    expectedPriceLabel: "Expected Asking Price",
    priceUnitLabel: "Per Unit",
    stateLabel: "State",
    districtLabel: "District",
    mandalLabel: "Mandal / Taluka",
    villageLabel: "Village / Town",
    readyDateLabel: "Ready / Harvest Date",
    qualityGradeLabel: "Quality Grade",
    descriptionLabel: "Crop Condition / Notes",
    uploadPhotoLabel: "Actual Product Photo (Visual Evidence)",
    submitListingBtn: "Publish Genuine Listing",
    photoUploadHelper: "JPG, PNG, WebP up to 5MB. Must be real crop photo.",

    // Buyer Demand Form
    createDemandTitle: "Create Genuine Buying Requirement",
    targetPriceLabel: "Target Buying Price (₹/kg)",
    minQuantityLabel: "Min Quantity (kg)",
    maxQuantityLabel: "Max Quantity (kg)",
    targetDistrictLabel: "Target Procurement District",
    expiryDateLabel: "Demand Expiry Date",
    qualitySpecsLabel: "Quality Specs / Grade Requirement",
    submitDemandBtn: "Post Verified Demand",

    // Offers & Agreements
    makeOfferBtn: "Make Offer",
    offeredPriceLabel: "Your Offer Price (₹/kg)",
    offeredQuantityLabel: "Offered Quantity (kg)",
    deliveryTermsLabel: "Delivery / Pickup Terms",
    acceptOfferBtn: "Accept Offer & Generate Agreement",
    rejectOfferBtn: "Reject Offer",
    counterOfferBtn: "Counter Offer",
    duplicateBuyerCropOfferBlocked: "Cannot accept multiple offers from this buyer for the same crop. You have already accepted an offer from this buyer for this crop.",
    duplicateBuyerCropBadge: "Offer already accepted for this crop from this buyer",
    duplicateBuyerCropTooltip: "You can only accept 1 offer per buyer for the same crop. Counter or Reject is still available.",
    agreementTitle: "MASSGS Bilateral Digital Agreement",
    agreementAcceptBtn: "Accept & Sign Digital Agreement",
    agreementSignedBadge: "Fully Signed & Legally Committed",
    pendingSignaturesBadge: "Pending Signatures",

    // Statuses
    statusAvailable: "AVAILABLE",
    statusNegotiating: "NEGOTIATING",
    statusAgreed: "AGREED",
    statusInProgress: "IN PROGRESS (DISPATCH/TRANSIT)",
    statusCompleted: "COMPLETED",
    statusCancelled: "CANCELLED",
    statusDisputed: "DISPUTED",

    // Trust & Verification
    mobileVerifiedBadge: "✓ Mobile Verified",
    profileCompleteBadge: "✓ Permanent ID Verified",
    verifiedTransactionsBadge: "✓ Verified Transactions",
    averageRatingBadge: "⭐ Average Rating",
    sellerTrustHeader: "Seller Trust & Provenance",
    buyerTrustHeader: "Buyer Trust & Provenance",

    // Feedback
    rateTransactionTitle: "Rate & Review Transaction",
    ratingLabel: "Star Rating (1 to 5)",
    reviewCommentsLabel: "Review Comments",
    reviewTagsLabel: "Tags (e.g. Timely Payment, Accurate Quality, Punctual)",
    submitFeedbackBtn: "Submit Verified Review",

    // Dispute
    disputeTitle: "Report an Issue / Dispute",
    disputeCategoryLabel: "Problem Category",
    disputeDescLabel: "Detailed Description of Issue",
    disputeEvidenceLabel: "Evidence URL / Document Link",
    submitDisputeBtn: "Submit for Admin Review",

    // Freshness & Comparisons
    updatedToday: "Updated today",
    updatedYesterday: "Updated yesterday",
    dataNotRecent: "Data not recent (> 48 hrs)",
    askingVsMandi: "Asking Price vs Verified Mandi Benchmark",
  },
  te: {
    appTitle: "MASSGS ఆగ్రో",
    appTagline: "నిర్ణయ మరియు ధృవీకరించబడిన సరఫరా వేదిక",
    farmerPortal: "రైతు పోర్టల్",
    buyerPortal: "కొనుగోలుదారు పోర్టల్",
    marketIntelligence: "మండి ధరలు",
    unifiedSearchPlaceholder: "పంట (వరి, మిరప), గ్రామం (గుంటూరు), మండి లేదా కొనుగోలుదారుని వెతకండి...",
    searchBtn: "శోధించండి",
    loginBtn: "OTP లాగిన్",
    logoutBtn: "లాగౌట్",
    permanentIdLabel: "శాశ్వత ఐడీ",
    zeroFakeData: "సున్నా నకిలీ సమాచార హామీ",
    zeroFakeDataBadge: "100% ధృవీకరించబడిన సమాచారం • సున్నా నకిలీ రికార్డులు",
    noDataAvailable: "ఎటువంటి ధృవీకరించబడిన సమాచారం అందుబాటులో లేదు.",
    notEnoughFeedback: "ఇంకా తగినంత ధృవీకరించబడిన సమీక్షలు లేవు.",
    visualEvidenceDisclaimer: "అప్‌లోడ్ చేసిన ఫోటో విక్రేత సమర్పించిన వాస్తవ నిదర్శనం మాత్రమే, నాణ్యతా ధృవీకరణ పత్రం కాదు.",

    // Nav & Dashboard actions
    checkTodaysPrice: "🌾 నేటి ధరను తనిఖీ చేయండి",
    sellMyCrop: "📦 నా పంటను అమ్మండి",
    findBuyers: "👥 కొనుగోలుదారులను కనుగొనండి",
    myOffers: "🤝 కొనుగోలుదారుల ఆఫర్లు",
    myTransactions: "📊 నా లావాదేవీలు",
    myFeedback: "⭐ నా సమీక్షలు",
    reportProblem: "🚨 సమస్యను నివేదించండి",

    findCrops: "🔎 పంటలను వెతకండి",
    searchVillages: "📍 గ్రామాలను శోధించండి",
    farmerListings: "📦 రైతుల పంట జాబితా",
    myDemands: "📢 నా కొనుగోలు అవసరాలు",
    myPurchases: "📊 నా కొనుగోళ్లు",
    postDemand: "కొనుగోలు అవసరాన్ని నమోదు చేయండి",

    // Farmer Listing Form
    listCropTitle: "విక్రయానికి మీ పంటను నమోదు చేయండి",
    cropNameLabel: "పంట పేరు (తెలుగు లేదా English)",
    quantityLabel: "పరిమాణం",
    unitLabel: "కొలత ప్రమాణం",
    expectedPriceLabel: "మీరు ఆశిస్తున్న ధర",
    priceUnitLabel: "ధర ప్రమాణం",
    stateLabel: "రాష్ట్రం",
    districtLabel: "జిల్లా",
    mandalLabel: "మండలం",
    villageLabel: "గ్రామం / ఊరు",
    readyDateLabel: "పంట అందుబాటులో ఉండే తేదీ",
    qualityGradeLabel: "నాణ్యత గ్రేడ్",
    descriptionLabel: "పంట వివరాలు / గమనికలు",
    uploadPhotoLabel: "వాస్తవ పంట ఫోటో (నిదర్శనం)",
    submitListingBtn: "పంట వివరాలను ప్రచురించండి",
    photoUploadHelper: "JPG, PNG, WebP గరిష్టంగా 5MB. అసలైన పంట ఫోటో మాత్రమే అప్‌లోడ్ చేయండి.",

    // Buyer Demand Form
    createDemandTitle: "కొనుగోలు అవసరాన్ని నమోదు చేయండి",
    targetPriceLabel: "కొనుగోలు ధర (₹/కిలో)",
    minQuantityLabel: "కనీస పరిమాణం (కిలోలు)",
    maxQuantityLabel: "గరిష్ట పరిమాణం (కిలోలు)",
    targetDistrictLabel: "కొనుగోలు చేయదలచిన జిల్లా",
    expiryDateLabel: "అవసరం ముగిసే తేదీ",
    qualitySpecsLabel: "నాణ్యతా ప్రమాణాలు",
    submitDemandBtn: "అవసరాన్ని పోస్ట్ చేయండి",

    // Offers & Agreements
    makeOfferBtn: "ఆఫర్ చేయండి",
    offeredPriceLabel: "మీ ఆఫర్ ధర (₹/కిలో)",
    offeredQuantityLabel: "పరిమాణం (కిలోలు)",
    deliveryTermsLabel: "రవాణా / డెలివరీ నిబంధనలు",
    acceptOfferBtn: "ఆఫర్‌ను అంగీకరించి ఒప్పందం చేయండి",
    rejectOfferBtn: "ఆఫర్‌ను తిరస్కరించండి",
    counterOfferBtn: "కౌంటర్ ఆఫర్ ఇవ్వండి",
    duplicateBuyerCropOfferBlocked: "ఒకే కొనుగోలుదారు నుండి ఒకే పంటకు బహుళ ఆఫర్లను ఆమోదించడం కుదరదు. ఈ కొనుగోలుదారు నుండి ఈ పంటకు ఇప్పటికే ఒక ఆఫర్ ఆమోదించబడింది.",
    duplicateBuyerCropBadge: "ఈ కొనుగోలుదారు నుండి ఈ పంటకు ఇప్పటికే ఒక ఆఫర్ ఆమోదించబడింది",
    duplicateBuyerCropTooltip: "ఒకే కొనుగోలుదారు నుండి ఒకే పంటకు 1 ఆఫర్ మాత్రమే ఆమోదించగలరు. కౌంటర్ లేదా తిరస్కరణ అందుబాటులో ఉంది.",
    agreementTitle: "MASSGS ద్వైపాక్షిక డిజిటల్ ఒప్పందం",
    agreementAcceptBtn: "డిజిటల్ ఒప్పందాన్ని అంగీకరించండి",
    agreementSignedBadge: "పూర్తిగా సంతకం చేయబడింది",
    pendingSignaturesBadge: "సంతకాల కోసం వేచి ఉంది",

    // Statuses
    statusAvailable: "అందుబాటులో ఉంది",
    statusNegotiating: "చర్చలలో ఉంది",
    statusAgreed: "ఒప్పందం కుదిరింది",
    statusInProgress: "పురోగతిలో ఉంది (రవాణా)",
    statusCompleted: "పూర్తయింది",
    statusCancelled: "రద్దు చేయబడింది",
    statusDisputed: "సమస్యలో ఉంది",

    // Trust & Verification
    mobileVerifiedBadge: "✓ మొబైల్ ధృవీకరించబడింది",
    profileCompleteBadge: "✓ శాశ్వత ఐడీ ధృవీకరించబడింది",
    verifiedTransactionsBadge: "✓ ధృవీకరించబడిన లావాదేవీలు",
    averageRatingBadge: "⭐ సగటు రేటింగ్",
    sellerTrustHeader: "విక్రేత విశ్వసనీయత వివరాలు",
    buyerTrustHeader: "కొనుగోలుదారు విశ్వసనీయత వివరాలు",

    // Feedback
    rateTransactionTitle: "లావాదేవీని రేట్ చేయండి & సమీక్షించండి",
    ratingLabel: "స్టార్ రేటింగ్ (1 నుండి 5)",
    reviewCommentsLabel: "సమీక్ష వ్యాఖ్యలు",
    reviewTagsLabel: "ట్యాగ్‌లు (ఉదా: సమయానికి చెల్లింపు, సరైన నాణ్యత)",
    submitFeedbackBtn: "సమీక్షను సమర్పించండి",

    // Dispute
    disputeTitle: "సమస్యను నివేదించండి / ఫిర్యాదు",
    disputeCategoryLabel: "సమస్య వర్గం",
    disputeDescLabel: "సమస్య పూర్తి వివరాలు",
    disputeEvidenceLabel: "ఆధారాల లింక్ / పత్రం",
    submitDisputeBtn: "అడ్మిన్ సమీక్షకు పంపండి",

    // Freshness & Comparisons
    updatedToday: "ఈరోజే తాజాకరించబడింది",
    updatedYesterday: "నిన్న తాజాకరించబడింది",
    dataNotRecent: "సమాచారం ఆలస్యమైంది (> 48 గంటలు)",
    askingVsMandi: "రైతు ఆశించిన ధర vs ధృవీకరించబడిన మండి ధర",
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('massgs_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('massgs_lang', language);
  }, [language]);

  const t = (key, params = {}) => {
    let text = translations[language]?.[key] || translations['en']?.[key] || key;
    Object.keys(params).forEach(paramKey => {
      text = text.replace(`{${paramKey}}`, params[paramKey]);
    });
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
