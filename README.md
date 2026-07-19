# Agent Payouts

A single-page payout dashboard for 7 agents. Six are already paid; **Waithaka**
has a pending **$25 USD** payout that is charged through **Paystack** in Kenyan
Shillings (KES), converted at the **live** USD→KES rate. Clicking any already-paid
agent shows an "already paid" notice.

## Files
- `index.html` — markup
- `style.css` — styling
- `script.js` — agents, live rate, Paystack checkout  ← **edit config here**
- `vercel.json` — Vercel static config

## 1. Add your Paystack key
Open `script.js` and set your **public** key (the one that starts with `pk_`):

```js
const PAYSTACK_PUBLIC_KEY = "pk_live_xxxxxxxxxxxxxxxxxxxxxxxx";
```

> Only the **public** key goes in the browser — it is safe to expose.
> **Never** put your secret key (`sk_...`) in this file.
> The payer enters **their own email** at checkout — no email is hardcoded.
> To charge in **KES**, your Paystack account must be a **Kenya** account with KES enabled.

## 2. Test locally
```bash
npx serve .
# or
python -m http.server 8000
```
Open the printed URL, then click **Pay** on Waithaka. Use a Paystack test card
while your key is `pk_test_...`.

## 3. Deploy to Vercel

**Option A — CLI**
```bash
npm i -g vercel
vercel        # first run: link/create the project
vercel --prod # promote to production
```

**Option B — GitHub + Vercel dashboard**
1. Push this folder to a GitHub repo.
2. On vercel.com → **New Project** → import the repo.
3. Framework preset: **Other** (no build command, output = root).
4. **Deploy**.

## Notes
- Live rate comes from `https://open.er-api.com/v6/latest/USD` (free, no key).
  If it is unreachable, a fallback rate is used and the pill shows "offline".
- The displayed KES amount updates automatically when the live rate loads.
- On a successful charge the Waithaka card flips to **Paid ✓** for that session.
