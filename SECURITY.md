# Security

Report vulnerabilities privately via GitHub Security Advisories, not public issues.

Secrets (provider keys, database URLs, Privy secrets, GitHub tokens) must only live in server-side env files. Never put them in `NEXT_PUBLIC_*` or client bundles.
