import type { AreaLabel, Confidence } from '~/types/areas'
import { HOME_COPY_ID, type AscendLocale, formatAreaNameByLocale, translateFactorByLocale } from '~/utils/i18nCopy'

export interface LabelMeta {
  id: AreaLabel
  title: string
  shortTitle: string
  description: string
  color: string
  bgTint: string
  borderTint: string
  pattern: 'solid' | 'dots'
}

export const LABEL_META: Record<AreaLabel, LabelMeta> = {
  opportunity: {
    id: 'opportunity',
    title: 'Opportunity',
    shortTitle: 'Opportunity',
    description: 'Fewer coffee shops than local demand here typically supports.',
    color: '#10B981',
    bgTint: 'rgba(16, 185, 129, 0.14)',
    borderTint: 'rgba(16, 185, 129, 0.48)',
    pattern: 'solid',
  },
  fair: {
    id: 'fair',
    title: 'Fair',
    shortTitle: 'Fair',
    description: 'Current shop count sits within the normal range for local demand.',
    color: '#F59E0B',
    bgTint: 'rgba(245, 158, 11, 0.14)',
    borderTint: 'rgba(245, 158, 11, 0.45)',
    pattern: 'solid',
  },
  crowded: {
    id: 'crowded',
    title: 'Crowded',
    shortTitle: 'Crowded',
    description: 'More coffee shops already operate here than local demand typically supports.',
    color: '#EF4444',
    bgTint: 'rgba(239, 68, 68, 0.14)',
    borderTint: 'rgba(239, 68, 68, 0.45)',
    pattern: 'solid',
  },
  not_enough_demand: {
    id: 'not_enough_demand',
    title: 'Not enough demand',
    shortTitle: 'Low demand',
    description: 'Resident density and daily activity are currently too thin to support a new shop.',
    color: '#64748B',
    bgTint: 'rgba(100, 116, 139, 0.16)',
    borderTint: 'rgba(100, 116, 139, 0.45)',
    pattern: 'dots',
  },
}

export const CONFIDENCE_META: Record<Confidence, { title: string; note: string }> = {
  normal: {
    title: 'Normal confidence',
    note: 'Open map coverage in this neighborhood is sufficient for comparison.',
  },
  low: {
    title: 'Low confidence',
    note: 'Low confidence: open data may miss some outlets here, such as informal stalls.',
  },
}

export function translateFactorText(text: string, locale: AscendLocale = 'en'): string {
  return translateFactorByLocale(text, locale)
}

export function formatAreaName(areaName: 'kota_bandung' | 'telkom_area', locale: AscendLocale = 'en'): string {
  return formatAreaNameByLocale(areaName, locale)
}

export const HOME_COPY = {
  navbar: {
    brand: 'ASCEND',
    links: [
      { id: 'cara-kerja', label: 'How it works', href: '#cara-kerja' },
      { id: 'fitur', label: 'Features', href: '#fitur' },
      { id: 'tentang', label: 'About', href: '#tim' },
    ],
    cta: 'Open the map',
  },

  hero: {
    eyebrow: 'SELAMAT DATANG · NUSANTARA BUSINESS MAP',
    wordmark: 'ASCEND',
    wordmarkHoverNote: 'START SMALL · BUILD STEP BY STEP · REACH THE SUMMIT',
    headlineLine1: 'Find the room your first shop can',
    headlineLine2Prefix: 'still',
    headlineLine2Accent: 'fill.',
    subtitle:
      'Find where your first shop still has room, from a count of shops against what local demand typically supports, not a busy-street hunch.',
    businessCoffee: 'Coffee shop',
    businessEatery: 'Eatery',
    comingSoon: 'COMING SOON',
    eateryComingSoonTitle: 'Eatery & warung coverage is coming soon',
    eateryComingSoonBody:
      'Ascend currently ships live open-data coverage for Coffee shops across 1,976 areas. Eatery & warung mapping launches in the next release.',
    ctaPrimary: 'Open the map',
    ctaSecondary: 'See how it works',
    chatPlaceholder: 'Ask Ascend: where could a student open a coffee kiosk?',
    chatSubmitLabel: 'Preview',
    chatComingSoonBadge: 'COMING SOON · ASSISTANT PREVIEW',
    chatComingSoonBody:
      'Ask Ascend conversational search is coming soon in Phase 2. While chat filtering is in development, you can inspect all labeled neighborhoods directly on the live map.',
    chatChips: [
      {
        id: 'campuses',
        label: 'NEAR CAMPUSES',
        prompt: 'Where could a student open a coffee kiosk near campuses?',
        hint: 'Tip on the live map: use the search bar or Area filter to explore campus corridors and compare student footfall against active coffee shops.',
      },
      {
        id: 'quiet-blocks',
        label: 'QUIET BLOCKS WITH FEW RIVALS',
        prompt: 'Show me quiet blocks with few coffee shop rivals',
        hint: 'Tip on the live map: look for green Opportunity hexagons where active shops within 500 m sit well below what neighborhood demand typically supports.',
      },
      {
        id: 'low-confidence',
        label: 'AREAS WITH LOW CONFIDENCE',
        prompt: 'Which areas have low open-data confidence?',
        hint: 'Tip on the live map: hexagons with dashed white borders mark Low confidence areas where informal stalls may not be fully listed in open maps.',
      },
    ],
    journeyStages: [
      {
        id: 'pioneering' as const,
        step: '01',
        title: 'Pioneering',
        subtitle: 'Coffee kiosk & A-SHOP',
      },
      {
        id: 'expansion' as const,
        step: '02',
        title: 'Expansion',
        subtitle: 'Modern ruko commercial row',
      },
      {
        id: 'thriving' as const,
        step: '03',
        title: 'Thriving',
        subtitle: 'City landmark summit',
      },
    ],
    scrollHint: 'SCROLL',
    marketLedgeOpen: 'OPEN',
  },

  marqueeItems: [
    'KIOS',
    'WARUNG',
    'GEROBAK',
    'RUKO',
    'LAPAK',
    'KELONTONG',
    'KAKI LIMA',
    'PASAR',
  ],

  storyShowcase: {
    introWhisper: 'ENTERING THE NEIGHBORHOOD GRID',
    zoomHint: 'SCROLL TO ZOOM OUT',
    completeLabel: 'ASCEND · OPEN NEIGHBORHOOD SIGNALS',
    skipClip: 'Skip this clip',
    ariaLabel: 'Scroll-driven night city panorama',
  },

  background: {
    eyebrow: 'STREET REALITY',
    rightEyebrow: 'SUPPLY VS DEMAND · ~500 M',
    headlinePrefix: "Busy isn't",
    headlineAccent: 'room.',
    body: 'A packed street makes it tempting to assume buyers will walk right in. Behind that traffic, rivals often already outnumber what local demand can support. Ascend reveals the remaining space before rent is signed.',
    scaleLeft: 'BUSY',
    scaleCenter: 'FAIR',
    scaleRight: 'ROOM',
    scaleCaption: 'room exists here',
    scaleFootnote: 'ILLUSTRATIVE ~500 M COMPARISON',
    stages: [
      {
        id: 'crowded' as const,
        label: 'Crowded',
        position: 18,
        ratioText: '11 shops vs ~6 supported',
        pillText: 'busy, no room left',
        meaning: 'Busy curb, but rivals already exceed local demand.',
      },
      {
        id: 'fair' as const,
        label: 'Fair',
        position: 50,
        ratioText: '7 shops vs ~7 supported',
        pillText: 'matches demand',
        meaning: 'Active shops sit within normal local demand.',
      },
      {
        id: 'opportunity' as const,
        label: 'Opportunity',
        position: 82,
        ratioText: '3 shops vs ~8 supported',
        pillText: 'room exists here',
        meaning: 'Fewer shops than nearby demand typically supports.',
      },
    ],
  },

  blindspots: {
    eyebrow: 'WHAT THE STREET HIDES',
    headlinePrefix: 'Three things the',
    headlineAccent: 'eye',
    headlineSuffix: 'misses',
    items: [
      {
        index: '01',
        eyebrow: '01 / COMPETITION',
        title: "Crowding you can't see",
        description:
          'A storefront can look wide open from the curb while dozens of shops tucked into nearby lanes already share the same pool of regular buyers.',
        visualType: 'competition' as const,
      },
      {
        index: '02',
        eyebrow: '02 / DEMAND',
        title: "Demand that doesn't show",
        description:
          'Everyday customers come from residents, campuses, schools, offices, and transit stops within walking reach, not just passing vehicles.',
        visualType: 'demand' as const,
      },
      {
        index: '03',
        eyebrow: '03 / RENT',
        title: 'Rent comes before the answer',
        description:
          'First-time owners pay upfront leases long before the first cup is brewed. Checking supply against demand first turns guesswork into clarity.',
        visualType: 'rent' as const,
      },
    ],
  },

  portal: {
    scrollCue: 'SCROLL',
    eyebrow: 'ENTERING OPEN DATA SPACE',
    leadTitle: 'Go deeper into the map',
    layerTag: 'OPEN DATA LAYER · 1,976 AREAS',
    title: 'THE COUNTING LAYER',
    subtitle: 'Reading neighborhoods across the city from open places, roads, and everyday demand.',
  },

  solution: {
    eyebrow: 'HOW ASCEND COUNTS',
    headlinePrefix: 'Ascend does the',
    headlineAccent: 'counting.',
    lead: 'Instead of judging a narrow sidewalk spot, Ascend compares active shops against expected demand across each area and its six surrounding neighbors.',
    cardTitle: 'One neighborhood, two ways to look',
    tabSeen: 'WHAT YOU SEE',
    tabCounted: 'WHAT ASCEND COUNTS',
    callout: 'this area + 6 neighbors, about 500 m',
    seenCaption: 'Just streets, shopfronts, and visual impressions with no supply or demand counts.',
    legend: [
      { key: 'opportunity', label: 'Opportunity', color: '#10B981', type: 'opportunity' as const },
      { key: 'fair', label: 'Fair', color: '#F59E0B', type: 'fair' as const },
      { key: 'crowded', label: 'Crowded', color: '#EF4444', type: 'crowded' as const },
      { key: 'not_enough_demand', label: 'Not enough demand', color: '#64748B', type: 'not_enough_demand' as const },
      { key: 'low_confidence', label: 'Low confidence', color: '#94A3B8', type: 'low_confidence' as const },
    ],
  },

  features: {
    eyebrow: 'CORE CAPABILITIES',
    headlinePrefix: 'Seven ways to choose with',
    headlineAccent: 'numbers',
    headlineSuffix: ', not noise.',
    availableBadge: 'AVAILABLE',
    comingSoonBadge: 'COMING SOON',
    items: [
      {
        id: 'labeled-map',
        eyebrow: '01 / INTERACTIVE MAP',
        title: 'Labeled map',
        description:
          'Explore nearly two thousand hexagonal areas across active coverage zones with colorblind-safe labels and confidence markers.',
        status: 'available' as const,
        cols: 'md:col-span-6',
        layout: 'horizontal' as const,
        chamfer: true,
        href: '/map',
      },
      {
        id: 'area-card',
        eyebrow: '02 / AREA BRIEF',
        title: 'Area card',
        description:
          'Click any area to compare shops within 500 m, what demand typically supports, and its top three drivers.',
        status: 'available' as const,
        cols: 'md:col-span-6',
        layout: 'horizontal' as const,
        chamfer: true,
        href: '/map',
      },
      {
        id: 'shortlist',
        eyebrow: '03 / SAVED PICKS',
        title: 'Shortlist',
        description:
          'Save up to ten candidate areas locally in your browser with no account required, and jump back in one click.',
        status: 'available' as const,
        cols: 'md:col-span-4',
        layout: 'vertical' as const,
        chamfer: false,
        href: '/map',
      },
      {
        id: 'breakeven',
        eyebrow: '04 / COST SCENARIO',
        title: 'Break-even calculator',
        description:
          'Enter your own cup price, unit cost, and monthly rent to see daily break-even targets alongside area competition.',
        status: 'coming_soon' as const,
        cols: 'md:col-span-4',
        layout: 'vertical' as const,
        chamfer: false,
        href: null,
      },
      {
        id: 'ask-ascend',
        eyebrow: '05 / MAP ASSISTANT',
        title: 'Ask Ascend',
        description:
          'Describe your target buyers and preferred district so the assistant filters mapped areas and guides the map view.',
        status: 'coming_soon' as const,
        cols: 'md:col-span-4',
        layout: 'vertical' as const,
        chamfer: false,
        href: null,
      },
      {
        id: 'compare',
        eyebrow: '06 / SIDE BY SIDE',
        title: 'Compare areas',
        description:
          'Line up two to three shortlisted areas side by side to weigh market room, confidence levels, and demand drivers.',
        status: 'coming_soon' as const,
        cols: 'md:col-span-6',
        layout: 'horizontal' as const,
        chamfer: false,
        href: null,
      },
      {
        id: 'rent-check',
        eyebrow: '07 / LEASE CONTEXT',
        title: 'Rent check',
        description:
          'Record your own rent quotes privately in the browser and weigh them against local market room before signing.',
        status: 'coming_soon' as const,
        cols: 'md:col-span-6',
        layout: 'horizontal' as const,
        chamfer: false,
        href: null,
      },
    ],
  },

  howItWorks: {
    eyebrow: 'OPEN METHODOLOGY',
    headlinePrefix: 'Four steps from open data to a',
    headlineAccent: 'label.',
    steps: [
      {
        num: '01',
        eyebrow: 'STEP 01',
        title: 'Collect open data',
        description:
          'Gathers active places, street networks, public facilities, and population estimates from openly licensed map sources.',
        icon: 'database' as const,
      },
      {
        num: '02',
        eyebrow: 'STEP 02',
        title: 'Estimate what demand supports',
        description:
          'Measures how many shops a neighborhood typically supports based on residents, campuses, schools, offices, retail, and transit.',
        icon: 'compass' as const,
      },
      {
        num: '03',
        eyebrow: 'STEP 03',
        title: 'Compare and label',
        description:
          'Assigns Opportunity or Crowded only when the gap between actual shops and expected demand clearly exceeds random chance.',
        icon: 'scale' as const,
      },
      {
        num: '04',
        eyebrow: 'STEP 04',
        title: 'Explain in plain words',
        description:
          'Every area surfaces its three strongest demand drivers in plain everyday language, free of confusing statistical jargon.',
        icon: 'message' as const,
      },
    ],
    doesNotTitle: 'What Ascend does not do',
    doesNotEyebrow: 'HONEST BOUNDARIES',
    doesNotItems: [
      'No sales, profit, or business survival predictions from map data.',
      'Not financial advice or a replacement for official zoning and permit checks.',
      'Informal vendors are not fully counted in open data (shown as Low confidence).',
      'Coverage expands region by region; inspect active mapped zones directly on the live map.',
    ],
  },

  team: {
    eyebrow: 'TEAM ROSUN GANK · STACK 2026 (GDGoC ITB)',
    headlinePrefix: 'The team behind the',
    headlineAccent: 'map.',
    members: [
      {
        id: 'aziz',
        initials: 'AG',
        name: 'Azziz Abdul Ghofur',
        roleTag: 'LEAD · BUSINESS & PITCH',
        affiliation: 'B.Sc. Informatics · Class of 2023',
        bio: 'Leads the team and the business side of Ascend, shaping its value for first-time shop owners and how that story is pitched.',
        theme: 'emerald' as const,
        iconSet: 'business' as const,
        poses: ['/images/team/aziz-1.webp', '/images/team/aziz-2.webp'] as const,
      },
      {
        id: 'april',
        initials: 'AY',
        name: 'Aprilianza Muhammad Yusup',
        roleTag: 'PRODUCT & ML LEAD',
        affiliation: 'B.Sc. Informatics · Class of 2023',
        bio: 'Leads product direction and demand modeling across 1,976 mapped areas, turning neighborhood counts into clear Opportunity, Fair, and Crowded labels.',
        theme: 'amber' as const,
        iconSet: 'ml' as const,
        poses: ['/images/team/april-1.webp', '/images/team/april-2.webp'] as const,
      },
      {
        id: 'bill',
        initials: 'BS',
        name: 'Bill Stephen Sembiring',
        roleTag: 'FRONT-END & UI/UX',
        affiliation: 'B.Sc. Informatics · Class of 2023',
        bio: 'Designs the Luhur Signal visual system, interactive hexagon map, and scroll storytelling so neighborhood signals read effortlessly.',
        theme: 'violet' as const,
        iconSet: 'frontend' as const,
        poses: ['/images/team/bill-1.webp', '/images/team/bill-2.webp'] as const,
      },
      {
        id: 'nopri',
        initials: 'NS',
        name: 'Nopri Anita Libertiana Saragih',
        roleTag: 'DATA QUALITY & RESEARCH',
        affiliation: 'B.Sc. Informatics · Class of 2023',
        bio: 'Audits open map sources, street coverage, and local demand clues across active study zones so sparse areas stay clearly flagged.',
        theme: 'rose' as const,
        iconSet: 'research' as const,
        poses: ['/images/team/nopri-1.webp', '/images/team/nopri-2.webp'] as const,
      },
    ],
  },

  cta: {
    openBadge: 'OPEN',
    eyebrow: 'READY WHEN YOU ARE',
    headlinePrefix: 'Ready to find room for your',
    headlineAccent: 'first shop?',
    primaryBtn: 'Open the map',
    secondaryBtn: 'See how it works',
    footnote: 'FREE · NO ACCOUNT NEEDED',
  },

  footer: {
    captionChip: 'DEMAND COMES FROM PLACES LIKE THESE',
    routeNodes: [
      { id: 'campus', label: 'Campus' },
      { id: 'school', label: 'School' },
      { id: 'office', label: 'Office' },
      { id: 'station', label: 'Station' },
      { id: 'terminal', label: 'Terminal' },
      { id: 'market', label: 'Market' },
    ],
    plates: [
      { id: 'open-data', label: 'OPEN DATA ONLY' },
      { id: 'no-surveys', label: 'NO SURVEYS' },
      { id: 'no-listings', label: 'NO LISTINGS' },
    ],
    links: [
      { id: 'about' as const, label: 'About' },
      { id: 'licenses' as const, label: 'Data & licenses' },
      { id: 'privacy' as const, label: 'Privacy' },
    ],
    dataSourcesLine:
      'DATA SOURCES: OPENSTREETMAP CONTRIBUTORS · OVERTURE MAPS FOUNDATION · WORLDPOP · OPENFREEMAP / OPENMAPTILES',
    disclaimer: 'Estimate based on open data. Not financial advice.',
    thanks: 'Terima kasih',
  },

  mapPage: {
    backToHome: 'Home',
    sampleBadge: 'Sample data',
    coffeeWithin500m: 'Coffee shops within about 500 m',
    demandSupports: 'Demand typically supports about',
    drivesTitle: 'What drives demand at this spot',
    cardFootnote:
      'Estimate based on open data. Not financial advice. Check zoning and permits with official sources before signing a lease.',
    saveShortlist: 'Save to shortlist',
    savedShortlist: 'Saved ✓',
    shortlistTitle: 'Shortlist',
    shortlistEmptyTitle: 'No saved areas yet',
    shortlistEmptyBody:
      'Click any hexagon on the map to inspect an area card, then save up to 10 candidate spots here.',
    unnamedArea: 'Unnamed area',
    retry: 'Retry',
    loadError: 'Could not load Ascend map data. Check your connection or try loading the dataset again.',
  },
} as const

export function getHomeCopy(locale: AscendLocale) {
  return locale === 'id' ? HOME_COPY_ID : HOME_COPY
}
