/**
 * ============================================================================
 * PROMPT / INSTRUCTIONS FOR ARGON (PHOTO EDITING & VECTOR TOPO DRAWING)
 * ============================================================================
 * Sector: Τοίχος του Μάκη (Makis' Wall) - Καρέας, Υμηττός
 * theCrag Master URL: https://www.thecrag.com/climbing/greece/area/2037217503
 * theCrag Sector URL: https://www.thecrag.com/en/climbing/greece/area/2037222360
 *
 * TASK 1: Image Processing
 *  - Source high-res photo of the compact wall (6–8m height).
 *  - Clean up lens distortion, balance contrast/shadows, export to:
 *    - /public/topos/toichos-maki.webp (and /public/topos/toichos-maki-clean.webp)
 *    - Recommended canvas aspect ratio ~ 1470 x 850 or similar standard.
 *
 * TASK 2: Vector Topo SVG Lines
 *  - Calibrate SVG path coordinates [x%, y%] from ground start to top edge.
 *  - Total routes to trace: 9 routes (numbered 1 through 9 from left to right).
 *  - All routes are Top-Rope ONLY (no permanent lower-off anchors). In the topo
 *    rendering, style these with amber/yellow stroke (#facc15).
 *  - Set anchor points at top trees / natural anchor stations.
 *  - Once coordinates are ready, replace `svgPath: null` in each route object
 *    below with the corresponding [[x, y], ...] percentage waypoint arrays.
 * ============================================================================
 */

export const MAKIS_WALLS = [
  {
    id: 1,
    titleGr: 'Τοίχος του Μάκη (Κύριος Τοίχος)',
    titleEn: "Makis' Wall (Main Wall)",
    subtitleGr: '9 διαδρομές Top Rope (Ιδοσίδης 1963 & Τιτόπουλος/Bailey 1990)',
    subtitleEn: '9 Top Rope lines (Idosidis 1963 & Titopoulos/Bailey 1990)',
    imageClean: null, // ARGON TASK: Place cleaned photo at /topos/toichos-maki-clean.webp
    imageOriginal: null, // ARGON TASK: Place original photo at /topos/toichos-maki.webp
    width: 1470,
    height: 850,
    pendingArgon: true,
  },
];

export const CRAG_INFO_MAKIS = {
  key: 'makis',
  nameGr: 'Τοίχος του Μάκη',
  nameEn: "Makis' Wall (Toichos tou Maki)",
  areaGr: 'Καρέας',
  areaEn: 'Kareas',
  gradeSpan: '4a–6b',
  height: '6–8m',
  quickdraws: 'Top Rope',
  ropeGr: '(σχοινί 30m)',
  ropeEn: '(30m rope)',
  approachMinutes: 5,
  theCragUrl: 'https://www.thecrag.com/en/climbing/greece/area/2037222360',
  parkingMapsUrl: 'https://maps.app.goo.gl/3Xz5tJzN2p4yqCgX8',
  cragMapsUrl: 'https://www.google.com/maps/search/?api=1&query=37.9540,23.7780',
  wikilocUrl: 'https://loc.wiki/t/166954682?wa=sc',
  introGr:
    'Συμπαγής βράχος πάνω από τη Μονή Καρέα, ιδανικός για Top Rope. Ιστορικό εκπαιδευτικό πεδίο όπου ανοίχτηκαν οι πρώτες διαδρομές το 1963 από τους Πρόδρομο (Μάκη) Ιδοσίδη, Γ. Μαρτζούκο και Ρ. Γιαννακόπουλο.',
  introEn:
    'Compact limestone crag above St. John of Kareas Monastery, ideal for top-rope training. Historic ground where the first routes were opened in 1963 by Prodromos (Makis) Idosidis, G. Martzoukos, and R. Giannakopoulos.',
  shadeGr: 'Το καλοκαίρι έχει σκιά από το πρωί μέχρι τις 14:00.',
  shadeEn: 'In summer shaded from morning until 14:00.',
  approachGr:
    'Από τον περιφερειακό Υμηττού στρίβετε προς Καρέα (πεζογέφυρα και φανάρια) με τελικό προορισμό τη Μονή Αγ. Ιωάννη Καρέα. Ακριβώς δίπλα και δεξιά της εισόδου ξεκινά σηματοδοτημένο μονοπάτι και ανηφορίζοντας συναντάτε σε 5 λεπτά τον «Τοίχο του Μάκη».',
  approachEn:
    'From the Hymettus ring road, follow signs to Kareas leading to St. John of Kareas Monastery. Right next to and to the right of the entrance gate, follow the marked path uphill; you reach Makis\' Wall in 5 minutes.',
  rockAndSafetyGr:
    'Συμπαγής ασβεστόλιθος ύψους 6–8μ. ΠΡΟΣΟΧΗ: Όλες οι διαδρομές γίνονται αποκλειστικά με σχοινί από πάνω (Top Rope) και ΔΕΝ έχουν μόνιμο ρελέ. Το ρελέ κατασκευάζεται στα δεντράκια πάνω από τα βράχια ή σε καρύδια/friends. Χρήση κράνους απαραίτητη πάντα.',
  rockAndSafetyEn:
    'Solid limestone 6–8m high. CAUTION: All routes are strictly Top Rope and DO NOT have permanent lower-off anchors. Belays must be equalized around sturdy trees on the rim above or with nuts/cams. Wearing a helmet is mandatory at all times.',
  reboltingGr:
    'Πεδίο ιστορικής αξίας. Οι διαδρομές παραμένουν παραδοσιακά σε μορφή Top Rope χωρίς επεμβάσεις με μόνιμα βύσματα ώστε να διατηρηθεί ο αρχικός τους χαρακτήρας.',
  reboltingEn:
    'Historic training wall preserved in its authentic top-rope format without bolted anchors to respect its climbing heritage.',
  guidebooksGr:
    '«Αναρρίχηση δίπλα στο σπίτι σας» (Δ. Τιτόπουλος & P. Bailey, 1991, σελ. 40–42) · ΕΟΣ Ηλιούπολης 2018 (cms_9a0ddbb10a.pdf, σελ. 1).',
  guidebooksEn:
    '"Climbing Next to Your Home" (D. Titopoulos & P. Bailey, 1991) · EOS Ilioupolis 2018 Climbing Guidebook (Page 1).',
};

export const TOICHOS_MAKI_ROUTES = [
  {
    id: 'tm-1',
    order: 1,
    wall: 1,
    pdfNumber: '1',
    displayCode: '1',
    topoLabel: '1',
    nameGr: 'Διαδρομή 1',
    nameEn: 'Route 1',
    uiaa: 'IV',
    french: '4a',
    length: 7,
    bolts: 0,
    protectionRaw: 'Top rope*',
    isTopRopeOnly: true,
    settersRawGr: 'Μ. Ιδοσίδης - Γ. Μαρτζούκος - Ρ. Γιαννακόπουλος 1963',
    settersRawEn: 'M. Idosidis - G. Martzoukos - R. Giannakopoulos 1963',
    setters: ['Μ. Ιδοσίδης', 'Γ. Μαρτζούκος', 'Ρ. Γιαννακόπουλος'],
    year: 1963,
    defaultStars: 2,
    isClassic: true,
    noteGr: 'Ιστορική γραμμή του 1963 στην αριστερή πλευρά του τοίχου. Top rope, ρελέ σε δέντρο στο πατάρι.',
    noteEn: 'Historic 1963 route on the left side of the wall. Top rope, anchor on tree above.',
    svgPath: null, // ARGON TASK: Calibrate SVG coordinates
  },
  {
    id: 'tm-2',
    order: 2,
    wall: 1,
    pdfNumber: '2',
    displayCode: '2',
    topoLabel: '2',
    nameGr: 'Διαδρομή 2',
    nameEn: 'Route 2',
    uiaa: 'IV',
    french: '4a',
    length: 7,
    bolts: 0,
    protectionRaw: 'Top rope*',
    isTopRopeOnly: true,
    settersRawGr: 'Μ. Ιδοσίδης - Γ. Μαρτζούκος - Ρ. Γιαννακόπουλος 1963',
    settersRawEn: 'M. Idosidis - G. Martzoukos - R. Giannakopoulos 1963',
    setters: ['Μ. Ιδοσίδης', 'Γ. Μαρτζούκος', 'Ρ. Γιαννακόπουλος'],
    year: 1963,
    defaultStars: 2,
    isClassic: true,
    noteGr: 'Εκπαιδευτική γραμμή IV σε συμπαγή βράχο. Top rope χωρίς μόνιμο ρελέ.',
    noteEn: 'Educational slab climb IV on solid limestone. Top rope with natural anchor.',
    svgPath: null, // ARGON TASK: Calibrate SVG coordinates
  },
  {
    id: 'tm-3',
    order: 3,
    wall: 1,
    pdfNumber: '3',
    displayCode: '3',
    topoLabel: '3',
    nameGr: 'Διαδρομή 3',
    nameEn: 'Route 3',
    uiaa: 'IV',
    french: '4a',
    length: 8,
    bolts: 0,
    protectionRaw: 'Top rope*',
    isTopRopeOnly: true,
    settersRawGr: 'Μ. Ιδοσίδης - Γ. Μαρτζούκος - Ρ. Γιαννακόπουλος 1963',
    settersRawEn: 'M. Idosidis - G. Martzoukos - R. Giannakopoulos 1963',
    setters: ['Μ. Ιδοσίδης', 'Γ. Μαρτζούκος', 'Ρ. Γιαννακόπουλος'],
    year: 1963,
    defaultStars: 2,
    isClassic: true,
    noteGr: 'Κάθετο πέρασμα 8μ, καλά πατήματα, ιδανικό για αρχάριους αναρριχητές.',
    noteEn: 'Vertical 8m face with good footholds, ideal for beginner training.',
    svgPath: null, // ARGON TASK: Calibrate SVG coordinates
  },
  {
    id: 'tm-4',
    order: 4,
    wall: 1,
    pdfNumber: '4',
    displayCode: '4',
    topoLabel: '4',
    nameGr: 'Διαδρομή 4',
    nameEn: 'Route 4',
    uiaa: 'V+',
    french: '5c',
    length: 8,
    bolts: 0,
    protectionRaw: 'Top rope*',
    isTopRopeOnly: true,
    settersRawGr: 'Δ. Τιτόπουλος - P. Bailey 1990',
    settersRawEn: 'D. Titopoulos - P. Bailey 1990',
    setters: ['Δ. Τιτόπουλος', 'P. Bailey'],
    year: 1990,
    defaultStars: 2,
    noteGr: 'Τεχνικό πέρασμα 5c με μικρά πιασίματα. Top rope.',
    noteEn: 'Technical 5c crux on delicate crimps. Top rope.',
    svgPath: null, // ARGON TASK: Calibrate SVG coordinates
  },
  {
    id: 'tm-5',
    order: 5,
    wall: 1,
    pdfNumber: '5',
    displayCode: '5',
    topoLabel: '5',
    nameGr: 'Διαδρομή 5',
    nameEn: 'Route 5',
    uiaa: 'VII-',
    french: '6b',
    length: 8,
    bolts: 0,
    protectionRaw: 'Top rope*',
    isTopRopeOnly: true,
    settersRawGr: 'Δ. Τιτόπουλος - P. Bailey 1990',
    settersRawEn: 'D. Titopoulos - P. Bailey 1990',
    setters: ['Δ. Τιτόπουλος', 'P. Bailey'],
    year: 1990,
    defaultStars: 3,
    noteGr: 'Απαιτητική κάθετη γραμμή 6b στο κέντρο του τοίχου. Top rope.',
    noteEn: 'Demanding vertical 6b sequence through the wall center. Top rope.',
    svgPath: null, // ARGON TASK: Calibrate SVG coordinates
  },
  {
    id: 'tm-6',
    order: 6,
    wall: 1,
    pdfNumber: '6',
    displayCode: '6',
    topoLabel: '6',
    nameGr: 'Διαδρομή 6',
    nameEn: 'Route 6',
    uiaa: 'VII-',
    french: '6b',
    length: 8,
    bolts: 0,
    protectionRaw: 'Top rope*',
    isTopRopeOnly: true,
    settersRawGr: 'Δ. Τιτόπουλος - P. Bailey 1990',
    settersRawEn: 'D. Titopoulos - P. Bailey 1990',
    setters: ['Δ. Τιτόπουλος', 'P. Bailey'],
    year: 1990,
    defaultStars: 3,
    noteGr: 'Συνεχές τεχνικό σκαρφάλωμα 6b σε θετικά νυχάκια. Top rope.',
    noteEn: 'Sustained technical 6b face climbing on micro edges. Top rope.',
    svgPath: null, // ARGON TASK: Calibrate SVG coordinates
  },
  {
    id: 'tm-7',
    order: 7,
    wall: 1,
    pdfNumber: '7',
    displayCode: '7',
    topoLabel: '7',
    nameGr: 'Διαδρομή 7',
    nameEn: 'Route 7',
    uiaa: 'VII-',
    french: '6b',
    length: 8,
    bolts: 0,
    protectionRaw: 'Top rope*',
    isTopRopeOnly: true,
    settersRawGr: 'Δ. Τιτόπουλος - P. Bailey 1990',
    settersRawEn: 'D. Titopoulos - P. Bailey 1990',
    setters: ['Δ. Τιτόπουλος', 'P. Bailey'],
    year: 1990,
    defaultStars: 2,
    noteGr: 'Κάθετη έξοδος σε συμπαγή ασβεστόλιθο. Top rope.',
    noteEn: 'Direct vertical finish on compact grey rock. Top rope.',
    svgPath: null, // ARGON TASK: Calibrate SVG coordinates
  },
  {
    id: 'tm-8',
    order: 8,
    wall: 1,
    pdfNumber: '8',
    displayCode: '8',
    topoLabel: '8',
    nameGr: 'Διαδρομή 8',
    nameEn: 'Route 8',
    uiaa: 'V+',
    french: '5c',
    length: 8,
    bolts: 0,
    protectionRaw: 'Top rope*',
    isTopRopeOnly: true,
    settersRawGr: 'Μ. Ιδοσίδης - Γ. Μαρτζούκος - Ρ. Γιαννακόπουλος 1963',
    settersRawEn: 'M. Idosidis - G. Martzoukos - R. Giannakopoulos 1963',
    setters: ['Μ. Ιδοσίδης', 'Γ. Μαρτζούκος', 'Ρ. Γιαννακόπουλος'],
    year: 1963,
    defaultStars: 2,
    isClassic: true,
    noteGr: 'Κλασική γραμμή 5c του 1963, όμορφο ανάγλυφο βράχου. Top rope.',
    noteEn: 'Classic 1963 5c line on pleasant featured rock. Top rope.',
    svgPath: null, // ARGON TASK: Calibrate SVG coordinates
  },
  {
    id: 'tm-9',
    order: 9,
    wall: 1,
    pdfNumber: '9',
    displayCode: '9',
    topoLabel: '9',
    nameGr: 'Διαδρομή 9',
    nameEn: 'Route 9',
    uiaa: 'V',
    french: '5b',
    length: 6,
    bolts: 0,
    protectionRaw: 'Top rope*',
    isTopRopeOnly: true,
    settersRawGr: 'Δ. Τιτόπουλος - P. Bailey 1990',
    settersRawEn: 'D. Titopoulos - P. Bailey 1990',
    setters: ['Δ. Τιτόπουλος', 'P. Bailey'],
    year: 1990,
    defaultStars: 2,
    noteGr: 'Δεξιά άκρη του πεδίου, σύντομο πέρασμα 6μ σε καλά πιασίματα. Top rope.',
    noteEn: 'Far-right route of the crag, short 6m line on good jugs. Top rope.',
    svgPath: null, // ARGON TASK: Calibrate SVG coordinates
  },
];

export const MAKIS_SETTERS = [
  'Μ. Ιδοσίδης',
  'Γ. Μαρτζούκος',
  'Ρ. Γιαννακόπουλος',
  'Δ. Τιτόπουλος',
  'P. Bailey',
];

export const MAKIS_YEARS = [1963, 1990];
