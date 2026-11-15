// Creates the OSAKA TOOL house-range product lines requested by management as DRAFTS.
// No model numbers, specifications, certifications or origins are invented: the team
// completes each record (images, datasheet, evidence) in the dashboard and then publishes.
// Medical devices additionally need a registered market with an evidence document.
//
//   node src/scripts/seed-range.js
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Brand from "../models/Brand.js";
import { toSlug } from "../utils/validate.js";

const RANGE = [
  ["digital-multimeters", "OSAKA TOOL True RMS Digital Multimeter", "Handheld true RMS multimeter line for electrical installation, maintenance and fault finding."],
  ["digital-multimeters", "OSAKA TOOL Compact Auto-Ranging Multimeter", "Pocket auto-ranging multimeter line for service technicians and field engineers."],
  ["digital-multimeters", "OSAKA TOOL Bench Digital Multimeter", "Bench multimeter line for electronics laboratories, production test and calibration benches."],
  ["clamp-meters", "OSAKA TOOL AC/DC Clamp Meter", "Clamp meter line for non-intrusive current measurement on live conductors."],
  ["insulation-voltage-testers", "OSAKA TOOL Insulation Resistance Tester", "Insulation tester line for cable, motor and switchgear verification."],
  ["insulation-voltage-testers", "OSAKA TOOL Non-Contact Voltage Tester", "Non-contact voltage detector line for fast presence-of-voltage checks."],
  ["oscilloscopes", "OSAKA TOOL Digital Storage Oscilloscope", "Digital storage oscilloscope line for design validation, repair and education."],
  ["soldering-repair", "OSAKA TOOL Temperature-Controlled Soldering Station", "ESD-safe soldering station line for electronics assembly and rework."],
  ["soldering-repair", "OSAKA TOOL Hot Air Rework Station", "Hot air rework station line for SMD removal and replacement."],
  ["dimensional-measurement", "OSAKA TOOL Digital Caliper", "Digital caliper line for workshop, inspection and quality control."],
  ["pressure-measurement", "OSAKA TOOL Digital Pressure Gauge", "Digital pressure gauge line for process, HVAC and hydraulic checks."],
  ["environmental-monitoring", "OSAKA TOOL Infrared Thermometer", "Non-contact infrared thermometer line for industrial surface temperature checks."],
  ["environmental-monitoring", "OSAKA TOOL Thermo-Hygrometer", "Temperature and humidity meter line for facilities, storage and HVAC commissioning."],
  ["blood-pressure-monitors", "OSAKA TOOL Upper-Arm Blood Pressure Monitor", "Automatic upper-arm blood pressure monitor line for clinics, pharmacies and home use."],
  ["blood-pressure-monitors", "OSAKA TOOL Wrist Blood Pressure Monitor", "Automatic wrist blood pressure monitor line for portable monitoring."],
  ["blood-glucose-monitors", "OSAKA TOOL Blood Glucose Meter", "Blood glucose meter line with test strips for self-monitoring and point-of-care use."],
  ["pulse-oximeters", "OSAKA TOOL Fingertip Pulse Oximeter", "Fingertip SpO2 and pulse rate monitor line."],
  ["digital-thermometers", "OSAKA TOOL Digital Clinical Thermometer", "Digital contact thermometer line for clinical and home use."],
  ["digital-thermometers", "OSAKA TOOL Infrared Forehead Thermometer", "Non-contact forehead thermometer line for clinics, schools and screening points."],
];

await connectDB();
const house = await Brand.findOne({ slug: "osaka-tool" });
let created = 0;
for (const [catSlug, name, text] of RANGE) {
  const cat = await Category.findOne({ slug: catSlug });
  if (!cat) { console.warn("[range] missing category", catSlug); continue; }
  const slug = toSlug(name);
  if (await Product.exists({ slug })) continue;
  await Product.create({
    name, slug, shortDescription: text, description: text, category: cat._id, brand: house?._id || null,
    manufacturer: "OSAKA TOOL", status: "draft", privateLabel: { status: "pending" },
    regulatory: { isMedical: Boolean(cat.isMedical), markets: [] },
    source: { system: "house-range", sourceId: slug, importedAt: new Date() },
    reviewNotes: [
      "House-range line created as a draft. Add product photos, the manufacturer datasheet, model number and specifications.",
      "Upload the private-label agreement in Documents and approve private label before publishing.",
      ...(cat.isMedical ? ["Medical device: add a registered market with its registration evidence before publishing."] : []),
    ],
  });
  created++;
}
console.log("[range] created", created, "draft lines");
await mongoose.disconnect();
