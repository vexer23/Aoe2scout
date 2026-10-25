// Civ tendencies and counters. Keys are aoe2companion civ ids.
// t = army type, u = typical army, r = early aggression (0 low, 1 some, 2 high), rough = notes less certain.
(function (root) {
  const CIVS = {
    aztecs:     { t: 'inf',  u: 'infantry (Eagles/Jaguars) and monks', r: 1 },
    armenians:  { t: 'mixed', u: 'Composite Bowmen, infantry and ships', r: 0 },
    bengalis:   { t: 'ele',  u: 'war elephants and Ratha', r: 0 },
    berbers:    { t: 'cav',  u: 'camels, Genitours and cavalry', r: 1 },
    bohemians:  { t: 'gun',  u: 'handcannons, Hussite Wagons and halberds', r: 0 },
    britons:    { t: 'arch', u: 'mass archers (long range)', r: 1 },
    bulgarians: { t: 'inf',  u: 'infantry and Konniks', r: 1 },
    burgundians:{ t: 'cav',  u: 'cavalry and Flemish Militia', r: 0 },
    burmese:    { t: 'inf',  u: 'infantry, monks and elephants', r: 1 },
    byzantines: { t: 'def',  u: 'towers, Cataphracts and cheap counter-units', r: 0 },
    celts:      { t: 'inf',  u: 'Woad Raiders, infantry and siege', r: 1 },
    chinese:    { t: 'arch', u: 'archers (Chu Ko Nu) and scorpions', r: 1 },
    cumans:     { t: 'cav',  u: 'fast cavalry (Kipchaks) with early 2nd TC', r: 1 },
    dravidians: { t: 'inf',  u: 'infantry, skirmishers and siege', r: 1 },
    ethiopians: { t: 'arch', u: 'archers and Shotel Warriors', r: 1 },
    franks:     { t: 'cav',  u: 'cavalry (Knights) and Throwing Axemen', r: 1 },
    georgians:  { t: 'cav',  u: 'cavalry (Monaspa) and Knights', r: 0 },
    goths:      { t: 'inf',  u: 'mass cheap infantry and Huskarls', r: 2 },
    gurjaras:   { t: 'cav',  u: 'camels, Chakram throwers and cavalry', r: 1 },
    hindustanis:{ t: 'cav',  u: 'camels, Ghulams and handcannons', r: 0 },
    huns:       { t: 'cav',  u: 'mounted archers and cavalry', r: 2 },
    incas:      { t: 'inf',  u: 'Kamayuks (pikes), slingers and Eagles', r: 1 },
    italians:   { t: 'arch', u: 'crossbows (Genoese) and ships', r: 0 },
    japanese:   { t: 'inf',  u: 'fast-attacking infantry (Samurai) and archers', r: 1 },
    jurchens:   { t: 'cav',  u: 'cavalry and mounted archers', r: 1, rough: true },
    khitans:    { t: 'cav',  u: 'cavalry and mounted units', r: 1, rough: true },
    khmer:      { t: 'ele',  u: 'Battle Elephants and Scorpions', r: 0 },
    koreans:    { t: 'arch', u: 'archers, War Wagons and towers', r: 0 },
    lithuanians:{ t: 'cav',  u: 'cavalry (Leitis, Knights)', r: 1 },
    magyars:    { t: 'cav',  u: 'cavalry (Huszars) with free Scouts', r: 2 },
    malay:      { t: 'ele',  u: 'Battle Elephants and ships', r: 0, rough: true },
    malians:    { t: 'inf',  u: 'infantry and Gbetos', r: 0 },
    mayans:     { t: 'arch', u: 'archers (Plumed Archers) and Eagles', r: 2 },
    mongols:    { t: 'cav',  u: 'cavalry (Mangudai, Steppe Lancers)', r: 1 },
    persians:   { t: 'cav',  u: 'cavalry and war elephants', r: 0 },
    poles:      { t: 'cav',  u: 'Winged Hussars, Knights and infantry', r: 1, rough: true },
    portuguese: { t: 'gun',  u: 'gunpowder (Organ Guns) and ships', r: 0 },
    romans:     { t: 'inf',  u: 'Legionaries, scorpions and infantry', r: 1 },
    saracens:   { t: 'cav',  u: 'camels, Mamelukes and archers', r: 1 },
    saxons:     { t: 'inf',  u: 'infantry (Thegns) and siege', r: 1, rough: true },
    shu:        { t: 'arch', u: 'crossbows (Chu Ko Nu) and chariots', r: 1, rough: true },
    sicilians:  { t: 'cav',  u: 'cavalry and Serjeants (tough units)', r: 0 },
    slavs:      { t: 'inf',  u: 'infantry and siege (Boyars)', r: 0 },
    spanish:    { t: 'cav',  u: 'cavalry, Conquistadors and monks', r: 0 },
    tatars:     { t: 'cav',  u: 'mounted archers and Keshiks', r: 1 },
    teutons:    { t: 'inf',  u: 'Teutonic Knights, towers and castles', r: 0 },
    turks:      { t: 'cav',  u: 'cavalry and gunpowder (Janissaries)', r: 0 },
    vietnamese: { t: 'arch', u: 'Rattan Archers and Imperial Skirmishers', r: 1 },
    vikings:    { t: 'inf',  u: 'infantry (Berserks) and ships', r: 1 },
    wei:        { t: 'cav',  u: 'cavalry and infantry', r: 1, rough: true },
    wu:         { t: 'inf',  u: 'infantry and elephants', r: 1, rough: true }
  };

  const UNKNOWN = { t: 'mixed', u: 'civ not in my table, army unknown', r: 1, rough: true };

  const COUNTERS = {
    cav:   'make spearmen/pikes and camels',
    arch:  'make skirmishers, cavalry and mangonels',
    inf:   'make archers and cavalry (avoid spearmen)',
    ele:   'make halberdiers/pikes, monks and siege',
    gun:   'raid with cavalry and skirmishers',
    def:   'do not hit towers/castles: boom and use rams/trebuchets',
    mixed: 'scout it first, then mass the counter'
  };

  // Teammate role suggestions by army type.
  const ROLES = {
    cav:   'strong cavalry: let them raid and flank, you hold with pikes/archers',
    arch:  'strong archers: let them go ranged, cover them with melee',
    inf:   'strong infantry: let them be the front line, you add archers behind',
    ele:   'elephants: let them lead the push, you add pikes for cover',
    gun:   'gunpowder/siege: let them play the late army, you protect them early',
    def:   'defensive civ: let them hold the line, you take map control',
    mixed: 'flexible civ: ask what they want and fill the gap in army'
  };

  const TYPE_NAME = { cav: 'cavalry', arch: 'archer', inf: 'infantry', ele: 'elephant', gun: 'gunpowder', def: 'defensive', mixed: 'mixed' };

  // Map notes. open = open map where early aggression lands; closed = walled/forested.
  const MAPS = {
    rm_arabia:        { open: true,  note: 'open map: early rushes land' },
    rm_arena:         { open: false, note: 'walled map: slower, expect booming' },
    rm_black_forest:  { open: false, note: 'closed map: low early aggression' },
    'rm_black-forest':{ open: false, note: 'closed map: low early aggression' },
    'rm_hill-fort':   { open: false, note: 'hill fort: castle-style defence' },
    rm_socotra:       { open: false, note: 'island map: naval play likely' },
    rm_coastal_forest:{ open: false, note: 'coastal map: some water play' }
  };

  const api = { CIVS, UNKNOWN, COUNTERS, ROLES, TYPE_NAME, MAPS };
  if (typeof module !== 'undefined') module.exports = api; else root.CivData = api;
})(typeof window !== 'undefined' ? window : globalThis);
