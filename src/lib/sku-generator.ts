/**
 * Comprehensive Industry-Standard Hardware, Paint, Tool & Building Material SKU Dictionary
 */
export const HARDWARE_SKU_MAP: Record<string, string> = {
  // --- Paint Colors & Finishes ---
  WHITE: 'WHT',
  BLACK: 'BLK',
  RED: 'RED',
  BLUE: 'BLU',
  GREEN: 'GRN',
  YELLOW: 'YLW',
  GREY: 'GRY',
  GRAY: 'GRY',
  BROWN: 'BRN',
  ORANGE: 'ORG',
  PINK: 'PNK',
  GOLD: 'GLD',
  SILVER: 'SLV',
  CLEAR: 'CLR',
  TRANSPARENT: 'CLR',
  PURPLE: 'PRP',
  VIOLET: 'VLT',
  BEIGE: 'BGE',
  CREAM: 'CRM',
  IVORY: 'IVR',
  BRONZE: 'BRZ',
  CHROME: 'CHR',
  COPPER: 'CPR',
  MATTE: 'MAT',
  GLOSS: 'GLS',
  GLOSSY: 'GLS',
  SATIN: 'STN',
  METALLIC: 'MTL',
  SEMI: 'SEM',
  SHEEN: 'SHN',
  EGGSHELL: 'EGS',

  // --- Paints, Coatings, Chemicals & Adhesives ---
  PAINT: 'PNT',
  PAINTS: 'PNT',
  PRIMER: 'PRM',
  ENAMEL: 'ENM',
  EMULSION: 'EML',
  DISTEMPER: 'DST',
  VARNISH: 'VRN',
  THINNER: 'THN',
  PUTTY: 'PTY',
  SEALANT: 'SLT',
  ADHESIVE: 'ADH',
  GLUE: 'GLU',
  SILICONE: 'SIL',
  TAPE: 'TAP',
  EPOXY: 'EPX',
  RESIN: 'RSN',
  SOLVENT: 'SLV',
  CEMENT: 'CMT',
  CONCRETE: 'CNC',
  PLASTER: 'PLS',
  GROUT: 'GRT',
  LUBRICANT: 'LUB',
  GREASE: 'GRS',
  OIL: 'OIL',
  COATING: 'CTG',
  RUST: 'RST',
  CLEANER: 'CLN',
  POLISH: 'POL',
  SPRAY: 'SPR',
  WATERPROOF: 'WPF',
  WATERPROOFING: 'WPF',
  ACID: 'ACD',
  STAIN: 'STN',
  WAX: 'WAX',

  // --- Tools & Painting Accessories ---
  HAMMER: 'HMR',
  DRILL: 'DRL',
  SCREWDRIVER: 'SDR',
  WRENCH: 'WRC',
  SPANNER: 'SPN',
  PLIERS: 'PLR',
  CUTTER: 'CTR',
  SAW: 'SAW',
  HACKSAW: 'HSW',
  BLADE: 'BLD',
  LEVEL: 'LVL',
  TROWEL: 'TRW',
  BRUSH: 'BRS',
  ROLLER: 'RLR',
  SANDER: 'SND',
  SANDPAPER: 'SPD',
  GRINDER: 'GND',
  CLAMP: 'CLP',
  CHISEL: 'CSL',
  VISE: 'VIS',
  VICE: 'VIS',
  MEASURE: 'MSR',
  LADDER: 'LDR',
  TORCH: 'TCH',
  TESTER: 'TST',
  MULTIMETER: 'MMT',
  GUN: 'GUN',
  CAULKING: 'CLK',
  TRAY: 'TRY',
  SCRAPER: 'SCR',
  SPATULA: 'SPT',
  BLOWER: 'BLW',
  MIXER: 'MXR',
  ROUTER: 'RTR',
  FILE: 'FIL',
  PUNCH: 'PCH',

  // --- Fasteners & Hardware Fixtures ---
  SCREW: 'SCR',
  SCREWS: 'SCR',
  NAIL: 'NAL',
  NAILS: 'NAL',
  BOLT: 'BLT',
  BOLTS: 'BLT',
  NUT: 'NUT',
  NUTS: 'NUT',
  WASHER: 'WSR',
  WASHERS: 'WSR',
  ANCHOR: 'ANC',
  RAWLPLUG: 'RPL',
  RIVET: 'RVT',
  HINGE: 'HNG',
  HINGES: 'HNG',
  HANDLE: 'HDL',
  HANDLES: 'HDL',
  LOCK: 'LCK',
  PADLOCK: 'PLK',
  LATCH: 'LTC',
  BRACKET: 'BKT',
  BRACKETS: 'BKT',
  KNOB: 'KNB',
  HOOK: 'HOK',
  HOOKS: 'HOK',
  CHAIN: 'CHN',
  WIRE: 'WIR',
  CABLE: 'CBL',
  ROPE: 'ROP',
  SPRING: 'SPR',
  CASTOR: 'CST',
  CASTER: 'CST',
  WHEEL: 'WHL',
  STUD: 'STD',
  THREAD: 'THD',
  FASTENER: 'FST',

  // --- Plumbing & Sanitary ---
  PIPE: 'PIP',
  PIPES: 'PIP',
  VALVE: 'VLV',
  VALVES: 'VLV',
  FITTING: 'FTG',
  FITTINGS: 'FTG',
  ELBOW: 'ELB',
  TEE: 'TEE',
  COUPLING: 'CPL',
  NIPPLE: 'NPL',
  REDUCER: 'RDC',
  FLANGE: 'FLG',
  UNION: 'UNN',
  BUSHING: 'BSH',
  FAUCET: 'FCT',
  TAP: 'TAP',
  SINK: 'SNK',
  DRAIN: 'DRN',
  TRAP: 'TRP',
  HOSE: 'HOS',
  PUMP: 'PMP',
  GASKET: 'GSK',
  SHOWER: 'SWR',
  TANK: 'TNK',
  CISTERN: 'CST',
  BIBCOCK: 'BCK',
  PILLAR: 'PLR',
  STOPCOCK: 'SCK',
  BALL: 'BAL',
  GATE: 'GAT',
  CHECK: 'CHK',

  // --- Electrical & Lighting ---
  SWITCH: 'SWT',
  SWITCHES: 'SWT',
  SOCKET: 'SKT',
  SOCKETS: 'SKT',
  PLUG: 'PLG',
  BULB: 'BLB',
  LAMP: 'LMP',
  LIGHT: 'LGT',
  LED: 'LED',
  TUBE: 'TUB',
  TUBELIGHT: 'TLGT',
  PANEL: 'PNL',
  CONDUIT: 'CDT',
  CASING: 'CSG',
  BREAKER: 'BKR',
  MCB: 'MCB',
  RCCB: 'RCCB',
  ELCB: 'ELCB',
  FUSE: 'FUS',
  ADAPTER: 'ADP',
  BATTERY: 'BAT',
  INVERTER: 'INV',
  TRANSFORMER: 'XFR',
  MOTOR: 'MTR',
  SENSOR: 'SNR',
  RELAY: 'RLY',
  HEATER: 'HTR',
  GEYSER: 'GYS',
  FAN: 'FAN',
  EXHAUST: 'EXH',
  STRIP: 'STP',
  HOLDER: 'HLD',
  DIMMER: 'DMR',
  CHIME: 'CHM',
  BELL: 'BEL',

  // --- Materials & Metallurgy ---
  STEEL: 'STL',
  STAINLESS: 'SS',
  IRON: 'IRN',
  CAST: 'CST',
  BRASS: 'BRS',
  ALUMINUM: 'ALU',
  ALUMINIUM: 'ALU',
  PLASTIC: 'PLS',
  PVC: 'PVC',
  CPVC: 'CPVC',
  UPVC: 'UPVC',
  HDPE: 'HDPE',
  PPR: 'PPR',
  WOOD: 'WOD',
  TIMBER: 'TMB',
  PLYWOOD: 'PLY',
  GLASS: 'GLS',
  RUBBER: 'RBR',
  CERAMIC: 'CRM',
  FIBER: 'FBR',
  FIBERGLASS: 'FBG',
  NYLON: 'NYL',
  ZINC: 'ZNC',
  GALVANIZED: 'GI',
  MILD: 'MLD',
  LEATHER: 'LTH',

  // --- Common Specifiers, Sizes & Grades ---
  HEAVY: 'HVY',
  DUTY: 'DTY',
  MEDIUM: 'MED',
  SMALL: 'SML',
  LARGE: 'LRG',
  EXTRA: 'XTR',
  LONG: 'LNG',
  SHORT: 'SHT',
  THICK: 'THK',
  THIN: 'THN',
  ROUND: 'RND',
  SQUARE: 'SQR',
  FLAT: 'FLT',
  HEX: 'HEX',
  FLEXIBLE: 'FLX',
  RIGID: 'RGD',
  ELECTRIC: 'ELC',
  MANUAL: 'MNL',
  AUTOMATIC: 'AUT',
  DIGITAL: 'DIG',
  ANALOG: 'ALG',
  UNIVERSAL: 'UNI',
  STANDARD: 'STD',
  PREMIUM: 'PRM',
  PROFESSIONAL: 'PRO',
  MINI: 'MNI',
  SUPER: 'SPR',
  INTERIOR: 'INT',
  EXTERIOR: 'EXT',
  HIGH: 'HI',
  LOW: 'LOW',
  POWER: 'PWR',
  PORTABLE: 'PRT',
  RECHARGEABLE: 'RCH',
  CORDLESS: 'CDL',
  DOUBLE: 'DBL',
  SINGLE: 'SGL',
  TRIPLE: 'TPL',
  SET: 'SET',
  KIT: 'KIT',
  PACK: 'PCK',
  BOX: 'BOX',
  PAIR: 'PR',
  PIECE: 'PCS',
  PIECES: 'PCS',
};

/**
 * Generate a clean, industry-standard SKU barcode string from product name.
 * 
 * Logic:
 * 1. Sanitizes punctuation (retains standard alphanumeric, numbers, and measurement specs like 10MM, 1/2, 5L, 20W).
 * 2. Checks each word against HARDWARE_SKU_MAP.
 * 3. If word is in map -> uses the mapped abbreviation.
 * 4. If word is pure digits / dimension format (e.g. 5L, 10MM, 20W, 100M, 1/2) -> preserves cleanly.
 * 5. Otherwise -> falls back to the first 3 letters of the word.
 * 6. Joins terms with hyphens ('-') without trailing random numbers.
 */
export function generateHardwareSku(prodName: string): string {
  if (!prodName || !prodName.trim()) return '';

  // Clean and normalize input string
  const normalized = prodName
    .trim()
    .toUpperCase()
    // Convert common fraction notations e.g. 1/2" or 3/4" to 1-2 or 3-4
    .replace(/(\d+)\/(\d+)/g, '$1-$2')
    // Remove symbols except hyphens, letters, and numbers
    .replace(/[^A-Z0-9\s-]/g, '')
    .trim();

  const words = normalized.split(/[\s_]+/).filter(Boolean);

  if (words.length === 0) return '';

  const skuParts: string[] = [];

  for (const word of words) {
    // If exact match in dictionary map
    if (HARDWARE_SKU_MAP[word]) {
      skuParts.push(HARDWARE_SKU_MAP[word]);
      continue;
    }

    // Check if word contains hyphens from fraction e.g. "1-2"
    if (/^\d+-\d+$/.test(word)) {
      skuParts.push(word);
      continue;
    }

    // Check if word is a pure number or measurement/dimension (e.g., "500W", "10MM", "20KG", "5L", "2M", "14IN", "M8", "12V")
    if (/^\d+[A-Z]*$/.test(word) || /^[A-Z]\d+$/.test(word)) {
      skuParts.push(word);
      continue;
    }

    // Fallback: take first 3 alphanumeric characters
    const cleanWord = word.replace(/[^A-Z0-9]/g, '');
    if (cleanWord.length > 0) {
      skuParts.push(cleanWord.substring(0, Math.min(3, cleanWord.length)));
    }
  }

  return skuParts.join('-');
}
