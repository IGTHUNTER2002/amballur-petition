import type { Language, LocalizedText } from '../types/petition'

export const copy = {
  appName: { en: 'Safer Streets', ml: 'സുരക്ഷിത വഴികൾ' },
  petition: { en: 'Community petition', ml: 'സമൂഹ ഹർജി' },
  privacy: { en: 'Privacy', ml: 'സ്വകാര്യത' },
  continue: { en: 'Continue to sign', ml: 'ഒപ്പിടാൻ തുടരുക' },
  back: { en: 'Back', ml: 'തിരികെ' },
  next: { en: 'Continue', ml: 'തുടരുക' },
  required: { en: 'Required', ml: 'നിർബന്ധം' },
  loading: { en: 'Loading petition…', ml: 'ഹർജി ലഭ്യമാക്കുന്നു…' },
  closed: { en: 'This petition is currently closed.', ml: 'ഈ ഹർജി ഇപ്പോൾ അവസാനിപ്പിച്ചിരിക്കുകയാണ്.' },
  petitionSteps: {
    en: ['Read', 'Your details', 'Signature', 'Review'],
    ml: ['വായിക്കുക', 'വിവരങ്ങൾ', 'ഒപ്പ്', 'പരിശോധിക്കുക'],
  },
  form: {
    fullName: { en: 'Full name', ml: 'പൂർണ നാമം' },
    houseName: { en: 'House name or number', ml: 'വീട്ടുപേര് അല്ലെങ്കിൽ നമ്പർ' },
    ward: { en: 'Ward', ml: 'വാർഡ്' },
    phone: { en: 'Phone number', ml: 'ഫോൺ നമ്പർ' },
    locality: { en: 'Locality', ml: 'പ്രദേശം' },
    incident: { en: 'Incident description', ml: 'സംഭവത്തിന്റെ വിവരണം' },
    optional: { en: 'Optional', ml: 'ഐച്ഛികം' },
    wardPlaceholder: { en: 'Select your ward', ml: 'നിങ്ങളുടെ വാർഡ് തിരഞ്ഞെടുക്കുക' },
    incidentHint: { en: 'Do not include personal information about other people.', ml: 'മറ്റുള്ളവരുടെ വ്യക്തിഗത വിവരങ്ങൾ നൽകരുത്.' },
  },
  signature: {
    title: { en: 'Add your signature', ml: 'നിങ്ങളുടെ ഒപ്പ് ചേർക്കുക' },
    instruction: { en: 'Use your finger, stylus, or mouse inside the box below.', ml: 'താഴെയുള്ള ബോക്‌സിൽ വിരൽ, സ്റ്റൈലസ്, അല്ലെങ്കിൽ മൗസ് ഉപയോഗിക്കുക.' },
    clear: { en: 'Clear signature', ml: 'ഒപ്പ് മായ്ക്കുക' },
    save: { en: 'Save signature', ml: 'ഒപ്പ് സംരക്ഷിക്കുക' },
    required: { en: 'Please draw your signature before continuing.', ml: 'തുടരുന്നതിന് മുമ്പ് ദയവായി ഒപ്പ് രേഖപ്പെടുത്തുക.' },
    consent: {
      en: 'I have read and understood this petition and voluntarily agree to support its submission to the Grama Panchayat.',
      ml: 'ഞാൻ ഈ ഹർജി വായിച്ചും മനസ്സിലാക്കിയും ഗ്രാമപഞ്ചായത്തിന് സമർപ്പിക്കുന്നതിന് സ്വമേധയാ പിന്തുണ നൽകുന്നു.',
    },
  },
  review: {
    title: { en: 'Review before submitting', ml: 'സമർപ്പിക്കുന്നതിന് മുമ്പ് പരിശോധിക്കുക' },
    edit: { en: 'Edit', ml: 'തിരുത്തുക' },
    submit: { en: 'Submit my signature', ml: 'എന്റെ ഒപ്പ് സമർപ്പിക്കുക' },
    submitting: { en: 'Submitting securely…', ml: 'സുരക്ഷിതമായി സമർപ്പിക്കുന്നു…' },
    version: { en: 'Petition version', ml: 'ഹർജി പതിപ്പ്' },
    privacyNote: { en: 'Your details will only be used to administer this petition and submit it to the Panchayat.', ml: 'ഈ ഹർജി നടത്തുന്നതിനും പഞ്ചായത്തിന് സമർപ്പിക്കുന്നതിനുമാത്രമേ നിങ്ങളുടെ വിവരങ്ങൾ ഉപയോഗിക്കൂ.' },
  },
  confirmation: {
    title: { en: 'Thank you for adding your support', ml: 'നിങ്ങളുടെ പിന്തുണ ചേർത്തതിന് നന്ദി' },
    reference: { en: 'Submission reference', ml: 'സമർപ്പണ റഫറൻസ്' },
    submitted: { en: 'Submitted', ml: 'സമർപ്പിച്ച തീയതി' },
    whatsapp: { en: 'Share on WhatsApp', ml: 'വാട്ട്‌സ്ആപ്പിൽ പങ്കിടുക' },
    shareText: { en: 'Please read and support this community petition for action on stray-dog disturbance and public safety.', ml: 'തെരുവുനായ ശല്യത്തിനും പൊതുസുരക്ഷയ്ക്കുമുള്ള നടപടിക്കായുള്ള ഈ സമൂഹ ഹർജി വായിച്ച് പിന്തുണയ്ക്കുക.' },
  },
  admin: {
    signIn: { en: 'Administrator sign in', ml: 'അഡ്മിനിസ്ട്രേറ്റർ സൈൻ ഇൻ' },
    email: { en: 'Email address', ml: 'ഇമെയിൽ വിലാസം' },
    password: { en: 'Password', ml: 'പാസ്‌വേഡ്' },
    forgot: { en: 'Forgot password?', ml: 'പാസ്‌വേഡ് മറന്നോ?' },
    dashboard: { en: 'Dashboard', ml: 'ഡാഷ്ബോർഡ്' },
    signatures: { en: 'Signatures', ml: 'ഒപ്പുകൾ' },
    settings: { en: 'Petition settings', ml: 'ഹർജി ക്രമീകരണങ്ങൾ' },
  },
  footer: {
    humaneAction: { en: 'Humane action. Shared responsibility.', ml: 'മാനുഷികമായ പ്രവർത്തനം. പങ്കിട്ട ഉത്തരവാദിത്തം.' },
    privacyNotice: { en: 'Privacy notice', ml: 'സ്വകാര്യതാ നയം' },
    createdBy: { en: 'Created by Nehmal', ml: 'നെഹ്മൽ തയ്യാറാക്കിയത്' },
  },
} satisfies Record<string, LocalizedText | { en: string[]; ml: string[] } | Record<string, LocalizedText>>

export function localize(value: LocalizedText, language: Language) {
  return value[language]
}
