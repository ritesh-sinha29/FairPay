# Arkiv Developer Friction & Feedback Report

*Constructive developer feedback submitted for ETHGlobal Mumbai judging.*

---

## 1. What Got in Our Way & Potential Improvements

### A. Access Key Onboarding vs. Public Endpoint Discovery
- **Observation**: When initializing `createPublicClient({ chain: rabdi() })` without an access key, the SDK throws `MissingAccessKeyError("Rabdi")`. While passing `accessKey: ""` unlocks the public rate-limited endpoint, this fallback behavior is not immediately obvious in the quickstart guides.
- **Recommendation**: Allow `rabdi()` to default gracefully to the public testnet endpoint with a standard console notice rather than requiring developers to explicitly pass `{ accessKey: "" }`.

### B. Query String Syntax vs. Typed Predicate Builders
- **Observation**: Arkiv supports two querying styles: raw string filters (e.g., `"status = str('open') AND budget >= dec('1.0')"`) and programmatic builders (`and(eq(...))`). In our testing, raw query strings provided faster iteration, but writing literal type wrappers like `str('value')` and `dec('1.00')` inside string templates occasionally led to syntax parsing errors if quotes weren't strictly formatted.
- **Recommendation**: Provide a simple tag template literal helper, e.g., `arkiv\`status = ${status} AND budget >= ${budget}\`` that automatically escapes and wraps typed values in `str()`, `dec()`, and `addr()`.

### C. Expiration Mental Model: Blocks vs. Clock Time
- **Observation**: While `ExpirationTime.fromDays(d)` and `fromHours(h)` are intuitive helper functions, under the hood Arkiv relies on block estimates (~2s per block on Rabdi). When querying entities back from `publicClient.query()`, entities expose `$expiresAt` or block numbers, requiring developers to write manual conversion helpers to display remaining hours/days on UI countdowns.
- **Recommendation**: Include a utility method on the SDK client such as `client.formatRemainingTime(entity.expiresAt)` or return a normalized Unix timestamp alongside block numbers.

---

## 2. Issues Encountered & Steps to Reproduce

### Issue: Vite / Next.js Fast-Refresh Transport Instantiation
- **Expected**: Calling `createPublicClient({ chain: rabdi({ accessKey }), transport: http() })` inside a React component or server action would cleanly re-use the connection.
- **What Happened**: Under React strict mode or HMR, multiple rapid queries occasionally triggered rate-limit 429 warnings on the public endpoint.
- **How We Handled It**: We wrapped the public client in a shared singleton pattern with a resilient verified testnet cache fallback so UI rendering never breaks during judging or offline review.

