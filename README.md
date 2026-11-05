# Jimmy Bautista's Portfolio

## Chatbot configuration

The chatbot tries Gemini first and uses local portfolio answers on provider errors,
network failures, or an exhausted daily token budget.

1. Run `supabase/migrations/20261103010000_chat_token_budget.sql` in your Supabase SQL editor (after the base schema).
   Then run `supabase/migrations/20261104000000_chatbot_rules.sql` to enable editable rules.
   Run `supabase/migrations/20261104010000_chat_model_order.sql` to enable the editable model fallback order.
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

Edit **Chatbot rules** in the same admin panel to customize Gemini's tone, language,
and guidance. Save to apply them to subsequent requests without restarting. An empty
field uses the default instructions. Rules are read server-side from the admin-only
configuration and included in token accounting. Local fallback remains deterministic
and does not interpret free-text rules.

Chat safeguards load only published portfolio facts from the server, ignore browser
claims about prior assistant replies, screen common instruction-override attempts,
and reject provider-blocked responses, credential leaks, external URLs, and claims
of completed actions. Failed checks use local answers. The existing 500-character
message limit, 40 KB request limit, 30-request/minute instance cap, timeouts, and
shared daily token budget also apply. Pattern checks reduce risk but cannot detect
every prompt injection or factual error. The request cap is per server instance;
use hosting-level rate limits for distributed abuse protection.

The **Gemini models** editor lets admins choose a primary model and check or uncheck fallback models. Checked fallbacks run in the displayed order; unchecked models are omitted from the saved model order.
The default sequence is 3.8 Flash, then 3.5 Flash Lite. Retired 2.5 models are filtered out of older saved configurations.
Saved settings apply immediately and supersede `GEMINI_MODEL`. Until the model-order
migration is installed, the server continues using the environment model.
Provider 404/429/5xx errors and network timeouts advance to the next model; safety,
authentication, and budget failures stop immediately. The entire request retains
its 20-second deadline, so slow providers may exhaust the time before every model
is tried. Each generation attempt reserves tokens separately. Responses include
`model` alongside `source: "gemini"` to identify the model that answered.

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


## Public resume link

The portfolio opens `/resume`, which serves the saved PDF through the server without
redirecting to Supabase. `/api/site-settings` replaces the stored resume URL with this
public route. Admins retain the original URL for editing. Apply
`supabase/migrations/20261104020000_private_site_settings.sql` to prevent anonymous
clients from looking up the original URL directly in `site_settings`. This requires
the existing server-only Supabase key. The PDF remains publicly downloadable, and
previously shared public storage URLs still work; this is URL masking, not document
access control.
