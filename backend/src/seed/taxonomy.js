// OSAKA TOOL product taxonomy and engineering articles.
// ensureTaxonomy() is idempotent: it inserts missing records by slug and never
// overwrites administrator edits. It contains no Osaka Toyo data and no products.
import Category from "../models/Category.js";
import BlogPost from "../models/BlogPost.js";
import Brand from "../models/Brand.js";

export const CATEGORIES = [
  {
    slug: "electrical-test-measurement", name: "Electrical Test & Measurement", icon: "zap", order: 1,
    tagline: "Safe, traceable measurement for installers, maintenance teams and inspectors.",
    description: "Handheld and bench instruments for measuring voltage, current, resistance, continuity and insulation in low-voltage electrical systems.",
    guide: "Start with the measurement category. IEC 61010-1 defines CAT II (equipment plugged into outlets), CAT III (distribution boards, fixed installations, motors) and CAT IV (the origin of the installation, such as the utility connection and meters). An instrument rated CAT III 600 V is suitable for building distribution work; service-entrance work needs CAT IV.\n\nChoose True RMS when you measure loads with variable-speed drives, LED drivers, switch-mode power supplies or any distorted waveform. Average-responding meters can read significantly low on these signals.\n\nCheck the accessories as carefully as the instrument. Test leads, probes and clamps must carry an equal or higher CAT and voltage rating, or the whole measurement chain is limited to the weakest part.",
  },
  {
    slug: "digital-multimeters", name: "Digital Multimeters", parent: "electrical-test-measurement", icon: "gauge", order: 1,
    tagline: "Voltage, current, resistance and continuity in one instrument.",
    description: "Handheld and bench digital multimeters for electrical installation, electronics repair and industrial maintenance.",
    guide: "Key selection points: measurement category and voltage rating, True RMS response, basic DC voltage accuracy, display counts (6,000 counts resolves 0.001 V on the 6 V range), input protection and fuse rating on current ranges, and whether you need temperature, capacitance, frequency or low-impedance (LoZ) voltage modes.\n\nFor electronics work, prioritise resolution and low-current ranges. For electrical installations, prioritise CAT rating, LoZ mode to reject ghost voltages, and robust, fused current inputs.",
  },
  {
    slug: "clamp-meters", name: "Clamp Meters", parent: "electrical-test-measurement", icon: "magnet", order: 2,
    tagline: "Current measurement without breaking the circuit.",
    description: "AC and AC/DC clamp meters for load surveys, motor diagnostics and HVAC service.",
    guide: "Current-transformer clamps measure AC only. Measuring DC current, such as in solar PV strings, battery systems or DC drives, requires a Hall-effect AC/DC clamp.\n\nCompare jaw opening against your largest conductor, the maximum current range, inrush-current capture for motor starts, and True RMS response for non-linear loads. Clamp around a single conductor; clamping both line and neutral cancels the reading.",
  },
  {
    slug: "insulation-voltage-testers", name: "Insulation & Voltage Testers", parent: "electrical-test-measurement", icon: "shield-check", order: 3,
    tagline: "Verify insulation integrity and prove circuits dead.",
    description: "Insulation resistance testers, two-pole voltage testers and non-contact voltage detectors.",
    guide: "Insulation testers apply a DC test voltage, commonly 250 V, 500 V or 1,000 V for low-voltage systems, with higher voltages for medium-voltage equipment, and report resistance in megohms. Trending results over time is more informative than a single reading. The polarisation index (10-minute / 1-minute ratio) and dielectric absorption ratio help assess motor and cable condition.\n\nWhen proving a circuit dead, use a dedicated two-pole voltage tester and verify it on a known live source before and after the test. Non-contact detectors are a useful first check, not proof of isolation.",
  },
  {
    slug: "electronics-laboratory", name: "Electronics & Laboratory Instruments", icon: "cpu", order: 2,
    tagline: "Bench instruments for design, repair and education.",
    description: "Oscilloscopes, soldering and rework equipment and bench tools for electronics laboratories and service centres.",
    guide: "A productive electronics bench is built around measurement (oscilloscope and multimeter), power (a regulated bench supply) and assembly (a temperature-controlled, ESD-safe soldering station). Specify instruments for the fastest signals and the finest-pitch components you work with today, with headroom for the next product generation.",
  },
  {
    slug: "oscilloscopes", name: "Oscilloscopes", parent: "electronics-laboratory", icon: "activity", order: 1,
    tagline: "See signals in time, not just their average values.",
    description: "Digital storage oscilloscopes for embedded development, power electronics and service work.",
    guide: "Bandwidth: a common rule is at least five times the highest frequency component you need to see. For digital signals, the edge rise time matters more than the clock rate; system rise time is approximately 0.35 divided by bandwidth.\n\nSample rate should be several times the bandwidth on every active channel. Memory depth determines how long you can capture at full sample rate. For power electronics, use differential probes or isolated-channel instruments; never float a ground-referenced oscilloscope.",
  },
  {
    slug: "soldering-repair", name: "Soldering & Repair Equipment", parent: "electronics-laboratory", icon: "wrench", order: 2,
    tagline: "Temperature control, precision and ESD safety.",
    description: "Soldering stations, precision screwdriver sets and repair tools for electronics assembly and device service.",
    guide: "Temperature-controlled soldering with fast thermal recovery protects pads and components. Lead-free SAC305 solder melts at about 217–220 °C; tip temperatures around 330–370 °C are typical, depending on thermal mass. Choose ESD-safe tools and grounded stations for sensitive semiconductors.\n\nFor device repair, precision drivers with a broad bit range (Phillips, Torx, Pentalobe, Tri-wing, hex) and controlled torque reduce stripped fasteners and damaged housings.",
  },
  {
    slug: "industrial-measurement", name: "Industrial Measurement Equipment", icon: "ruler", order: 3,
    tagline: "Dimension, pressure and process measurement for the shop floor.",
    description: "Dimensional and pressure measurement instruments for workshops, construction and maintenance.",
    guide: "Match resolution and accuracy to the tolerance you must verify. A practical rule is that the instrument should be several times more precise than the tolerance being checked. Record calibration status and keep instruments in protective storage.",
  },
  {
    slug: "dimensional-measurement", name: "Dimensional Measurement", parent: "industrial-measurement", icon: "ruler", order: 1,
    tagline: "Tapes, calipers and distance measurement.",
    description: "Tape measures, calipers and distance meters for construction, fabrication and installation.",
    guide: "For tape measures, check blade length and width, standout (how far the blade extends unsupported), a true-zero hook for inside and outside measurements, and the accuracy class marking where required (for example EC Class I or II in Europe).",
  },
  {
    slug: "pressure-measurement", name: "Pressure Measurement", parent: "industrial-measurement", icon: "gauge", order: 2,
    tagline: "Gauges and digital pressure instruments.",
    description: "Analogue and digital pressure gauges for pneumatic, hydraulic and service applications.",
    guide: "Select a range so that normal operating pressure sits in the middle third of the scale. Confirm the pressure units, media compatibility of wetted parts, and the process connection thread.",
  },
  {
    slug: "industrial-tools", name: "Industrial Tools & Accessories", icon: "hammer", order: 4,
    tagline: "Reliable tools for workshops, fleets and field service.",
    description: "Portable compressors, inflators and workshop accessories for professional and fleet use.",
    guide: "For professional tool programmes, standardise battery platforms and charging ports where possible, check duty cycle for continuous use, and keep spare consumables available.",
  },
  {
    slug: "air-compressors-inflators", name: "Air Compressors & Inflators", parent: "industrial-tools", icon: "wind", order: 1,
    tagline: "Portable inflation with digital pressure presets.",
    description: "Rechargeable and 12 V portable compressors and tyre inflators with digital pressure display and automatic shut-off.",
    guide: "Compare maximum pressure, inflation speed, duty cycle, battery capacity and the accuracy of the built-in gauge. Automatic shut-off at a preset pressure prevents over-inflation. Always confirm final tyre pressure against the vehicle manufacturer's specification with a calibrated gauge.",
  },
  {
    slug: "environmental-monitoring", name: "Environmental Monitoring", icon: "thermometer-sun", order: 5,
    tagline: "Temperature, humidity, air flow, light and sound.",
    description: "Instruments for measuring ambient conditions in facilities, HVAC systems, warehouses and workplaces.",
    guide: "Define what you must demonstrate: comfort and HVAC balancing (temperature, humidity, air velocity), workplace exposure (sound level, light level), or storage compliance (logged temperature and humidity). For compliance, choose data-logging instruments with calibration certificates.",
  },
  {
    slug: "medical-diagnostic", name: "Medical & Diagnostic Instruments", icon: "heart-pulse", order: 6, isMedical: true,
    tagline: "Clinically validated home and professional monitoring devices.",
    description: "Blood pressure monitors, thermometers, pulse oximeters and blood glucose monitoring systems. Each device is listed only for markets where its registration is documented.",
    guide: "Medical devices are regulated products. Before purchase, confirm the device is registered or cleared for your market (for example FDA in the United States, CE marking under the EU MDR, or the national health authority) and that its accuracy has been clinically validated against the applicable ISO standard.\n\nOSAKA TOOL lists market eligibility for each medical device. Devices without documented registration for a market are not offered for sale there.",
  },
  {
    slug: "blood-pressure-monitors", name: "Blood Pressure Monitors", parent: "medical-diagnostic", icon: "heart-pulse", order: 1, isMedical: true,
    tagline: "Automated oscillometric monitors for home and clinic.",
    description: "Upper-arm and wrist automated blood pressure monitors.",
    guide: "Prefer upper-arm monitors validated to ISO 81060-2, and check independent validated-device listings. Cuff size matters: an undersized cuff overestimates blood pressure. Measure seated, with the back supported, the arm at heart level, after five minutes of rest.",
  },
  {
    slug: "digital-thermometers", name: "Digital Thermometers", parent: "medical-diagnostic", icon: "thermometer", order: 2, isMedical: true,
    tagline: "Contact and infrared clinical thermometers.",
    description: "Clinical contact thermometers and infrared ear and forehead thermometers.",
    guide: "Clinical thermometers are covered by ISO 80601-2-56. Infrared ear and forehead readings depend on technique; follow the manufacturer's positioning instructions and allow the device to acclimatise to room temperature.",
  },
  {
    slug: "pulse-oximeters", name: "Pulse Oximeters", parent: "medical-diagnostic", icon: "activity", order: 3, isMedical: true,
    tagline: "SpO2 and pulse-rate spot checks.",
    description: "Fingertip and handheld pulse oximeters.",
    guide: "Look for conformity with ISO 80601-2-61 and a stated SpO2 accuracy (Arms). Readings can be affected by poor circulation, cold fingers, movement, nail polish and skin pigmentation. Oximeters support clinical judgement; they do not replace it.",
  },
  {
    slug: "blood-glucose-monitors", name: "Blood Glucose Monitors", parent: "medical-diagnostic", icon: "droplet", order: 4, isMedical: true,
    tagline: "Self-testing systems for diabetes management.",
    description: "Blood glucose meters and their matched test strips.",
    guide: "ISO 15197:2013 requires that 95% of results fall within ±15 mg/dL of the reference below 100 mg/dL, or within ±15% at or above 100 mg/dL. Meters and strips are a matched system; confirm long-term strip availability in your market before choosing a meter.",
  },
];

export const ARTICLES = [
  {
    slug: "multimeter-measurement-categories-cat-ii-iii-iv-explained",
    title: "Multimeter measurement categories: CAT II, CAT III and CAT IV explained",
    category: "Electrical safety", tags: ["multimeter", "safety", "IEC 61010"], relatedCategories: ["digital-multimeters", "electrical-test-measurement"],
    excerpt: "The CAT rating on a meter describes the transient energy it can survive at a point in the installation, not just the voltage it can read. Here is how to choose correctly.",
    content: "## Why the category matters more than the voltage\n\nElectrical installations carry transient overvoltages caused by switching and lightning. These impulses are largest near the supply origin and are attenuated by each layer of wiring and protection. IEC 61010-1 groups locations into measurement categories so that an instrument's insulation and protection can be matched to the energy available at that location.\n\n## The categories\n\n- CAT II: circuits connected to the low-voltage installation by a plug, such as appliances and portable tools.\n- CAT III: the fixed installation, including distribution boards, busbars, feeders, permanently connected motors and industrial equipment.\n- CAT IV: the origin of the installation, including service drops, utility meters and primary overcurrent protection.\n\nA rating always pairs a category with a voltage, for example CAT III 1000 V / CAT IV 600 V. A higher category at a given voltage indicates greater transient withstand.\n\n## Choosing in practice\n\n- Electronics bench work on isolated, low-energy circuits: the category requirement is low, but good input protection still matters.\n- Building electricians: CAT III 600 V as a minimum; CAT IV for service-entrance work.\n- Industrial maintenance: CAT III 1000 V / CAT IV 600 V is a common professional specification.\n\n## The measurement chain\n\nThe system is only as safe as its lowest-rated component. Test leads, probe tips, clamps and adaptors must carry the same or a higher category and voltage rating. Use shrouded connectors and short exposed probe tips in CAT III and CAT IV environments, and inspect leads for damage before every use.",
  },
  {
    slug: "true-rms-vs-average-responding-meters",
    title: "True RMS vs average-responding meters: when the difference matters",
    category: "Measurement", tags: ["true rms", "multimeter", "clamp meter"], relatedCategories: ["digital-multimeters", "clamp-meters"],
    excerpt: "Average-responding meters are accurate on pure sine waves. On modern non-linear loads they can read significantly low.",
    content: "## What RMS means\n\nThe root-mean-square value of an AC signal is the equivalent DC value that delivers the same heating power. It is the value that matters for conductor sizing, protective device behaviour and power calculations.\n\n## How average-responding meters work\n\nA lower-cost meter rectifies the signal, measures the average, and multiplies by 1.11, the ratio between RMS and average for a pure sine wave. On a clean sine wave this is accurate. On a distorted wave, the ratio is different and the reading is wrong.\n\n## Where distortion appears\n\n- Variable-frequency drives and soft starters\n- LED drivers, switch-mode power supplies and computer loads\n- UPS systems and inverters\n- Phase-angle dimmers and heater controllers\n\nThe current drawn by single-phase rectifier loads is often sharply peaked. An average-responding clamp meter can under-read that current substantially, which leads to undersized conductors or unexplained breaker trips.\n\n## Recommendation\n\nFor any electrical maintenance or installation work on modern buildings and industrial plant, specify True RMS meters and clamps. Check the crest factor specification and the bandwidth of the True RMS converter as well.",
  },
  {
    slug: "choosing-an-oscilloscope-bandwidth-sample-rate-memory",
    title: "Choosing an oscilloscope: bandwidth, sample rate and memory depth",
    category: "Electronics", tags: ["oscilloscope", "electronics lab"], relatedCategories: ["oscilloscopes", "electronics-laboratory"],
    excerpt: "Three specifications decide whether an oscilloscope shows your signal accurately. Here is how they interact.",
    content: "## Bandwidth\n\nBandwidth is the frequency at which a sine wave is attenuated by 3 dB. Signals near the bandwidth are already displayed with reduced amplitude. A practical rule is to choose bandwidth of at least five times the highest frequency component of interest.\n\nFor digital signals, think in terms of edge speed. System rise time is approximately 0.35 divided by bandwidth: a 100 MHz oscilloscope has a rise time of about 3.5 ns, so it cannot show faster edges faithfully.\n\n## Sample rate\n\nSample rate should be several times the bandwidth to reconstruct waveforms accurately. Check the sample rate when all the channels you need are enabled. Some instruments share converters between channels.\n\n## Memory depth\n\nCapture time equals memory depth divided by sample rate. Deep memory lets you capture long serial transactions or power-up sequences while keeping full time resolution.\n\n## Probing\n\nThe probe is part of the measurement system. Use correctly compensated 10:1 passive probes for general work, short ground connections for fast edges, and differential or isolated inputs for power electronics.",
  },
  {
    slug: "insulation-resistance-testing-basics",
    title: "Insulation resistance testing: test voltages, PI and DAR",
    category: "Electrical safety", tags: ["insulation", "maintenance", "motors"], relatedCategories: ["insulation-voltage-testers"],
    excerpt: "A single megohm reading tells you little. Trend data, the polarisation index and correct test voltages tell you much more.",
    content: "## The test\n\nAn insulation tester applies a stabilised DC voltage between a conductor and earth, or between conductors, and measures the leakage current. It reports the result as resistance in megohms or gigohms.\n\n## Selecting the test voltage\n\nTest voltages are chosen relative to the equipment's rated voltage. 250 V, 500 V and 1,000 V are common for low-voltage cables and equipment. Higher test voltages are used for medium-voltage assets. Follow the equipment manufacturer's and the applicable standard's guidance. Disconnect electronics that the test voltage could damage.\n\n## Time-based tests\n\n- Dielectric absorption ratio (DAR): the 60-second reading divided by the 30-second reading.\n- Polarisation index (PI): the 10-minute reading divided by the 1-minute reading.\n\nHealthy, dry insulation shows rising resistance as absorption current decays. A ratio close to 1 suggests moisture or contamination.\n\n## Good practice\n\n- Prove the circuit dead and isolate it before testing.\n- Record temperature and humidity; resistance falls as temperature rises.\n- Discharge the circuit after testing. Most testers do this automatically.\n- Trend results over years rather than relying on a single pass or fail value.",
  },
  {
    slug: "blood-pressure-monitor-accuracy-and-validation",
    title: "Home blood pressure monitors: validation, cuff size and correct technique",
    category: "Medical devices", tags: ["blood pressure", "medical", "ISO 81060-2"], relatedCategories: ["blood-pressure-monitors", "medical-diagnostic"],
    excerpt: "Accuracy depends on three things: a clinically validated device, the correct cuff size and a consistent measurement routine.",
    content: "## Choose a validated device\n\nAutomated monitors estimate blood pressure from cuff pressure oscillations using a proprietary algorithm. ISO 81060-2 defines the clinical validation protocol for these devices. Independent registries list models that have passed validation. Check them before purchasing.\n\n## Upper arm or wrist\n\nUpper-arm monitors are generally preferred. Wrist monitors are more sensitive to the position of the wrist relative to the heart.\n\n## Cuff size\n\nThe cuff bladder must suit the arm circumference. A cuff that is too small tends to overestimate blood pressure, and one that is too large can underestimate it. Measure the mid-upper-arm circumference and choose the matching cuff.\n\n## Measurement routine\n\n- Rest seated for five minutes, with the back supported and feet flat.\n- Support the arm at heart level, with the cuff on bare skin.\n- Avoid caffeine, exercise and smoking for 30 minutes beforehand.\n- Take two readings one minute apart and record both.\n\n## Important\n\nHome monitoring supports, but does not replace, assessment by a qualified healthcare professional. Medical devices must be registered for the market in which they are sold.",
  },
  {
    slug: "pulse-oximeter-accuracy-limitations",
    title: "Pulse oximeters: how they work and what affects accuracy",
    category: "Medical devices", tags: ["pulse oximeter", "SpO2", "medical"], relatedCategories: ["pulse-oximeters", "medical-diagnostic"],
    excerpt: "Pulse oximetry is fast and non-invasive, but its readings have known limitations every user should understand.",
    content: "## Principle\n\nA pulse oximeter shines red and infrared light through tissue and compares the pulsatile absorption at the two wavelengths. Oxygenated and deoxygenated haemoglobin absorb them differently, and the device converts the ratio to an SpO2 estimate using an empirical calibration.\n\n## Standards and accuracy\n\nISO 80601-2-61 covers the safety and performance of pulse oximeters. Accuracy is expressed as Arms, the root-mean-square difference from arterial blood gas reference values over a stated range. Accuracy is lower at low saturation levels.\n\n## Factors that affect readings\n\n- Poor perfusion, cold hands and movement\n- Nail polish and artificial nails\n- Skin pigmentation, which regulators have identified as a source of overestimation in some devices\n- Carbon monoxide exposure, as standard two-wavelength oximeters cannot distinguish carboxyhaemoglobin\n- Bright ambient light and incorrect sensor placement\n\n## Use responsibly\n\nWatch trends rather than single readings. Interpret readings together with symptoms, and seek medical advice when values are low or symptoms are present.",
  },
];

export async function ensureTaxonomy({ log = console.log } = {}) {
  let createdCategories = 0;
  const bySlug = new Map((await Category.find().select("_id slug").lean()).map((c) => [c.slug, c._id]));
  for (const def of CATEGORIES.filter((c) => !c.parent).concat(CATEGORIES.filter((c) => c.parent))) {
    if (bySlug.has(def.slug)) continue;
    const { parent, ...rest } = def;
    const doc = await Category.create({ ...rest, parent: parent ? bySlug.get(parent) || null : null });
    bySlug.set(def.slug, doc._id);
    createdCategories++;
  }

  let createdArticles = 0;
  for (const article of ARTICLES) {
    if (await BlogPost.exists({ slug: article.slug })) continue;
    await BlogPost.create({ ...article, readingMinutes: Math.max(2, Math.round(article.content.split(/\s+/).length / 220)), published: true, publishedAt: new Date() });
    createdArticles++;
  }

  // The OSAKA TOOL house brand. It is assigned to products only after private-label evidence is verified.
  await Brand.updateOne({ slug: "osaka-tool" }, { $setOnInsert: { name: "OSAKA TOOL", slug: "osaka-tool", kind: "house",
    description: "OSAKA TOOL house brand." } }, { upsert: true });

  if (createdCategories || createdArticles) log(`[seed] inserted ${createdCategories} categories and ${createdArticles} articles`);
  return { createdCategories, createdArticles };
}
