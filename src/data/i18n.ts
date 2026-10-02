import { Language } from '../types';

export interface Translations {
  appName: string;
  tagline: string;
  roles: {
    farmer: string;
    buyer: string;
    logistics: string;
    admin: string;
    collector: string;
    recycler: string;
  };
  nav: {
    dashboard: string;
    listings: string;
    orders: string;
    schemes: string;
    finance: string;
    insights: string;
    safetyReport: string;
    demoGuide: string;
    lots: string;
    pools: string;
  };
  farmer: {
    welcome: string;
    tapToSpeak: string;
    listening: string;
    speakPrompt: string;
    createListing: string;
    cropName: string;
    quantity: string;
    expectedPrice: string;
    aiPriceBand: string;
    aiQualityScan: string;
    publishAnon: string;
    anonShieldNotice: string;
    myListings: string;
    activeOrders: string;
    eligibleAdvance: string;
    cashoutAeps: string;
    reportConcern: string;
  };
  collector: {
    welcome: string;
    tapToSpeak: string;
    listening: string;
    speakPrompt: string;
    createLot: string;
    materialType: string;
    materialCategory: string;
    estimatedWeight: string;
    expectedPrice: string;
    aiPriceBand: string;
    aiQualityScan: string;
    publishAnon: string;
    anonShieldNotice: string;
    myLots: string;
    activeLots: string;
    poolLot: string;
    cashoutAeps: string;
    reportConcern: string;
  };
  buyer: {
    marketplace: string;
    recommendedForYou: string;
    allListings: string;
    filterByCrop: string;
    qualityGrade: string;
    reputation: string;
    placeOrder: string;
    anonymizedSeller: string;
    identityLockNotice: string;
  };
  logistics: {
    pooledPickups: string;
    clusterTitle: string;
    routeSequence: string;
    assignVehicle: string;
    startTrip: string;
    markDelivered: string;
    fuelSaved: string;
  };
  finance: {
    creditScoreTitle: string;
    advanceAvailable: string;
    requestCashout: string;
    bcAgentSimulator: string;
    enterAadhaar: string;
    biometricConfirm: string;
    receiptRef: string;
  };
  safety: {
    title: string;
    subheading: string;
    guarantee: string;
    categoryLabel: string;
    descLabel: string;
    submitAnon: string;
  };
  common: {
    kg: string;
    quintal: string;
    rupees: string;
    viewDetails: string;
    close: string;
    confirm: string;
    cancel: string;
    status: string;
    grade: string;
    confidence: string;
    liveMandiTrend: string;
  };
}

export const I18N_STRINGS: Record<Language, Translations> = {
  en: {
    appName: 'Vasundhara',
    tagline: 'Direct Farmer-to-Buyer Digital Marketplace',
    roles: {
      farmer: 'Farmer Portal',
      buyer: 'Buyer / Processor',
      logistics: 'Logistics Network',
      admin: 'Admin & Safety',
      collector: 'Kabadiwala / Collector Portal',
      recycler: 'Authorized Recycler Portal',
    },
    nav: {
      dashboard: 'Dashboard',
      listings: 'My Listings',
      orders: 'Orders & Settlement',
      schemes: 'Govt Schemes',
      finance: 'Finance & AEPS',
      insights: 'Mandi Insights',
      safetyReport: 'Report Concern',
      demoGuide: 'Judge Demo Flow',
      lots: 'My Scrap Lots',
      pools: 'Smart Pools',
    },
    farmer: {
      welcome: 'Welcome, Farmer Partner',
      tapToSpeak: 'Tap Mic & Speak in Your Language',
      listening: 'Listening to your harvest details...',
      speakPrompt: 'e.g., "2 quintal tomato, expecting 18 rupees per kg"',
      createListing: 'Create New Produce Listing',
      cropName: 'Crop & Variety',
      quantity: 'Quantity (kg / quintal)',
      expectedPrice: 'Expected Price (₹/kg)',
      aiPriceBand: 'AI Market Price Band (Agmarknet Mandi Model)',
      aiQualityScan: 'AI Produce Quality Scan (CNN Classifier)',
      publishAnon: 'Publish Anonymously to Marketplace',
      anonShieldNotice: 'Your name, village, and phone remain 100% confidential until you confirm a matching buyer order.',
      myListings: 'My Harvest Listings',
      activeOrders: 'Active Transactions',
      eligibleAdvance: 'AI Pre-Harvest Cash Advance',
      cashoutAeps: 'Simulate AEPS Biometric Cash-Out',
      reportConcern: 'Report Exploitation / Harassment (Safe & Anonymous)',
    },
    collector: {
      welcome: 'Welcome, Kabadiwala Partner',
      tapToSpeak: 'Tap Mic & Speak in Your Language',
      listening: 'Listening to your scrap lot details...',
      speakPrompt: 'e.g., "500 kg copper wire, expecting 450 rupees per kg"',
      createLot: 'Create New Scrap Lot',
      materialType: 'Material Type & Category',
      materialCategory: 'Category (Metal / Plastic / E-waste / Paper)',
      estimatedWeight: 'Estimated Weight (kg)',
      expectedPrice: 'Expected Price (₹/kg)',
      aiPriceBand: 'AI Market Price Band (Recycler Rates)',
      aiQualityScan: 'AI Material Quality Scan (CNN Classifier)',
      publishAnon: 'Publish Anonymously to Marketplace',
      anonShieldNotice: 'Your name, area, and phone remain 100% confidential until a recycler confirms the lot.',
      myLots: 'My Scrap Lots',
      activeLots: 'Active Lots',
      poolLot: 'Join Verified Smart Lot Pool',
      cashoutAeps: 'Simulate AEPS Biometric Cash-Out',
      reportConcern: 'Report Exploitation / Harassment (Safe & Anonymous)',
    },
    buyer: {
      marketplace: 'Direct Farm Marketplace',
      recommendedForYou: 'AI-Recommended For Your Demand',
      allListings: 'All Active Farmgate Batches',
      filterByCrop: 'Filter by Crop',
      qualityGrade: 'Quality Grade',
      reputation: 'Seller Trust Score',
      placeOrder: 'Place Procurement Order',
      anonymizedSeller: 'Verified Anonymous Seller',
      identityLockNotice: 'Seller identity and contact details will be automatically revealed immediately upon order confirmation.',
    },
    logistics: {
      pooledPickups: 'Pooled Farmgate Pickups',
      clusterTitle: 'Nearby Order Cluster & Route Solver',
      routeSequence: 'Optimized Multi-Stop Route',
      assignVehicle: 'Assign Vehicle & Driver',
      startTrip: 'Mark In-Transit',
      markDelivered: 'Confirm Dropoff Delivery',
      fuelSaved: 'Fuel & Cost Efficiency Saved',
    },
    finance: {
      creditScoreTitle: 'AI Harvest Risk Assessment',
      advanceAvailable: 'Available Working Capital Advance',
      requestCashout: 'Request Instant Cash-out',
      bcAgentSimulator: 'Simulated AEPS Banking Correspondent Counter',
      enterAadhaar: 'Farmer Aadhaar (Last 4 Digits)',
      biometricConfirm: 'Press Fingerprint to Authenticate (NPCI Mock)',
      receiptRef: 'NPCI Transaction Reference',
    },
    safety: {
      title: 'Report a Concern & Cartel Whistleblower',
      subheading: 'Women-centric, exploitation-free protection for vulnerable farming communities.',
      guarantee: 'Zero Personal Data Logged. Your phone number, IP address, and identity are never shared with intermediaries or local mandis.',
      categoryLabel: 'Issue Category',
      descLabel: 'Describe the middleman / pricing issue',
      submitAnon: 'Submit 100% Anonymously',
    },
    common: {
      kg: 'kg',
      quintal: 'Quintal',
      rupees: '₹',
      viewDetails: 'View Details',
      close: 'Close',
      confirm: 'Confirm',
      cancel: 'Cancel',
      status: 'Status',
      grade: 'Grade',
      confidence: 'Confidence',
      liveMandiTrend: 'Live Mandi Benchmark',
    },
  },
  hi: {
    appName: 'वसुंधरा',
    tagline: 'सीधा किसान-से-खरीदार डिजिटल महामंडी',
    roles: {
      farmer: 'किसान सेवा केंद्र',
      buyer: 'खरीदार / व्यापारी',
      logistics: 'वाहन व परिवहन',
      admin: 'प्रशासन व सुरक्षा',
      collector: 'कबाड़ीवाला / कलेक्टर पोर्टल',
      recycler: 'अधिकृत रीसाइक्लर पोर्टल',
    },
    nav: {
      dashboard: 'डैशबोर्ड',
      listings: 'मेरी फसलें',
      orders: 'ऑर्डर व भुगतान',
      schemes: 'सरकारी योजनाएं',
      finance: 'वित्त व AEPS निकासी',
      insights: 'मंडी भाव व रुझान',
      safetyReport: 'शिकायत दर्ज करें',
      demoGuide: 'डेमो गाइड',
      lots: 'मेरे स्क्रैप लॉट',
      pools: 'स्मार्ट पूल',
    },
    farmer: {
      welcome: 'नमस्ते किसान भाई-बहन',
      tapToSpeak: 'माइक दबाएं और अपनी भाषा में बोलें',
      listening: 'आपकी फसल की जानकारी सुनी जा रही है...',
      speakPrompt: 'उदा. "दो क्विंटल टमाटर, अठारह रुपये किलो"',
      createListing: 'फसल बेचने के लिए दर्ज करें',
      cropName: 'फसल और किस्म',
      quantity: 'मात्रा (किलो / क्विंटल)',
      expectedPrice: 'अपेक्षित मूल्य (₹/किलो)',
      aiPriceBand: 'एआई मंडी भाव बैंड (अगमार्कनेट डाटा)',
      aiQualityScan: 'एआई फसल गुणवत्ता जांच (ग्रेडिंग)',
      publishAnon: 'गुमनाम रूप से मंडी में पोस्ट करें',
      anonShieldNotice: 'खरीदार द्वारा ऑर्डर पक्का होने तक आपका नाम और फोन नंबर पूरी तरह सुरक्षित व गुप्त रहता है।',
      myListings: 'मेरी दर्ज फसलें',
      activeOrders: 'सक्रिय सौदे',
      eligibleAdvance: 'एआई अग्रिम राशि पात्रता',
      cashoutAeps: 'AEPS बायोमेट्रिक नकद निकासी',
      reportConcern: 'बिचौलियों की मनमानी / शोषण की शिकायत',
    },
    collector: {
      welcome: 'नमस्ते कबाड़ीवाला साथी',
      tapToSpeak: 'माइक दबाएं और अपनी भाषा में बोलें',
      listening: 'आपके स्क्रैप लॉट की जानकारी सुनी जा रही है...',
      speakPrompt: 'उदा. "५०० किलो तांबे का तार, ४५० रुपये किलो"',
      createLot: 'नया स्क्रैप लॉट बनाएं',
      materialType: 'सामग्री प्रकार और श्रेणी',
      materialCategory: 'श्रेणी (धातु / प्लास्टिक / ई-कचरा / कागज)',
      estimatedWeight: 'अनुमानित वजन (किलो)',
      expectedPrice: 'अपेक्षित मूल्य (₹/किलो)',
      aiPriceBand: 'एआई बाजार भाव बैंड (रीसाइक्लर दरें)',
      aiQualityScan: 'एआई सामग्री गुणवत्ता जांच (CNN क्लासिफायर)',
      publishAnon: 'गुमनाम रूप से बाजार में पोस्ट करें',
      anonShieldNotice: 'रीसाइक्लर द्वारा लॉट पक्का करने तक आपका नाम, इलाका और फोन नंबर पूरी तरह सुरक्षित रहता है।',
      myLots: 'मेरे स्क्रैप लॉट',
      activeLots: 'सक्रिय लॉट',
      poolLot: 'सत्यापित स्मार्ट लॉट पूल में शामिल हों',
      cashoutAeps: 'AEPS बायोमेट्रिक नकद निकासी',
      reportConcern: 'शोषण / उत्पीड़न की शिकायत (सुरक्षित और गुमनाम)',
    },
    buyer: {
      marketplace: 'सीधी किसान मंडी',
      recommendedForYou: 'आपके लिए अनुशंसित फसलें (एआई मैच)',
      allListings: 'उपलब्ध सभी लॉट',
      filterByCrop: 'फसल चुनें',
      qualityGrade: 'गुणवत्ता ग्रेड',
      reputation: 'विश्वसनीयता स्कोर',
      placeOrder: 'ऑर्डर बुक करें',
      anonymizedSeller: 'सत्यापित गुप्त किसान',
      identityLockNotice: 'ऑर्डर कन्फर्म होते ही किसान का नाम, फोन और पता तत्काल दोनों पक्षों को प्रदर्शित कर दिया जाएगा।',
    },
    logistics: {
      pooledPickups: 'संयुक्त पूलिंग वाहन',
      clusterTitle: 'समीपवर्ती ऑर्डर क्लस्टर व रूट',
      routeSequence: 'अनुकूलित रूट व स्टॉप',
      assignVehicle: 'वाहन व चालक सौंपें',
      startTrip: 'मार्ग पर रवाना करें',
      markDelivered: 'डिलीवरी पूर्ण दर्ज करें',
      fuelSaved: 'ईंधन और बचत प्रतिशत',
    },
    finance: {
      creditScoreTitle: 'एआई कृषि साख मूल्यांकन',
      advanceAvailable: 'उपलब्ध अग्रिम पूंजी',
      requestCashout: 'निकासी का अनुरोध करें',
      bcAgentSimulator: 'बैंक मित्र (AEPS) काउंटर सिम्युलेटर',
      enterAadhaar: 'आधार कार्ड के अंतिम 4 अंक',
      biometricConfirm: 'अंगूठे का निशान लगाएं (NPCI)',
      receiptRef: 'लेनदेन संदर्भ संख्या',
    },
    safety: {
      title: 'सुरक्षा, शोषण व मूल्य कार्टेल शिकायत',
      subheading: 'महिला व छोटे किसानों के लिए सुरक्षित, भयमुक्त व गोपनीय सुरक्षा कवच।',
      guarantee: 'पूरी तरह गोपनीय। आपका नाम या फोन नंबर किसी दलाल या स्थानीय मंडी को नहीं दिखाया जाता।',
      categoryLabel: 'शिकायत का प्रकार',
      descLabel: 'समस्या का संक्षिप्त विवरण दें',
      submitAnon: '100% गुप्त रूप से भेजें',
    },
    common: {
      kg: 'किलो',
      quintal: 'क्विंटल',
      rupees: '₹',
      viewDetails: 'विवरण देखें',
      close: 'बंद करें',
      confirm: 'पुष्टि करें',
      cancel: 'रद्द करें',
      status: 'स्थिति',
      grade: 'ग्रेड',
      confidence: 'सटीकता',
      liveMandiTrend: 'लाइव मंडी भाव',
    },
  },
  mr: {
    appName: 'वसुंधरा',
    tagline: 'थेट शेतकरी-ते-खरेदीदार डिजिटल बाजारपेठ',
    roles: {
      farmer: 'शेतकरी कक्ष',
      buyer: 'खरेदीदार / व्यापारी',
      logistics: 'वाहतूक व लॉजिस्टिक',
      admin: 'प्रशासन व सुरक्षा',
      collector: 'कबाडीवाला / कलेक्टर पोर्टल',
      recycler: 'अधिकृत रीसायकलर पोर्टल',
    },
    nav: {
      dashboard: 'डॅशबोर्ड',
      listings: 'माझी पिके',
      orders: 'ऑर्डर्स व व्यवहार',
      schemes: 'शासकीय योजना',
      finance: 'अर्थसहाय्य व AEPS',
      insights: 'बाजारभाव अंदाज',
      safetyReport: 'तक्रार नोंदवा',
      demoGuide: 'डेमो मार्गदर्शन',
      lots: 'माझे स्क्रॅप लॉट',
      pools: 'स्मार्ट पूल',
    },
    farmer: {
      welcome: 'स्वागत आहे शेतकरी मित्र',
      tapToSpeak: 'माइक दाबा आणि मराठीत बोला',
      listening: 'पिकाचा तपशील ऐकत आहे...',
      speakPrompt: 'उदा. "दोन क्विंटल टोमॅटो, वीस रुपये किलो"',
      createListing: 'पिकाची नोंदणी करा',
      cropName: 'पीक व जात',
      quantity: 'प्रमाण (किलो / क्विंटल)',
      expectedPrice: 'अपेक्षित दर (₹/किलो)',
      aiPriceBand: 'एआय बाजारभाव श्रेणी (अगमार्कनेट)',
      aiQualityScan: 'एआय दर्जा तपासणी (CNN ग्रेडिंग)',
      publishAnon: 'गुप्त ओळखीसह बाजारात विका',
      anonShieldNotice: 'सौदा पक्का होईपर्यंत तुमचे नाव व मोबाईल क्रमांक पूर्णतः सुरक्षित आणि गुप्त राहील.',
      myListings: 'नोंदणीकृत पिके',
      activeOrders: 'सुरू असलेले सौदे',
      eligibleAdvance: 'पूर्व-हंगामी अग्रिम रक्कम',
      cashoutAeps: 'AEPS द्वारे रोख रक्कम काढा',
      reportConcern: 'दलालांच्या पिळवणुकीविरोधात तक्रार',
    },
    collector: {
      welcome: 'स्वागत आहे कबाडीवाला मित्र',
      tapToSpeak: 'माइक दाबा आणि मराठीत बोला',
      listening: 'तुमच्या स्क्रॅप लॉटाचा तपशील ऐकत आहे...',
      speakPrompt: 'उदा. "५०० किलो तांबाचा तार, ४५० रुपये किलो"',
      createLot: 'नवीन स्क्रॅप लॉट तयार करा',
      materialType: 'साहित्य प्रकार व श्रेणी',
      materialCategory: 'श्रेणी (धातू / प्लास्टिक / ई-वेस्ट / कागद)',
      estimatedWeight: 'अंदाजे वजन (किलो)',
      expectedPrice: 'अपेक्षित दर (₹/किलो)',
      aiPriceBand: 'एआय बाजारभाव श्रेणी (रीसायकलर दर)',
      aiQualityScan: 'एआय साहित्य गुणवत्ता तपासणी (CNN क्लासिफायर)',
      publishAnon: 'गुप्त ओळखीसह बाजारात प्रसिद्ध करा',
      anonShieldNotice: 'रीसायकलर लॉट पक्का करताचपर्यंत तुमचे नाव, परिसर आणि फोन नंबर पूर्णतः सुरक्षित राहील.',
      myLots: 'माझे स्क्रॅप लॉट',
      activeLots: 'सक्रिय लॉट',
      poolLot: 'सत्यापित स्मार्ट लॉट पूलमध्ये सामील व्हा',
      cashoutAeps: 'AEPS द्वारे रोख रक्कम काढा',
      reportConcern: 'पिळवणूक / गैरव्यवहार विरोधात तक्रार (सुरक्षित आणि गुप्त)',
    },
    buyer: {
      marketplace: 'थेट शेतकरी बाजार',
      recommendedForYou: 'तुमच्या मागणीनुसार पिके',
      allListings: 'सर्व उपलब्ध लॉट',
      filterByCrop: 'पीक निवडा',
      qualityGrade: 'दर्जा ग्रेड',
      reputation: 'शेतकरी विश्वासार्हता',
      placeOrder: 'ऑर्डर निश्चित करा',
      anonymizedSeller: 'सत्यापित गुप्त शेतकरी',
      identityLockNotice: 'ऑर्डर कन्फर्म होताच शेतकऱ्याचा पत्ता व फोन नंबर दोन्ही बाजूंस लगेच उघड होईल.',
    },
    logistics: {
      pooledPickups: 'एकत्रित माल वाहतूक (पूल)',
      clusterTitle: 'जवळपासचे ऑर्डर्स व मार्ग नियोजन',
      routeSequence: 'अनुकूलित थांबे व मार्ग',
      assignVehicle: 'वाहन व चालक जोडा',
      startTrip: 'प्रवास सुरू करा',
      markDelivered: 'पोहोच पावती नोंदवा',
      fuelSaved: 'इंधन व खर्च बचत',
    },
    finance: {
      creditScoreTitle: 'एआय पत व जोखीम मूल्यांकन',
      advanceAvailable: 'मंजूर तत्काळ रक्कम',
      requestCashout: 'रक्कम खात्यातून काढा',
      bcAgentSimulator: 'बँक मित्र AEPS काउंटर',
      enterAadhaar: 'आधार कार्डचे शेवटचे ४ अंक',
      biometricConfirm: 'अंगठा लावून पुष्टी करा (NPCI)',
      receiptRef: 'व्यवहार संदर्भ क्र.',
    },
    safety: {
      title: 'पिळवणूक व गैरव्यवहार निवारण',
      subheading: 'महिला व लहान शेतकऱ्यांसाठी सुरक्षित आणि गोपनीय तक्रार निवारण.',
      guarantee: 'तुमची ओळख कोणालाही कळू दिली जाणार नाही.',
      categoryLabel: 'तक्रारीचा प्रकार',
      descLabel: 'तक्रारीचा तपशील',
      submitAnon: '१००% गुप्तपणे पाठवा',
    },
    common: {
      kg: 'किलो',
      quintal: 'क्विंटल',
      rupees: '₹',
      viewDetails: 'तपशील पहा',
      close: 'बंद करा',
      confirm: 'निश्चित करा',
      cancel: 'रद्द करा',
      status: 'स्थिती',
      grade: 'दर्जा',
      confidence: 'अचूकता',
      liveMandiTrend: 'थेट बाजारभाव',
    },
  },
  te: {
    appName: 'వసుంధర',
    tagline: 'రైతు నుండి నేరుగా కొనుగోలుదారుకు డిజిటల్ మార్కెట్',
    roles: {
      farmer: 'రైతు విభాగం',
      buyer: 'కొనుగోలుదారు',
      logistics: 'ట్రాన్స్పోర్ట్ సేవలు',
      admin: 'పరిపాలన & భద్రత',
      collector: 'కవడివాల / కలెక్టర్ పోర్టల్',
      recycler: 'అధికారవంతు రీసైక్లర్ పోర్టల్',
    },
    nav: {
      dashboard: 'డ్యాష్‌బోర్డ్',
      listings: 'నా పంటలు',
      orders: 'ఆర్డర్లు',
      schemes: 'ప్రభుత్వ^.marques',
      finance: 'ఆర్థికం & AEPS',
      insights: 'మార్కెట్ ధరలు',
      safetyReport: 'సమస్యను నివేదించండి',
      demoGuide: 'డెమో గైడ్',
      lots: 'నా స్క్రాప్ లాట్లు',
      pools: 'స్మార్ట్ పూల్స్',
    },
    farmer: {
      welcome: 'రైతు సోదరులకు స్వాగతం',
      tapToSpeak: 'మైక్ నొక్కి మీ భాషలో మాట్లాడండి',
      listening: 'పంట వివరాలను వింటున్నారు...',
      speakPrompt: 'ఉదా. "రెండు క్వింటాళ్ల టమోటా, కిలో పద్దెనిమిది రూపాయలు"',
      createListing: 'కొత్త పంట నమోదు చేయండి',
      cropName: 'పంట & రకం',
      quantity: 'పరిమాణం (కిలోలు / క్వింటాళ్లు)',
      expectedPrice: 'ఆశించిన ధర (₹/కిలో)',
      aiPriceBand: 'AI మార్కెట్ ధర శ్రేణి',
      aiQualityScan: 'AI నాణ్యత పరీక్ష (CNN గ్రేడింగ్)',
      publishAnon: 'గోప్యంగా మార్కెట్‌లో ప్రచురించండి',
      anonShieldNotice: 'ఆర్డర్ ధృవీకరించబడే వరకు మీ పేరు మరియు ఫోన్ నంబర్ పూర్తిగా సురక్షితంగా ఉంటాయి.',
      myListings: 'నా పంట జాబితా',
      activeOrders: 'సక్రియ ఆర్డర్లు',
      eligibleAdvance: 'తక్షణ రుణ సదుపాయం',
      cashoutAeps: 'AEPS ద్వారా నగదు విత్‌డ్రా',
      reportConcern: 'దళారుల దోపిడీపై ఫిర్యాదు',
    },
    buyer: {
      marketplace: 'రైతు మార్కెట్',
      recommendedForYou: 'మీ కోసం AI సిఫార్సులు',
      allListings: 'అందుబాటులో ఉన్న పంటలు',
      filterByCrop: 'పంట ఫిల్టర్',
      qualityGrade: 'నాణ్యత గ్రేడ్',
      reputation: 'విశ్వసనీయత స్కోర్',
      placeOrder: 'ఆర్డర్ చేయండి',
      anonymizedSeller: 'ధృవీకరించబడిన రైతు',
      identityLockNotice: 'ఆర్డర్ నిర్ధారించబడిన వెంటనే రైతు పూర్తి వివరాలు కనిపిస్తాయి.',
    },
    collector: {
      welcome: 'స్వాగతం, కవడివాల భాగస్వామి',
      tapToSpeak: 'మైక్ నొక్కి మీ భాషలో మాట్లాడండి',
      listening: 'మీ స్క్రాప్ లాట్ వివరాలు వినబడతున్నాయి...',
      speakPrompt: 'ఉదా. "500 కికల్ కోప్పర్ వయిర్, 450 రూపాయలు Privatize"',
      createLot: 'కొత్త స్క్రాప్ లాట్ సృష్టించండి',
      materialType: 'మెటీరియల్ రకం & వర్గం',
      materialCategory: 'వర్గం (లోహము / ప్లాస్టిక్ / ఈ-వేస్ట్ / కాగితం)',
      estimatedWeight: 'అంచనా బర (కిలో)',
      expectedPrice: 'ఆశించిన ధర (₹/కిలో)',
      aiPriceBand: 'AI मार्केट ధర శ్రేణి (రీసైక్లర్ రేట్స్)',
      aiQualityScan: 'AI మెటీరియల్ నాణ్యత స్కాన్ (CNN క్లాసిఫైర్)',
      publishAnon: 'గోప్యంగా మార్కెట్‌లో ప్రచురించండి',
      anonShieldNotice: 'రీసైక్లర్ లాట్ నిర్ధారిస్తే వరకు మీ పేరు, వెల్లడిక, మరియు فون నంబర్ పూర్తిగా సురక్షితంగా ఉంటాయి.',
      myLots: 'నా స్క్రాప్ లాట్లు',
      activeLots: 'సక్రియ లాట్లు',
      poolLot: 'వెరిఫైడ్ स्मార్ట్ లాట్ పుల్‌లో చేరుకోండి',
      cashoutAeps: 'AEPS బయోమెట్రిక్ నగదు వనిడ్రా',
      reportConcern: 'దోపిడీ / హరాస్మెంట్ రిపోర్టు (సురక్షితం & గోప్యం)',
    },
    logistics: {
      pooledPickups: 'సమిష్టి రవాణా సేవలు',
      clusterTitle: 'సమీప ఆర్డర్ల సమూహం & మార్గం',
      routeSequence: 'రూట్ క్రమం',
      assignVehicle: 'వాహనాన్ని కేటాయించండి',
      startTrip: 'ప్రయాణం ప్రారంభించండి',
      markDelivered: 'డెలివరీ పూర్తయింది',
      fuelSaved: 'ఇంధనం ఆదా',
    },
    finance: {
      creditScoreTitle: 'రైతు ఆర్థిక స్కోర్',
      advanceAvailable: 'అందుబాటులో ఉన్న ముందస్తు మొత్తం',
      requestCashout: 'నగదు విత్‌డ్రా అభ్యర్థన',
      bcAgentSimulator: 'AEPS బ్యాంక్ మిత్ర కౌంటర్',
      enterAadhaar: 'ఆధార్ చివరి 4 అంకెలు',
      biometricConfirm: 'వేలిముద్రతో ధృవీకరించండి',
      receiptRef: 'NPCI లావాదేవీ సంఖ్య',
    },
    safety: {
      title: 'దోపిడీ & సమస్యల నివేదిక',
      subheading: 'రైతులకు పూర్తి భద్రత మరియు గోప్యతా రక్షణ.',
      guarantee: 'మీ వ్యక్తిగత వివరాలు ఎవరికీ వెల్లడించబడవు.',
      categoryLabel: 'ఫిర్యాదు వర్గం',
      descLabel: 'వివరణ',
      submitAnon: '100% గోప్యంగా సమర్పించండి',
    },
    common: {
      kg: 'కిలో',
      quintal: 'క్వింటాల్',
      rupees: '₹',
      viewDetails: 'వివరాలు చూడండి',
      close: 'మూసివేయి',
      confirm: 'ధృవీకరించు',
      cancel: 'రద్దు చేయి',
      status: 'స్థితి',
      grade: 'గ్రేడ్',
      confidence: 'ఖచ్చితత్వం',
      liveMandiTrend: 'మండీ ధరలు',
    },
  },
  pa: {
    appName: 'ਵਸੁੰਧਰਾ',
    tagline: 'ਸਿੱਧਾ ਕਿਸਾਨ-ਤੋਂ-ਖਰੀਦਦਾਰ ਡਿਜੀਟਲ ਮਾਰਕਿਟਪਲੇਸ',
    roles: {
      farmer: 'ਕਿਸਾਨ ਪੋਰਟਲ',
      buyer: 'ਖਰੀਦਦਾਰ / ਵਪਾਰੀ',
      logistics: 'ਟਰਾਂਸਪੋਰਟ ਨੈੱਟਵਰਕ',
      admin: 'ਪ੍ਰਬੰਧਕ ਤੇ ਸੁਰੱਖਿਆ',
      collector: 'ਕਬਾਡੀਵਾਲਾ / ਕਲੈਕਟਰ ਪੋਰਟਲ',
      recycler: 'ਅਧਿਕਾਰ ਪ੍ਰਾਪਤ ਰੀਸਾਇਕਲਰ ਪੋਰਟਲ',
    },
    nav: {
      dashboard: 'ਡੈਸ਼ਬੋਰਡ',
      listings: 'ਮੇਰੀਆਂ ਫਸਲਾਂ',
      orders: 'ਆਰਡਰ ਤੇ ਭੁਗਤਾਨ',
      schemes: 'ਸਰਕਾਰੀ ਸਕੀਮਾਂ',
      finance: 'ਵਿੱਤੀ ਸਹਾਇਤਾ (AEPS)',
      insights: 'ਮੰਡੀ ਭਾਅ',
      safetyReport: 'ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ',
      demoGuide: 'ਡੈਮੋ ਗਾਈਡ',
      lots: 'ਮੇਰੇ ਸਕਰੈਪ ਲਾਟ',
      pools: 'ਸਮਾਰਟ ਪੂਲ',
    },
    farmer: {
      welcome: 'ਜੀ ਆਇਆਂ ਨੂੰ ਕਿਸਾਨ ਵੀਰੋ',
      tapToSpeak: 'ਮਾਈਕ ਦਬਾਓ ਅਤੇ ਆਪਣੀ ਬੋਲੀ ਵਿੱਚ ਬੋਲੋ',
      listening: 'ਫਸਲ ਦੇ ਵੇਰਵੇ ਸੁਣੇ ਜਾ ਰਹੇ ਹਨ...',
      speakPrompt: 'ਜਿਵੇਂ "ਪੰਜਾਹ ਕੁਇੰਟਲ ਆਲੂ, ਚੌਦਾਂ ਰੁਪਏ ਕਿਲੋ"',
      createListing: 'ਨਵੀਂ ਫਸਲ ਦਰਜ ਕਰੋ',
      cropName: 'ਫਸਲ ਅਤੇ ਕਿਸਮ',
      quantity: 'ਮਾਤਰਾ (ਕਿਲੋ / ਕੁਇੰਟਲ)',
      expectedPrice: 'ਉਮੀਦ ਕੀਤਾ ਭਾਅ (₹/ਕਿਲੋ)',
      aiPriceBand: 'AI ਮੰਡੀ ਭਾਅ ਬੈਂਡ',
      aiQualityScan: 'AI ਫਸਲ ਕੁਆਲਿਟੀ ਸਕੈਨ (CNN)',
      publishAnon: 'ਗੁਪਤ ਪਛਾਣ ਨਾਲ ਮੰਡੀ ਵਿੱਚ ਵੇਚੋ',
      anonShieldNotice: 'ਸੌਦਾ ਪੱਕਾ ਹੋਣ ਤੱਕ ਤੁਹਾਡਾ ਨਾਮ ਅਤੇ ਫੋਨ ਨੰਬਰ ਪੂਰੀ ਤਰ੍ਹਾਂ ਗੁਪਤ ਰਹੇਗਾ।',
      myListings: 'ਮੇਰੀਆਂ ਦਰਜ ਫਸਲਾਂ',
      activeOrders: 'ਸਰਗਰਮ ਸੌਦੇ',
      eligibleAdvance: 'AI ਅਗਾਊਂ ਰਕਮ ਦੀ ਯੋਗਤਾ',
      cashoutAeps: 'AEPS ਬਾਇਓਮੈਟ੍ਰਿਕ ਨਕਦ ਨਿਕਾਸੀ',
      reportConcern: 'ਦਲਾਲਾਂ ਦੀ ਧੱਕੇਸ਼ਾਹੀ ਖਿਲਾਫ ਸ਼ਿਕਾਇਤ',
    },
    buyer: {
      marketplace: 'ਸਿੱਧੀ ਕਿਸਾਨ ਮੰਡੀ',
      recommendedForYou: 'ਤੁਹਾਡੇ ਲਈ ਖਾਸ ਸੁਝਾਅ (AI ਮੈਚ)',
      allListings: 'ਉਪਲਬਧ ਫਸਲਾਂ',
      filterByCrop: 'ਫਸਲ ਚੁਣੋ',
      qualityGrade: 'ਕੁਆਲਿਟੀ ਗ੍ਰੇਡ',
      reputation: 'ਕਿਸਾਨ ਭਰੋਸੇਯੋਗਤਾ',
      placeOrder: 'ਆਰਡਰ ਬੁੱਕ ਕਰੋ',
      anonymizedSeller: 'ਤਸਦੀਕਸ਼ੁਦਾ ਗੁਪਤ ਕਿਸਾਨ',
      identityLockNotice: 'ਆਰਡਰ ਕਨਫਰਮ ਹੁੰਦੇ ਹੀ ਦੋਵਾਂ ਧਿਰਾਂ ਨੂੰ ਨਾਮ ਅਤੇ ਫੋਨ ਨੰਬਰ ਦਿਸ ਜਾਵੇਗਾ।',
    },
    collector: {
      welcome: 'ਸਵਾਗਤ ਹੈ, ਕਬਾਡੀਵਾਲਾ ਸਾਥੀ',
      tapToSpeak: 'ਮਾਈਕ ਦਬਾਓ ਅਤੇ ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਬੋਲੋ',
      listening: 'ਤੁਹਾਡੇ ਸਕਰੈਪ ਲਾਟ ਦੇ ਵੇਰਵੇ ਸੁਣੇ ਜਾ ਰਹੇ ਹਨ...',
      speakPrompt: 'ਜਿਵੇਂ "500 ਕਿਲੋ ਕੌਪਰ ਵਾਇਰ, 450 ਰੁਪਏ ਕਿਲੋ"',
      createLot: 'ਨਵਾਂ ਸਕਰੈਪ ਲਾਟ ਬਣਾਓ',
      materialType: 'ਮੈਟीरੀਅਲ ਕਿਸਮ ਅਤੇ ਸ਼੍ਰੇਣੀ',
      materialCategory: 'ਸ਼੍ਰੇਣੀ (ਧਾਤੁ / ਪਲਾਸਟਿਕ / ਈ-ਵੇਸਟ / ਕਾਗਜ਼)',
      estimatedWeight: 'ਅੰਦਾਜ਼ਾ ਵਜ਼ਨ (ਕਿਲੋ)',
      expectedPrice: 'ਉਮੀਦ ਕੀਤਾ ਭਾਅ (₹/ਕਿਲੋ)',
      aiPriceBand: 'AI ਮਾਰਕੀਟ ਭਾਅ ਬੈਂਡ (ਰੀਸਾਇਕਲਰ ਦਰਾਂ)',
      aiQualityScan: 'AI ਮੈਟਿਰੀਅਲ ਕੁਆਲਿਟੀ ਸਕੈਨ (CNN ਕਲਾਸੀਫਾਇਰ)',
      publishAnon: 'ਗੁਪਤ ਪਛਾਣ ਨਾਲ ਬਾਜ਼ਾਰ ਵਿੱਚ ਪ੍ਰਕਾਸ਼ਿਤ ਕਰੋ',
      anonShieldNotice: 'ਰੀਸਾਇਕਲਰ ਲਾਟ ਨੂੰ ਠੀਕ ਕਰਨ ਤੱਕ ਤੁਹਾਡਾ ਨਾਮ, ਇਲਾਕਾ, ਅਤੇ ਫੋਨ ਨੰਬਰ ਪੂਰੀ ਤਰ੍ਹਾਂ ਸੁਰੱਖਿਅਤ ਰਹੇਗਾ।',
      myLots: 'ਮੇਰੇ ਸਕਰੈਪ ਲਾਟ',
      activeLots: 'ਸਰਗਰਮ ਲਾਟ',
      poolLot: 'ਵੈਰੀਫਾਇਡ ਸਮਾਰਟ ਲਾਟ ਪੂਲ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਵੋ',
      cashoutAeps: 'AEPS ਬਾਇਓਮੈਟ੍ਰਿਕ ਨਕਦ ਨਿਕਾਸੀ',
      reportConcern: 'ਸ਼ੋਸ਼ਣ / ਹਰਾਸਮੈਂਟ ਦੀ ਸ਼ਿਕਾਇਤ (ਸੁਰੱਖਿਅਤ ਅਤੇ ਗੁਪਤ)',
    },
    logistics: {
      pooledPickups: 'ਇਕੱਠੀ ਮਾਲ ਢੋਆ-ਢੁਆਈ',
      clusterTitle: 'ਨੇੜਲੇ ਆਰਡਰਾਂ ਦਾ ਸਮੂਹ ਤੇ ਰੂਟ',
      routeSequence: 'ਅਨੁਕੂਲਿਤ ਰਸਤਾ',
      assignVehicle: 'ਗੱਡੀ ਤੇ ਡਰਾਈਵਰ ਚੁਣੋ',
      startTrip: 'ਰਵਾਨਾ ਕਰੋ',
      markDelivered: 'ਡਿਲੀਵਰੀ ਪੂਰੀ ਹੋਈ',
      fuelSaved: 'ਤੇਲ ਦੀ ਬੱਚਤ',
    },
    finance: {
      creditScoreTitle: 'ਕਿਸਾਨ ਵਿੱਤੀ ਮੁਲਾਂਕਣ',
      advanceAvailable: 'ਉਪਲਬਧ ਅਗਾਊਂ ਰਕਮ',
      requestCashout: 'ਨਕਦੀ ਕਢਵਾਉਣ ਦੀ ਬੇਨਤੀ',
      bcAgentSimulator: 'ਬੈਂਕ ਮਿੱਤਰ AEPS ਕਾਊਂਟਰ',
      enterAadhaar: 'ਆਧਾਰ ਕਾਰਡ ਦੇ ਆਖਰੀ 4 ਅੰਕ',
      biometricConfirm: 'ਅੰਗੂਠਾ ਲਗਾ ਕੇ ਤਸਦੀਕ ਕਰੋ (NPCI)',
      receiptRef: 'ਲੈਣ-ਦੇਣ ਰੈਫਰੈਂਸ ਨੰਬਰ',
    },
    safety: {
      title: 'ਸ਼ੋਸ਼ਣ ਤੇ ਧੱਕੇਸ਼ਾਹੀ ਖਿਲਾਫ ਸ਼ਿਕਾਇਤ',
      subheading: 'ਕਿਸਾਨਾਂ ਲਈ ਪੂਰੀ ਤਰ੍ਹਾਂ ਸੁਰੱਖਿਅਤ ਤੇ ਗੁਪਤ ਪੋਰਟਲ।',
      guarantee: 'ਤੁਹਾਡੀ ਪਛਾਣ ਕਦੇ ਵੀ ਕਿਸੇ ਦਲਾਲ ਨੂੰ ਨਹੀਂ ਦੱਸੀ ਜਾਵੇਗੀ।',
      categoryLabel: 'ਸ਼ਿਕਾਇਤ ਦੀ ਕਿਸਮ',
      descLabel: 'ਵੇਰਵਾ ਦਿਓ',
      submitAnon: '100% ਗੁਪਤ ਤੌਰ ਤੇ ਭੇਜੋ',
    },
    common: {
      kg: 'ਕਿਲੋ',
      quintal: 'ਕੁਇੰਟਲ',
      rupees: '₹',
      viewDetails: 'ਵੇਰਵਾ ਵੇਖੋ',
      close: 'ਬੰਦ ਕਰੋ',
      confirm: 'ਪੁਸ਼ਟੀ ਕਰੋ',
      cancel: 'ਰੱਦ ਕਰੋ',
      status: 'ਸਥਿਤੀ',
      grade: 'ਦਰਜਾ',
      confidence: 'ਸ਼ੁੱਧਤਾ',
      liveMandiTrend: 'ਲਾਈਵ ਮੰਡੀ ਭਾਅ',
    },
  },
};

