# Loomspace App Builder

Open-source AI app builder: describe an app, an agent edits real source in a sandbox, you preview, edit, and download the code.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

Required services: Privy (auth), Supabase Postgres (state), an OpenAI-compatible LLM endpoint, and a sandboxd instance for workspaces.

Schema: apply `supabase/migrations/*.sql` in order.

Based on the MIT-licensed `ai-app-builder-open` project. See NOTICE.
