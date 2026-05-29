import { useState, useRef, useCallback, useMemo, useEffect } from "react";

// ─── Static / standardised lists ────────────────────────────────────────────
const DERMOSCOPY_OPTIONS = [
  "Comedonal-like openings", "Milia-like cysts", "Fingerprint pattern",
  "Cerebriform surface", "Hairpin vessels", "Stuck-on appearance",
  "Cobblestone appearance", "Comma-like blood vessels", "Uniform pigment network",
  "Reticular pigment pattern", "Atypical pigment network", "Blue-white veil",
  "Irregular dots and globules", "Polymorphous, irregular vessels", "Negative network",
  "Irregular blotches", "Arborising vessels", "Small erosions", "White lines",
  "Central ulceration", "Blue-gray dots and globules", "Keratinised surface",
  "Ulceration", "Basal induration", "Red pseudonetwork, strawberry pattern",
  "Rosette sign under polarised light"
];

const SOCIAL_OPTIONS = [
  "Never smoked",
  "Heavy cigarette smoker", "Moderate cigarette smoker", "Minimal cigarette smoker",
  "Ex-heavy cigarette smoker", "Ex-moderate cigarette smoker", "Ex-minimal cigarette smoker",
  "Ex smoker", "Smoker", "Electronic cigarette user", "Ex-electronic cigarette user",
  "Heavy alcohol use", "Moderate alcohol use", "Minimal alcohol use", "No alcohol use",
  "Lives alone", "Lives with family", "Lives with partner"
];

const SKIN_TYPES = [
  { short: "Type I",   full: "Type I: Highly sensitive, always burns, never tans" },
  { short: "Type II",  full: "Type II: Very sun sensitive, burns easily, tans minimally" },
  { short: "Type III", full: "Type III: Sun sensitive, sometimes burns, slowly tans to light brown" },
  { short: "Type IV",  full: "Type IV: Minimally sun sensitive, burns minimally, always tans to moderate brown" },
  { short: "Type V",   full: "Type V: Sun insensitive, rarely burns, tans well" },
  { short: "Type VI",  full: "Type VI: Sun insensitive, never burns, deeply pigmented" },
];

const PERFORMANCE_STATUS = [
  "0 - Fully active, able to carry on all pre-disease performance without restriction",
  "1 - Restricted in physically strenuous activity but ambulatory and able to carry out light or sedentary work",
  "2 - Ambulatory and capable of all selfcare but unable to carry out any work; up and about >50% of waking hours",
  "3 - Capable of only limited selfcare; confined to bed or chair >50% of waking hours",
  "4 - Completely disabled; cannot carry on any selfcare; totally confined to bed or chair",
  "5 - Dead"
];

// ─── User-editable defaults ──────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  reasonOptions:        ["Two-week wait skin cancer referral", "Follow up"],
  consultantOptions:    ["Dr Griffin", "Dr Stylianou"],
  diagnosisOptions:     ["Suspected basal cell carcinoma", "Suspected squamous cell carcinoma", "Suspected melanoma", "Seborrhoeic keratosis", "Actinic keratosis"],
  managementOptions:    ["Reassurance and discharge", "Clinical photography", "Biopsy", "Referral to plastic surgeon", "Referral to Mohs surgeon", "Referral for excisional biopsy", "Referral for punch biopsy", "Referral for curette and cautery", "Cryotherapy", "5-fluorouracil cream", "Clinic review follow up"],
  patientInfoOptions:   ["ABCDE mole check", "Sun safety", "Seborrhoeic keratosis", "Incisional biopsy", "Curette and cautery", "Punch biopsy", "Cryotherapy", "Efudix", "Actinic keratosis"],
  gpActionsOptions:     ["Script", "None"],
  twwOptions:           ["Step down", "Remain on TWW pathway"],
  followUpOptions:      ["Discharge", "With results", "Clinic follow up"],
  chaperoneRoleOptions: ["Nurse", "Healthcare assistant", "Medical student", "Clinic coordinator"],
  hobbyOptions:         ["Gardening", "Horse riding", "Outdoor sports", "Watersports"],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const cap  = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const low  = (s) => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
const joinMulti  = (arr, free) => { const a = [...arr]; if (free) a.push(free); return a.join(", "); };
const capJoin    = (arr, free) => cap(joinMulti(arr, free));
const formatHobbyList = (arr, free) => {
  const items = [...arr.filter(h => h !== "No outdoor hobbies")];
  if (free) items.push(free);
  if (!items.length) return "";
  if (items.length === 1) return items[0].toLowerCase();
  return items.slice(0, -1).map(h => h.toLowerCase()).join(", ") + " and " + items[items.length - 1].toLowerCase();
};
// Join clauses into "a, b and c"
const joinAnd = (arr) => arr.length <= 1 ? (arr[0] || "") : arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1];

// Map form values → predicate fragments that read naturally after "You …"
const WORKED_OUTSIDE_FRAGMENTS = {
  "Previously worked outside": "previously worked outdoors",
  "Currently works outdoors":  "currently work outdoors",
};
const LIVED_ABROAD_FRAGMENTS = {
  "Previously lived abroad": "previously lived abroad",
};
const SUNBED_FRAGMENTS = {
  "Minimal previous use": "previously used a sunbed minimally",
  "Regular previous use": "previously used a sunbed regularly",
  "Minimal current use":  "currently use a sunbed minimally",
  "Regular current use":  "currently use a sunbed regularly",
};

// ─── Shared tokens ────────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #d0d7e2",
  fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: "none",
  boxSizing: "border-box", background: "#fff", transition: "border-color 0.2s"
};
const tagStyle = {
  padding: "6px 13px", borderRadius: 20, border: "1.5px solid", fontSize: 12,
  fontFamily: "'DM Sans', sans-serif", cursor: "pointer", transition: "all 0.15s",
  fontWeight: 500, whiteSpace: "nowrap", lineHeight: 1.4
};
const btnSmall = {
  padding: "6px 12px", borderRadius: 7, border: "none", cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600
};
const tabBtn = {
  padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, transition: "all 0.2s"
};

// ─── Section accent palette ──────────────────────────────────────────────────
const ACCENTS = {
  clinic:      "#1a5276",
  assessment:  "#0b6677",
  risk:        "#935116",
  patient:     "#6c3483",
  examination: "#1f618d",
  lesion:      "#78281f",
  consultant:  "#1a5276",
};

// ─── Reusable UI components ──────────────────────────────────────────────────

function SectionHeader({ children, icon, accent = "#1a5276" }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "7px 16px", marginTop: 0, marginBottom: 18,
      background: accent + "18", border: `1px solid ${accent}35`,
      borderRadius: 24, color: accent,
      fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: 0.1
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>{children}
    </div>
  );
}

function FieldLabel({ required, children }) {
  return (
    <label style={{
      display: "block", fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
      fontSize: 12.5, color: "#4a5568", marginBottom: 5, letterSpacing: 0.15
    }}>
      {required && <span style={{ color: "#e53e3e", marginRight: 3, fontSize: 13 }}>!</span>}
      {children}
    </label>
  );
}

// Single-select button group (replaces SelectField / SelectOrFreeText for specified fields)
function ButtonSelectGroup({ label, required, value, onChange, options, allowFreeText }) {
  const [typing, setTyping] = useState(false);
  const inOptions = options.includes(value);
  const hasCustom  = !!value && !inOptions;
  const showInput  = typing || hasCustom;
  const filled     = !!value;
  const borderColor = required && !filled ? "#fc8181" : filled ? "#68d391" : "#d0d7e2";

  // Clear typing state if value is reset externally
  useEffect(() => { if (!value) setTyping(false); }, [value]);

  return (
    <div style={{ marginBottom: 14 }}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div style={{ border: `1.5px solid ${borderColor}`, borderRadius: 10, padding: "10px 10px 8px", background: "#fff", transition: "border-color 0.2s" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {options.map(o => (
            <button key={o} onClick={() => { onChange(value === o ? "" : o); setTyping(false); }}
              style={{ ...tagStyle, background: value === o ? "#1a5276" : "#f0f4f8", color: value === o ? "#fff" : "#2d3748", borderColor: value === o ? "#1a5276" : "#d0d7e2", boxShadow: value === o ? "0 1px 4px rgba(26,82,118,0.3)" : "none" }}>
              {value === o ? "✓ " : ""}{o}
            </button>
          ))}
          {allowFreeText && !showInput && (
            <button onClick={() => setTyping(true)}
              style={{ ...tagStyle, background: "#f7fafc", color: "#a0aec0", borderColor: "#d0d7e2", borderStyle: "dashed" }}>
              ✏️ Other…
            </button>
          )}
        </div>
        {showInput && (
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <input type="text" value={value} onChange={e => onChange(e.target.value)}
              placeholder="Type here…" style={{ ...inputStyle, flex: 1, fontSize: 12 }} autoFocus={!hasCustom} />
            <button onClick={() => { setTyping(false); onChange(""); }}
              style={{ ...btnSmall, background: "#edf2f7", color: "#718096" }}>↩</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Multi-select checkbox group (unchanged behaviour, refreshed visuals)
function CheckboxGroup({ label, required, options, selected, onChange, allowFreeText, freeText, onFreeTextChange }) {
  const filled = selected.length > 0 || (freeText && freeText.length > 0);
  const borderColor = required && !filled ? "#fc8181" : filled ? "#68d391" : "#d0d7e2";
  const toggle = (opt) => onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
  return (
    <div style={{ marginBottom: 14 }}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div style={{ border: `1.5px solid ${borderColor}`, borderRadius: 10, padding: "10px 10px 8px", background: "#fff", transition: "border-color 0.2s" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {options.map(o => (
            <button key={o} onClick={() => toggle(o)}
              style={{ ...tagStyle, background: selected.includes(o) ? "#1a5276" : "#f0f4f8", color: selected.includes(o) ? "#fff" : "#2d3748", borderColor: selected.includes(o) ? "#1a5276" : "#d0d7e2", boxShadow: selected.includes(o) ? "0 1px 4px rgba(26,82,118,0.3)" : "none" }}>
              {selected.includes(o) ? "✓ " : ""}{o}
            </button>
          ))}
        </div>
        {allowFreeText && (
          <input type="text" value={freeText || ""} onChange={e => onFreeTextChange(e.target.value)}
            placeholder="Additional (free text)…" style={{ ...inputStyle, marginTop: 8, fontSize: 12 }} />
        )}
      </div>
    </div>
  );
}

// Compact skin type selector: shows Type I–VI as short buttons, reveals full text when selected
function SkinTypeSelect({ required, value, onChange }) {
  const filled     = !!value;
  const selected   = SKIN_TYPES.find(t => t.full === value);
  const borderColor = required && !filled ? "#fc8181" : filled ? "#68d391" : "#d0d7e2";
  return (
    <div style={{ marginBottom: 14 }}>
      <FieldLabel required={required}>Skin type</FieldLabel>
      <div style={{ border: `1.5px solid ${borderColor}`, borderRadius: 10, padding: "10px 10px 8px", background: "#fff", transition: "border-color 0.2s" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SKIN_TYPES.map(t => (
            <button key={t.short} onClick={() => onChange(value === t.full ? "" : t.full)}
              style={{ ...tagStyle, background: value === t.full ? "#1a5276" : "#f0f4f8", color: value === t.full ? "#fff" : "#2d3748", borderColor: value === t.full ? "#1a5276" : "#d0d7e2", boxShadow: value === t.full ? "0 1px 4px rgba(26,82,118,0.3)" : "none" }}>
              {value === t.full ? "✓ " : ""}{t.short}
            </button>
          ))}
        </div>
        {selected && (
          <div style={{ marginTop: 8, padding: "6px 10px", background: "#ebf5fb", borderRadius: 6, fontSize: 11.5, color: "#1a5276", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4 }}>
            {selected.full}
          </div>
        )}
      </div>
    </div>
  );
}

// Standard dropdown (kept for long lists: performance status, person relation, chaperone role)
function SelectField({ label, required, value, onChange, options, placeholder, allowFreeText }) {
  const [custom, setCustom] = useState(false);
  const filled = !!value;
  const borderColor = required && !filled ? "#fc8181" : filled ? "#68d391" : "#d0d7e2";
  return (
    <div style={{ marginBottom: 14 }}>
      <FieldLabel required={required}>{label}</FieldLabel>
      {!custom ? (
        <select value={value} onChange={e => { if (e.target.value === "__custom__") { setCustom(true); onChange(""); } else onChange(e.target.value); }}
          style={{ ...inputStyle, borderColor }}>
          <option value="">{placeholder || "Select…"}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
          {allowFreeText && <option value="__custom__">✏️ Free text…</option>}
        </select>
      ) : (
        <div style={{ display: "flex", gap: 6 }}>
          <input type="text" value={value} onChange={e => onChange(e.target.value)}
            placeholder="Type here…" style={{ ...inputStyle, flex: 1 }} autoFocus />
          <button onClick={() => { setCustom(false); onChange(""); }} style={{ ...btnSmall, background: "#edf2f7", color: "#718096" }}>↩</button>
        </div>
      )}
    </div>
  );
}

// Simple text / textarea
function TextField({ label, required, value, onChange, placeholder, multiline }) {
  const filled = !!value;
  const borderColor = required && !filled ? "#fc8181" : filled ? "#68d391" : "#d0d7e2";
  const El = multiline ? "textarea" : "input";
  return (
    <div style={{ marginBottom: 14 }}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <El type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || ""}
        style={{ ...inputStyle, borderColor, ...(multiline ? { minHeight: 64, resize: "vertical" } : {}) }} />
    </div>
  );
}

// SelectOrFreeText kept for examination fields (full exam, chaperone, PMH, etc.)
function SelectOrFreeText({ label, required, value, onChange, options, placeholder }) {
  const [mode, setMode] = useState("select");
  const filled = !!value;
  const borderColor = required && !filled ? "#fc8181" : filled ? "#68d391" : "#d0d7e2";
  return (
    <div style={{ marginBottom: 14 }}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div style={{ display: "flex", gap: 6 }}>
        {mode === "select" ? (
          <select value={value} onChange={e => { if (e.target.value === "__custom__") { setMode("free"); onChange(""); } else onChange(e.target.value); }}
            style={{ ...inputStyle, borderColor, flex: 1 }}>
            <option value="">{placeholder || "Select…"}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
            <option value="__custom__">✏️ Free text…</option>
          </select>
        ) : (
          <>
            <input type="text" value={value} onChange={e => onChange(e.target.value)}
              placeholder="Type here…" style={{ ...inputStyle, borderColor, flex: 1 }} autoFocus />
            <button onClick={() => { setMode("select"); onChange(""); }} style={{ ...btnSmall, background: "#edf2f7", color: "#718096" }}>↩</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Settings modal ───────────────────────────────────────────────────────────
const SETTINGS_SECTIONS = [
  { key: "reasonOptions",        label: "Reason for attendance" },
  { key: "consultantOptions",    label: "Responsible Consultant" },
  { key: "diagnosisOptions",     label: "Diagnosis" },
  { key: "managementOptions",    label: "Management plan" },
  { key: "patientInfoOptions",   label: "Patient information provided" },
  { key: "gpActionsOptions",     label: "Actions for GP" },
  { key: "twwOptions",           label: "TWW pathway" },
  { key: "followUpOptions",      label: "Follow up" },
  { key: "chaperoneRoleOptions", label: "Chaperone roles" },
  { key: "hobbyOptions",         label: 'Hobbies (excluding "No outdoor hobbies")' },
];

function SettingsModal({ settings, onChange, onClose }) {
  const [drafts, setDrafts] = useState({});
  const remove = (key, item) => onChange({ ...settings, [key]: settings[key].filter(o => o !== item) });
  const add = (key) => {
    const val = (drafts[key] || "").trim();
    if (!val || settings[key].includes(val)) return;
    onChange({ ...settings, [key]: [...settings[key], val] });
    setDrafts(d => ({ ...d, [key]: "" }));
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 300, overflowY: "auto", padding: "32px 16px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", background: "#fff", borderRadius: 16, padding: "26px 26px 32px", boxShadow: "0 12px 48px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 18, color: "#1a5276" }}>⚙️ Settings</div>
          <button onClick={onClose} style={{ ...btnSmall, background: "#edf2f7", color: "#555" }}>✕ Close</button>
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#718096", marginTop: 0, marginBottom: 22 }}>
          Customise options in each list. Changes are saved to your browser.
        </p>
        {SETTINGS_SECTIONS.map(({ key, label }) => (
          <div key={key} style={{ marginBottom: 22, paddingBottom: 22, borderBottom: "1px solid #edf2f7" }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13, color: "#2d3748", marginBottom: 8 }}>{label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {(settings[key] || []).map(item => (
                <span key={item} style={{ ...tagStyle, background: "#f0f4f8", color: "#2d3748", borderColor: "#d0d7e2", display: "inline-flex", alignItems: "center", gap: 5 }}>
                  {item}
                  <button onClick={() => remove(key, item)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e53e3e", padding: 0, fontSize: 13, fontWeight: 700, lineHeight: 1 }}>✕</button>
                </span>
              ))}
              {!(settings[key] || []).length && (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#a0aec0", fontStyle: "italic" }}>No options, add one below</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input type="text" value={drafts[key] || ""} placeholder="Add option…"
                onChange={e => setDrafts(d => ({ ...d, [key]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && add(key)}
                style={{ ...inputStyle, flex: 1, fontSize: 12 }} />
              <button onClick={() => add(key)} style={{ ...btnSmall, background: "#1a5276", color: "#fff", padding: "6px 16px" }}>Add</button>
            </div>
          </div>
        ))}
        <button onClick={() => onChange(DEFAULT_SETTINGS)}
          style={{ ...btnSmall, background: "#fff5f5", color: "#e53e3e", border: "1px solid #fed7d7", width: "100%", padding: "10px 0", fontSize: 13, borderRadius: 8 }}>
          🗑 Reset all to defaults
        </button>
      </div>
    </div>
  );
}

// ─── Main app ─────────────────────────────────────────────────────────────────
export default function ClinicLetterApp() {
  // Settings
  const [customSettings, setCustomSettings] = useState(() => {
    try { const s = localStorage.getItem("clinicLetterSettings"); if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) }; } catch {}
    return DEFAULT_SETTINGS;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const saveSettings = (next) => { setCustomSettings(next); try { localStorage.setItem("clinicLetterSettings", JSON.stringify(next)); } catch {} };
  const s = customSettings;

  // ── Clinic details ──
  const [reason, setReason]                         = useState("");
  const [consultant, setConsultant]                 = useState("");
  const [diagnosis, setDiagnosis]                   = useState([]);
  const [diagnosisFree, setDiagnosisFree]           = useState("");
  const [managementPlan, setManagementPlan]         = useState([]);
  const [managementPlanFree, setManagementPlanFree] = useState("");
  const [patientInfo, setPatientInfo]               = useState(["ABCDE mole check", "Sun safety"]);
  const [patientInfoFree, setPatientInfoFree]       = useState("");
  const [gpActions, setGpActions]                   = useState([]);
  const [gpActionsFree, setGpActionsFree]           = useState("");
  const [lesionId, setLesionId]                     = useState("");
  const [twwPathway, setTwwPathway]                 = useState("");
  const [followUp, setFollowUp]                     = useState("");
  const [followUpNumber, setFollowUpNumber]         = useState("6");
  const [followUpPeriod, setFollowUpPeriod]         = useState("weeks");

  // ── Clinical assessment ──
  const [location, setLocation]                     = useState("");
  const [duration, setDuration]                     = useState("");
  const [reportedChange, setReportedChange]         = useState([]);
  const [reportedChangeFree, setReportedChangeFree] = useState("");
  const [symptoms, setSymptoms]                     = useState([]);
  const [symptomsFree, setSymptomsFree]             = useState("");

  // ── Risk factors ──
  const [prevCancer, setPrevCancer]         = useState("");
  const [familyHx, setFamilyHx]             = useState("");
  const [immunosupp, setImmunosupp]         = useState("");
  const [skinType, setSkinType]             = useState("");
  const [sunExposure, setSunExposure]       = useState("");
  const [sunbed, setSunbed]                 = useState("");
  const [workedOutside, setWorkedOutside]   = useState("");
  const [livedAbroad, setLivedAbroad]       = useState("");
  const [childhoodBurn, setChildhoodBurn]   = useState("");
  const [hobbies, setHobbies]               = useState([]);
  const [hobbiesFree, setHobbiesFree]       = useState("");

  // ── Patient details ──
  const [pmh, setPmh]               = useState("");
  const [anticoag, setAnticoag]     = useState("");
  const [allergies, setAllergies]   = useState("");
  const [ppm, setPpm]               = useState("");
  const [social, setSocial]         = useState([]);
  const [socialFree, setSocialFree] = useState("");
  const [perfStatus, setPerfStatus] = useState("");

  // ── Examination ──
  const [fullExam, setFullExam]                   = useState("");
  const [skinExamFindings, setSkinExamFindings]   = useState("");
  const [chaperone, setChaperone]                 = useState("");
  const [chaperoneName, setChaperoneName]         = useState("");
  const [chaperoneRole, setChaperoneRole]         = useState("");
  const [personName, setPersonName]               = useState("");
  const [personRelation, setPersonRelation]       = useState("");

  // ── Lesions ──
  const [lesions, setLesions] = useState([{ site: "", size: "", dermoscopy: [], dermoscopyFree: "" }]);

  // ── Consultant involvement ──
  const [consultInvolvement, setConsultInvolvement] = useState("");
  const [consultInvolved, setConsultInvolved]       = useState("");

  // ── UI ──
  const [view, setView]     = useState("form");
  const [copied, setCopied] = useState(false);
  const letterRef           = useRef(null);

  const handleLocationChange = (val) => {
    setLocation(val);
    setLesions(prev => { const c = [...prev]; c[0] = { ...c[0], site: val }; return c; });
  };

  const addLesion    = () => setLesions([...lesions, { site: "", size: "", dermoscopy: [], dermoscopyFree: "" }]);
  const removeLesion = (i) => { if (lesions.length > 1) setLesions(lesions.filter((_, idx) => idx !== i)); };
  const updateLesion = (i, f, v) => { const c = [...lesions]; c[i] = { ...c[i], [f]: v }; setLesions(c); };

  useEffect(() => {
    if (lesionId === "Clinical photography on PACS") {
      setManagementPlan(prev => prev.includes("Clinical photography") ? prev : [...prev, "Clinical photography"]);
    }
  }, [lesionId]);

  useEffect(() => {
    if (followUp === "Clinic follow up") {
      setManagementPlan(prev => prev.includes("Clinic review follow up") ? prev : [...prev, "Clinic review follow up"]);
    }
  }, [followUp]);

  const allDiagnoses = useMemo(() => { const d = [...diagnosis]; if (diagnosisFree) d.push(diagnosisFree); return d; }, [diagnosis, diagnosisFree]);
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const skinTypeShort   = useMemo(() => SKIN_TYPES.find(t => t.full === skinType)?.short || skinType, [skinType]);
  const perfStatusShort = useMemo(() => { const m = perfStatus.match(/^(\d+)/); return m ? m[1] : perfStatus; }, [perfStatus]);

  const requiredFields = useMemo(() => ([
    { name: "Reason for attendance",  ok: !!reason },
    { name: "Responsible Consultant", ok: !!consultant },
    { name: "Diagnosis",              ok: diagnosis.length > 0 || !!diagnosisFree },
    { name: "Management plan",        ok: managementPlan.length > 0 || !!managementPlanFree },
    { name: "Patient information",    ok: patientInfo.length > 0 || !!patientInfoFree },
    { name: "Actions for GP",         ok: gpActions.length > 0 || !!gpActionsFree },
    { name: "TWW pathway",            ok: !!twwPathway },
    { name: "Follow up",              ok: !!followUp },
    { name: "Location",               ok: !!location },
    { name: "Duration",               ok: !!duration },
    { name: "Reported change",        ok: reportedChange.length > 0 || !!reportedChangeFree },
    { name: "Symptoms",               ok: symptoms.length > 0 || !!symptomsFree },
    { name: "Previous skin cancer",   ok: !!prevCancer },
    { name: "Family history",         ok: !!familyHx },
    { name: "Immunosuppression",      ok: !!immunosupp },
    { name: "Skin type",              ok: !!skinType },
    { name: "Sun exposure",           ok: !!sunExposure },
    { name: "Sunbed use",             ok: !!sunbed },
    { name: "PMH",                    ok: !!pmh },
    { name: "Anticoagulation",        ok: !!anticoag },
    { name: "Allergies",              ok: !!allergies },
    { name: "PPM/device",             ok: !!ppm },
    { name: "Social history",         ok: social.length > 0 || !!socialFree },
    { name: "Performance status",     ok: !!perfStatus },
    { name: "Full skin exam",         ok: !!fullExam },
    { name: "Chaperone",              ok: !!chaperone },
    { name: "Lesion 1 site",          ok: !!lesions[0]?.site },
    { name: "Lesion 1 size",          ok: !!lesions[0]?.size },
    { name: "Lesion 1 dermoscopy",    ok: lesions[0]?.dermoscopy?.length > 0 || !!lesions[0]?.dermoscopyFree },
    { name: "Consultant involvement", ok: !!consultInvolvement },
    { name: "Consultant involved",    ok: !!consultInvolved },
  ]), [reason,consultant,diagnosis,diagnosisFree,managementPlan,managementPlanFree,patientInfo,patientInfoFree,gpActions,gpActionsFree,twwPathway,followUp,location,duration,reportedChange,reportedChangeFree,symptoms,symptomsFree,prevCancer,familyHx,immunosupp,skinType,sunExposure,sunbed,pmh,anticoag,allergies,ppm,social,socialFree,perfStatus,fullExam,chaperone,lesions,consultInvolvement,consultInvolved]);

  const filledCount = requiredFields.filter(f => f.ok).length;
  const totalCount  = requiredFields.length;
  const allFilled   = filledCount === totalCount;
  const diagLabel   = allDiagnoses.length > 1 ? "Diagnoses" : "Diagnosis";

  const chaperoneText = useMemo(() => {
    if (chaperone === "No at patient request") return "No at patient request";
    if (chaperone === "Yes") return `Yes, by ${chaperoneName || "[name]"}${chaperoneRole ? ` (${chaperoneRole})` : ""}`;
    return chaperone;
  }, [chaperone, chaperoneName, chaperoneRole]);

  const chaperoneProsePhrase = useMemo(() => {
    if (chaperone === "No at patient request") return "no chaperone at patient request";
    if (chaperone === "Nil present")           return "no chaperone";
    if (chaperone === "Yes") return `chaperone ${chaperoneName || "[name]"}${chaperoneRole ? ` (${low(chaperoneRole)})` : ""}`;
    return chaperone ? low(chaperone) : "[chaperone]";
  }, [chaperone, chaperoneName, chaperoneRole]);

  const fullExamStructured = useMemo(() => {
    if (fullExam === "No")               return "No, patient kindly declined offer and has capacity";
    if (fullExam === "Normal")           return "Yes, no abnormal findings";
    if (fullExam === "Abnormal findings") return skinExamFindings ? `Yes, abnormal findings: ${cap(skinExamFindings)}` : "Yes, abnormal findings (not described)";
    return fullExam;
  }, [fullExam, skinExamFindings]);

  const hobbyListText    = hobbies.includes("No outdoor hobbies") ? "No outdoor hobbies" : joinMulti(hobbies.filter(h => h !== "No outdoor hobbies"), hobbiesFree);
  const hobbyProsePhrase = useMemo(() => formatHobbyList(hobbies, hobbiesFree), [hobbies, hobbiesFree]);

  const sunExposureProse = useMemo(() => {
    if (!sunExposure) return "";
    const base = `You have had ${low(sunExposure)}`;
    const sunbedFrag = sunbed && sunbed !== "Never" ? (SUNBED_FRAGMENTS[sunbed] || low(sunbed)) : "";
    if (sunExposure.toLowerCase().includes("minimal")) {
      return sunbedFrag ? `${base}. You ${sunbedFrag}.` : `${base}.`;
    }
    const frags = [];
    if (workedOutside && workedOutside !== "Never") frags.push(WORKED_OUTSIDE_FRAGMENTS[workedOutside] || low(workedOutside));
    if (livedAbroad && livedAbroad !== "Never")     frags.push(LIVED_ABROAD_FRAGMENTS[livedAbroad] || low(livedAbroad));
    if (hobbyProsePhrase)                           frags.push(`enjoy ${hobbyProsePhrase}`);
    if (sunbedFrag)                                 frags.push(sunbedFrag);
    if (!frags.length) return `${base}.`;
    return `${base}. You ${joinAnd(frags)}.`;
  }, [sunExposure, workedOutside, livedAbroad, hobbyProsePhrase, sunbed]);

  const personPresentPhrase = useMemo(() => {
    if (!personName && !personRelation) return "";
    if (personName && personRelation)   return `, with ${personName}, your ${low(personRelation)},`;
    if (personName)                     return `, with ${personName},`;
    return `, with your ${low(personRelation)},`;
  }, [personName, personRelation]);

  const consultantSentence = useMemo(() => {
    if (!consultInvolved) return "";
    if (consultInvolvement === "Review")
      return `You were also reviewed by ${consultInvolved}, who agreed with the likely diagnosis and management plan.`;
    return `I discussed your case with ${consultInvolved}, who agreed with the likely diagnosis and management plan.`;
  }, [consultInvolvement, consultInvolved, allDiagnoses]);

  const followUpParagraph = useMemo(() =>
    followUp === "Discharge"
      ? "If you find any new, non-healing or rapidly growing lesions please seek medical attention via your local care provider if you have been discharged from our service."
      : "If you remain under dermatology follow-up, please contact using the details at the top of this letter. Waiting times for procedures can be long therefore if you notice any significant increase in size of the growth or develop new symptoms such as pain or bleeding please contact us urgently on the above number."
  , [followUp]);

  const generateLetter = useCallback(() => {
    const L = [];
    L.push(`Date: ${today}`);
    L.push("Two-week wait skin cancer clinic letter - HL\n");
    L.push(`Reason for attendance: ${cap(reason) || "[Not specified]"}\n`);
    L.push(`Responsible Consultant: ${cap(consultant) || "[Not specified]"}\n`);
    L.push("Dear\n");
    L.push("You recently attended the urgent skin cancer clinic for assessment. The clinical information provided by yourself and your GP were reviewed.\n");
    L.push(`${diagLabel}: ${capJoin(allDiagnoses, "") || "[Not specified]"}\n`);
    L.push(`Management plan: ${capJoin(managementPlan, managementPlanFree) || "[Not specified]"}\n`);
    L.push(`Patient information provided: ${capJoin(patientInfo, patientInfoFree) || "[Not specified]"}\n`);
    const gpActionsDisplay = [...gpActions.map(a => a === "Script" ? "Please provide treatments as per GP script" : a), ...(gpActionsFree ? [gpActionsFree] : [])];
    L.push(`Actions for GP: ${cap(gpActionsDisplay.join(", ")) || "[Not specified]"}\n`);
    L.push(`How will lesion be identified: ${cap(lesionId) || "N/A"}\n`);
    L.push(`Remain on TWW pathway: ${cap(twwPathway) || "[Not specified]"}\n`);
    const followUpDisplay = followUp === "Clinic follow up" ? `Clinic follow up in ${followUpNumber} ${followUpPeriod}` : followUp;
    L.push(`Follow up: ${cap(followUpDisplay) || "[Not specified]"}\n`);
    L.push("Clinical Assessment");
    L.push(`Location: ${cap(location) || "[Not specified]"}`);
    L.push(`Duration: ${cap(duration) || "[Not specified]"}`);
    L.push(`Reported change: ${capJoin(reportedChange, reportedChangeFree) || "[Not specified]"}`);
    L.push(`Any symptoms: ${capJoin(symptoms, symptomsFree) || "[Not specified]"}\n`);
    L.push("Risk factors");
    L.push(`Previous skin cancer: ${cap(prevCancer) || "[Not specified]"}`);
    L.push(`Family history: ${cap(familyHx) || "[Not specified]"}`);
    L.push(`Immunosuppression: ${cap(immunosupp) || "[Not specified]"}`);
    L.push(`Skin type: ${skinTypeShort || "[Not specified]"}`);
    L.push(`Sun exposure: ${cap(sunExposure) || "[Not specified]"}`);
    L.push(`Sunbed use: ${cap(sunbed) || "[Not specified]"}`);
    L.push(`Worked outside: ${cap(workedOutside) || "Never"}`);
    L.push(`Lived abroad: ${cap(livedAbroad) || "Never"}`);
    L.push(`Childhood sunburn: ${cap(childhoodBurn) || "Unknown"}`);
    L.push(`Hobbies: ${cap(hobbyListText) || "[Not specified]"}\n`);
    L.push("Patient details");
    L.push(`Relevant PMH: ${cap(pmh) || "[Not specified]"}`);
    L.push(`Antiplatelets/anticoagulation medication: ${cap(anticoag) || "[Not specified]"}`);
    L.push(`Allergies: ${cap(allergies) || "[Not specified]"}`);
    L.push(`PPM/implanted device: ${cap(ppm) || "[Not specified]"}`);
    L.push(`Social history: ${capJoin(social, socialFree) || "[Not specified]"}`);
    L.push(`Performance status: ${perfStatusShort || "[Not specified]"}\n`);
    L.push("Examination");
    L.push(`Full skin examination performed: ${fullExamStructured || "[Not specified]"}`);
    L.push(`Chaperone: ${chaperoneText || "[Not specified]"}\n`);
    lesions.forEach((l, i) => {
      L.push(`Lesion ${i + 1}:`);
      L.push(`Site: ${cap(l.site) || "[Not specified]"}`);
      L.push(`Size: ${cap(l.size) || "[Not specified]"}`);
      L.push(`Dermoscopy findings: ${capJoin(l.dermoscopy, l.dermoscopyFree) || "[Not specified]"}\n`);
    });
    // Prose
    L.push(`I reviewed you${personPresentPhrase} this morning in the two-week wait skin cancer clinic due to a lesion on ${low(location) || "[location]"}. This has been present for ${low(duration) || "[duration]"}.`);
    if (sunExposureProse) L.push(sunExposureProse);
    L.push("");
    if (fullExam === "Normal") {
      L.push(`I conducted a full skin examination with ${chaperoneProsePhrase} present. There were no other lesions of concern.`);
    } else if (fullExam === "Abnormal findings") {
      L.push(`I conducted a full skin examination with ${chaperoneProsePhrase} present.${skinExamFindings ? ` I noted the following findings: ${low(skinExamFindings)}.` : ""}`);
    }
    L.push("");
    if (lesions[0]?.site) { L.push(`The lesion on the ${low(lesions[0].site)} is typical of a ${low(allDiagnoses[0]) || "[diagnosis]"}.`); L.push(""); }
    if (managementPlan.includes("5-fluorouracil cream")) {
      L.push("Please apply 5-FU (Efudix or Tolak) cream once daily for 4 weeks to the affected areas as discussed. Wash your hands thoroughly after each application. This treatment is expected to cause some irritation and soreness, and it is acceptable to skip the occasional day if needed. The crusting and scabbing will settle over a few weeks once treatment is complete. Occasionally a repeat course is required.");
      L.push("");
    }
    L.push(consultantSentence);
    L.push("");
    if (followUp === "Clinic follow up") {
      L.push(`We will arrange a follow-up clinic appointment for you in ${followUpNumber} ${followUpPeriod}. If you have not heard from us by then, please contact the team using the details at the top of this letter.`);
      L.push("");
    }
    L.push("Management as above.\n");
    L.push("Please continue to monitor your skin regularly for any changes.\n");
    L.push("If you remain under dermatology follow-up, please contact using the details at the top of this letter. Waiting times for procedures can be long therefore if you notice any significant increase in size of the growth or develop new symptoms such as pain or bleeding please contact us urgently on the above number\n");
    L.push("If you find any new, non-healing or rapidly growing lesions please seek medical attention via your local care provider if you have been discharged from our service.\n");
    L.push("Yours sincerely\n");
    L.push("Dr Harry Large");
    L.push("GPST3 in Dermatology");
    L.push("GMC: 7837565");
    return L.join("\n");
  }, [reason,consultant,allDiagnoses,diagLabel,managementPlan,managementPlanFree,patientInfo,patientInfoFree,gpActions,gpActionsFree,lesionId,twwPathway,followUp,followUpNumber,followUpPeriod,location,duration,reportedChange,reportedChangeFree,symptoms,symptomsFree,prevCancer,familyHx,immunosupp,skinTypeShort,sunExposure,sunbed,workedOutside,livedAbroad,childhoodBurn,hobbyListText,hobbyProsePhrase,hobbies,sunExposureProse,pmh,anticoag,allergies,ppm,social,socialFree,perfStatusShort,fullExamStructured,chaperoneText,chaperoneProsePhrase,fullExam,skinExamFindings,lesions,consultantSentence,personPresentPhrase,today]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateLetter()).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const resetForm = () => {
    setReason(""); setConsultant(""); setDiagnosis([]); setDiagnosisFree("");
    setManagementPlan([]); setManagementPlanFree("");
    setPatientInfo(["ABCDE mole check", "Sun safety"]); setPatientInfoFree("");
    setGpActions([]); setGpActionsFree(""); setLesionId(""); setTwwPathway(""); setFollowUp(""); setFollowUpNumber("6"); setFollowUpPeriod("weeks");
    setLocation(""); setDuration(""); setReportedChange([]); setReportedChangeFree("");
    setSymptoms([]); setSymptomsFree(""); setPrevCancer(""); setFamilyHx(""); setImmunosupp("");
    setSkinType(""); setSunExposure(""); setSunbed(""); setWorkedOutside(""); setLivedAbroad("");
    setChildhoodBurn(""); setHobbies([]); setHobbiesFree(""); setPmh(""); setAnticoag("");
    setAllergies(""); setPpm(""); setSocial([]); setSocialFree(""); setPerfStatus("");
    setFullExam(""); setSkinExamFindings(""); setChaperone(""); setChaperoneName(""); setChaperoneRole("");
    setPersonName(""); setPersonRelation("");
    setLesions([{ site: "", size: "", dermoscopy: [], dermoscopyFree: "" }]);
    setConsultInvolvement(""); setConsultInvolved(""); setView("form");
  };

  // Card builder with per-section accent
  const card = (accent) => ({
    background: "#fff", borderRadius: 14, padding: "22px 24px", margin: "10px 14px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #edf2f7",
    borderTop: `3px solid ${accent}`
  });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", fontFamily: "'DM Sans', sans-serif", background: "#f0f4f8", minHeight: "100vh", padding: "0 0 48px" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {settingsOpen && <SettingsModal settings={customSettings} onChange={saveSettings} onClose={() => setSettingsOpen(false)} />}

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #1a3a5c 0%, #1a5276 50%, #2471a3 100%)",
        padding: "22px 26px 16px", color: "#fff", position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.5 }}>TWW Skin Cancer Clinic</div>
            <div style={{ fontSize: 11.5, opacity: 0.75, marginTop: 2, letterSpacing: 0.3 }}>Dr Harry Large · {today}</div>
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <button onClick={resetForm}
              style={{ ...tabBtn, background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>
              🗑 Reset
            </button>
            <button onClick={() => setSettingsOpen(true)}
              style={{ ...tabBtn, background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>
              ⚙️ Settings
            </button>
            <button onClick={() => setView("form")}
              style={{ ...tabBtn, background: view === "form" ? "#fff" : "rgba(255,255,255,0.12)", color: view === "form" ? "#1a5276" : "#fff", border: view === "form" ? "none" : "1px solid rgba(255,255,255,0.2)" }}>
              📋 Form
            </button>
            <button onClick={() => setView("letter")}
              style={{ ...tabBtn, background: view === "letter" ? "#fff" : "rgba(255,255,255,0.12)", color: view === "letter" ? "#1a5276" : "#fff", border: view === "letter" ? "none" : "1px solid rgba(255,255,255,0.2)" }}>
              ✉️ Letter
            </button>
          </div>
        </div>
        {/* Progress */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 11, opacity: 0.8 }}>{filledCount}/{totalCount} required fields</span>
            {allFilled
              ? <span style={{ fontSize: 11, color: "#6ee7b7", fontWeight: 600 }}>✓ Ready to generate</span>
              : <span style={{ fontSize: 11, color: "#fcd34d" }}>⚠ {totalCount - filledCount} remaining</span>}
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, height: 6 }}>
            <div style={{ width: `${(filledCount / totalCount) * 100}%`, height: "100%", background: allFilled ? "#34d399" : "#fbbf24", borderRadius: 20, transition: "width 0.3s ease" }} />
          </div>
        </div>
      </div>

      {view === "form" ? (
        <div>
          {/* ── CLINIC DETAILS ── */}
          <div style={card(ACCENTS.clinic)}>
            <SectionHeader icon="🏥" accent={ACCENTS.clinic}>Clinic Details</SectionHeader>
            <ButtonSelectGroup label="Reason for attendance" required value={reason} onChange={setReason}
              options={s.reasonOptions} allowFreeText />
            <ButtonSelectGroup label="Responsible Consultant" required value={consultant} onChange={setConsultant}
              options={s.consultantOptions} allowFreeText />
            <CheckboxGroup label="Diagnosis" required options={s.diagnosisOptions}
              selected={diagnosis} onChange={setDiagnosis} allowFreeText freeText={diagnosisFree} onFreeTextChange={setDiagnosisFree} />
            <CheckboxGroup label="Management plan" required options={s.managementOptions}
              selected={managementPlan} onChange={setManagementPlan}
              allowFreeText freeText={managementPlanFree} onFreeTextChange={setManagementPlanFree} />
            <CheckboxGroup label="Patient information provided" required options={s.patientInfoOptions}
              selected={patientInfo} onChange={setPatientInfo} allowFreeText freeText={patientInfoFree} onFreeTextChange={setPatientInfoFree} />
            <CheckboxGroup label="Actions for GP" required options={s.gpActionsOptions}
              selected={gpActions} onChange={setGpActions} allowFreeText freeText={gpActionsFree} onFreeTextChange={setGpActionsFree} />
            <ButtonSelectGroup label="How will lesion be identified" value={lesionId} onChange={setLesionId}
              options={["N/A", "Patient to identify", "Clinical photography on PACS"]} allowFreeText />
            <ButtonSelectGroup label="Remain on TWW pathway" required value={twwPathway} onChange={setTwwPathway}
              options={s.twwOptions} />
            <ButtonSelectGroup label="Follow up" required value={followUp} onChange={setFollowUp}
              options={s.followUpOptions} allowFreeText />
            {followUp === "Clinic follow up" && (
              <div style={{ display: "flex", gap: 8, marginTop: -6, marginBottom: 14 }}>
                <select value={followUpNumber} onChange={e => setFollowUpNumber(e.target.value)}
                  style={{ ...inputStyle, width: 80 }}>
                  {[1,2,3,4,5,6,7,8,9,10,11,12,16,18,24].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <select value={followUpPeriod} onChange={e => setFollowUpPeriod(e.target.value)}
                  style={{ ...inputStyle, width: 110 }}>
                  {["days","weeks","months"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* ── CLINICAL ASSESSMENT ── */}
          <div style={card(ACCENTS.assessment)}>
            <SectionHeader icon="🔍" accent={ACCENTS.assessment}>Clinical Assessment</SectionHeader>
            <TextField label="Location" required value={location} onChange={handleLocationChange} placeholder="e.g. Left forearm" />
            <TextField label="Duration" required value={duration} onChange={setDuration} placeholder="e.g. 6 months" />
            <CheckboxGroup label="Reported change" required
              options={["Change in colour", "Change in size", "Change in texture"]}
              selected={reportedChange} onChange={setReportedChange}
              allowFreeText freeText={reportedChangeFree} onFreeTextChange={setReportedChangeFree} />
            <CheckboxGroup label="Any symptoms" required options={["None", "Itchy", "Bleeding", "Painful"]}
              selected={symptoms} onChange={setSymptoms}
              allowFreeText freeText={symptomsFree} onFreeTextChange={setSymptomsFree} />
          </div>

          {/* ── RISK FACTORS ── */}
          <div style={card(ACCENTS.risk)}>
            <SectionHeader icon="⚠️" accent={ACCENTS.risk}>Risk Factors</SectionHeader>
            <ButtonSelectGroup label="Previous skin cancer" required value={prevCancer} onChange={setPrevCancer}
              options={["None", "Yes, previous BCC", "Yes, previous SCC", "Yes, previous melanoma"]} allowFreeText />
            <ButtonSelectGroup label="Family history" required value={familyHx} onChange={setFamilyHx}
              options={["None"]} allowFreeText />
            <ButtonSelectGroup label="Immunosuppression" required value={immunosupp} onChange={setImmunosupp}
              options={["None"]} allowFreeText />
            <SkinTypeSelect required value={skinType} onChange={setSkinType} />
            <ButtonSelectGroup label="Sun exposure" required value={sunExposure} onChange={setSunExposure}
              options={["Minimal sun exposure", "Moderate sun exposure", "Marked sun exposure"]} allowFreeText />
            <ButtonSelectGroup label="Sunbed use" required value={sunbed} onChange={setSunbed}
              options={["Never", "Minimal previous use", "Regular previous use", "Minimal current use", "Regular current use"]} allowFreeText />
            <ButtonSelectGroup label="Worked outside" value={workedOutside} onChange={setWorkedOutside}
              options={["Never", "Previously worked outside", "Currently works outdoors"]} allowFreeText />
            <ButtonSelectGroup label="Lived abroad" value={livedAbroad} onChange={setLivedAbroad}
              options={["Never", "Previously lived abroad"]} allowFreeText />
            <ButtonSelectGroup label="Childhood sunburn" value={childhoodBurn} onChange={setChildhoodBurn}
              options={["Unknown", "No significant childhood sunburn"]} allowFreeText />
            <CheckboxGroup label="Hobbies" options={["No outdoor hobbies", ...s.hobbyOptions]}
              selected={hobbies} onChange={setHobbies}
              allowFreeText freeText={hobbiesFree} onFreeTextChange={setHobbiesFree} />
          </div>

          {/* ── PATIENT DETAILS ── */}
          <div style={card(ACCENTS.patient)}>
            <SectionHeader icon="👤" accent={ACCENTS.patient}>Patient Details</SectionHeader>
            <SelectOrFreeText label="Relevant PMH" required value={pmh} onChange={setPmh} options={["None"]} />
            <SelectOrFreeText label="Antiplatelets / anticoagulation" required value={anticoag} onChange={setAnticoag} options={["None"]} />
            <SelectOrFreeText label="Allergies" required value={allergies} onChange={setAllergies} options={["No known drug allergies"]} />
            <SelectOrFreeText label="PPM / implanted device" required value={ppm} onChange={setPpm} options={["None"]} />
            <CheckboxGroup label="Social history" required options={SOCIAL_OPTIONS}
              selected={social} onChange={setSocial}
              allowFreeText freeText={socialFree} onFreeTextChange={setSocialFree} />
            <SelectField label="Performance status" required value={perfStatus} onChange={setPerfStatus}
              options={PERFORMANCE_STATUS} allowFreeText />
          </div>

          {/* ── EXAMINATION ── */}
          <div style={card(ACCENTS.examination)}>
            <SectionHeader icon="🩺" accent={ACCENTS.examination}>Examination</SectionHeader>
            <TextField label="Person present: name (optional)" value={personName} onChange={setPersonName} placeholder="e.g. Jane" />
            <SelectField label="Person present: relation (optional)" value={personRelation} onChange={setPersonRelation}
              options={["Partner", "Spouse", "Husband", "Wife", "Mother", "Father", "Daughter", "Son", "Sister", "Brother", "Friend", "Carer"]}
              allowFreeText placeholder="Select relation…" />
            <SelectOrFreeText label="Full skin examination" required value={fullExam}
              onChange={(v) => { setFullExam(v); if (v !== "Abnormal findings") setSkinExamFindings(""); }}
              options={["Normal", "Abnormal findings", "No"]} />
            {fullExam === "Abnormal findings" && (
              <TextField label="Describe findings" value={skinExamFindings} onChange={setSkinExamFindings}
                placeholder="Describe abnormal findings…" multiline />
            )}
            <SelectOrFreeText label="Chaperone" required value={chaperone}
              onChange={(v) => { setChaperone(v); if (v !== "Yes") { setChaperoneName(""); setChaperoneRole(""); } }}
              options={["Nil present", "No at patient request", "Yes"]} />
            {chaperone === "Yes" && (
              <>
                <TextField label="Chaperone name" value={chaperoneName} onChange={setChaperoneName} placeholder="Name of chaperone" />
                <SelectField label="Chaperone role" value={chaperoneRole} onChange={setChaperoneRole}
                  options={s.chaperoneRoleOptions} allowFreeText placeholder="Select role…" />
              </>
            )}
          </div>

          {/* ── LESION ASSESSMENT ── */}
          <div style={card(ACCENTS.lesion)}>
            <SectionHeader icon="🔬" accent={ACCENTS.lesion}>Lesion Assessment</SectionHeader>
            {lesions.map((lesion, i) => (
              <div key={i} style={{ background: "#fdf8f8", borderRadius: 10, padding: 16, marginBottom: 14, border: `1px solid ${ACCENTS.lesion}22` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: ACCENTS.lesion, fontFamily: "'DM Sans'" }}>Lesion {i + 1}</span>
                  {lesions.length > 1 && (
                    <button onClick={() => removeLesion(i)} style={{ ...btnSmall, background: "#fff5f5", color: "#e53e3e", border: "1px solid #fed7d7", fontSize: 11 }}>✕ Remove</button>
                  )}
                </div>
                <TextField label="Site" required={i === 0} value={lesion.site}
                  onChange={v => updateLesion(i, "site", v)} placeholder="e.g. Left forearm" />
                <TextField label="Size" required={i === 0} value={lesion.size}
                  onChange={v => updateLesion(i, "size", v)} placeholder="e.g. 8mm × 6mm" />
                <CheckboxGroup label="Dermoscopy findings" required={i === 0}
                  options={DERMOSCOPY_OPTIONS} selected={lesion.dermoscopy}
                  onChange={v => updateLesion(i, "dermoscopy", v)}
                  allowFreeText freeText={lesion.dermoscopyFree}
                  onFreeTextChange={v => updateLesion(i, "dermoscopyFree", v)} />
              </div>
            ))}
            <button onClick={addLesion}
              style={{ ...btnSmall, background: "#fff8f8", color: ACCENTS.lesion, border: `1.5px dashed ${ACCENTS.lesion}80`, width: "100%", padding: 11, fontSize: 13, borderRadius: 10 }}>
              + Add another lesion
            </button>
          </div>

          {/* ── CONSULTANT INVOLVEMENT ── */}
          <div style={card(ACCENTS.consultant)}>
            <SectionHeader icon="👨‍⚕️" accent={ACCENTS.consultant}>Consultant Involvement</SectionHeader>
            <ButtonSelectGroup label="Consultant involvement" required value={consultInvolvement} onChange={setConsultInvolvement}
              options={["Discussion", "Review"]} />
            <ButtonSelectGroup label="Consultant involved" required value={consultInvolved} onChange={setConsultInvolved}
              options={s.consultantOptions} allowFreeText />
          </div>

          {/* ── Actions ── */}
          <div style={{ padding: "14px 14px 0", display: "flex", gap: 10 }}>
            <button onClick={() => setView("letter")}
              style={{
                flex: 1, padding: "15px 20px", borderRadius: 12, border: "none",
                background: allFilled ? "linear-gradient(135deg, #1a3a5c, #2471a3)" : "#a0aec0",
                color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700,
                cursor: "pointer", boxShadow: allFilled ? "0 4px 16px rgba(26,82,118,0.35)" : "none", transition: "all 0.2s"
              }}>
              ✉️ Preview Letter
            </button>
            <button onClick={resetForm}
              style={{ ...btnSmall, padding: "15px 20px", background: "#fff5f5", color: "#e53e3e", border: "1px solid #fed7d7", fontSize: 13, borderRadius: 12 }}>
              🗑 Reset
            </button>
          </div>
        </div>
      ) : (
        /* ── LETTER VIEW ── */
        <div style={{ background: "#fff", borderRadius: 14, padding: "22px 24px", margin: "12px 14px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #edf2f7" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <button onClick={copyToClipboard}
              style={{
                padding: "10px 26px", borderRadius: 9, border: "none", cursor: "pointer",
                background: copied ? "#38a169" : "linear-gradient(135deg, #1a3a5c, #2471a3)",
                color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14,
                boxShadow: "0 2px 10px rgba(26,82,118,0.25)", transition: "all 0.2s"
              }}>
              {copied ? "✓ Copied!" : "📋 Copy Letter"}
            </button>
            <button onClick={() => setView("form")}
              style={{ ...btnSmall, padding: "10px 18px", background: "#edf2f7", color: "#4a5568", fontSize: 13, borderRadius: 9 }}>
              ← Back to form
            </button>
          </div>
          <pre ref={letterRef} style={{
            fontFamily: "'DM Mono', monospace", fontSize: 12.5, lineHeight: 1.75,
            whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#2d3748",
            background: "#f7fafc", padding: 22, borderRadius: 10, border: "1px solid #e2e8f0", margin: 0
          }}>
            {generateLetter()}
          </pre>
        </div>
      )}
    </div>
  );
}
