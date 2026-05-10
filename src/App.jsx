import { useState, useRef, useCallback, useMemo } from "react";

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

const MANAGEMENT_PLAN_OPTIONS = [
  "Reassurance and discharge",
  "Clinical photography",
  "Biopsy",
  "Referral to plastic surgeon",
  "Referral to Mohs surgeon",
  "Referral for excisional biopsy",
  "Referral for punch biopsy",
  "Referral for curette and cautery",
  "Cryotherapy",
  "Clinic review follow up"
];

const SOCIAL_OPTIONS = [
  "Heavy cigarette smoker", "Moderate cigarette smoker", "Minimal cigarette smoker",
  "Ex-heavy cigarette smoker", "Ex-moderate cigarette smoker", "Ex-minimal cigarette smoker",
  "Ex smoker", "Smoker", "Electronic cigarette user", "Ex-electronic cigarette user",
  "Heavy alcohol use", "Moderate alcohol use", "Minimal alcohol use", "No alcohol use",
  "Lives alone", "Lives with family", "Lives with partner"
];

const HOBBY_OPTIONS = [
  "No outdoor hobbies", "Enjoys gardening", "Enjoys horse riding",
  "Enjoys outdoor sports", "Enjoys watersports"
];

const DIAGNOSIS_OPTIONS = [
  "Suspected basal cell carcinoma", "Suspected squamous cell carcinoma",
  "Suspected melanoma", "Seborrhoeic keratosis", "Actinic keratosis"
];

const PATIENT_INFO_OPTIONS = [
  "ABCDE mole check", "Sun safety", "Seborrhoeic keratosis",
  "Incisional biopsy", "Curette and cautery", "Punch biopsy",
  "Cryotherapy", "Efudix", "Actinic keratosis"
];

const SYMPTOM_OPTIONS = ["None", "Itchy", "Bleeding", "Painful"];

const SKIN_TYPES = [
  "Type I - Highly sensitive, always burns, never tans",
  "Type II - Very sun sensitive, burns easily, tans minimally",
  "Type III - Sun sensitive skin, sometimes burns, slowly tans to light brown",
  "Type IV - Minimally sun sensitive, burns minimally, always tans to moderate brown",
  "Type V - Sun insensitive skin, rarely burns, tans well",
  "Type VI - Sun insensitive, never burns, deeply pigmented"
];

const PERFORMANCE_STATUS = [
  "0 - Fully active, able to carry on all pre-disease performance without restriction",
  "1 - Restricted in physically strenuous activity but ambulatory and able to carry out work of a light or sedentary nature",
  "2 - Ambulatory and capable of all selfcare but unable to carry out any work activities; up and about more than 50% of waking hours",
  "3 - Capable of only limited selfcare; confined to bed or chair more than 50% of waking hours",
  "4 - Completely disabled; cannot carry on any selfcare; totally confined to bed or chair",
  "5 - Dead"
];

const CHAPERONE_ROLES = [
  "Nurse", "Healthcare assistant", "Medical student", "Clinic coordinator"
];

// helpers
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const low = (s) => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
const joinMulti = (arr, free) => {
  const all = [...arr];
  if (free) all.push(free);
  return all.join(", ");
};
const capJoin = (arr, free) => cap(joinMulti(arr, free));
const lowJoin = (arr, free) => low(joinMulti(arr, free));

// --- Reusable components ---

function SectionHeader({ children, icon }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 0", marginTop: 20, marginBottom: 8,
      borderBottom: "2px solid #1a5276", color: "#1a5276",
      fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: 0.3
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>{children}
    </div>
  );
}

function FieldLabel({ required, children }) {
  return (
    <label style={{
      display: "block", fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
      fontSize: 13, color: "#2c3e50", marginBottom: 4, letterSpacing: 0.2
    }}>
      {required && <span style={{ color: "#c0392b", marginRight: 3 }}>!</span>}
      {children}
    </label>
  );
}

function SelectField({ label, required, value, onChange, options, placeholder, allowFreeText }) {
  const [custom, setCustom] = useState(false);
  const filled = value && value.length > 0;
  const borderColor = required && !filled ? "#e74c3c" : filled ? "#27ae60" : "#bdc3c7";
  return (
    <div style={{ marginBottom: 12 }}>
      <FieldLabel required={required}>{label}</FieldLabel>
      {!custom ? (
        <div style={{ display: "flex", gap: 6 }}>
          <select value={value} onChange={e => { if (e.target.value === "__custom__") { setCustom(true); onChange(""); } else onChange(e.target.value); }}
            style={{ ...inputStyle, borderColor, flex: 1 }}>
            <option value="">{placeholder || "Select..."}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
            {allowFreeText && <option value="__custom__">✏️ Free text...</option>}
          </select>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 6 }}>
          <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder="Type here..."
            style={{ ...inputStyle, borderColor, flex: 1 }} autoFocus />
          <button onClick={() => { setCustom(false); onChange(""); }}
            style={{ ...btnSmall, background: "#ecf0f1", color: "#7f8c8d" }}>↩</button>
        </div>
      )}
    </div>
  );
}

function TextField({ label, required, value, onChange, placeholder, multiline }) {
  const filled = value && value.length > 0;
  const borderColor = required && !filled ? "#e74c3c" : filled ? "#27ae60" : "#bdc3c7";
  const El = multiline ? "textarea" : "input";
  return (
    <div style={{ marginBottom: 12 }}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <El type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || ""}
        style={{ ...inputStyle, borderColor, ...(multiline ? { minHeight: 60, resize: "vertical" } : {}) }} />
    </div>
  );
}

function CheckboxGroup({ label, required, options, selected, onChange, allowFreeText, freeText, onFreeTextChange }) {
  const filled = selected.length > 0 || (freeText && freeText.length > 0);
  const borderColor = required && !filled ? "#e74c3c" : filled ? "#27ae60" : "#bdc3c7";
  const toggle = (opt) => {
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
  };
  return (
    <div style={{ marginBottom: 12 }}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div style={{ border: `1.5px solid ${borderColor}`, borderRadius: 8, padding: 10, background: "#fff" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {options.map(o => (
            <button key={o} onClick={() => toggle(o)}
              style={{
                ...tagStyle,
                background: selected.includes(o) ? "#1a5276" : "#f0f4f8",
                color: selected.includes(o) ? "#fff" : "#2c3e50",
                borderColor: selected.includes(o) ? "#1a5276" : "#d5dbe1"
              }}>
              {selected.includes(o) ? "✓ " : ""}{o}
            </button>
          ))}
        </div>
        {allowFreeText && (
          <input type="text" value={freeText || ""} onChange={e => onFreeTextChange(e.target.value)}
            placeholder="Additional (free text)..." style={{ ...inputStyle, marginTop: 8, fontSize: 12 }} />
        )}
      </div>
    </div>
  );
}

function SelectOrFreeText({ label, required, value, onChange, options, placeholder }) {
  const [mode, setMode] = useState("select");
  const filled = value && value.length > 0;
  const borderColor = required && !filled ? "#e74c3c" : filled ? "#27ae60" : "#bdc3c7";
  return (
    <div style={{ marginBottom: 12 }}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div style={{ display: "flex", gap: 6 }}>
        {mode === "select" ? (
          <>
            <select value={value} onChange={e => { if (e.target.value === "__custom__") { setMode("free"); onChange(""); } else onChange(e.target.value); }}
              style={{ ...inputStyle, borderColor, flex: 1 }}>
              <option value="">{placeholder || "Select..."}</option>
              {options.map(o => <option key={o} value={o}>{o}</option>)}
              <option value="__custom__">✏️ Free text...</option>
            </select>
          </>
        ) : (
          <>
            <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder="Type here..."
              style={{ ...inputStyle, borderColor, flex: 1 }} autoFocus />
            <button onClick={() => { setMode("select"); onChange(""); }}
              style={{ ...btnSmall, background: "#ecf0f1", color: "#7f8c8d" }}>↩</button>
          </>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "8px 12px", borderRadius: 7, border: "1.5px solid #bdc3c7",
  fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: "none", boxSizing: "border-box",
  transition: "border-color 0.2s", background: "#fff"
};
const tagStyle = {
  padding: "5px 12px", borderRadius: 20, border: "1.5px solid", fontSize: 12,
  fontFamily: "'DM Sans', sans-serif", cursor: "pointer", transition: "all 0.15s",
  fontWeight: 500, whiteSpace: "nowrap"
};
const btnSmall = {
  padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600
};

// --- MAIN APP ---

export default function ClinicLetterApp() {
  // Top section
  const [reason, setReason] = useState("");
  const [consultant, setConsultant] = useState("");
  const [diagnosis, setDiagnosis] = useState([]);
  const [diagnosisFree, setDiagnosisFree] = useState("");
  const [managementPlan, setManagementPlan] = useState([]);
  const [managementPlanFree, setManagementPlanFree] = useState("");
  const [patientInfo, setPatientInfo] = useState(["ABCDE mole check", "Sun safety"]);
  const [patientInfoFree, setPatientInfoFree] = useState("");
  const [gpActions, setGpActions] = useState([]);
  const [gpActionsFree, setGpActionsFree] = useState("");
  const [lesionId, setLesionId] = useState("");
  const [twwPathway, setTwwPathway] = useState("");
  const [followUp, setFollowUp] = useState("");

  // Clinical assessment
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("");
  const [reportedChange, setReportedChange] = useState([]);
  const [reportedChangeFree, setReportedChangeFree] = useState("");
  const [symptoms, setSymptoms] = useState([]);
  const [symptomsFree, setSymptomsFree] = useState("");

  // Risk factors
  const [prevCancer, setPrevCancer] = useState("");
  const [familyHx, setFamilyHx] = useState("");
  const [immunosupp, setImmunosupp] = useState("");
  const [skinType, setSkinType] = useState("");
  const [sunExposure, setSunExposure] = useState("");
  const [sunbed, setSunbed] = useState("");
  const [workedOutside, setWorkedOutside] = useState("");
  const [livedAbroad, setLivedAbroad] = useState("");
  const [childhoodBurn, setChildhoodBurn] = useState("");
  const [hobbies, setHobbies] = useState([]);
  const [hobbiesFree, setHobbiesFree] = useState("");

  // Patient details
  const [pmh, setPmh] = useState("");
  const [anticoag, setAnticoag] = useState("");
  const [allergies, setAllergies] = useState("");
  const [ppm, setPpm] = useState("");
  const [social, setSocial] = useState([]);
  const [socialFree, setSocialFree] = useState("");
  const [perfStatus, setPerfStatus] = useState("");

  // Examination
  const [fullExam, setFullExam] = useState("");
  const [skinExamFindings, setSkinExamFindings] = useState("");
  const [chaperone, setChaperone] = useState("");
  const [chaperoneName, setChaperoneName] = useState("");
  const [chaperoneRole, setChaperoneRole] = useState("");

  // Lesions — site for lesion 0 is kept in sync with location
  const [lesions, setLesions] = useState([{ site: "", size: "", dermoscopy: [], dermoscopyFree: "" }]);

  // Consultant involvement
  const [consultInvolvement, setConsultInvolvement] = useState("");
  const [consultInvolved, setConsultInvolved] = useState("");

  // View mode
  const [view, setView] = useState("form");
  const [copied, setCopied] = useState(false);
  const letterRef = useRef(null);

  // Keep lesion 1 site in sync with location
  const handleLocationChange = (val) => {
    setLocation(val);
    setLesions(prev => {
      const copy = [...prev];
      copy[0] = { ...copy[0], site: val };
      return copy;
    });
  };

  const addLesion = () => setLesions([...lesions, { site: "", size: "", dermoscopy: [], dermoscopyFree: "" }]);
  const removeLesion = (i) => { if (lesions.length > 1) setLesions(lesions.filter((_, idx) => idx !== i)); };
  const updateLesion = (i, field, val) => {
    const copy = [...lesions];
    copy[i] = { ...copy[i], [field]: val };
    setLesions(copy);
  };

  const allDiagnoses = useMemo(() => {
    const d = [...diagnosis];
    if (diagnosisFree) d.push(diagnosisFree);
    return d;
  }, [diagnosis, diagnosisFree]);

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  // Validation
  const requiredFields = useMemo(() => {
    const checks = [
      { name: "Reason for attendance", ok: !!reason },
      { name: "Responsible Consultant", ok: !!consultant },
      { name: "Diagnosis", ok: diagnosis.length > 0 || !!diagnosisFree },
      { name: "Management plan", ok: managementPlan.length > 0 || !!managementPlanFree },
      { name: "Patient information", ok: patientInfo.length > 0 || !!patientInfoFree },
      { name: "Actions for GP", ok: gpActions.length > 0 || !!gpActionsFree },
      { name: "TWW pathway", ok: !!twwPathway },
      { name: "Follow up", ok: !!followUp },
      { name: "Location", ok: !!location },
      { name: "Duration", ok: !!duration },
      { name: "Reported change", ok: reportedChange.length > 0 || !!reportedChangeFree },
      { name: "Symptoms", ok: symptoms.length > 0 || !!symptomsFree },
      { name: "Previous skin cancer", ok: !!prevCancer },
      { name: "Family history", ok: !!familyHx },
      { name: "Immunosuppression", ok: !!immunosupp },
      { name: "Skin type", ok: !!skinType },
      { name: "Sun exposure", ok: !!sunExposure },
      { name: "Sunbed use", ok: !!sunbed },
      { name: "PMH", ok: !!pmh },
      { name: "Anticoagulation", ok: !!anticoag },
      { name: "Allergies", ok: !!allergies },
      { name: "PPM/device", ok: !!ppm },
      { name: "Social history", ok: social.length > 0 || !!socialFree },
      { name: "Performance status", ok: !!perfStatus },
      { name: "Full skin exam", ok: !!fullExam },
      { name: "Chaperone", ok: !!chaperone },
      { name: "Lesion 1 site", ok: !!lesions[0]?.site },
      { name: "Lesion 1 size", ok: !!lesions[0]?.size },
      { name: "Lesion 1 dermoscopy", ok: (lesions[0]?.dermoscopy?.length > 0 || !!lesions[0]?.dermoscopyFree) },
      { name: "Consultant involvement", ok: !!consultInvolvement },
      { name: "Consultant involved", ok: !!consultInvolved },
    ];
    return checks;
  }, [reason,consultant,diagnosis,diagnosisFree,managementPlan,managementPlanFree,patientInfo,patientInfoFree,gpActions,gpActionsFree,twwPathway,followUp,location,duration,reportedChange,reportedChangeFree,symptoms,symptomsFree,prevCancer,familyHx,immunosupp,skinType,sunExposure,sunbed,pmh,anticoag,allergies,ppm,social,socialFree,perfStatus,fullExam,chaperone,lesions,consultInvolvement,consultInvolved]);

  const filledCount = requiredFields.filter(f => f.ok).length;
  const totalCount = requiredFields.length;
  const allFilled = filledCount === totalCount;

  const diagLabel = allDiagnoses.length > 1 ? "Diagnoses" : "Diagnosis";

  const chaperoneText = useMemo(() => {
    if (chaperone === "No at patient request") return "No at patient request";
    if (chaperone === "Yes") {
      const name = chaperoneName || "[name]";
      const role = chaperoneRole ? ` (${chaperoneRole})` : "";
      return `Yes, by ${name}${role}`;
    }
    return chaperone;
  }, [chaperone, chaperoneName, chaperoneRole]);

  const fullExamStructured = useMemo(() => {
    if (fullExam === "No") return "No, patient kindly declined offer and has capacity";
    if (fullExam === "Yes") {
      return skinExamFindings
        ? `Yes - abnormal findings noted: ${cap(skinExamFindings)}`
        : "Yes - no abnormal findings";
    }
    return fullExam;
  }, [fullExam, skinExamFindings]);

  const hobbiesText = hobbies.includes("No outdoor hobbies")
    ? "No outdoor hobbies"
    : joinMulti(hobbies, hobbiesFree) || "";

  const consultantSentence = useMemo(() => {
    if (!consultInvolved) return "";
    if (consultInvolvement === "Review") {
      return `You were also reviewed by ${consultInvolved} who agreed this represents a ${low(allDiagnoses.join(", ")) || "[diagnosis]"}.`;
    }
    return `I discussed your case with ${consultInvolved} who agreed the plan.`;
  }, [consultInvolvement, consultInvolved, allDiagnoses]);

  const followUpParagraph = useMemo(() => {
    if (followUp === "Discharge") {
      return "If you find any new, non-healing or rapidly growing lesions please seek medical attention via your local care provider if you have been discharged from our service.";
    }
    return "If you remain under dermatology follow-up, please contact using the details at the top of this letter. Waiting times for procedures can be long therefore if you notice any significant increase in size of the growth or develop new symptoms such as pain or bleeding please contact us urgently on the above number.";
  }, [followUp]);

  // Prose chaperone phrase
  const chaperoneProsePhrase = useMemo(() => {
    if (chaperone === "No at patient request") return "no chaperone at patient request";
    if (chaperone === "Yes") {
      const name = chaperoneName || "[name]";
      const role = chaperoneRole ? ` (${low(chaperoneRole)})` : "";
      return `chaperone ${name}${role}`;
    }
    return chaperone ? low(chaperone) : "[chaperone]";
  }, [chaperone, chaperoneName, chaperoneRole]);

  const generateLetter = useCallback(() => {
    const lines = [];
    lines.push(`Date: ${today}`);
    lines.push("Two-week wait skin cancer clinic letter - HL\n");
    lines.push(`Reason for attendance: ${cap(reason) || "[Not specified]"}\n`);
    lines.push(`Responsible Consultant: ${cap(consultant) || "[Not specified]"}\n`);
    lines.push("Dear\n");
    lines.push("You recently attended the urgent skin cancer clinic for assessment. The clinical information provided by yourself and your GP were reviewed.\n");
    lines.push(`${diagLabel}: ${capJoin(allDiagnoses, "") || "[Not specified]"}\n`);
    lines.push(`Management plan: ${capJoin(managementPlan, managementPlanFree) || "[Not specified]"}\n`);
    lines.push(`Patient information provided: ${capJoin(patientInfo, patientInfoFree) || "[Not specified]"}\n`);
    lines.push(`Actions for GP: ${capJoin(gpActions, gpActionsFree) || "[Not specified]"}\n`);
    lines.push(`How will lesion be identified: ${cap(lesionId) || "N/A"}\n`);
    lines.push(`Remain on TWW pathway: ${cap(twwPathway) || "[Not specified]"}\n`);
    lines.push(`Follow up: ${cap(followUp) || "[Not specified]"}\n`);

    lines.push("Clinical Assessment");
    lines.push(`Location: ${cap(location) || "[Not specified]"}`);
    lines.push(`Duration: ${cap(duration) || "[Not specified]"}`);
    lines.push(`Reported change: ${capJoin(reportedChange, reportedChangeFree) || "[Not specified]"}`);
    lines.push(`Any symptoms: ${capJoin(symptoms, symptomsFree) || "[Not specified]"}\n`);

    lines.push("Risk factors");
    lines.push(`Previous skin cancer: ${cap(prevCancer) || "[Not specified]"}`);
    lines.push(`Family history: ${cap(familyHx) || "[Not specified]"}`);
    lines.push(`Immunosuppression: ${cap(immunosupp) || "[Not specified]"}`);
    lines.push(`Skin type: ${cap(skinType) || "[Not specified]"}`);
    lines.push(`Sun exposure: ${cap(sunExposure) || "[Not specified]"}`);
    lines.push(`Sunbed use: ${cap(sunbed) || "[Not specified]"}`);
    lines.push(`Worked outside: ${cap(workedOutside) || "Never"}`);
    lines.push(`Lived abroad: ${cap(livedAbroad) || "Never"}`);
    lines.push(`Childhood sunburn: ${cap(childhoodBurn) || "Unknown"}`);
    lines.push(`Hobbies: ${cap(hobbiesText) || "[Not specified]"}\n`);

    lines.push("Patient details");
    lines.push(`Relevant PMH: ${cap(pmh) || "[Not specified]"}`);
    lines.push(`Antiplatelets/anticoagulation medication: ${cap(anticoag) || "[Not specified]"}`);
    lines.push(`Allergies: ${cap(allergies) || "[Not specified]"}`);
    lines.push(`PPM/implanted device: ${cap(ppm) || "[Not specified]"}`);
    lines.push(`Social history: ${capJoin(social, socialFree) || "[Not specified]"}`);
    lines.push(`Performance status: ${cap(perfStatus) || "[Not specified]"}\n`);

    lines.push("Examination");
    lines.push(`Full skin examination performed: ${fullExamStructured || "[Not specified]"}`);
    lines.push(`Chaperone: ${chaperoneText || "[Not specified]"}\n`);

    lesions.forEach((l, i) => {
      lines.push(`Lesion ${i + 1}:`);
      lines.push(`Site: ${cap(l.site) || "[Not specified]"}`);
      lines.push(`Size: ${cap(l.size) || "[Not specified]"}`);
      lines.push(`Dermoscopy findings: ${capJoin(l.dermoscopy, l.dermoscopyFree) || "[Not specified]"}\n`);
    });

    // Prose section — lowercase values mid-sentence
    lines.push(`I reviewed you this morning in the two-week wait skin cancer clinic due to a lesion on ${low(location) || "[location]"}. This has been present for ${low(duration) || "[duration]"}.`);
    if (hobbiesText && !hobbies.includes("No outdoor hobbies")) {
      lines.push(`You do enjoy ${low(hobbiesText)}.`);
    } else if (hobbies.includes("No outdoor hobbies")) {
      lines.push("You have no outdoor hobbies.");
    }
    lines.push("");

    const examFindings = fullExam === "Yes" && skinExamFindings
      ? ` I also noted the following on full skin examination: ${low(skinExamFindings)}.`
      : "";
    lines.push(`I conducted a full skin examination with ${chaperoneProsePhrase} present and did not notice any other lesions of concern.${examFindings}`);
    lines.push("");

    if (lesions[0]?.site) {
      lines.push(`The lesion on the ${low(lesions[0].site)} is typical of a ${low(allDiagnoses[0]) || "[diagnosis]"}.`);
      lines.push("");
    }
    lines.push(consultantSentence);
    lines.push("");
    lines.push("Management as above.\n");
    lines.push("Please continue to monitor your skin regularly for any changes.\n");
    lines.push(followUpParagraph);
    lines.push("");
    lines.push("Yours sincerely\n");
    lines.push("Dr Harry Large");
    lines.push("GPST3 in Dermatology");
    lines.push("GMC: 7837565");

    return lines.join("\n");
  }, [reason,consultant,allDiagnoses,diagLabel,managementPlan,managementPlanFree,patientInfo,patientInfoFree,gpActions,gpActionsFree,lesionId,twwPathway,followUp,location,duration,reportedChange,reportedChangeFree,symptoms,symptomsFree,prevCancer,familyHx,immunosupp,skinType,sunExposure,sunbed,workedOutside,livedAbroad,childhoodBurn,hobbiesText,hobbies,pmh,anticoag,allergies,ppm,social,socialFree,perfStatus,fullExamStructured,chaperoneText,chaperoneProsePhrase,fullExam,skinExamFindings,lesions,consultantSentence,followUpParagraph,today]);

  const copyToClipboard = () => {
    const text = generateLetter();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const resetForm = () => {
    setReason(""); setConsultant(""); setDiagnosis([]); setDiagnosisFree("");
    setManagementPlan([]); setManagementPlanFree("");
    setPatientInfo(["ABCDE mole check", "Sun safety"]); setPatientInfoFree("");
    setGpActions([]); setGpActionsFree(""); setLesionId(""); setTwwPathway(""); setFollowUp("");
    setLocation(""); setDuration(""); setReportedChange([]); setReportedChangeFree("");
    setSymptoms([]); setSymptomsFree(""); setPrevCancer(""); setFamilyHx(""); setImmunosupp("");
    setSkinType(""); setSunExposure(""); setSunbed(""); setWorkedOutside(""); setLivedAbroad("");
    setChildhoodBurn(""); setHobbies([]); setHobbiesFree(""); setPmh(""); setAnticoag("");
    setAllergies(""); setPpm(""); setSocial([]); setSocialFree(""); setPerfStatus("");
    setFullExam(""); setSkinExamFindings(""); setChaperone(""); setChaperoneName(""); setChaperoneRole("");
    setLesions([{ site: "", size: "", dermoscopy: [], dermoscopyFree: "" }]);
    setConsultInvolvement(""); setConsultInvolved(""); setView("form");
  };

  const containerStyle = {
    maxWidth: 780, margin: "0 auto", fontFamily: "'DM Sans', sans-serif",
    background: "#f8f9fa", minHeight: "100vh", padding: "0 0 40px 0"
  };
  const headerStyle = {
    background: "linear-gradient(135deg, #1a5276 0%, #2980b9 100%)",
    padding: "24px 28px 18px", color: "#fff", position: "sticky", top: 0, zIndex: 100,
    boxShadow: "0 2px 12px rgba(0,0,0,0.15)"
  };
  const cardStyle = {
    background: "#fff", borderRadius: 10, padding: "18px 22px", margin: "12px 16px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e8ecf0"
  };

  return (
    <div style={containerStyle}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.3 }}>TWW Skin Cancer Clinic</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Dr Harry Large · {today}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setView("form")}
              style={{ ...tabBtn, background: view === "form" ? "#fff" : "rgba(255,255,255,0.15)", color: view === "form" ? "#1a5276" : "#fff" }}>
              📋 Form
            </button>
            <button onClick={() => setView("letter")}
              style={{ ...tabBtn, background: view === "letter" ? "#fff" : "rgba(255,255,255,0.15)", color: view === "letter" ? "#1a5276" : "#fff" }}>
              ✉️ Letter
            </button>
          </div>
        </div>
        <div style={{ marginTop: 12, background: "rgba(255,255,255,0.2)", borderRadius: 20, height: 8, overflow: "hidden" }}>
          <div style={{ width: `${(filledCount / totalCount) * 100}%`, height: "100%", background: allFilled ? "#2ecc71" : "#f1c40f", borderRadius: 20, transition: "width 0.3s" }} />
        </div>
        <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>
          {filledCount}/{totalCount} required fields completed
          {!allFilled && <span style={{ marginLeft: 8, color: "#f1c40f" }}>⚠ Complete all required fields</span>}
        </div>
      </div>

      {view === "form" ? (
        <div>
          {/* --- CLINIC DETAILS --- */}
          <div style={cardStyle}>
            <SectionHeader icon="🏥">Clinic Details</SectionHeader>
            <SelectField label="Reason for attendance" required value={reason} onChange={setReason}
              options={["Two-week wait skin cancer referral", "Follow up"]} allowFreeText />
            <SelectField label="Responsible Consultant" required value={consultant} onChange={setConsultant}
              options={["Dr Griffin", "Dr Stylianou"]} allowFreeText />
            <CheckboxGroup label="Diagnosis" required options={DIAGNOSIS_OPTIONS}
              selected={diagnosis} onChange={setDiagnosis} allowFreeText freeText={diagnosisFree} onFreeTextChange={setDiagnosisFree} />
            <CheckboxGroup label="Management plan" required options={MANAGEMENT_PLAN_OPTIONS}
              selected={managementPlan} onChange={setManagementPlan}
              allowFreeText freeText={managementPlanFree} onFreeTextChange={setManagementPlanFree} />
            <CheckboxGroup label="Patient information provided" required options={PATIENT_INFO_OPTIONS}
              selected={patientInfo} onChange={setPatientInfo} allowFreeText freeText={patientInfoFree} onFreeTextChange={setPatientInfoFree} />
            <CheckboxGroup label="Actions for GP" required options={["Script", "None"]}
              selected={gpActions} onChange={setGpActions} allowFreeText freeText={gpActionsFree} onFreeTextChange={setGpActionsFree} />
            <SelectField label="How will lesion be identified" value={lesionId} onChange={setLesionId}
              options={["N/A", "Patient to identify", "Clinical photography on PACS"]} allowFreeText />
            <SelectField label="Remain on TWW pathway" required value={twwPathway} onChange={setTwwPathway}
              options={["Step down", "Remain on TWW pathway"]} />
            <SelectField label="Follow up" required value={followUp} onChange={setFollowUp}
              options={["Discharge", "With results"]} allowFreeText />
          </div>

          {/* --- CLINICAL ASSESSMENT --- */}
          <div style={cardStyle}>
            <SectionHeader icon="🔍">Clinical Assessment</SectionHeader>
            <TextField label="Location" required value={location} onChange={handleLocationChange} placeholder="e.g. Left forearm" />
            <TextField label="Duration" required value={duration} onChange={setDuration} placeholder="e.g. 6 months" />
            <CheckboxGroup label="Reported change" required
              options={["Change in colour", "Change in size", "Change in texture"]}
              selected={reportedChange} onChange={setReportedChange}
              allowFreeText freeText={reportedChangeFree} onFreeTextChange={setReportedChangeFree} />
            <CheckboxGroup label="Any symptoms" required options={SYMPTOM_OPTIONS}
              selected={symptoms} onChange={setSymptoms}
              allowFreeText freeText={symptomsFree} onFreeTextChange={setSymptomsFree} />
          </div>

          {/* --- RISK FACTORS --- */}
          <div style={cardStyle}>
            <SectionHeader icon="⚠️">Risk Factors</SectionHeader>
            <SelectOrFreeText label="Previous skin cancer" required value={prevCancer} onChange={setPrevCancer}
              options={["None", "Yes, previous BCC", "Yes, previous SCC", "Yes, previous melanoma"]} />
            <SelectOrFreeText label="Family history" required value={familyHx} onChange={setFamilyHx}
              options={["None"]} />
            <SelectOrFreeText label="Immunosuppression" required value={immunosupp} onChange={setImmunosupp}
              options={["None"]} />
            <SelectField label="Skin type" required value={skinType} onChange={setSkinType}
              options={SKIN_TYPES} allowFreeText />
            <SelectOrFreeText label="Sun exposure" required value={sunExposure} onChange={setSunExposure}
              options={["Minimal sun exposure", "Moderate sun exposure", "Marked sun exposure"]} />
            <SelectOrFreeText label="Sunbed use" required value={sunbed} onChange={setSunbed}
              options={["Never", "Minimal previous use", "Regular user"]} />
            <SelectOrFreeText label="Worked outside" value={workedOutside} onChange={setWorkedOutside}
              options={["Never", "Previously worked outside"]} />
            <SelectOrFreeText label="Lived abroad" value={livedAbroad} onChange={setLivedAbroad}
              options={["Never", "Previously lived abroad"]} />
            <SelectOrFreeText label="Childhood sunburn" value={childhoodBurn} onChange={setChildhoodBurn}
              options={["Unknown", "No significant childhood sunburn"]} />
            <CheckboxGroup label="Hobbies" options={HOBBY_OPTIONS}
              selected={hobbies} onChange={setHobbies}
              allowFreeText freeText={hobbiesFree} onFreeTextChange={setHobbiesFree} />
          </div>

          {/* --- PATIENT DETAILS --- */}
          <div style={cardStyle}>
            <SectionHeader icon="👤">Patient Details</SectionHeader>
            <SelectOrFreeText label="Relevant PMH" required value={pmh} onChange={setPmh}
              options={["None"]} />
            <SelectOrFreeText label="Antiplatelets/anticoagulation medication" required value={anticoag} onChange={setAnticoag}
              options={["None"]} />
            <SelectOrFreeText label="Allergies" required value={allergies} onChange={setAllergies}
              options={["No known drug allergies"]} />
            <SelectOrFreeText label="PPM/implanted device" required value={ppm} onChange={setPpm}
              options={["None"]} />
            <CheckboxGroup label="Social history" required options={SOCIAL_OPTIONS}
              selected={social} onChange={setSocial}
              allowFreeText freeText={socialFree} onFreeTextChange={setSocialFree} />
            <SelectField label="Performance status" required value={perfStatus} onChange={setPerfStatus}
              options={PERFORMANCE_STATUS} allowFreeText />
          </div>

          {/* --- EXAMINATION --- */}
          <div style={cardStyle}>
            <SectionHeader icon="🩺">Examination</SectionHeader>
            <SelectOrFreeText label="Full skin examination performed" required value={fullExam} onChange={(v) => { setFullExam(v); if (v !== "Yes") setSkinExamFindings(""); }}
              options={["Yes", "No"]} />
            {fullExam === "Yes" && (
              <TextField
                label="Abnormal findings (leave blank if none)"
                value={skinExamFindings}
                onChange={setSkinExamFindings}
                placeholder="Describe any abnormal findings..."
                multiline
              />
            )}
            <SelectOrFreeText label="Chaperone" required value={chaperone} onChange={(v) => { setChaperone(v); if (v !== "Yes") { setChaperoneName(""); setChaperoneRole(""); } }}
              options={["No at patient request", "Yes"]} />
            {chaperone === "Yes" && (
              <>
                <TextField label="Chaperone name" value={chaperoneName} onChange={setChaperoneName} placeholder="Name of chaperone" />
                <SelectField label="Chaperone role" value={chaperoneRole} onChange={setChaperoneRole}
                  options={CHAPERONE_ROLES} allowFreeText placeholder="Select role..." />
              </>
            )}
          </div>

          {/* --- LESIONS --- */}
          <div style={cardStyle}>
            <SectionHeader icon="🔬">Lesion Assessment</SectionHeader>
            {lesions.map((lesion, i) => (
              <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: 14, marginBottom: 14, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#1a5276" }}>Lesion {i + 1}</span>
                  {lesions.length > 1 && (
                    <button onClick={() => removeLesion(i)}
                      style={{ ...btnSmall, background: "#fee2e2", color: "#c0392b", fontSize: 11 }}>✕ Remove</button>
                  )}
                </div>
                <TextField label="Site" required={i === 0} value={lesion.site}
                  onChange={v => updateLesion(i, "site", v)} placeholder="e.g. Left forearm" />
                <TextField label="Size" required={i === 0} value={lesion.size}
                  onChange={v => updateLesion(i, "size", v)} placeholder="e.g. 8mm x 6mm" />
                <CheckboxGroup label="Dermoscopy findings" required={i === 0}
                  options={DERMOSCOPY_OPTIONS}
                  selected={lesion.dermoscopy}
                  onChange={v => updateLesion(i, "dermoscopy", v)}
                  allowFreeText freeText={lesion.dermoscopyFree}
                  onFreeTextChange={v => updateLesion(i, "dermoscopyFree", v)} />
              </div>
            ))}
            <button onClick={addLesion}
              style={{ ...btnSmall, background: "#ebf5fb", color: "#1a5276", border: "1.5px dashed #1a5276", width: "100%", padding: 10, fontSize: 13 }}>
              + Add another lesion
            </button>
          </div>

          {/* --- CONSULTANT INVOLVEMENT --- */}
          <div style={cardStyle}>
            <SectionHeader icon="👨‍⚕️">Consultant Involvement</SectionHeader>
            <SelectField label="Consultant involvement" required value={consultInvolvement} onChange={setConsultInvolvement}
              options={["Discussion", "Review"]} />
            <SelectField label="Consultant involved" required value={consultInvolved} onChange={setConsultInvolved}
              options={["Dr Griffin", "Dr Stylianou"]} allowFreeText />
          </div>

          {/* Generate button */}
          <div style={{ padding: "16px 16px 0", display: "flex", gap: 10 }}>
            <button onClick={() => setView("letter")}
              style={{
                flex: 1, padding: "14px 20px", borderRadius: 10, border: "none",
                background: allFilled ? "linear-gradient(135deg, #1a5276, #2980b9)" : "#95a5a6",
                color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 15,
                fontWeight: 700, cursor: "pointer", letterSpacing: 0.3,
                boxShadow: allFilled ? "0 4px 12px rgba(26,82,118,0.3)" : "none"
              }}>
              ✉️ Preview Letter
            </button>
            <button onClick={resetForm}
              style={{ ...btnSmall, padding: "14px 20px", background: "#fee2e2", color: "#c0392b", fontSize: 13, borderRadius: 10 }}>
              🗑 Reset
            </button>
          </div>
        </div>
      ) : (
        /* LETTER VIEW */
        <div style={{ ...cardStyle, margin: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <button onClick={copyToClipboard}
              style={{
                padding: "10px 24px", borderRadius: 8, border: "none", cursor: "pointer",
                background: copied ? "#2ecc71" : "linear-gradient(135deg, #1a5276, #2980b9)",
                color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14,
                boxShadow: "0 2px 8px rgba(26,82,118,0.2)", transition: "all 0.2s"
              }}>
              {copied ? "✓ Copied!" : "📋 Copy Letter"}
            </button>
            <button onClick={() => setView("form")}
              style={{ ...btnSmall, padding: "10px 16px", background: "#ecf0f1", color: "#555", fontSize: 13, borderRadius: 8 }}>
              ← Back to form
            </button>
          </div>
          <pre ref={letterRef} style={{
            fontFamily: "'DM Mono', monospace", fontSize: 12.5, lineHeight: 1.7,
            whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#2c3e50",
            background: "#fafbfc", padding: 20, borderRadius: 8, border: "1px solid #e8ecf0"
          }}>
            {generateLetter()}
          </pre>
        </div>
      )}
    </div>
  );
}

const tabBtn = {
  padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13,
  transition: "all 0.2s"
};
