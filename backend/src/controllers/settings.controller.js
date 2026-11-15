import SiteSetting from "../models/SiteSetting.js";
import { audit, diff } from "../services/audit.js";

const SECTIONS = { announcement: ["text", "href", "active"], hero: ["kicker", "title", "subtitle", "kanji"],
  contact: ["email", "phone", "whatsapp", "address", "hours"], social: ["linkedin", "facebook", "instagram", "youtube", "x"],
  home: ["featuredCategories", "statement"] };
const SAFE_URL = /^(https?:\/\/|\/)[^\s<>"']*$/i;

async function load() {
  return (await SiteSetting.findOne({ key: "site" })) || SiteSetting.create({ key: "site" });
}

export async function getSettings(_req, res, next) {
  try {
    const s = (await load()).toObject();
    delete s._id; delete s.__v; delete s.key;
    res.set("Cache-Control", "public, max-age=30").json({ settings: s });
  } catch (err) { next(err); }
}

export async function updateSettings(req, res, next) {
  try {
    const doc = await load();
    const before = doc.toObject();
    for (const [section, fields] of Object.entries(SECTIONS)) {
      const input = req.body?.[section];
      if (!input || typeof input !== "object") continue;
      for (const f of fields) {
        if (!(f in input)) continue;
        let v = input[f];
        if (f === "active") v = Boolean(v);
        else if (f === "featuredCategories") v = Array.isArray(v) ? v.map(String).map((x) => x.trim()).filter(Boolean).slice(0, 12) : [];
        else v = typeof v === "string" ? v.trim() : "";
        if ((section === "social" || f === "href") && v && !SAFE_URL.test(v)) {
          return res.status(400).json({ message: `${section}.${f} must be an http(s) URL or a site path` });
        }
        doc.set(`${section}.${f}`, v);
      }
    }
    await doc.save();
    const after = doc.toObject();
    const changes = {};
    for (const s of Object.keys(SECTIONS)) {
      for (const [f, c] of Object.entries(diff(before[s] || {}, after[s] || {}, SECTIONS[s]) || {})) changes[`${s}.${f}`] = c;
    }
    await audit(req, "update", "settings", String(doc._id), "Updated site settings", Object.keys(changes).length ? changes : undefined);
    res.json({ settings: doc });
  } catch (err) { next(err); }
}
