---
name: ABA PayWay live checkout
description: The live-only behavior of the JLA PayWay wrapper and safe verification boundaries.
---

The documented JLA PayWay `create-tran` route creates a live payment request. Its documentation does not describe a sandbox, and its interactive tester creates live requests. The project uses a merchant-owned ABA PayWay payment link and never relies on the documentation's shared sample link.

**Why:** The checkout can lead to an actual charge, so routine setup checks must not create transactions.

**How to apply:** Do not call `create-tran` in automated or smoke checks. Keep the amount fixed at the user's requested value, and only create a live request after the customer explicitly starts checkout; a charge requires their approval on PayWay.