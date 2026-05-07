# Known Issues

## Auto-close loses doctor's diagnosis window

**Severity**: Medium  
**Affects**: Doctor experience when consultation is auto-closed by timeout

**Description**  
When a consultation is automatically closed after `CONSULTATION_AUTO_CLOSE_HOURS` (default: 1h) because the doctor did not click "Terminer", the system marks it `COMPLETED` with `autoClosedByTimeout = true` and `diagnosis = null`. The doctor never gets a chance to enter their diagnosis or prescription.

**Current mitigation**  
- The doctor UI shows a persistent warning banner: *"⚠️ Cette consultation sera automatiquement clôturée 1h après son démarrage. Pensez à cliquer sur Terminer pour saisir votre compte-rendu."*
- The `GET /doctors/me/incomplete-consultations` endpoint returns auto-closed consultations with no diagnosis, so the doctor dashboard can surface a follow-up prompt.

**Planned fix (not yet implemented)**  
Add a post-close diagnosis flow: after detecting `autoClosedByTimeout = true` + `diagnosis = null` on the doctor dashboard, redirect the doctor to a lightweight form (`/consultations/:id/complete`) to fill in the diagnosis and prescription retroactively. The API endpoint `POST /consultations/:id/complete-late` would accept diagnosis/prescription and only be callable when `autoClosedByTimeout = true && diagnosis IS NULL`.

---

## Payment provider limited to mock in dev

**Severity**: Low (expected in dev)  
**Affects**: Payment flow

**Description**  
`PAYMENT_PROVIDER=mock` returns a fake successful payment. Real CMI integration (Moroccan payment gateway) requires a bank convention and test credentials. The mock is intentional during MVP development.
