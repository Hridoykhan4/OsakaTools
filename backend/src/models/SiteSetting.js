import mongoose from "mongoose";

// Singleton document (key "site") holding editable site-wide content: hero copy,
// announcement bar, contact channels, social links and homepage curation.
const siteSettingSchema = new mongoose.Schema(
  {
    key: { type: String, default: "site", unique: true },
    announcement: { text: { type: String, default: "", maxlength: 200 }, href: { type: String, default: "", maxlength: 300 }, active: { type: Boolean, default: false } },
    hero: {
      kicker: { type: String, default: "", maxlength: 80 },
      title: { type: String, default: "", maxlength: 120 },
      subtitle: { type: String, default: "", maxlength: 400 },
      kanji: { type: String, default: "", maxlength: 8 },
    },
    contact: {
      email: { type: String, default: "", maxlength: 160 },
      phone: { type: String, default: "", maxlength: 60 },
      whatsapp: { type: String, default: "", maxlength: 60 },
      address: { type: String, default: "", maxlength: 300 },
      hours: { type: String, default: "", maxlength: 120 },
    },
    social: {
      linkedin: { type: String, default: "", maxlength: 300 },
      facebook: { type: String, default: "", maxlength: 300 },
      instagram: { type: String, default: "", maxlength: 300 },
      youtube: { type: String, default: "", maxlength: 300 },
      x: { type: String, default: "", maxlength: 300 },
    },
    home: {
      featuredCategories: { type: [String], default: [] }, // category slugs, in order
      statement: { type: String, default: "", maxlength: 400 },
    },
  },
  { timestamps: true }
);

export default mongoose.models.SiteSetting || mongoose.model("SiteSetting", siteSettingSchema);
