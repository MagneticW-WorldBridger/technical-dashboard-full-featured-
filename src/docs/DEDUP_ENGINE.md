# Dedup Engine (MVP)

## Deterministic
- Exact match by email; E164 phone; normalized name+zip if available

## Probabilistic
- Name similarity (Jaro-Winkler or cosine over tokens) + email user-part fuzz + phone last4
- Threshold e.g. ≥ 0.88 → auto-merge; 0.7–0.88 → manual review

## Merge Strategy
- Prefer verified identities; keep highest confidence; audit log merges

## Sync
- If GHL enabled: push merged contact → update external id
