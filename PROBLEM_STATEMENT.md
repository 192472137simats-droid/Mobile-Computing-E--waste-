# VESTIGE — Detailed Problem Statement

## Submission form text

Electronic device owners often lack a clear, trustworthy path from a damaged or aging device to repair, reuse, or responsible recycling. Assessing repair feasibility, finding a service provider, arranging collection, tracking progress, and confirming the final outcome usually happen through disconnected channels. This creates uncertainty for owners, inefficient intake for vendors, and limited visibility for administrators. VESTIGE addresses this gap with one role based platform where users assess a device through an explainable rules based recommendation, submit it for repair or recycling, track the booking, and receive applicable rewards. Vendors manage assigned work and update status, while administrators oversee users, vendors, transactions, and activity. The prototype is intended to make circular device handling easier to choose and easier to trace; environmental figures shown in the product are estimates and require external validation before being presented as measured impact.

## 1. Context

Phones, laptops, tablets, desktops, and other electronics can remain useful after a fault or change of ownership. A device owner must still answer practical questions: Is repair economical? Are parts available? Who can perform the work? If repair is unsuitable, how can the device be handed to a recycler, and how will the outcome be recorded?

The relevant information and services are often spread across separate repair shops, recycler contacts, messages, receipts, and spreadsheets. The owner cannot easily compare the available paths. A vendor may receive incomplete device details, and a platform administrator may struggle to see whether work was completed. This is the workflow gap VESTIGE targets.

## 2. Formal problem statement

**How might we give device owners a single, understandable path to evaluate an electronic device, choose repair or recycling, book a vendor, and track completion, while giving vendors and administrators the records they need to operate and oversee that process?**

The solution must be usable by all three roles and must distinguish a recommendation from a confirmed diagnosis or measured environmental outcome.

## 3. Who is affected

| Stakeholder | Current difficulty | Needed outcome |
| --- | --- | --- |
| Device owner | Uncertain repair value, scattered service discovery and follow up. | A clear assessment, booking, status, and reward history. |
| Repair vendor | Device details and incoming work may be fragmented. | Structured job information and a way to update progress. |
| Recycling vendor | Device intake and completion can be difficult to track. | Structured requests and a recorded processing status. |
| Administrator | Limited consolidated view across users, vendors, requests, and transactions. | Oversight, audit information, and operational analytics. |

## 4. Why this matters

- A potentially repairable device may be discarded because the owner cannot judge whether repair is practical.
- A device intended for recycling may remain unused in storage if arranging handoff is inconvenient.
- Untracked vendor work makes it hard for the owner to know what happened and for an administrator to resolve discrepancies.
- Reward programs are less useful if points and redemptions are separate from recorded activity.

These are motivations for the project, not measured claims about the amount of waste the prototype has already reduced.

## 5. Objectives

1. Capture the key device inputs needed for an initial repair versus recycling recommendation.
2. Explain the recommendation in plain language and show the uncertainty level.
3. Let the owner submit a device and create a repair or recycling request.
4. Let the assigned vendor view and advance the request status.
5. Give the owner one place to see booking history and applicable reward points.
6. Give administrators views of users, vendors, requests, payments, rewards, and activity.
7. Protect role specific information through authentication, authorization, and ownership checks.

## 6. Proposed solution and workflow

VESTIGE is a three role web platform. The owner starts with an assessment form. The backend calculates a score from the device's category, age, condition, estimated repair cost relative to its value, parts availability, and known faults. It returns a repair or recycle suggestion with a rationale. The owner can submit the device and arrange the relevant service. The vendor processes the work and updates the status. Reward and administrative records are built from these transactions.

```text
Device owner enters details
          ↓
Rules based assessment and explanation
          ↓
Device submission and repair/recycling booking
          ↓
Vendor processes and updates the request
          ↓
Owner views status and eligible rewards
          ↓
Administrator monitors activity and exceptions
```

The assessment is **decision support**. It does not replace a hands on technician inspection, guarantee vendor acceptance, or certify the environmental effect of a completed service.

## 7. Functional scope in the current prototype

| Area | Implemented capability |
| --- | --- |
| Identity | Public user and vendor registration; role based login; signed JWT protection for API routes. |
| Assessment | Explainable score, recommendation, confidence band, and category based environmental estimates. |
| Device and bookings | Device submission; repair and recycling requests; user and vendor views; status updates. |
| Rewards | Account balance, transactions, catalog, and redemption. |
| Administration | User and vendor review, operational records, analytics, performance, and audit views. |
| Payment integration | Razorpay order creation and signature verification code; live checkout requires gateway credentials and testing. |
| Data storage | H2 for local demonstration; PostgreSQL schema migrations prepared for deployment. |

## 8. Technical approach

- **Frontend:** React 19 and Vite 8 with public, owner, vendor, and administrator routes.
- **Backend:** Java 21, Spring Boot 3.4.3, Spring Security, and REST APIs.
- **Persistence:** Spring Data JPA; in-memory H2 for development and PostgreSQL configuration for production.
- **Assessment logic:** Deterministic heuristic rules. The implementation starts at 100, deducts points for cost ratio, age, condition, missing parts, and faults, clamps the result to 5–95, and recommends repair at 50 or above.
- **Payment:** Server side Razorpay order and signature verification path, contingent on valid credentials.

The assessment rule thresholds are product assumptions. They need empirical calibration and expert review before they can be treated as a validated repairability model.

## 9. Expected outcomes and evaluation criteria

The intended user outcome is an easier, traceable decision and service journey. For evaluation, the prototype can be assessed through these observable checks:

| Criterion | How to check it |
| --- | --- |
| Complete owner journey | Register or log in, assess a device, submit it, create a booking, and see it in history. |
| Explainable recommendation | Change assessment inputs and inspect the score and rationale. |
| Vendor handoff | Sign in as a vendor and update an assigned request; confirm the owner sees the new status. |
| Reward accounting | Complete eligible activity and verify points and redemption records. |
| Administrative oversight | Review users, vendors, bookings, payments, and analytics from an admin account. |
| Access control | Confirm a user cannot operate on another user's records or use admin routes. |
| Engineering quality | Run backend tests, frontend lint, production build, and health endpoints. |

After a real pilot, additional measures could include completed repair rate, completed recycling rate, median booking time, vendor response time, and user comprehension of recommendations. No pilot data is claimed here.

## 10. Boundaries and limitations

- The present assessment is a heuristic, not a machine learning model or a professional device diagnosis.
- The category based mass and CO₂e values are illustrative estimates. VESTIGE has not measured actual material recovery or avoided emissions.
- The local demo uses seeded users and an in-memory database. Production PostgreSQL deployment and migrations need environment specific verification.
- Real payment checkout has not been validated without Razorpay credentials. A payment webhook is not part of the verified flow.
- Password reset, physical pickup logistics, recycler certification, and downstream proof of treatment remain outside the current verified prototype.

## 11. Future work

1. Pilot with real vendors and validate booking status and service outcomes.
2. Review assessment rules with repair professionals; tune thresholds from observed repair data.
3. Record documentary proof of recycling and establish an auditable chain of custody.
4. Add password recovery and stronger account lifecycle management.
5. Complete sandbox and production payment verification and operational monitoring.
6. Replace generic impact factors with documented, device specific methodology and measured outcomes where possible.

## 12. Submission references

- [Project README](README.md)
- [Evaluation PPT](docs/submission/VESTIGE_Evaluation_Presentation.pptx)
- [GitHub repository](https://github.com/Jaswanth300/vestige)
