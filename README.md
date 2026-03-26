# KINGA 🛡️

**Empowering Frontline Health Volunteers with AI-Driven Decision Support.**

## The Problem
In rural East Africa, Community Health Volunteers (CHVs) serve as the first line of defense against preventable childhood illnesses like malaria and pneumonia. However, these volunteers often face the "diagnostic gap"—lacking the specialized training and immediate access to clinical expertise needed to make life-saving decisions within the critical 24-hour window of an acute illness. Furthermore, inconsistent internet connectivity and language barriers often hinder the quality of care provided.

## The Solution
KINGA is an AI-powered "Decision Support Tool" designed to bridge this gap. KINGA functions as a digital assistant that lives in the pocket of the volunteer, providing real-time, intelligent guidance to help identify symptoms and triage patients according to urgency.

It is designed to be a collaborator, not a replacement, for medical professionals, ensuring that every volunteer has the confidence and information they need to act decisively in the field.

## Key Features
- **Multimodal Triage**: Uses advanced AI to analyze photos of symptoms alongside reported patient history to provide instant assessment.
- **Traffic Light Urgency System**: Simplifies complex medical output into actionable protocols: **Red** (Emergency/Hospital), **Yellow** (Schedule Visit), **Green** (Monitor at home).
- **Offline-First Architecture**: Built for environments with limited connectivity; data is processed and cached locally, syncing with central systems only when a connection is established.
- **Localized Guidance**: Offers support in local languages (e.g., Swahili), ensuring that language is never a barrier to quality healthcare.
- **Outbreak Monitoring**: Enables the automatic compilation of anonymized symptom data, providing district health officials with real-time insights into potential disease outbreaks.
- **Voice-First Interaction**: Integrated with Gemini Live API to allow volunteers to record patient details and symptoms through natural conversation.

## Our Mission
To reduce preventable child mortality by equipping frontline health workers with the intelligence they need to make the right decision, at the right time, in the right place.

---

### Technical Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Motion (Framer Motion)
- **AI Engine**: Google Gemini 3.1 Flash (for analysis) & Gemini 2.5 Flash Native Audio (for Live Voice)
- **Local Database**: IndexedDB (via `idb`) for offline-first data persistence
- **Icons**: Lucide React
