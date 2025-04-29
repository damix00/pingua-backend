# Pingua - Backend

This is the backend for the Pingua project. It is built using **TypeScript** and **Express.js**, with a focus on scalability, real-time interaction, and AI-assisted learning.

## Tech Stack

- **Language**: TypeScript  
- **Framework**: Express.js  
- **Database**: MongoDB (via MongoDB Atlas)  
- **ORM**: Prisma  
- **Cache**: Redis  
- **AI Services**: 
  - ChatGPT (OpenAI) for translation, chat, and scenario generation
  - Whisper (OpenAI) for speech-to-text
  - ElevenLabs for realistic TTS (text-to-speech)
- **Storage**: Supabase (for storing TTS audio files)
- **Email Service**: Resend (for registration and login emails)
- **Payments**: Stripe

---

## Configuration

Before running the application, ensure the following setup:

### API Keys

Create API keys for:

- [OpenAI](https://platform.openai.com/)
- [ElevenLabs](https://elevenlabs.io/)
- [Supabase](https://supabase.com/)
- [Resend](https://resend.com/)

### Services Required

- A **MongoDB** database instance
- A **Redis** instance (local or cloud-hosted)

### Environment Variables

All configuration values are managed using environment variables. Use the `.env.example` file as a reference:

```bash
cp .env.example .env
```

Fill in your actual credentials and configuration values inside `.env`.

---

## Getting Started

### Prerequisites

Ensure you have Node.js and npm installed. Then:

1. Install TypeScript globally (if not already installed):

```bash
npm install -g typescript
```

2. Install all dependencies:

```bash
npm install
```

3. Generate Prisma types:

```bash
npx prisma generate
```

4. Start the server:

```bash
npm start
```
