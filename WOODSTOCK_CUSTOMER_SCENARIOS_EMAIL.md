# 📧 Customer Scenarios — LLM‑First, Semantic, Modern

---

## 1) Semantic Service Escalation (Damage/Returns without keywords)

Transcript (natural language, no keywords used):
```
Customer: I love the table we picked, but one chair arrived looking… not right. Finish seems off.
April: I understand. When a finish isn’t consistent out of the box, we consider that a fulfillment defect.
       I can start a replacement flow right away. Do you prefer a replacement chair or a technician visit?
Customer: Replacement chair is fine. I’m in Covington and I’m usually home after 5.
April: Great. I’ll schedule an after‑5 delivery window and mark this as a fulfillment issue so you’re not charged.
```

Routing & Memory Outcome:
- Routed to Customer Service (Distribution Center) with tag: “fulfillment defect → replacement chair”.
- Captured constraints: location=Covington, availability=after 5pm, product=lineage linked to order line.
- Memory persists “finish sensitivity” for future quality checks.

LLM/NLP signals used (no keyword lists):
- Pragmatic intent: complaint-with-remedy; defect subtype: “finish inconsistency”.
- Causal framing detection → fulfillment vs. wear‑and‑tear.
- Slot extraction via few‑shot semantic parsing (availability window, location).

---

## 2) Location & Inventory Matching by Latent Geo Intent

Transcript:
```
Customer: I’m near the west side and need a modern sectional that fits a 15x20.
April: Noted: modern aesthetic, 15×20 footprint. The Hiram location has two sectionals in stock that fit.
       Would you like dimensions with a layout suggestion?
Customer: Yes, please. I’m hosting soon, need seating for 6.
April: Recommending “Repose Avenue Sectional” and “Vista Modular L‑shape”. Both seat 6 comfortably.
       I can reserve at Hiram or schedule a viewing.
```

Routing & Memory Outcome:
- Routed to Hiram Furniture team with reservation option.
- Memory: style=modern, room=15×20, seating=6, urgency=soon (hosting).
- Generates store‑specific hold ticket with layout PDF link.

LLM/NLP signals used:
- Geo entity linking ("west side" → nearest eligible store by service region).
- Constraint solving (room dimensions × seating × style) → SKU shortlist.
- Generative layout suggestion conditioned on extracted constraints.

---

## 3) Soft Authentication + Order Status via Entity Resolution

Transcript:
```
Customer: Can you check my delivery? I’m John; placed the leather sectional last week.
April: I can help. For security, can you confirm the last 4 of your phone?
Customer: 6128.
April: Thanks John. Found your order #WO‑2025‑0910 (leather reclining sectional).
       Status: In transit → ETA Thu 18th. Delivery address ends with Peachtree.
Customer: Perfect. Can we aim after 3pm?
April: I’ve requested a post‑3pm window and added an arrival text alert.
```

Routing & Memory Outcome:
- No forced portal login; identity resolved with soft factors (name + last‑4 + item/time context).
- Memory: prefers afternoon windows + SMS alerts.
- Escalation only if risk score < threshold (not triggered here).

LLM/NLP signals used:
- Probabilistic entity resolution (name/time/product coherence) + minimal verification prompt.
- Risk scoring from discourse confidence; fallbacks: human‑in‑the‑loop if low confidence.

---

## 4) Expertise Routing: Sleep/Ergonomics Consultation (Mattress)

Transcript:
```
Customer: I wake up with lower‑back tightness; prefer something supportive but not rock hard.
April: Understood: lumbar support with medium‑firm feel and pressure relief.
       I can connect you to our mattress specialists and propose two models you can test.
Customer: Share options first.
April: Recommending “Ortho‑Balance Medium” and “Hybrid Support Plus”.
       Differences: zoned lumbar coils vs. foam‑encased hybrid; both medium‑firm with cooling.
       Want me to book a 20‑minute comfort fitting at Hiram?
```

Routing & Memory Outcome:
- Routed to Mattress Specialists with clinical‑style need summary (no medical claims).
- Memory: lumbar support preference, temperature sensitivity, test‑in‑store intent.
- Creates pre‑visit note for advisor with fit hypotheses.

LLM/NLP signals used:
- Symptom semantics → comfort attribute mapping (lumbar support, firmness spectrum, cooling).
- Contrastive explanation generation to aid decision.

---

## 5) Proactive CS Handoff: Warranty vs. Assembly Resolution

Transcript:
```
Customer: The bookshelf leans a bit; I assembled it yesterday.
April: Thanks. This sounds like an assembly alignment issue rather than a material defect.
       I can send a 2‑step shim/level guide, or schedule an in‑home adjustment.
Customer: Send the guide first.
April: Done. If it still leans after steps 1–2, I’ll route to Customer Service to evaluate a replacement.
```

Routing & Memory Outcome:
- Stays in Self‑Service path with dynamic playbook; conditional escalation if unresolved.
- Memory: DIY‑friendly; assembly assistance provided; escalation rule armed.

LLM/NLP signals used:
- Causal attribution (assembly vs. defect) from discourse evidence.
- Policy‑aware plan generation with conditional escalation triggers.
