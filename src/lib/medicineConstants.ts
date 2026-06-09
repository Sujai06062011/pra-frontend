export const DOSAGE_OPTIONS = {
  tablet: ["½ tablet", "1 tablet", "1½ tablets", "2 tablets"],
  liquid: ["2.5ml", "5ml", "7.5ml", "10ml", "15ml", "20ml"],
  inhaler: ["1 puff", "2 puffs"],
  topical: ["Apply thin layer", "Apply twice daily"],
  other: ["As directed", "1 sachet", "2 sachets"],
};

export const ALL_DOSAGE_OPTIONS = [
  "½ tablet", "1 tablet", "1½ tablets", "2 tablets",
  "2.5ml", "5ml", "7.5ml", "10ml", "15ml",
  "1 puff", "2 puffs",
  "Apply thin layer", "As directed", "1 sachet",
];

export const DURATION_OPTIONS = [1, 2, 3, 5, 7, 10, 14, 21, 30, 45, 60, 90];

export const DIETARY_NOTES_OPTIONS = [
  "Avoid oily and spicy food",
  "Take plenty of fluids",
  "Low salt diet",
  "Avoid cold food and drinks",
  "Bland diet — rice, banana, curd",
  "Avoid dairy products",
  "High protein diet",
  "Low sugar diet",
  "Warm fluids only",
];

export const PRECAUTION_OPTIONS = [
  "Complete bed rest for 2 days",
  "Avoid direct sunlight",
  "Monitor BP twice daily",
  "Check blood sugar daily",
  "Avoid swimming",
  "No strenuous activity",
  "Keep wound dry",
  "Return if fever persists beyond 3 days",
  "Return immediately if breathing difficulty",
];

export const DIAGNOSIS_SUGGESTIONS = [
  "Viral Fever",
  "Upper Respiratory Tract Infection (URTI)",
  "Acute Gastroenteritis",
  "Allergic Rhinitis",
  "Bronchial Asthma",
  "Hypertension Stage 1",
  "Hypertension Stage 2",
  "Type 2 Diabetes Mellitus",
  "Acute Otitis Media",
  "Urinary Tract Infection",
  "Skin Infection - Impetigo",
  "Fungal Infection",
  "Anaemia",
  "Vitamin D Deficiency",
  "Acute Pharyngitis",
  "Acute Tonsillitis",
  "Conjunctivitis",
  "Dengue Fever - Suspected",
  "Typhoid Fever",
  "Pneumonia",
];

export const MEDICINE_FORM_OPTIONS = [
  { value: "tablet", label: "Tablet / Capsule" },
  { value: "liquid", label: "Syrup / Drops / Liquid" },
  { value: "inhaler", label: "Inhaler / Spray" },
  { value: "topical", label: "Cream / Ointment / Lotion" },
  { value: "other", label: "Other / Sachet" },
];

export const MEDICINE_CATEGORIES = [
  "Analgesic", "Antibiotic", "Antihistamine", "Antiemetic",
  "Anti-inflammatory", "Antiallergic", "Antifungal", "Antiplatelet",
  "Antihypertensive", "Antidiabetic", "Antacid", "Bronchodilator",
  "Steroid", "Supplement", "Statin", "Skin", "Other",
];
