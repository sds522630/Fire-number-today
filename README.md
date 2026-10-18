# FIREPath — FIRE Number Today

A static, private-by-default calculator that builds a FIRE corpus from a detailed current-expense checklist.

## Run locally
From this folder run:

    python -m http.server 8000

Then open `http://localhost:8000`.

## Calculation
- Annual expenses are divided by 12.
- Only expenses checked **Retire?** are included in retirement spending.
- Core FIRE = annual retirement spending / withdrawal rate.
- Safety-adjusted FIRE = Core FIRE + selected safety buffer + separate goals + reserve.
- Use **Print / Save PDF** and select **Save as PDF** in the browser print dialog.

## Important
This is an educational planning illustration, not financial advice. It does not model taxes, fees, market volatility, sequence risk, or changing future expenses.
