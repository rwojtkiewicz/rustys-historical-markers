import { HistoricalMarker, DrivingRoute } from '../types';
import { PLATTE_COUNTY_MARKERS } from './markers/missouri/greater-kansas-city/platte-county';

const BASE_MARKERS: HistoricalMarker[] = [
  // --- ST. LOUIS & EASTERN MISSOURI ---
  {
    id: 'marker-gateway-arch',
    title: 'Gateway Arch & National Expansion',
    subtitle: 'The Gateway to the American West',
    plaqueText:
      'Standing 630 feet tall on the west bank of the Mississippi River in St. Louis, the Gateway Arch commemorates Thomas Jefferson\'s Louisiana Purchase of 1803 and the westward expansion of the United States. Designed by architect Eero Saarinen in 1947 and completed in 1965, it remains the tallest national monument in the Western Hemisphere.',
    category: 'Frontier & Pioneer',
    era: '1803 / 1965',
    lat: 38.6247,
    lng: -90.1848,
    locationName: '11 North 4th Street',
    city: 'St. Louis',
    state: 'MO',
    yearErected: 1965,
    markerNumber: 'MO-STL-01',
    routeIds: ['route-66-missouri', 'route-mississippi-river-mo', 'route-i70-heritage-mo'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
        caption: 'The Gateway Arch rising above St. Louis Riverfront',
        isPlaquePhoto: false,
      },
    ],
    historicalContext:
      'St. Louis served as the departure hub for the Lewis and Clark Expedition in 1804 and tens of thousands of pioneers heading west along the Oregon, Santa Fe, and California Trails.',
  },
  {
    id: 'marker-chain-of-rocks',
    title: 'Historic Chain of Rocks Bridge',
    subtitle: 'Route 66 22-Degree Bend Over the Mississippi',
    plaqueText:
      'Opened in 1929, this 5,353-foot bridge carried historic U.S. Route 66 traffic over the Mississippi River into Missouri. Famous for its unique 22-degree bend in the middle, engineered to allow river barges safe passage through treacherous bedrock rapids below.',
    category: 'Architecture',
    era: '1929',
    lat: 38.7611,
    lng: -90.1764,
    locationName: 'Chain of Rocks Road',
    city: 'St. Louis',
    state: 'MO',
    yearErected: 1996,
    markerNumber: 'MO-R66-01',
    routeIds: ['route-66-missouri'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
        caption: 'Historic Truss Bridge spanning the Mississippi River',
        isPlaquePhoto: false,
      },
    ],
    historicalContext:
      'The bridge was a key landmark for Route 66 travelers crossing between Illinois and Missouri for nearly four decades.',
  },
  {
    id: 'marker-dred-scott',
    title: 'Old Courthouse & Dred Scott Freedom Trial',
    subtitle: 'Pivotal Civil Rights Landmark of the American Legal System',
    plaqueText:
      'In 1847 and 1850, enslaved African Americans Dred and Harriet Scott filed suit for their freedom in this historic St. Louis court, arguing that living in free northern territories made them free. The resulting 1857 U.S. Supreme Court ruling inflamed national anti-slavery sentiments, accelerating the American Civil War.',
    category: 'Civil Rights',
    era: '1847',
    lat: 38.6257,
    lng: -90.1893,
    locationName: '11 North 4th Street',
    city: 'St. Louis',
    state: 'MO',
    yearErected: 1970,
    markerNumber: 'MO-STL-02',
    routeIds: ['route-mississippi-river-mo'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Dome of the Old Courthouse in Downtown St. Louis',
        isPlaquePhoto: false,
      },
    ],
    historicalContext:
      'The 1857 Dred Scott decision is widely regarded by historians as one of the most consequential legal precedents in U.S. history.',
  },
  {
    id: 'marker-ted-drewes',
    title: 'Ted Drewes Frozen Custard - Route 66',
    subtitle: 'St. Louis Route 66 Landmark Since 1929',
    plaqueText:
      'Serving its famous "concrete" milkshakes upside down since the 1930s, Ted Drewes on Chippewa Street became an essential pit-stop for generations of Route 66 road-trippers entering Missouri. Founded by Ted Drewes Sr., the stand remains a world-renowned roadside icon.',
    category: 'Cultural Heritage',
    era: '1929',
    lat: 38.5888,
    lng: -90.3061,
    locationName: '6726 Chippewa Street',
    city: 'St. Louis',
    state: 'MO',
    yearErected: 1985,
    markerNumber: 'MO-R66-04',
    routeIds: ['route-66-missouri'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
        caption: 'Historic Route 66 Roadside Stand',
        isPlaquePhoto: true,
      },
    ],
    historicalContext:
      'The motto "It\'s Really Good!" was coined by Ted Drewes Sr. and remains a beloved Missouri highway tradition.',
  },

  // --- CENTRAL MISSOURI & OZARKS ---
  {
    id: 'marker-meramec-caverns',
    title: 'Meramec Caverns - Jesse James Hideout',
    subtitle: 'Historic Ozark Cave System Along Route 66',
    plaqueText:
      'Carved from limestone over 400 million years, these 4.6-mile Ozark caverns served as a saltpeter magazine during the Civil War and a legendary hideout for outlaw Jesse James and the James-Younger Gang in the 1870s. In 1935, Lester Dill opened it as a pioneer attraction along Route 66.',
    category: 'Outlaw & Lore',
    era: '1870s',
    lat: 38.2435,
    lng: -91.1558,
    locationName: '1135 Hwy W',
    city: 'Stanton',
    state: 'MO',
    yearErected: 1935,
    markerNumber: 'MO-R66-02',
    routeIds: ['route-66-missouri'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        caption: 'Limestone Formations Inside Meramec Caverns',
        isPlaquePhoto: false,
      },
    ],
    historicalContext:
      'Jesse and Frank James used the river cave\'s underwater exits to evade law enforcement after train and bank robberies.',
  },
  {
    id: 'marker-churchill-fulton',
    title: 'National Churchill Museum & "Iron Curtain" Site',
    subtitle: 'Birthplace of Cold War Geopolitics at Westminster College',
    plaqueText:
      'On March 5, 1946, former British Prime Minister Winston Churchill delivered his famous "Sinews of Peace" address in Fulton, declaring: "From Stettin in the Baltic to Trieste in the Adriatic, an iron curtain has descended across the Continent." This historic speech defined Cold War policy.',
    category: 'Notable Figures',
    era: '1946',
    lat: 38.8471,
    lng: -91.9546,
    locationName: 'Westminster College, 501 Westminster Ave',
    city: 'Fulton',
    state: 'MO',
    yearErected: 1969,
    markerNumber: 'MO-HIST-15',
    routeIds: ['route-i70-heritage-mo'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1569974498991-d3c12a504f9c?auto=format&fit=crop&w=1200&q=80',
        caption: 'Historic St. Mary the Virgin Church at Fulton',
        isPlaquePhoto: false,
      },
    ],
    historicalContext:
      'The museum includes the restored 17th-century London church of St. Mary the Virgin, Aldermanbury, which was dismantled in London and rebuilt on campus in Fulton.',
  },
  {
    id: 'marker-hermann-winery',
    title: 'Hermann Historic German Settlement & Wine Country',
    subtitle: '19th Century German Colony on the Missouri River',
    plaqueText:
      'Founded in 1837 by the German School Society of Philadelphia to preserve German language and culture in North America. By the 1880s, Hermann\'s terraced Missouri River hills produced over 3 million gallons of wine annually, becoming one of the largest wine producing regions in the world.',
    category: 'Cultural Heritage',
    era: '1837',
    lat: 38.7042,
    lng: -91.4377,
    locationName: 'Wharf Street & Missouri River',
    city: 'Hermann',
    state: 'MO',
    yearErected: 1972,
    markerNumber: 'MO-HIST-08',
    routeIds: ['route-i70-heritage-mo'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
        caption: 'Terraced Vineyards Overlooking the Missouri River Valley',
        isPlaquePhoto: false,
      },
    ],
    historicalContext:
      'Hermann rootstocks helped save European vineyards during the Great French Wine Blight (phylloxera epidemic) in the late 19th century.',
  },

  // --- MISSISSIPPI RIVER & NORTHERN MISSOURI ---
  {
    id: 'marker-mark-twain',
    title: 'Mark Twain Boyhood Home & Historic District',
    subtitle: 'Inspiration for Tom Sawyer and Huckleberry Finn',
    plaqueText:
      'Samuel Langhorne Clemens (Mark Twain) lived in this Hannibal home from 1839 to 1853. The steamboat traffic, whitewashed fences, and limestone bluffs along the Mississippi River directly inspired his literary masterpieces, capturing 19th-century frontier river town life.',
    category: 'Notable Figures',
    era: '1840s',
    lat: 39.7101,
    lng: -91.3562,
    locationName: '120 North Main Street',
    city: 'Hannibal',
    state: 'MO',
    yearErected: 1912,
    markerNumber: 'MO-RIVER-01',
    routeIds: ['route-mississippi-river-mo'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
        caption: 'Mark Twain\'s Boyhood Home and Whitewashed Fence',
        isPlaquePhoto: false,
      },
    ],
    historicalContext:
      'Mark Twain took his pen name from the Mississippi riverboat call meaning "two fathoms deep" (safe water for navigation).',
  },
  {
    id: 'marker-ste-genevieve',
    title: 'Ste. Genevieve French Colonial District',
    subtitle: 'Oldest European Settlement in Missouri',
    plaqueText:
      'Founded around 1735 by French Canadian settlers along the west bank of the Mississippi River, Ste. Genevieve preserves North America\'s highest concentration of French Colonial vertical-log "poteaux-en-terre" architecture, pre-dating the Louisiana Purchase.',
    category: 'Architecture',
    era: '1735',
    lat: 37.9789,
    lng: -90.0432,
    locationName: '66 S Main Street',
    city: 'Ste. Genevieve',
    state: 'MO',
    yearErected: 1960,
    markerNumber: 'MO-HIST-01',
    routeIds: ['route-mississippi-river-mo'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1548625361-18da3a16bf15?auto=format&fit=crop&w=1200&q=80',
        caption: 'French Colonial Vertical-Log Architecture in Ste. Genevieve',
        isPlaquePhoto: false,
      },
    ],
    historicalContext:
      'Historic homes such as the Bolduc House and Beauvais-Amoureux House feature original French colonial hip roofs and wide wraparound galleries.',
  },

  // --- KANSAS CITY & WESTERN MISSOURI ---
  {
    id: 'marker-pony-express',
    title: 'Pony Express National Museum & Pikes Peak Stables',
    subtitle: 'Starting Point of the Legendary Overland Mail Service',
    plaqueText:
      'On April 3, 1860, rider Johnny Fry galloped out of these St. Joseph stables carrying the first leather mochila mail pouch bound for Sacramento, California. Covering 1,966 miles in just 10 days, the Pony Express bound a divided nation before transcontinental telegraph wires crossed the continent.',
    category: 'Pioneer & Trails',
    era: '1860',
    lat: 39.7588,
    lng: -94.8519,
    locationName: '914 Penn Street',
    city: 'St. Joseph',
    state: 'MO',
    yearErected: 1950,
    markerNumber: 'MO-PONY-01',
    routeIds: ['route-pioneer-trails-mo'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
        caption: 'Pikes Peak Stables Brick Facade in St. Joseph',
        isPlaquePhoto: false,
      },
    ],
    historicalContext:
      'Pony Express riders changed horses every 10 to 15 miles, riding through rugged wilderness and enduring extreme weather.',
  },
  {
    id: 'marker-truman-home',
    title: 'Harry S. Truman National Historic Site',
    subtitle: 'Home of the 33rd President of the United States',
    plaqueText:
      'This Victorian residence in Independence served as the home of President Harry S. Truman and First Lady Bess Wallace Truman. Known as the "Summer White House" during his presidency (1945-1953), Truman made monumental decisions here including the Marshall Plan and NATO creation.',
    category: 'Notable Figures',
    era: '1945',
    lat: 39.0917,
    lng: -94.4217,
    locationName: '219 N Delaware Street',
    city: 'Independence',
    state: 'MO',
    yearErected: 1983,
    markerNumber: 'MO-TRUMAN-01',
    routeIds: ['route-pioneer-trails-mo', 'route-i70-heritage-mo'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
        caption: 'The Truman Home in Independence',
        isPlaquePhoto: false,
      },
    ],
    historicalContext:
      'Truman was famous for taking daily brisk morning walks through the streets of Independence greeting neighbors throughout his retirement.',
  },
  {
    id: 'marker-kc-union-station',
    title: 'Union Station Kansas City & Gangster History Site',
    subtitle: 'Beaux-Arts Architectural Landmark & Historic Rail Hub',
    plaqueText:
      'Opened in 1914 as a premier transcontinental passenger depot, this 850,000-square-foot station hosted millions of travelers and WWII troops. On June 17, 1933, bullet holes were left in its stone facade during the infamous gangster shootout known as the Kansas City Massacre.',
    category: 'Architecture',
    era: '1914',
    lat: 39.0858,
    lng: -94.5858,
    locationName: '30 West Pershing Road',
    city: 'Kansas City',
    state: 'MO',
    yearErected: 1999,
    markerNumber: 'MO-KC-01',
    routeIds: ['route-pioneer-trails-mo', 'route-i70-heritage-mo'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
        caption: 'Grand Hall of Union Station Kansas City',
        isPlaquePhoto: false,
      },
    ],
    historicalContext:
      'Union Station is the second-largest working train station in the United States, featuring a 95-foot grand hall ceiling.',
  },

  // --- SOUTHWEST MISSOURI & OZARKS ---
  {
    id: 'marker-wilsons-creek',
    title: 'Wilson\'s Creek National Battlefield',
    subtitle: 'First Major Civil War Engagement West of the Mississippi',
    plaqueText:
      'On August 10, 1861, Union General Nathaniel Lyon\'s forces clashed with Confederate and Missouri State Guard forces southwest of Springfield. General Lyon became the first Union general killed in action during the Civil War while leading charges on Bloody Hill.',
    category: 'Civil War',
    era: '1861',
    lat: 37.1147,
    lng: -93.4158,
    locationName: '6424 M Hwy',
    city: 'Republic',
    state: 'MO',
    yearErected: 1960,
    markerNumber: 'MO-CW-01',
    routeIds: ['route-66-missouri'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Bloody Hill Memorial Field at Wilson\'s Creek',
        isPlaquePhoto: false,
      },
    ],
    historicalContext:
      'The battle secured Missouri for Union control early in the war despite an initial tactical Union retreat.',
  },
  {
    id: 'marker-66-drive-in',
    title: 'Historic 66 Drive-In Theatre',
    subtitle: 'Golden Era Route 66 Outdoor Cinema Landmark',
    plaqueText:
      'Opened on September 22, 1949, along Route 66 in Carthage, this 9-acre theater features its original neon sign and a 66-foot steel screen tower. It stands as one of the few continuously operating drive-in theaters along Mother Road.',
    category: 'Cultural Heritage',
    era: '1949',
    lat: 37.1654,
    lng: -94.3312,
    locationName: '17231 Old 66 Hwy',
    city: 'Carthage',
    state: 'MO',
    yearErected: 1998,
    markerNumber: 'MO-R66-03',
    routeIds: ['route-66-missouri'],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
        caption: 'Original Neon Sign Tower at 66 Drive-In Carthage',
        isPlaquePhoto: true,
      },
    ],
    historicalContext:
      'During the peak of Route 66 travel in the 1950s, drive-in theaters provided evening entertainment for motoring families.',
  },
];

export const HISTORICAL_MARKERS: HistoricalMarker[] = PLATTE_COUNTY_MARKERS;

export const PRESET_ROUTES: DrivingRoute[] = [
  {
    id: 'route-platte-county-heritage',
    name: 'Platte County Heritage Driving Tour',
    subtitle: 'Weston 1837, Parkville Riverfront & Platte City Courthouse',
    description:
      'Explore 45 miles of historic Missouri River bluff country across Platte County. Discover the antebellum town of Weston, the Civil War skirmish at Paw Paw Fort in Parkville, Platte City\'s historic square, and Lewis & Clark campsite markers.',
    region: 'Greater Kansas City (Platte County, MO)',
    distanceMiles: 46.5,
    approxDriveTimeHours: 1.5,
    coverPhoto: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    startPoint: { name: 'Renner Village Site, Riverside', lat: 39.1758, lng: -94.6151 },
    endPoint: { name: 'Camden Point Veterans Memorial', lat: 39.4534, lng: -94.7562 },
    waypoints: [
      { lat: 39.1758, lng: -94.6151, label: 'Renner Village Site' },
      { lat: 39.1891, lng: -94.6832, label: 'Parkville Farmers Bank & Paw Paw Fort' },
      { lat: 39.2818, lng: -94.8315, label: 'Farley - Sheriff Dillingham' },
      { lat: 39.4092, lng: -94.9033, label: 'Weston Historic District' },
      { lat: 39.4579, lng: -94.9696, label: 'Iatan / Cow Island' },
      { lat: 39.3702, lng: -94.7837, label: 'Platte City Courthouse & Anchor' },
      { lat: 39.4534, lng: -94.7562, label: 'Camden Point Veterans Memorial' },
    ],
    bounds: {
      north: 39.5,
      south: 39.15,
      east: -94.6,
      west: -95.0,
    },
    markerIds: [
      'hmdb-73531',
      'hmdb-65995',
      'hmdb-65997',
      'hmdb-40986',
      'hmdb-44509',
      'hmdb-44521',
      'hmdb-44567',
      'hmdb-63521',
      'hmdb-254872',
      'hmdb-22004',
    ],
  },
  {
    id: 'route-weston-historic',
    name: 'Weston 1837 Antebellum Walking & Driving Tour',
    subtitle: 'Preserved 1840s Brick Architecture, Burley Tobacco & Civil War Era',
    description:
      'Stroll through Weston\'s nationally recognized historic district established in 1837. Visit the St. George Hotel (1847), Doppler Building (1856), Cody House (1845), Dinah Robinson Courtyard, and historic Laurel Hill Cemetery.',
    region: 'Platte County, MO (Weston)',
    distanceMiles: 3.2,
    approxDriveTimeHours: 0.5,
    coverPhoto: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
    startPoint: { name: 'Weston Historical Museum, Main St', lat: 39.4117, lng: -94.901 },
    endPoint: { name: 'Laurel Hill Cemetery, Welt St', lat: 39.4152, lng: -94.8979 },
    waypoints: [
      { lat: 39.4117, lng: -94.901, label: 'Weston History Museum' },
      { lat: 39.4113, lng: -94.9015, label: 'St. George Hotel (1847)' },
      { lat: 39.4111, lng: -94.9019, label: 'Doppler Building (1856)' },
      { lat: 39.4117, lng: -94.9009, label: 'Cody House (1845)' },
      { lat: 39.412, lng: -94.9016, label: 'Dinah Robinson Courtyard' },
      { lat: 39.4152, lng: -94.8979, label: 'Laurel Hill Cemetery' },
    ],
    bounds: {
      north: 39.42,
      south: 39.4,
      east: -94.89,
      west: -94.91,
    },
    markerIds: [
      'hmdb-77143',
      'hmdb-44531',
      'hmdb-44529',
      'hmdb-44543',
      'hmdb-302066',
      'hmdb-77293',
      'hmdb-77296',
    ],
  },
  {
    id: 'route-66-missouri',
    name: 'Route 66 Missouri Mother Road Byway',
    subtitle: 'St. Louis to Carthage Historic Highway (MO U.S. 66)',
    description:
      'Drive 290 miles across Missouri on historic Route 66, crossing the Mississippi River at Chain of Rocks, visiting Meramec Caverns, Civil War battlefields, and classic neon drive-ins.',
    region: 'Missouri (St. Louis to Carthage)',
    distanceMiles: 290.0,
    approxDriveTimeHours: 4.5,
    coverPhoto: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    startPoint: { name: 'Chain of Rocks Bridge, St. Louis', lat: 38.7611, lng: -90.1764 },
    endPoint: { name: '66 Drive-In, Carthage', lat: 37.1654, lng: -94.3312 },
    waypoints: [
      { lat: 38.7611, lng: -90.1764, label: 'Chain of Rocks Bridge' },
      { lat: 38.6247, lng: -90.1848, label: 'Gateway Arch St. Louis' },
      { lat: 38.5888, lng: -90.3061, label: 'Ted Drewes Route 66' },
      { lat: 38.2435, lng: -91.1558, label: 'Meramec Caverns' },
      { lat: 37.1147, lng: -93.4158, label: 'Wilson\'s Creek Battlefield' },
      { lat: 37.1654, lng: -94.3312, label: '66 Drive-In Carthage' },
    ],
    bounds: {
      north: 38.9,
      south: 36.9,
      east: -90.0,
      west: -94.5,
    },
    markerIds: [
      'marker-chain-of-rocks',
      'marker-gateway-arch',
      'marker-ted-drewes',
      'marker-meramec-caverns',
      'marker-wilsons-creek',
      'marker-66-drive-in',
    ],
  },
  {
    id: 'route-mississippi-river-mo',
    name: 'Great River Road Missouri (MO Hwy 61)',
    subtitle: 'Mark Twain River Coast to Ste. Genevieve',
    description:
      'Follow the majestic Mississippi River through Hannibal, historic St. Louis courtrooms, and North America\'s premier French colonial vertical-log settlement.',
    region: 'Eastern Missouri (Mississippi River Corridor)',
    distanceMiles: 185.0,
    approxDriveTimeHours: 3.2,
    coverPhoto: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    startPoint: { name: 'Mark Twain Home, Hannibal', lat: 39.7101, lng: -91.3562 },
    endPoint: { name: 'Ste. Genevieve Historic District', lat: 37.9789, lng: -90.0432 },
    waypoints: [
      { lat: 39.7101, lng: -91.3562, label: 'Mark Twain Home Hannibal' },
      { lat: 38.6257, lng: -90.1893, label: 'Old Courthouse St. Louis' },
      { lat: 38.6247, lng: -90.1848, label: 'Gateway Arch Riverfront' },
      { lat: 37.9789, lng: -90.0432, label: 'Ste. Genevieve Colonial Town' },
    ],
    bounds: {
      north: 39.8,
      south: 37.8,
      east: -90.0,
      west: -91.5,
    },
    markerIds: [
      'marker-mark-twain',
      'marker-dred-scott',
      'marker-gateway-arch',
      'marker-ste-genevieve',
    ],
  },
  {
    id: 'route-pioneer-trails-mo',
    name: 'Missouri Pioneer & Overland Express Highway',
    subtitle: 'St. Joseph Stables to Kansas City & Independence',
    description:
      'Journey along the starting gates of the Pony Express, Oregon, and Santa Fe Trails, through Kansas City\'s Union Station and Harry S. Truman\'s presidential home.',
    region: 'Northwest Missouri (KC Metro & St. Joseph)',
    distanceMiles: 75.0,
    approxDriveTimeHours: 1.4,
    coverPhoto: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
    startPoint: { name: 'Pony Express Museum, St. Joseph', lat: 39.7588, lng: -94.8519 },
    endPoint: { name: 'Truman Historic Site, Independence', lat: 39.0917, lng: -94.4217 },
    waypoints: [
      { lat: 39.7588, lng: -94.8519, label: 'Pony Express Stables' },
      { lat: 39.0858, lng: -94.5858, label: 'Union Station KC' },
      { lat: 39.0917, lng: -94.4217, label: 'Truman Presidential Home' },
    ],
    bounds: {
      north: 39.85,
      south: 39.0,
      east: -94.3,
      west: -94.9,
    },
    markerIds: ['marker-pony-express', 'marker-kc-union-station', 'marker-truman-home'],
  },
  {
    id: 'route-i70-heritage-mo',
    name: 'Missouri River Heritage Corridor (I-70 / US-54)',
    subtitle: 'Kansas City to Fulton, Hermann Wine Country & St. Louis',
    description:
      'Cross central Missouri along the historic Missouri River valley, stopping at Truman\'s estate, Hermann German wineries, Churchill\'s Iron Curtain memorial, and St. Louis.',
    region: 'Central Missouri (KC to St. Louis)',
    distanceMiles: 248.0,
    approxDriveTimeHours: 3.8,
    coverPhoto: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    startPoint: { name: 'Kansas City Union Station', lat: 39.0858, lng: -94.5858 },
    endPoint: { name: 'Gateway Arch, St. Louis', lat: 38.6247, lng: -90.1848 },
    waypoints: [
      { lat: 39.0858, lng: -94.5858, label: 'Union Station KC' },
      { lat: 39.0917, lng: -94.4217, label: 'Truman Home Independence' },
      { lat: 38.8471, lng: -91.9546, label: 'Churchill Museum Fulton' },
      { lat: 38.7042, lng: -91.4377, label: 'Hermann German Wineries' },
      { lat: 38.6247, lng: -90.1848, label: 'Gateway Arch St. Louis' },
    ],
    bounds: {
      north: 39.2,
      south: 38.5,
      east: -90.0,
      west: -94.7,
    },
    markerIds: [
      'marker-kc-union-station',
      'marker-truman-home',
      'marker-churchill-fulton',
      'marker-hermann-winery',
      'marker-gateway-arch',
    ],
  },
];
