# TiketKilat home refresh

## Direction

Search-first airline booking home with a compact photographic hero, overlapping booking panel, destination discovery cards, route shortcuts, and an accurate three-step booking guide. Preserve TiketKilat's Plus Jakarta Sans typography, blue primary color, React/TypeScript/Tailwind stack, authentication, and existing backend integration.

UI/UX Pro Max's airline recommendation guided the sky-blue/trust palette, restrained surfaces, visible field labels, 44px controls, inline errors, keyboard focus, responsive grids, and reduced-motion support. No round-trip, passenger-count, fare-class, discount, rating, or availability controls are shown unless supported by the app.

## 21st.dev references

Visual inspiration only; implemented with the project's installed primitives, without adding motion libraries or copying third-party component source.

- [Location Card — LaviKatiyar](https://21st.dev/@lavikatiyar/components/location-card): destination photo, location hierarchy, and a restrained directional call to action.
- [Header with Search — Shaban Haider / Efferd](https://21st.dev/@sshahaider/components/header-with-search): concise navigation and clear search hierarchy. TiketKilat keeps the primary booking form visible, with a compact navigation row on mobile.

## Photo credits

Downloaded local WebP assets from Unsplash. All source pages identify these as available under the [Unsplash License](https://unsplash.com/license).

- `bali-hero.webp`, `bali.webp`: [Dominic Krainer — Kelingking Beach, Nusa Penida](https://unsplash.com/photos/rock-cliff-tsnJEq4744s). Bali discovery links search for arrival in Denpasar; the photo is not presented as Denpasar city.
- `yogyakarta.webp`: [Edmund Lou — Prambanan](https://unsplash.com/photos/a-large-group-of-stone-structures-sitting-on-top-of-a-lush-green-field-3U1LXFVSyMo).
- `jakarta.webp`: [Rafli Raihan — Jakarta skyline](https://unsplash.com/photos/a-view-of-a-city-with-tall-buildings-ylgA4NKVyDM).
- `surabaya.webp`: [Hafid Pratama — Surabaya skyline](https://unsplash.com/photos/city-skyline-under-white-sky-during-daytime-gFS9auoPmYQ).

## Functional scope

- Search retains the API's `dari`, `ke`, `tanggal`, and `maskapai` query contract.
- Both city selectors share the same options, so swapping works in both directions.
- An empty date searches all dates; a supplied past date is rejected.
- Destination cards and route links lead to real `/flights` searches, with existing authentication guards unchanged.
- The shared account menu retains orders (`/history`), profile (`/profile`), admin dashboard (`/admin`), and logout actions for the appropriate roles.
- Home makes no live fare/availability claims. The footer identifies current inventory as demo data.
- Social-preview metadata and imagery follow the TiketKilat name. Local-only; no deployment.

## Shared header and flight catalog

Home and all AppShell pages now render one `SiteHeader`, preserving the same brand, dimensions, consumer navigation, and account menu. Admin pages keep their role-specific navigation. `HomeHeader` is only a compatibility export, not a second implementation.

Header actions no longer link to `/#destinasi` or `/#cara-pesan`. Destinasi opens a destination picker; on `/flights` it updates the existing catalog through a callback, preserving origin, date, airline, budget, departure periods, and sorting without remounting the page. The origin cannot be selected as the destination, and invalid-date feedback stays inside the picker. From other pages, selecting a destination leads directly to its real filtered catalog. Cara pesan opens a dismissible four-step guide and never changes the route. Opening or cancelling either panel has no search side effects. Tiket pesawat focuses the catalog search when already there; modified clicks retain the submitted query in a new tab. Both desktop and mobile compose the same installed dialog primitives for keyboard focus, dismissal, and focus restoration.

The `/flights` catalog follows the same search-first, sky-blue UI/UX direction: a prominent labeled search panel, collapsible mobile filters, a desktop filter sidebar, price/duration/departure sorting, and readable itinerary cards with separate price and booking actions. Price ceilings and departure-time filters operate on the actual API results. Cards retain the existing booking URL fields and indicate overnight arrivals without inventing live status, stops, baggage, or cabin data.

Search state distinguishes edited fields from submitted filters. A request-generation guard prevents stale requests from replacing newer results or updating the URL after unmount. Incoming city/airline selections remain available when optional metadata fails. Validation, empty results, loading, and retry states are preserved. Verification is source-level, automated tests, TypeScript, and a local build; no browser interaction or deployment.

## TiketKilat brand rename

Display names, page metadata, and ticket/email template branding use the exact spelling **TiketKilat**. Internal storage keys retain their original names so existing login sessions and pending payment details remain readable.

The social preview is saved as `public/og.png` (1731 × 909) and referenced with the `v=tiketkilat` cache version. Built-in imagegen edited the existing card. Final prompt: “Add only the missing final lowercase t so the brand reads TiketKilat, with Tiket blue and Kilat teal. Preserve the tagline ‘Temukan penerbangan terbaik, tanpa ribet.’, scenery, aircraft, colors, typography, and landscape composition.”
