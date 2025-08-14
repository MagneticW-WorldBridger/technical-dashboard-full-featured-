# 🛋️ Woodstock Furniture & Mattress Outlet – Instagram Messaging Playbook (2025)

Status: Ready for pilot
Brand voice: Warm, design-forward, value + quality, friendly expertise.

---

## 1) messages (Direct Messages)
- Scenario A: Sofa Finder Concierge
  - Trigger: “Looking for a blue sectional under $1500”
  - Flow: AI → Magento search (style=color=blue, type=sectional, price<1500) → carousel → store visit CTA
- Scenario B: Delivery & Lead Times
  - Trigger: “How soon can I get this recliner?”
  - Flow: Stock check + delivery estimator + financing CTA
- Scenario C: Room Design Tips
  - Trigger: “What rug size for 12x14 living room?”
  - Flow: Quick tips; product links; appointment booking

## 2) messaging_seen
- Scenario A: Design Nudge
  - Read-no-reply → send mood board link or saved cart reminder
- Scenario B: Price Drop Alert
  - After seen → notify if price drops within 7d
- Scenario C: Appointment Follow-up
  - Read-no-reply → offer in-store consultation

## 3) messaging_postbacks
- Scenario A: “Show Styles” (Modern / Transitional / Rustic)
- Scenario B: “Under $999 / $1000-$1999 / $2000+” quick budgets
- Scenario C: “Book Visit / Talk to Expert / Financing Options”

## 4) comments
- Scenario A: Comment-to-DM Catalog
  - “Reply ‘SECTIONAL’ for today’s top 5 sectionals”
- Scenario B: Public + Private Support
  - Friendly public reply + DM with details and links
- Scenario C: UGC Amplification
  - Positive comment → ask permission to reshare; track consent

## 5) live_comments
- Scenario A: Live Show – New Arrivals
  - Price/spec DM + add-to-cart link
- Scenario B: Live Design Q&A
  - AI answers standard sizing/care questions
- Scenario C: Live Promo Code
  - Time-boxed code via DM to engaged commenters

## 6) messaging_handover
- Scenario A: Custom Orders → Specialist
- Scenario B: Warranty/Service → Support Queue
- Scenario C: High-ticket Sales → Senior Advisor

## 7) messaging_referral
- Scenario A: “Share with a Friend” deep link
- Scenario B: Influencer Collab → DM flow with tracking param
- Scenario C: Store QR → DM design concierge

## 8) message_reactions
- Scenario A: Content Preference → feed merchandizing insights
- Scenario B: Agent QA → ❤️ on solved cases
- Scenario C: Promo Effectiveness → reaction rate vs offer type

## 9) standby
- Scenario A: After-hours bot; business-hours human advisor
- Scenario B: Peak-load routing
- Scenario C: Specialist swap (mattresses vs sectionals)

---

## Composite Workflows
- Alpha: Comment→DM→Postbacks→Carousel→Store Visit
- Beta: DM Finder→Seen→Nudge→Price Drop→Conversion
- Gamma: Live→DM Code→Add-to-Cart→Appointment

---

## Magento Integration (Existing)
- Use `searchMagentoProducts` with filters: color/material/style/price
- Resolve category names (e.g., “Sectionals”) to IDs via DB cache
- Include product media via `getMagentoProductMedia`

---

## Guardrails & Best Practices
- HTML responses (no inline CSS) for clean UI
- One unsolicited follow-up per 24h; opt-out honored
- Tone: design-helpful, never pushy

---

## Testing Plan (Woodstock)
1) Tester accounts added; Page + IG connected
2) Post: “New Sectionals” – comment ‘SECTIONAL’ from tester
3) DM carousel appears; click-through works
4) DM: “Blue sectional under $1500” → correct results
5) Live dry-run: price DM during stream
6) Verify saved in `chatbot_conversations` (platform=instagram)

---

## KPIs
- Click-through to product
- Appointment bookings
- DM→sale attribution
- Reaction-based CSAT

