# BookLan — Complete Project Master Prompt
### Read this entire document before responding to anything. This is the full context of what we are building.

---

## WHO WE ARE

**Team name:** Ping Pong Team
**Members:** Heng Sok (team lead), Chary, Faris, Senghab
**University:** Paragon International University (PIU), Phnom Penh, Cambodia
**Program:** AIM Growth Program — AI vibe coding sprint
**Sprint duration:** 1 week to build a working MVP demo
**After sprint:** 2 months to build the full product if we pass

---

## WHAT BOOKLAN IS

BookLan is a mobile-first web application for Cambodia that solves intercity transportation and delivery problems on national roads. It connects passengers and package senders to passing private intercity buses and vans that would otherwise never stop for them because they are not at a designated station.

**One line:** Book a seat on any passing intercity bus from wherever you are standing on the road. No station. No advance booking. No waiting in uncertainty.

---

## THE PROBLEM

### Why it exists

Private intercity buses and vans in Cambodia (companies like Vireak Buntham, Larita, Capitol Tour, Mekong Express) run fixed routes between provinces. Their entire system is built around physical stations. A bus leaves Phnom Penh to Siem Reap and will only stop at its own designated stations along the way.

If a traveler is already on National Road 6, somewhere between Phnom Penh and Siem Reap, with no station nearby — no vehicle will stop for them. It does not matter how many empty seats the bus has. The system does not allow mid-route pickups unless the passenger pre-booked from a station.

### What happens today

The traveler stands on the road and waves at every vehicle that passes. Most ignore them. Some informal vehicles might stop but are often overcrowded, dirty, unpriced, and unsafe. The traveler has no information on what is coming, when, how many seats are available, or what the price is. They can wait over an hour with zero certainty.

### Validated with real data

We conducted user research with 24 intercity travelers in Cambodia. 91.7% confirmed that passing buses and vans never stop for them on the road unless they have a pre-booked ticket with that company.

### The user persona

**Dara, 32, office worker in Phnom Penh.** His wife's hometown is along National Road 6. He needs to reach Siem Reap urgently. He is already on the road, nowhere near any station. No time to go back to Phnom Penh to book. He flags down every van that passes. None stop. He waits over an hour. Ends up cramming into a packed dirty informal vehicle with no seat guarantee and no receipt.

---

## THE SOLUTION

BookLan connects mid-route passengers to passing private buses and vans with available seats.

**The flow:**
1. Passenger opens the app on their phone
2. Searches their destination
3. Pins their current location on the road
4. Sees nearby buses heading their direction with estimated distance, seats available, and price
5. Selects a bus, picks a seat from the seat map
6. Chooses a drop-off station in the destination province
7. Pays in-app via ABA PayWay
8. Receives a booking ticket with a unique ticket ID
9. Waits for the bus, tracks it by distance (not exact GPS)
10. Shows ticket ID to driver when bus arrives
11. Boards and travels to destination

---

## THREE CORE FEATURES

### Feature 1: On-road passenger booking (MAIN MVP)
The core product. Traveler is mid-route, not near any station. Books a passing bus from wherever they are standing. This is what no other app does.

### Feature 2: Advance booking
Works like Bookmebus or similar Cambodian bus booking platforms. User picks a route, date, departure time, company, and seat. Books and pays in advance. Goes to the station at the right time and boards normally. Included because it serves all use cases and makes the app useful to everyone, not just mid-route travelers.

### Feature 3: Intercity package delivery (FUTURE — not in sprint MVP)
A sender wants to deliver a package to another province. They pin their location on the road. Select destination station/branch of the company. Enter sender and receiver phone numbers. Package details and size. A passing vehicle picks up the package at the sender's pin, delivers to the destination station. Receiver gets notified by staff using the phone number provided. Receiver does not need the app. This mirrors how existing delivery companies like Vireak Buntham already work, but removes the requirement to go to a physical station to drop off.

---

## IMPORTANT SECURITY AND PRIVACY DECISIONS

### No exact GPS for vehicles
The app does NOT show the exact real-time GPS location of any bus or van on a map visible to passengers. This was flagged as a critical privacy concern — showing exact bus location means exposing the location of 10 to 20 other passengers on board. Instead the app only shows estimated distance radius: "12 km away, approximately 8 minutes." The distance counts down over time using a frontend timer. Never show exact coordinates.

### No plate numbers
Vehicle plate numbers are NEVER shown anywhere in the app. Not on the bus list, not on the tracking screen, not anywhere. Company name and vehicle type (bus or van) is enough for the passenger to identify their vehicle.

### Pin location constraints
When a passenger pins their pickup location, the app should validate that the pin is on or near a main road. Passengers cannot pin inside a house, a village, or an area with no road access. If the pin is in an invalid location, the confirm button does not work. For the sprint MVP this validation can be simplified, but it must exist in some form.

### Package delivery liability
For package delivery, any issues with the package (loss, damage) are the responsibility of the private bus company, not BookLan. Each company has their own policies. BookLan is only the booking and payment platform.

---

## TWO TICKET TYPES

To solve the problem of existing passengers getting frustrated by extra mid-route stops:

**Express ticket:** Full price. No mid-route stops. Only boards at the departure station. Guaranteed on-time arrival. For passengers who planned ahead.

**Flex ticket:** Slightly cheaper. Bus may pick up mid-route passengers or packages along the way. Takes slightly longer. This is the ticket type used for on-road booking. Passengers who choose Flex already know and accept that there may be stops. No one is surprised.

This completely solves the angry passenger problem because expectations are set at the time of booking.

---

## BUSINESS MODEL

### How we make money

**Primary: Booking commission**
8 to 10 percent per confirmed booking paid by the private bus company. Bus companies gain revenue from seats that would otherwise be empty between stations. They pay nothing unless a booking happens. Zero risk to join, pure upside per trip.

**Secondary: Promoted listings**
Bus companies can pay to rank higher in search results during peak travel periods. Performance-based, not subscription.

**Tertiary: Partner promotions**
Companies like Grab, food delivery apps, and other brands pay to feature their promo codes to our users during their trip. Travelers heading to a new city are a highly relevant captive audience.

**Quaternary: In-app advertising**
Small ad banners for local businesses targeting travelers.

### What we do NOT charge
- No subscription fee for passengers
- No fee for bus companies to join the platform
- Revenue only when a booking happens

### Why bus companies will join
The math is simple. If a van has 15 seats and fills 10 from the station, those 5 empty seats are $50 of lost revenue per trip. If BookLan fills 2 of those seats and takes 10% commission, the company earns $18 more per trip doing nothing differently. Multiply by 3 trips per day and 30 days per month = over $1,600 of additional monthly revenue from one van on one route.

### No government dependency
This is critical. We work entirely with private bus companies. No license needed. No data agreement with the government. No risk of being shut down because the government pulls our data. Every revenue stream comes from private businesses who benefit directly.

---

## LEAN CANVAS

**Problem:** Private buses will only stop at their own stations. Travelers mid-route have no way to book, no visibility into passing vehicles, and no guarantee anything stops.

**Customer segments:** Intercity travelers already on national roads far from any station. Workers and students visiting family in rural provinces. Anyone needing urgent transport who cannot reach a departure station.

**Unique value proposition:** Book a confirmed seat on a passing bus from anywhere on the road. No station. No schedule. No uncertainty.

**Solution:** Pin location, see nearby buses by distance and price, book a seat, pay in-app, bus stops at your pin.

**Channels:** iOS/Android web app accessible via URL. Direct outreach to bus companies. Word of mouth on popular routes.

**Revenue streams:** Commission per booking. Promoted listings. Partner promotions. In-app ads.

**Cost structure:** App development and maintenance. Server infrastructure. Payment processing fees. Bus company onboarding. Marketing.

**Key metrics:** Bookings per month. Companies onboarded. Booking completion rate. Driver acceptance rate. Average time between booking and pickup.

**Unfair advantage:** First mover in mid-route intercity booking in Cambodia. Validated idea. Commission-only model means zero risk for partners. Won 1st Place at MIS Challenge 2026.

---

## COMPETITION

### No direct competitor exists
Nothing in Cambodia or Southeast Asia does mid-route intercity booking on national roads.

### Existing alternatives and why they fail
- **Traditional station booking (Bookmebus, Camboticket):** Requires physical presence at a terminal. Useless if you are mid-route.
- **Standing on the road:** Informal, zero guarantee, no price, no seat confirmation.
- **Calling the company:** Companies cannot process mid-route pickups by phone. Their system is station-based only.
- **Grab/PassApp:** Short urban rides only. Not intercity. Not relevant.

### Why Grab cannot copy us
Grab focuses on short urban rides. Intercity van routing with mid-route pickups across national roads is a completely different operational and technical model. They would need to rebuild their driver network and pricing system for a market they have not prioritized. By the time they move we already have the company relationships locked in.

---

## SPRINT MVP SCOPE (WHAT WE BUILD THIS WEEK)

The sprint is 1 week. We focus on the core passenger booking flow only. Everything must be working end to end for the demo.

### What is IN the sprint MVP

**Authentication:**
- Sign in with phone number (Cambodia +855)
- OTP verification (fake for demo — correct code is always 123456)
- Sign in with Google (optional, requires phone number confirmation after)
- Create profile with name and optional profile photo
- Skip profile option

**Home screen:**
- Search bar for destination
- Leaflet.js map with OpenStreetMap tiles (NOT Google Maps)
- Browser geolocation API to auto-detect user position and drop a pin
- Show 4 fake bus/van icons on the map at static positions on national roads
- Small list panel below map showing nearby active buses
- Sort by nearest and cheapest

**On-road booking flow:**
- Search destination
- Confirm pickup pin on the road
- Bus list filtered by destination
- Bus detail with seat map selection
- Drop-off station selection from company's stations in that province
- Booking summary with price breakdown
- ABA PayWay sandbox payment (real payment flow using sandbox credentials)
- Booking confirmed screen with ticket ID in format BL-XXXX-XXXX

**Tracking screen:**
- Distance countdown (frontend timer decreasing every 30 seconds, NOT real GPS)
- Estimated arrival time
- Company name and vehicle type only (NO plate number)
- Action buttons: Call Driver, Message, View Ticket, Cancel Booking
- Ticket ID panel at bottom to show driver

**My Bookings page:**
- Active bookings with Track and Cancel options
- Past bookings history

**Advanced Booking:**
- Search by route and date
- List of schedules like Bookmebus
- Same seat selection and payment flow
- Creates advanced booking record

**Profile page:**
- Name, photo, phone number
- Settings: notifications, language, help, log out

### What is NOT in the sprint MVP
- Package delivery feature (future)
- Real driver app (simulated via Supabase dashboard during demo)
- Real SMS OTP (faked with 123456)
- Real-time vehicle GPS tracking (simulated with countdown timer)
- Road validation for pin location (simplified for demo)
- Multiple payment methods (ABA only)
- Khmer language (English only for now)

---

## FUTURE FEATURES (AFTER SPRINT — 2 MONTH BUILD)

**Package delivery feature:**
- Full delivery booking flow
- Package details, size, weight limits
- Company sets available cargo space per trip
- Sender pays in-app, receiver notified by phone
- Package tracking by bus distance
- Same driver flow as passenger pickup

**Real driver app:**
- Driver registers through their company
- Receives booking notifications while driving
- Accept or reject with 2-minute timeout
- GPS broadcasting from driver phone
- Verify ticket ID at pickup
- Confirm boarding / confirm package pickup

**Real road validation:**
- Google Roads API or Mapbox to validate pin is on a main road
- Error if pin is in a house, village, or off-road area

**Real SMS OTP:**
- Twilio or similar for actual SMS verification

**Crowdedness indicator:**
- Show how full each bus is in real time

**Trip history and favorites:**
- Save regular routes
- Quick rebook past trips

**Dark mode**

**Offline route cache:**
- Basic route info available without internet

**Multi-language:**
- Khmer and English toggle

**Real-time service alerts:**
- Push notifications when a booked bus is delayed

**Crowdfunding-style pre-boarding:**
- Route only activates if minimum passengers book
- For less popular routes

---

## TECH STACK

**Frontend:** Next.js 14 with App Router, TypeScript, Tailwind CSS
**Maps:** Leaflet.js with OpenStreetMap (free, no API key needed)
**Location:** Browser Geolocation API combined with Leaflet
**Backend and database:** Supabase (PostgreSQL, auth, real-time)
**Payment:** ABA PayWay sandbox
**Icons:** Lucide React
**Deployment:** Vercel

---

## CREDENTIALS AND KEYS

**Supabase:**
- URL: https://cscgdnlugmtysbbonkhg.supabase.co
- Project ID: cscgdnlugmtysbbonkhg
- Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzY2dkbmx1Z210eXNiYm9ua2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMTAwNzUsImV4cCI6MjEwMzY4NjA3NX0.0ZcwXIGGB8xWzf61jaNYtDzBgqCZUHWYMiAxguq5hXo

**ABA PayWay Sandbox:**
- Merchant ID: ec478081
- Public Key: 941123f1a0c6abc26a12a3fcdd111626bd0f1232
- Sandbox URL: https://checkout-sandbox.payway.com.kh
- Valid until: 29 November 2026

**Google OAuth:**
- Client ID: 481362747355-9vrc7m04361gl2mv20nq3bj59k96kv0f.apps.googleusercontent.com
- Client Secret: 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

---

## DATABASE SCHEMA

### users
- id (uuid, primary key)
- phone (text, unique)
- name (text, nullable)
- profile_photo_url (text, nullable)
- created_at (timestamp)

### companies
- id (uuid, primary key)
- name (text) — Vireak Buntham, Larita, Capitol Tour, Mekong Express
- vehicle_type (text) — 'bus' or 'van'

### active_trips
- id (uuid, primary key)
- company_id (uuid, FK companies)
- route (text)
- origin (text)
- destination (text)
- national_road (text)
- distance_km (integer) — how far the bus is from reference point
- seats_total (integer)
- seats_available (integer)
- price_per_km (float)
- status (text) — 'active'

### stations
- id (uuid, primary key)
- company_id (uuid, FK companies)
- name (text)
- province (text)
- address (text)
- lat (float)
- lng (float)

### bookings
- id (uuid, primary key)
- user_id (uuid, FK users)
- trip_id (uuid, FK active_trips)
- seat_number (integer)
- pickup_lat (float)
- pickup_lng (float)
- dropoff_station_id (uuid, FK stations)
- ticket_id (text, unique) — format: BL-XXXX-XXXX
- status (text) — 'confirmed', 'cancelled'
- total_price (float)
- payment_status (text) — 'paid', 'unpaid'
- distance_remaining_km (integer) — counts down from trip distance_km
- created_at (timestamp)

### schedules (advance booking)
- id (uuid, primary key)
- company_id (uuid, FK companies)
- origin (text)
- destination (text)
- departure_time (text)
- arrival_time (text)
- duration_hours (float)
- price_per_seat (float)
- seats_total (integer)
- seats_available (integer)
- days_available (text) — 'daily'

### advanced_bookings
- id (uuid, primary key)
- user_id (uuid, FK users)
- schedule_id (uuid, FK schedules)
- travel_date (date)
- seat_number (integer)
- ticket_id (text, unique)
- status (text)
- total_price (float)
- payment_status (text)
- created_at (timestamp)

---

## SEED DATA

### Companies
1. Vireak Buntham — bus
2. Larita — van
3. Capitol Tour — bus
4. Mekong Express — van

### Active Trips (fake, for demo)
1. Vireak Buntham, Phnom Penh to Siem Reap, NR6, 12km away, 5 seats, $0.10/km
2. Larita, Phnom Penh to Siem Reap, NR6, 28km away, 3 seats, $0.09/km
3. Capitol Tour, Phnom Penh to Kampot, NR3, 15km away, 8 seats, $0.08/km
4. Mekong Express, Phnom Penh to Sihanoukville, NR4, 40km away, 6 seats, $0.10/km

### Stations
- Vireak Buntham Siem Reap Main: NR6, Siem Reap (13.3671, 103.8448)
- Vireak Buntham Siem Reap Branch: Sivatha Blvd, Siem Reap (13.3625, 103.8560)
- Larita Siem Reap Station: Charles de Gaulle, Siem Reap (13.3700, 103.8500)
- Capitol Tour Kampot Station: NR3, Kampot (10.6100, 104.1800)
- Mekong Express Sihanoukville Station: Ekareach St (10.6277, 103.5230)

### Schedules
- Vireak Buntham, PP to Siem Reap: 07:00, 09:00, 13:00 — $12/seat
- Capitol Tour, PP to Kampot: 08:00, 14:00 — $8/seat
- Mekong Express, PP to Sihanoukville: 07:30, 12:00 — $10/seat

---

## DESIGN SYSTEM

- Primary: #1A3A5C (dark navy)
- Secondary: #2563EB (bright blue)
- Background: #FFFFFF
- Surface: #F5F7FA
- Text primary: #111827
- Text secondary: #6B7280
- Success: #16A34A
- Error: #DC2626
- Border: #E5E7EB
- Font: Inter
- Card border radius: 12px
- Mobile-first, optimized for 390px width
- Clean minimal modern UI inspired by Grab
- No emoji — Lucide React icons only
- Every button has loading state
- Every list has empty state with illustration
- Every form validates with clear error messages

---

## DEMO STRATEGY

Since we have no real bus companies sending GPS data during the demo:

**Fake bus data:** 4 active trips seeded in Supabase with static distance values. When a passenger searches, the app queries these and displays them as if they are real nearby buses.

**Fake bus positions on map:** 4 static coordinates on national roads near Phnom Penh. Bus icons placed at these coordinates on the Leaflet map. Looks real because they are on actual roads.

**Distance countdown:** After booking, the tracking screen shows distance counting down by 1 to 3 km every 30 seconds using a frontend timer. Not real GPS — a timer. Looks like live tracking.

**Driver simulation:** During the demo, a teammate opens the Supabase dashboard on their laptop. When the judge books, the teammate manually changes the booking status from 'pending' to 'confirmed' in the Supabase table editor. The passenger app updates in real time via Supabase real-time subscriptions.

**OTP:** Any 6-digit code is accepted. Correct code for testing is always 123456.

**Payment:** ABA PayWay sandbox. Real payment flow opens, judge completes a test transaction, booking confirms. Uses sandbox credentials so no real money moves.

---

## RULES THAT MUST NEVER BE BROKEN

1. Never show vehicle plate numbers anywhere
2. Never show exact real-time vehicle GPS coordinates
3. Only show distance in km and estimated minutes
4. All prices in USD with 2 decimal places
5. All ticket IDs in format BL-XXXX-XXXX
6. Mobile-first — every screen must work on a 390px phone browser
7. ABA PayWay only — no other payment method in sprint
8. Supabase real-time subscriptions on bookings table
9. App must be fully functional end to end — no placeholder screens

---

## COMPETITION HISTORY

- **MIS Challenge 2026:** Won 1st Place at Paragon International University with the BookLan prototype (Figma only, no code)
- **AIM Growth Program:** Selected to build the real working app using AI vibe coding tools
- The idea was validated by a lecturer who also works with government transport authorities in Cambodia and confirmed the problem is real

---

## WHAT THIS PROJECT IS NOT

- Not a public bus app (that is a separate project called LanKrong — do not confuse them)
- Not a ride-hailing app like Grab for short urban rides
- Not a delivery company — we connect senders to existing bus company delivery services
- Not dependent on government data or approval
- Not a subscription product — revenue is purely performance-based commission

---

## CONTEXT FOR AI ASSISTANTS

If you are an AI reading this document to help the team build BookLan, here is what you need to know:

The team is using AI vibe coding tools to build this app in one week. The primary tool is Claude Code in the terminal connected to a Next.js project. The app is already designed in Figma (high-fidelity prototype exists). The Lovable platform has been used to generate the initial scaffold. Your job is to help extend, fix, and polish the application based on this specification.

When writing code:
- Use Next.js 14 App Router patterns
- Use TypeScript strictly
- Use Tailwind CSS for styling, no other CSS framework
- Use Supabase client from @supabase/supabase-js
- Use Leaflet for maps, imported client-side only (dynamic import)
- Use Lucide React for icons
- Follow the color system defined above
- Never hardcode sensitive credentials — use environment variables
- All Supabase queries must handle errors
- All UI must be responsive and mobile-first

When in doubt, refer to the database schema section for table structures and the seed data section for what data exists.
