# Jimmy Bautista's Portfolio

## Chatbot configuration

The chatbot tries Gemini first and uses local portfolio answers on provider errors,
network failures, or an exhausted daily token budget.

1. Run `supabase/migrations/20261103010000_chat_token_budget.sql` in your Supabase SQL editor (after the base schema).
2. Set `GEMINI_API_KEY`, `GEMINI_MODEL`, and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` or your hosting environment. The Supabase URL is the existing `NEXT_PUBLIC_SUPABASE_URL`. Keep the service-role key and Gemini key server-only.
3. Restart the development server or redeploy.
4. Open **Admin → Site settings → Chatbot daily token budget** to switch Gemini on/off, edit the limit, or refresh usage. Click **Save chatbot settings** to apply changes.

The default is 50,000 tokens per day; 0 enables local-only replies. The shared budget
resets at midnight Asia/Singapore. Input, output, and thinking tokens count toward it.
Gemini's token-count endpoint measures input before each generation flow, and database
transactions reserve input plus the maximum output for each attempt, including retries.
Completed responses reconcile against Gemini's reported total usage. Requests with
unknown usage retain their reservation until the next day, so the limit can take effect
early after provider failures. Lowering a limit does not cancel in-flight requests.
If storage or its credentials are unavailable, the chatbot uses local replies rather
than generating without an enforced budget. This tracks this website's requests only,
not other applications sharing the same Gemini API key.

A modern, responsive, and high-performance portfolio website built with Next.js 15, Tailwind CSS, and TypeScript.

## 🚀 Features

- **Responsive Design**: Optimized for all device sizes using Tailwind CSS.
- **Contact Form**: Integrated API route for seamless communication.
- **Resume Integration**: Easy access to professional resume.
- **Fast Performance**: Leveraging Next.js 15 App Router and server-side capabilities.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Icons/Images**: Custom assets in `/public`

## 📦 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd portfolio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

```text
.
├── app/                # Next.js App Router
│   ├── api/            # API routes (e.g., contact form)
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main portfolio page
├── public/             # Static assets (logo, resume, etc.)
├── tailwind.config.ts  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## 📄 License

This project is licensed under the MIT License.
