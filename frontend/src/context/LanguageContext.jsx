import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    appTitle: "MASSGS",
    decisionEngine: "Decision Engine",
    liveDataBadge: "AGMARKNET Live Data",
    todaysMandiRates: "Today's Mandi Rates",
    myCrop: "My Crop",
    sellMyCrop: "Sell My Crop",
    bestSellingOption: "Best Selling Option",
    priceComparison: "Price Comparison",
    moreTools: "More Tools",
    whatIfSimulator: "What-If Simulator",
    fpoAggregation: "FPO Aggregation",
    dataTransparency: "Data Transparency",
    adminHealth: "Admin Health",
    selectLanguage: "Language / భాష",
    backToHome: "Back to Home",
    
    // Landing/Home Page
    heroTitle: "Know Where. Know When. Know Why.",
    heroSubtitle: "Turn verified market information and your crop details into a clearer selling decision.",
    exploreMandisBtn: "Explore Verified Mandis",
    zeroFakeData: "Zero Fake Data • AGMARKNET Verified Engine",
    absoluteDataRule: "Our Absolute Data Rule",
    absoluteDataRuleDesc: "We do not invent market prices, fabricate buyers, or produce random AI predictions. If verified data is unavailable for your crop or route, we state it honestly instead of presenting guess-work.",
    viewDataSources: "View Data Sources",
    todaysMandiRatesHeader: "Today's Mandi Rates (Andhra Pradesh)",
    selectDistrict: "Select District",
    selectMandi: "Select Mandi APMC",
    allDistricts: "All Districts",
    allMandis: "All Mandis",
    cropName: "Crop Name",
    minPrice: "Min Price",
    maxPrice: "Max Price",
    modalPrice: "Today's Price (Modal)",
    lastUpdated: "Last Ingested",
    sourceStatus: "Status",
    verifiedBadge: "VERIFIED",
    staleBadge: "DATA DELAYED",
    liveBadge: "LIVE / UPDATED",
    unavailableBadge: "DATA UNAVAILABLE",
    sellMyCropBtn: "Sell My Crop Now ➔",
    dataUnavailableMsg: "Data unavailable",
    lastUpdatedTime: "Last update timestamp",

    // Farmer Flow
    stepHeader: "Step {step} of 6",
    whatCrop: "1. What crop do you have?",
    howMuch: "2. How much do you have?",
    whereCrop: "3. Where is your crop?",
    nearbyRates: "4. See nearby/current mandi rates",
    compareOptions: "5. Compare your options",
    bestOption: "6. Show the clearest selling recommendation",
    
    cropLabel: "Your Crop",
    quantityLabel: "Your Quantity",
    locationLabel: "Your Location",
    todaysPriceLabel: "Today's Price",
    bestOptionLabel: "Best Option",
    whyThisOption: "Why this option?",

    // Instructions
    whatToDoNow: "What to do now",
    whatInfoNeeded: "What information is needed",
    whatHappensNext: "What happens next",
    
    detailsBtn: "View details",
    hideDetailsBtn: "Hide details",

    // Ingestion & API Info
    latestMandiRates: "Latest Ingested Mandi Rates",
    selectDistrictMandi: "Select AP District and Mandi above to filter live rates.",
    noMandiData: "No verified mandi data available for the selected region.",
  },
  te: {
    appTitle: "MASSGS",
    decisionEngine: "నిర్ణయ యంత్రం",
    liveDataBadge: "AGMARKNET ప్రత్యక్ష సమాచారం",
    todaysMandiRates: "నేటి మండి ధరలు",
    myCrop: "నా పంట",
    sellMyCrop: "నా పంటను అమ్ముకోండి",
    bestSellingOption: "ఉత్తమ విక్రయ ఎంపిక",
    priceComparison: "ధరల పోలిక",
    moreTools: "ఇతర సాధనాలు",
    whatIfSimulator: "వాట్-ఇఫ్ సిమ్యులేటర్",
    fpoAggregation: "FPO సమూహం",
    dataTransparency: "సమాచార పారదర్శకత",
    adminHealth: "అడ్మిన్ ఆరోగ్యం",
    selectLanguage: "భాష / Language",
    backToHome: "తిరిగి హోమ్‌కి వెళ్ళండి",
    
    // Landing/Home Page
    heroTitle: "ఎక్కడ అమ్మాలో తెలుసుకోండి. ఎప్పుడు అమ్మాలో తెలుసుకోండి. ఎందుకు అమ్మాలో తెలుసుకోండి.",
    heroSubtitle: "నిజమైన మార్కెట్ సమాచారాన్ని, మీ పంట వివరాలను జోడించి స్పష్టమైన విక్రయ నిర్ణయాన్ని తీసుకోండి.",
    exploreMandisBtn: "ధృవీకరించబడిన మండిలను అన్వేషించండి",
    zeroFakeData: "సున్నా నకిలీ సమాచారం • AGMARKNET ధృవీకరించబడిన యంత్రం",
    absoluteDataRule: "మా ఖచ్చితమైన సమాచార నియమం",
    absoluteDataRuleDesc: "మేము నకిలీ మార్కెట్ ధరలను లేదా కొనుగోలుదారులను సృష్టించము. ఒకవేళ మీ పంట లేదా మార్గానికి సంబంధించిన సమాచారం అందుబాటులో లేకపోతే, అంచనాలతో చూపించకుండా నిజాయితీగా సమాచారం లేదని తెలియజేస్తాము.",
    viewDataSources: "సమాచార వనరులను చూడండి",
    todaysMandiRatesHeader: "నేటి మండి ధరలు (ఆంధ్రప్రదేశ్)",
    selectDistrict: "జిల్లాను ఎంచుకోండి",
    selectMandi: "మండిని ఎంచుకోండి",
    allDistricts: "అన్ని జిల్లాలు",
    allMandis: "అన్ని మండిలు",
    cropName: "పంట పేరు",
    minPrice: "కనీస ధర",
    maxPrice: "గరిష్ట ధర",
    modalPrice: "నేటి ధర (సగటు)",
    lastUpdated: "చివరి సారి పొందిన సమాచారం",
    sourceStatus: "స్థితి",
    verifiedBadge: "ధృవీకరించబడింది",
    staleBadge: "ధర ఆలస్యమైంది",
    liveBadge: "సజీవ సమాచారం",
    unavailableBadge: "సమాచారం అందుబాటులో లేదు",
    sellMyCropBtn: "నా పంటను ఇప్పుడే అమ్ముతాను ➔",
    dataUnavailableMsg: "సమాచారం అందుబాటులో లేదు",
    lastUpdatedTime: "చివరి సమాచార సమయం",

    // Farmer Flow
    stepHeader: "దశ {step}/6",
    whatCrop: "1. మీ పంట ఏమిటి?",
    howMuch: "2. మీ పంట పరిమాణం ఎంత?",
    whereCrop: "3. మీ పంట ఎక్కడ ఉంది?",
    nearbyRates: "4. సమీప మండి ధరలను చూడండి",
    compareOptions: "5. మీ ఎంపికలను పోల్చి చూడండి",
    bestOption: "6. ఉత్తమ విక్రయ ఎంపికను తెలుసుకోండి",
    
    cropLabel: "మీ పంట",
    quantityLabel: "మీ పంట పరిమాణం",
    locationLabel: "మీ పంట స్థలం",
    todaysPriceLabel: "నేటి ధర",
    bestOptionLabel: "ఉత్తమ ఎంపిక",
    whyThisOption: "ఈ ఎంపికను ఎందుకు ఎంచుకోవాలి?",

    // Instructions
    whatToDoNow: "ఇప్పుడు మీరు చేయాల్సిందేమిటి",
    whatInfoNeeded: "ఏ సమాచారం అవసరం",
    whatHappensNext: "తర్వాత ఏం జరుగుతుంది",
    
    detailsBtn: "పూర్తి వివరాలు చూడండి",
    hideDetailsBtn: "వివరాలను దాచండి",

    // Ingestion & API Info
    latestMandiRates: "తాజా మండి ధరలు",
    selectDistrictMandi: "తాజా ధరలను ఫిల్టర్ చేయడానికి పైన ఉన్న జిల్లా మరియు మండిని ఎంచుకోండి.",
    noMandiData: "ఎంచుకున్న ప్రాంతంలో ఎటువంటి ధృవీకరించబడిన మండి సమాచారం అందుబాటులో లేదు.",
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
