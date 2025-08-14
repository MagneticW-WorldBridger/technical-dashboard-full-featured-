# 🚜 Rural King – Instagram Messaging Playbook (2025)

Status: Ready for pilot
Brand voice: Friendly, practical, farm & home expertise. Focus on utility, value, and community.

---

## 1) messages (Direct Messages)
- Scenario A: Product Availability Q&A
  - Trigger: DM: “Do you have cattle panels in stock in Paducah?”
  - Flow: AI → inventory lookup → nearest stores → pickup/delivery options → CTA link
  - KPI: First-response < 2s; conversion to store visit
- Scenario B: Order Status Helper
  - Trigger: DM includes order #
  - Flow: AI validates, returns status + tracking; upsell accessories
  - KPI: Ticket deflection; CSAT
- Scenario C: Store Hours & Services
  - Trigger: “Is the small engine shop open Sunday?”
  - Flow: Store hours; service menu; booking CTA
  - KPI: Reduced calls; bookings

## 2) messaging_seen (Read receipts)
- Scenario A: Smart Follow-up
  - Read-no-reply in 2h → gentle nudge with 1-click options
- Scenario B: Prioritized Escalation
  - High-value DM read but idle → route to human within 10m
- Scenario C: Campaign Timing Optimization
  - Learn best follow-up windows per region

## 3) messaging_postbacks (Quick replies/buttons)
- Scenario A: “Find Nearest Store” → location share → store details + map link
- Scenario B: “In-Stock Alerts” → subscribe per SKU → DM when replenished
- Scenario C: “Talk to Specialist” → route to category expert (hunting, ag, pets)

## 4) comments (Public post comments)
- Scenario A: Comment-to-DM Promo
  - “Reply ‘TRACTOR’ to get specs + financing” → DM with details
- Scenario B: Community Help
  - Common questions under posts → helpful public reply + DM for details
- Scenario C: Reputation Guard
  - Negative comment → public empathy + private resolution DM

## 5) live_comments (IG Live)
- Scenario A: Live Shopping
  - “Price?” during live → DM price + link + curbside pickup
- Scenario B: Live Q&A Assist
  - AI answers repetitive Qs to keep host focused
- Scenario C: Limited-Time Offers
  - Live-only code; track redemptions

## 6) messaging_handover (Agent handoff)
- Scenario A: Firearms/Compliance Questions → human specialist
- Scenario B: B2B/Corporate Orders → sales desk
- Scenario C: Warranty/Returns → support queue with prefilled details

## 7) messaging_referral (Deep links/keywords)
- Scenario A: Referral Links from Email/SMS
  - “Reply ‘RKJEANS’ to claim promo” → DM flow
- Scenario B: Partner Campaigns
  - Influencer posts → referral param → attribute sales
- Scenario C: Store Signage → QR codes to DM flows

## 8) message_reactions (👍❤️ sentiment)
- Scenario A: CSAT Proxy
  - Track ❤️ on resolutions; escalate 😡 patterns
- Scenario B: Content Preference
  - Map reactions to content types; inform ads
- Scenario C: Agent Quality
  - Reaction scoring per handoff

## 9) standby (Multi-bot orchestration)
- Scenario A: Hours-based routing (after-hours bot; business-hours human)
- Scenario B: Load shedding during peaks
- Scenario C: Specialist swap (livestock vs. apparel)

---

## Composite Workflows (Stacked permissions)
- Alpha: Comment→DM→Seen→Postback→Store Visit
  - Comment “CHAINSAW” → DM specs; read-no-reply → nudge → “Visit Store” → map + hours
- Beta: Live→DM→Referral
  - Live viewer asks price → DM → shares link with friend → tracked referral
- Gamma: Escalation→Reaction→CSAT
  - Complex warranty → handoff → 👍 reaction → close loop

---

## Campaign: #RK5PocketJean (from Slack brief)
- Trigger: User posts with #RK5pocketJean and @ruralking or comments keyword
- DM: “Thanks for sharing your 5-pocket jeans! Please leave a review at {REVIEW_LINK} to get your FREE pair.”
- Guardrails:
  - One DM per user per 7 days for campaign
  - Respect messaging policy windows
  - Only DM on eligible interactions (comment/mention/DM)
- Metrics: posts → DMs sent → reviews completed → redemptions

---

## Guardrails & Best Practices
- Respect IG policy: DM only on user-initiated interactions
- Rate limits: queue spikes during campaigns
- Tone: Helpful, rural expertise, concise CTAs
- Opt-outs: honor STOP/UNSUBSCRIBE

---

## Testing Plan (Rural King)
1) Add tester accounts to the app; connect Page & IG Business
2) Verify webhook (done). Subscribe Page
3) Seed test post; comment ‘RKJEANS’ from tester
4) Confirm DM received; reply with quick reply; validate follow-up
5) Live dry-run: live comment triggers DM
6) Analytics: verify events stored in `chatbot_conversations` (platform=instagram)

---

## Data & KPIs
- Response SLA, read→reply %, store-visit CTR, sales attribution, CSAT proxy (reactions)

