# MR.LEO POS — Refactored File Structure

## File Map

```
mrleo-pos/
├── index.html          ← Clean HTML shell (no JS, no CSS inline)
├── style.css           ← All styles in one place
├── js/
│   ├── main.js         ← Entry point — import everything here
│   ├── config.js       ← Supabase keys + all global state
│   ├── utils.js        ← Pure helpers (fmt, toast, dates, etc.)
│   ├── auth.js         ← Login, logout, loadCloudData, fetchAllData
│   ├── ui.js           ← Tab switching, clock
│   ├── pin.js          ← Boot lock, employee selector, PIN pad
│   ├── session.js      ← Open/close session
│   ├── pos.js          ← Service grid, cart, checkout, print
│   ├── sales.js        ← Current session view, history, txn detail
│   ├── expenses.js     ← Expense modal + expense tab
│   ├── reports.js      ← Date-range reports, CSV export
│   ├── commission.js   ← Commission tab
│   ├── admin.js        ← Employee/service CRUD, logo
│   ├── superadmin.js   ← Master dashboard
│   └── pwa.js          ← Service worker, install prompt
└── README.md
```

## How to deploy to Netlify

1. Upload ALL files above to your GitHub repo (same folder where `index.html` is).
2. Make sure `manifest.json` and `service-worker.js` are also in the root.
3. Push to GitHub → Netlify auto-deploys.

## Next upgrade steps (after this refactor is live)

### Phase 1 — Security (free, no coding needed)
- Go to Supabase → Authentication → Policies
- Enable RLS properly per table with `shop_id` ownership checks
- Move SUPA_KEY to Netlify Environment Variables (Site settings → Env vars)
  then update config.js to read: `const SUPA_KEY = window.__ENV?.SUPA_KEY || 'fallback'`

### Phase 2 — Features to add (each in their own file)
- `js/customers.js` — Customer profiles + visit history
- `js/inventory.js` — Product stock tracking
- `js/appointments.js` — Booking calendar

## Adding a new feature (how to work with Claude)

Send Claude only the relevant file, e.g.:
> "Here is js/pos.js — add a discount field to the cart"

This keeps token usage low and changes clean.
