// ============================================================================
// MT. HYMETTUS CLIMBING SECTORS DATABASE (EOSH 2018 + community updates)
// 
// NOTE ON GPS COORDINATES:
// The latitude/longitude values below are PROVISIONAL PLACEHOLDERS.
// When verified GPS coordinates are provided, replace the `lat` and `lng`
// values directly in `PARKING_TRAILHEADS`, `AREA_BOUNDARIES`, and `sectors`.
// The interactive map, Google Maps directions, and markers will immediately
// update without any component logic changes.
// ============================================================================

export const PARKING_TRAILHEADS = {
  ilioupoli: {
    id: 'ilioupoli',
    nameGr: 'Πάρκινγκ & Μεταλλική Μπάρα — Τέρμα Λ. Σοφοκλή Βενιζέλου (Πυροφυλάκιο)',
    nameEn: 'Parking & Metal Gate — End of Sofokli Venizelou Ave. (Fire Lookout)',
    shortGr: 'Πάρκινγκ Σοφ. Βενιζέλου (Μπάρα)',
    shortEn: 'Sof. Venizelou Parking (Gate)',
    areaGr: 'Ηλιούπολη',
    areaEn: 'Ilioupoli',
    lat: 37.92968,
    lng: 23.77165,
    noteGr:
      'Αφήνετε το όχημα στο τέρμα της Λεωφ. Σοφοκλή Βενιζέλου (μπροστά στη μεταλλική πόρτα του Πυροφυλακίου). Από εκεί ανηφορίζετε 150μ τον χωματόδρομο και μπαίνετε ευθεία στο σηματοδοτημένο μονοπάτι του ρέματος (10′ για Κόκκινη/Πράσινη Πίστα).',
    noteEn:
      'Park at the top end of Sofokli Venizelou Ave. (in front of the fire lookout metal gate). Walk 150m up the dirt road and enter straight into the marked gully trail (10′ to Kokkini/Prasini Pista).',
    wikilocUrl: 'https://loc.wiki/t/166954682?wa=sc',
  },
  karea: {
    id: 'karea',
    nameGr: 'Πάρκινγκ Μονής Αγ. Ιωάννη Καρέα',
    nameEn: 'Agios Ioannis Karea Monastery Parking',
    shortGr: 'Πάρκινγκ Μονής Καρέα',
    shortEn: 'Karea Monastery Parking',
    areaGr: 'Καρέας',
    areaEn: 'Karea',
    lat: 37.93915,
    lng: 23.77395,
    noteGr:
      'Από τον Περιφερειακό Υμηττού στρίβετε στις πινακίδες για Καρέα (μεταλλική πεζογέφυρα) έως το πάρκινγκ της Μονής Αγ. Ιωάννη Καρέα. Δεξιά της εισόδου ξεκινά το σηματοδοτημένο μονοπάτι (5′ για Τοίχο του Μάκη + 5′ για Μακρύ Τοίχο).',
    noteEn:
      'From the Hymettus Ring Road turn toward Karea (at the pedestrian footbridge) up to the Karea Monastery parking lot. The marked trail starts just right of the entrance (5′ to Makis Wall + 5′ to Long Wall).',
    wikilocUrl: null,
  },
};

// Surrounding area boundary polygons (inspired by theCrag's EmbedAreaMap)
// Enclosing Kareas and Ilioupoli climbing zones
export const AREA_BOUNDARIES = [
  {
    id: 'ilioupoli',
    nameGr: 'Πεδίο Ηλιούπολης',
    nameEn: 'Ilioupoli Crag Area',
    color: '#0284c7', // Sky blue
    fillColor: '#38bdf8',
    coords: [
      [37.9288, 23.7695],
      [37.9348, 23.7712],
      [37.9355, 23.7758],
      [37.9315, 23.7785],
      [37.9285, 23.7760],
    ],
  },
  {
    id: 'karea',
    nameGr: 'Πεδίο Καρέα',
    nameEn: 'Kareas Crag Area',
    color: '#10b981', // Emerald green
    fillColor: '#34d399',
    coords: [
      [37.9378, 23.7725],
      [37.9415, 23.7745],
      [37.9418, 23.7798],
      [37.9385, 23.7805],
      [37.9370, 23.7760],
    ],
  },
];

export const APPROACH_TRAILS = [
  {
    id: 'ilioupoli-main',
    area: 'Ilioupoli',
    labelGr: 'Μονοπάτι Πρόσβασης Ηλιούπολης (10′ → Κόκκινη / +10′ → Τρύπιος)',
    labelEn: 'Ilioupoli Approach Trail (10′ → Kokkini / +10′ → Trypios)',
    coords: [
      [37.92968, 23.77165], // Parking & Metal Gate (Sof. Venizelou)
      [37.93085, 23.77205], // 150m dirt road junction
      [37.93185, 23.77255], // Small gully trail
      [37.932795, 23.773192], // Kokkini Pista
      [37.93338, 23.77265], // Prasini Pista
    ],
  },
  {
    id: 'ilioupoli-trypios',
    area: 'Ilioupoli',
    labelGr: 'Ανάβαση προς Τρύπιο Βράχο (+10′)',
    labelEn: 'Ascent to Trypios Vrachos (+10′)',
    coords: [
      [37.932795, 23.773192], // Kokkini Pista
      [37.93262, 23.77405], // Rocky step with fixed rope
      [37.932476, 23.774808], // Trypios Vrachos
    ],
  },
  {
    id: 'ilioupoli-gouva',
    area: 'Ilioupoli',
    labelGr: 'Πρόσβαση προς Γούβα',
    labelEn: 'Approach to Gouva',
    coords: [
      [37.93085, 23.77205],
      [37.93045, 23.7741],
      [37.93015, 23.77595], // Gouva
    ],
  },
  {
    id: 'karea-main',
    area: 'Karea',
    labelGr: 'Μονοπάτι Καρέα (5′ → Τοίχος Μάκη / +5′ → Μακρύς Τοίχος)',
    labelEn: 'Karea Trail (5′ → Makis Wall / +5′ → Long Wall)',
    coords: [
      [37.93915, 23.77395], // Karea Monastery Parking
      [37.93948, 23.77525],
      [37.93972, 23.77645], // Toichos tou Maki
      [37.939955, 23.777954], // Makrys Toichos
    ],
  },
];

// Keyless Google Maps URL builders (100% free, zero API key required)
export function getGoogleMapsDirectionsUrl(lat, lng, travelMode = 'driving') {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=${travelMode}`;
}

export function getGoogleMapsPinUrl(lat, lng, label = 'Climbing Crag') {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function getGoogleMapsEmbedUrl(lat, lng, zoom = 16, mapType = 'h') {
  return `https://maps.google.com/maps?q=${lat},${lng}&t=${mapType}&z=${zoom}&output=embed`;
}

export const sectors = [
  {
    key: 'makis',
    path: '/toichos-maki',
    nameEn: "Makis' Wall (Toichos tou Maki)",
    nameGr: 'Τοίχος του Μάκη',
    area: 'Karea',
    areaGr: 'Καρέας',
    routes: 9,
    totalLines: 9,
    grades: '4a – 6b (IV – VII-)',
    shadeEn: 'Shaded morning to 14:00',
    shadeGr: 'Σκιά πρωί έως 14:00',
    descEn:
      'Compact wall above Karea Monastery, ideal for top-roping. Several historic routes opened by Idosidis–Martzoukos in 1963.',
    descGr:
      'Συμπαγής τοίχος πάνω από τη Μονή Καρέα, ιδανικός για Top Rope. Πολλές ιστορικές διαδρομές του Ιδοσίδη–Μαρτζούκου το 1963.',
    available: true,
    lat: 37.93972,
    lng: 23.77645,
    approachMin: 5,
    parkingId: 'karea',
  },
  {
    key: 'makrys',
    path: '/makrys-toichos',
    nameEn: 'Long Wall (Makrys Toichos)',
    nameGr: 'Μακρύς Τοίχος',
    area: 'Karea',
    areaGr: 'Καρέας',
    routes: 23,
    totalLines: 23,
    grades: '4a – 6a+ (IV – VI+)',
    shadeEn: 'Shaded morning to 17:00',
    shadeGr: 'Σκιά πρωί έως 17:00',
    descEn:
      'The longest training crag of Karea, with 23 routes from the 1950s pioneers Michaelidis & Idosidis up to modern bolted lines.',
    descGr:
      'Ο μεγαλύτερος εκπαιδευτικός βράχος του Καρέα, με 23 διαδρομές από τους πρωτοπόρους Μιχαηλίδη & Ιδοσίδη μέχρι σύγχρονες ασφαλισμένες γραμμές.',
    available: true,
    lat: 37.939955,
    lng: 23.777954,
    approachMin: 10,
    parkingId: 'karea',
  },
  {
    key: 'prasini',
    path: '/prasini-pista',
    nameEn: 'Green Crag (Prasini Pista)',
    nameGr: 'Πράσινη Πίστα',
    area: 'Ilioupoli',
    areaGr: 'Ηλιούπολη',
    routes: 10,
    totalLines: 10,
    grades: '5a – 6c+ (V- – VIII-)',
    shadeEn: 'Shaded until 12:00',
    shadeGr: 'Σκιά έως τις 12:00',
    descEn:
      'Sustained vertical wall with technical face climbing. Bolted by Kouniakis & Bailey in 1990–1991.',
    descGr:
      'Συνεχής κάθετος τοίχος με τεχνικό κάθετο σκαρφάλωμα. Ασφαλισμένη από Κουνιάκη & Bailey, 1990–1991.',
    available: true,
    lat: 37.93338,
    lng: 23.77265,
    approachMin: 10,
    parkingId: 'ilioupoli',
  },
  {
    key: 'kokkini',
    path: '/kokkini-pista',
    nameEn: 'Red Crag (Kokkini Pista)',
    nameGr: 'Κόκκινη Πίστα',
    area: 'Ilioupoli',
    areaGr: 'Ηλιούπολη',
    routes: 40,
    totalLines: 40,
    grades: '5a – 7a (V – VIII)',
    shadeEn: 'Shaded morning + 11:00 onwards',
    shadeGr: 'Σκιά πρωί + από 11:00 και μετά',
    descEn:
      'The largest sector on Hymettus with 40 routes ranging from beginner-friendly slabs to the famous overhanging roof first climbed by Idosidis in 1960.',
    descGr:
      'Ο μεγαλύτερος τομέας στον Υμηττό με 40 διαδρομές από αρχάριες έως τη διάσημη στέγη που πρωτοσκαρφαλώθηκε από τον Ιδοσίδη το 1960.',
    available: true,
    lat: 37.932795,
    lng: 23.773192,
    approachMin: 10,
    parkingId: 'ilioupoli',
  },
  {
    key: 'trypios',
    path: '/trypios-vrachos',
    nameEn: 'Perforated Rock (Trypios Vrachos)',
    nameGr: 'Τρύπιος Βράχος',
    area: 'Ilioupoli',
    areaGr: 'Ηλιούπολη',
    routes: 38,
    totalLines: 38,
    grades: '4b – 8a (IV+ – IX+)',
    shadeEn: 'Main mass shaded until 16:00',
    shadeGr: 'Κύριος όγκος σε σκιά έως τις 16:00',
    descEn:
      'Multi-pitch terrain with the hardest routes on Mt. Hymettus including ASE (8a / IX+), Moutampa (7b+), and classic multi-pitches (Orio, Dynamis, Matseta, Adhoc). 70m rope recommended.',
    descGr:
      'Πολυσχοινιά πεδίο με τις πιο απαιτητικές διαδρομές στον Υμηττό: ΑΣΕ (8a / IX+), Μουτάμπα (7b+), και κλασικές πολυσχοινιές (Όριο, Δύναμις, Ματσέτα, Adhoc). Συνιστάται σχοινί 70μ.',
    available: true,
    lat: 37.932476,
    lng: 23.774808,
    approachMin: 20,
    parkingId: 'ilioupoli',
  },
  {
    key: 'gouva',
    path: '/gouva',
    nameEn: 'Gouva (Pit)',
    nameGr: 'Γούβα',
    area: 'Ilioupoli',
    areaGr: 'Ηλιούπολη',
    routes: 18,
    totalLines: 18,
    grades: '4a – 7b (IV – VIII+)',
    shadeEn: 'Variable shade — quarry-like setting',
    shadeGr: 'Μεταβλητή σκιά — σαν λατομείο',
    descEn:
      'Compact crag opened by Karagiannis–Florian–Sotirakis. Cut limestone and marble, featuring routes from 4a up to Exodos Kindinou (7b).',
    descGr:
      'Μικρό πεδίο που άνοιξαν οι Καραγιάννης–Florian–Σωτηράκης. Λαξευμένος ασβεστόλιθος και μάρμαρο, με διαδρομές από 4a έως την Έξοδο Κινδύνου (7b).',
    available: true,
    lat: 37.93015,
    lng: 23.77595,
    approachMin: 8,
    parkingId: 'ilioupoli',
  },
];
