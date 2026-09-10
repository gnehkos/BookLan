# BookLan — Khmer translation worksheet

Every user-facing string in the app, with a first-pass Khmer translation.

**How to use this:** edit the **Khmer** column only. Leave the **Key** column
untouched — it is what the code will look the string up by. Send the file back
when you are happy and the language toggle will be built from it.

Extracted from 49 files. Anything not listed here is either data from the
database (company names, station names, province names, ticket IDs) or a number.

---

## Decisions I need from you

These change how much gets translated, so they are worth settling first.

| # | Question | My suggestion |
|---|---|---|
| 1 | **Province names** — the database stores `Siem Reap`, `Kampot` etc. and searching matches on them. Translating them means a separate display map (English stays the key). Do you want them shown in Khmer? | Yes — table at the bottom, English stays as the data key |
| 2 | **Numbers** — prices, distances, seat numbers, times. Khmer numerals (០១២៣) or Arabic (0123)? | Keep Arabic. Khmer apps mostly do, and prices/ticket IDs read better |
| 3 | **Company names** — Vireak Buntham, Giant Ibis, ABA Bank | Leave in English, they are brands |
| 4 | **BookLan** and the slogan | Leave the name; slogan translated below, tell me if you want it left in English |
| 5 | **National Road 6** etc. | Translated (`ផ្លូវជាតិលេខ ៦`) — this one uses Khmer numerals since that is how the roads are written |

---

## 1. Navigation and common buttons

| Key | English | Khmer |
|---|---|---|
| `nav.home` | Home | ទំព័រដើម |
| `nav.planTrip` | Plan Trip | គ្រោងដំណើរ |
| `nav.bookings` | Bookings | ការកក់ |
| `nav.profile` | Profile | គណនី |
| `common.back` | Back | ត្រឡប់ក្រោយ |
| `common.continue` | Continue | បន្ត |
| `common.cancel` | Cancel | បោះបង់ |
| `common.close` | Close | បិទ |
| `common.done` | Done | រួចរាល់ |
| `common.skip` | Skip | រំលង |
| `common.search` | Search | ស្វែងរក |
| `common.tryAgain` | Try again | ព្យាយាមម្តងទៀត |
| `common.total` | Total | សរុប |
| `common.totalPaid` | Total paid | បានបង់សរុប |
| `common.serviceFee` | Service fee | ថ្លៃសេវា |
| `common.distance` | Distance | ចម្ងាយ |
| `common.destination` | Destination | គោលដៅ |
| `common.departure` | Departure | ការចេញដំណើរ |
| `common.travelDate` | Travel date | កាលបរិច្ឆេទធ្វើដំណើរ |
| `common.vehicle` | Vehicle | ប្រភេទឡាន |
| `common.operator` | Operator | ក្រុមហ៊ុន |
| `common.seat` | Seat | កៅអី |
| `common.seats` | Seats | កៅអី |
| `common.ticketId` | TICKET ID | លេខសំបុត្រ |
| `common.pickup` | Pickup | ចំណុចទទួល |
| `common.dropoff` | Drop-off | ចំណុចចុះ |
| `common.from` | FROM | ចេញពី |
| `common.to` | TO | ទៅ |
| `common.bus` | bus | រថយន្តក្រុង |
| `common.van` | van | រថយន្តតូច |
| `common.km` | km | គម |
| `common.kmValue` | {km} km | {km} គម |
| `common.seatNumber` | Seat {n} | កៅអី {n} |
| `common.minutes` | {n}m | {n}នាទី |
| `common.hoursMinutes` | {h}h {n}m | {h}ម៉ោង {n}នាទី |
| `common.youAreHere` | You | អ្នក |

## 2. Splash and onboarding

| Key | English | Khmer |
|---|---|---|
| `splash.slogan` | No station. No waiting. | គ្មានស្ថានីយ។ គ្មានការរង់ចាំ។ |
| `onboarding.1.title` | Book from anywhere | កក់បានគ្រប់ទីកន្លែង |
| `onboarding.1.body` | No station needed. Flag down any bus or van right from where you stand on the national road. | មិនចាំបាច់ទៅស្ថានីយទេ។ ហៅឡានក្រុង ឬឡានវ៉ាន់ណាមួយ ពីកន្លែងដែលអ្នកឈរនៅលើផ្លូវជាតិ។ |
| `onboarding.2.title` | Pre-book in advance | កក់ទុកជាមុន |
| `onboarding.2.body` | Schedule your trip a day ahead. Pick your route, date, and seats — all locked in before you travel. | កំណត់ដំណើររបស់អ្នកមួយថ្ងៃជាមុន។ ជ្រើសរើសផ្លូវ កាលបរិច្ឆេទ និងកៅអី — ទាំងអស់ត្រូវបានកក់មុនពេលធ្វើដំណើរ។ |
| `onboarding.3.title` | Pay and get picked up | បង់ប្រាក់ រួចរង់ចាំគេមកទទួល |
| `onboarding.3.body` | Pay securely in-app with your E-Bank account. Show your Ticket ID to the driver and hop on. | បង់ប្រាក់ដោយសុវត្ថិភាពក្នុងកម្មវិធី តាមគណនីធនាគាររបស់អ្នក។ បង្ហាញលេខសំបុត្រទៅអ្នកបើកបរ រួចឡើងជិះ។ |
| `onboarding.getStarted` | Get Started | ចាប់ផ្តើម |

## 3. Sign in and account

| Key | English | Khmer |
|---|---|---|
| `login.title` | Let's get you moving | តោះចាប់ផ្តើមដំណើររបស់អ្នក |
| `login.subtitle` | Sign in or create an account to book your seat. | ចូលគណនី ឬបង្កើតគណនីថ្មី ដើម្បីកក់កៅអីរបស់អ្នក។ |
| `login.phone` | Continue with Phone Number | បន្តដោយប្រើលេខទូរស័ព្ទ |
| `login.google` | Continue with Google | បន្តដោយប្រើ Google |
| `login.terms` | By continuing, you agree to BookLan's Terms of Service and Privacy Policy. | ដោយបន្ត អ្នកយល់ព្រមតាមលក្ខខណ្ឌប្រើប្រាស់ និងគោលការណ៍ឯកជនភាពរបស់ BookLan។ |
| `phone.title` | What's your phone number? | តើលេខទូរស័ព្ទរបស់អ្នកគឺជាអ្វី? |
| `phone.subtitle` | We'll use this to identify your bookings. | យើងនឹងប្រើវាដើម្បីកំណត់អត្តសញ្ញាណការកក់របស់អ្នក។ |
| `phone.label` | PHONE NUMBER | លេខទូរស័ព្ទ |
| `phone.signedInAs` | Signed in as | បានចូលគណនីជា |
| `phone.invalid` | Enter a valid Cambodian phone number. | សូមបញ្ចូលលេខទូរស័ព្ទកម្ពុជាឲ្យបានត្រឹមត្រូវ។ |
| `phone.unreachable` | Couldn't reach the server. Check your connection and try again. | មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ។ សូមពិនិត្យអ៊ីនធឺណិត រួចព្យាយាមម្តងទៀត។ |
| `signup.title` | Create account | បង្កើតគណនី |
| `signup.subtitle` | Add your name so drivers know who's travelling. | បញ្ចូលឈ្មោះរបស់អ្នក ដើម្បីឲ្យអ្នកបើកបរដឹងថាអ្នកណាធ្វើដំណើរ។ |
| `signup.fullName` | FULL NAME | ឈ្មោះពេញ |
| `signup.namePlaceholder` | e.g. Dara Sok | ឧ. ដារ៉ា សុខ |
| `signup.photoOptional` | Profile photo (optional) | រូបភាពគណនី (ស្រេចចិត្ត) |
| `signup.uploadPhoto` | Upload profile photo | បញ្ចូលរូបភាពគណនី |
| `signup.verified` | Verified | បានផ្ទៀងផ្ទាត់ |
| `signup.nameRequired` | Please enter your name so drivers know who to look for. | សូមបញ្ចូលឈ្មោះរបស់អ្នក ដើម្បីឲ្យអ្នកបើកបរដឹងថាត្រូវរកអ្នកណា។ |
| `signup.photoTooBig` | That image is over 5MB. Please pick a smaller one. | រូបភាពនេះធំជាង 5MB។ សូមជ្រើសរើសរូបតូចជាងនេះ។ |
| `signup.saveFailed` | Couldn't save your profile. Please try again. | មិនអាចរក្សាទុកព័ត៌មានរបស់អ្នកបានទេ។ សូមព្យាយាមម្តងទៀត។ |

## 4. Home and search

| Key | English | Khmer |
|---|---|---|
| `home.searchPlaceholder` | Where are you going? | តើអ្នកចង់ទៅណា? |
| `home.inbox` | Inbox | សារ |
| `home.yourProfile` | Your profile | គណនីរបស់អ្នក |
| `search.title` | Where do you want to go? | តើអ្នកចង់ទៅណា? |
| `search.clear` | Clear search | សម្អាតការស្វែងរក |
| `search.popular` | POPULAR DESTINATIONS | គោលដៅពេញនិយម |
| `search.matches` | MATCHES | លទ្ធផល |
| `search.noMatch` | No destination matches "{query}". | រកមិនឃើញគោលដៅដែលត្រូវនឹង "{query}" ទេ។ |
| `destinationSheet.title` | Change destination | ប្តូរគោលដៅ |
| `destinationSheet.search` | Search a province | ស្វែងរកខេត្ត |
| `destinationSheet.current` | Current | បច្ចុប្បន្ន |
| `destinationSheet.goingTo` | Currently going to {destination} | បច្ចុប្បន្នកំពុងទៅ {destination} |

## 5. Pickup map

| Key | English | Khmer |
|---|---|---|
| `pickup.title` | Set your pickup point | កំណត់ចំណុចទទួលរបស់អ្នក |
| `pickup.subtitle` | Drag the pin, or long-press anywhere on the map | អូសម្ជុល ឬចុចឲ្យជាប់លើផែនទី |
| `pickup.hintTitle` | Hold to set pickup | ចុចឲ្យជាប់ដើម្បីកំណត់ចំណុចទទួល |
| `pickup.hintSub` | or drag this pin | ឬអូសម្ជុលនេះ |
| `pickup.warnTitle` | Wrong road | ខុសផ្លូវ |
| `pickup.warnSub` | Your bus won't pass here | ឡានរបស់អ្នកមិនឆ្លងកាត់ទីនេះទេ |
| `pickup.zones` | Pickup zones | តំបន់ទទួល |
| `pickup.allowed` | Pickup allowed | អាចទទួលបាន |
| `pickup.notAllowed` | No pickup | មិនអាចទទួលបាន |
| `pickup.otherRoads` | Any other road | ផ្លូវផ្សេងទៀត |
| `pickup.onRoad` | On {road} | នៅលើ {road} |
| `pickup.finding` | Finding this place… | កំពុងស្វែងរកទីតាំង… |
| `pickup.cannotHere` | Can't be picked up here | មិនអាចទទួលនៅទីនេះបានទេ |
| `pickup.wontPass` | Buses to {destination} don't pass this spot | ឡានទៅ {destination} មិនឆ្លងកាត់ចំណុចនេះទេ |
| `pickup.confirm` | Confirm pickup location | បញ្ជាក់ចំណុចទទួល |
| `pickup.moveOnto` | Move pin onto {road} | ផ្លាស់ទីម្ជុលទៅលើ {road} |
| `pickup.recenter` | Recenter to my pin | ត្រឡប់ទៅម្ជុលរបស់ខ្ញុំ |

## 6. Available buses

| Key | English | Khmer |
|---|---|---|
| `buses.title` | Buses to {destination} | ឡានទៅ {destination} |
| `buses.none` | No buses heading to {destination} right now. | ឥឡូវនេះគ្មានឡានទៅ {destination} ទេ។ |
| `buses.loadFailed` | Couldn't load buses. Check your connection and try again. | មិនអាចទាញយកបញ្ជីឡានបានទេ។ សូមពិនិត្យអ៊ីនធឺណិត រួចព្យាយាមម្តងទៀត។ |
| `buses.sortSoonest` | Soonest | មកដល់លឿនបំផុត |
| `buses.sortCheapest` | Cheapest | ថោកបំផុត |
| `buses.sortMostSeats` | Most seats | កៅអីនៅសល់ច្រើនបំផុត |
| `buses.seatsLeft` | {n} seats | {n} កៅអី |
| `buses.availableNow` | {n} available now | មាន {n} ឥឡូវនេះ |

## 7. Seat selection and company details

| Key | English | Khmer |
|---|---|---|
| `seats.title` | Select seats | ជ្រើសរើសកៅអី |
| `seats.left` | {n} left | នៅសល់ {n} |
| `seats.front` | FRONT | ខាងមុខ |
| `seats.available` | Available | នៅទំនេរ |
| `seats.selected` | Selected | បានជ្រើសរើស |
| `seats.occupied` | Occupied | មានគេកក់ |
| `seats.onlyOne` | Only 1 seat is left on this trip. | ដំណើរនេះនៅសល់តែ ១ កៅអីទេ។ |
| `seats.pickOne` | Pick a seat | ជ្រើសរើសកៅអី |
| `seats.perSeat` | ${price} per seat | ${price} ក្នុងមួយកៅអី |
| `seats.noneYet` | No seats yet | មិនទាន់ជ្រើសរើសកៅអី |
| `seats.chooseSeat` | Choose a seat | ជ្រើសរើសកៅអី |
| `seats.pricePerSeat` | Price per seat | តម្លៃក្នុងមួយកៅអី |
| `seats.selectedSeats` | Selected seats | កៅអីដែលបានជ្រើស |
| `seats.subtotal` | Subtotal | សរុបរង |
| `company.details` | Details | ព័ត៌មានលម្អិត |
| `company.photos` | Photos | រូបភាព |
| `company.ratingsReviews` | Ratings & Reviews | ការវាយតម្លៃ និងមតិយោបល់ |
| `company.policies` | Policies | គោលការណ៍ |
| `company.seeAll` | See all {n} reviews | មើលមតិទាំង {n} |
| `company.showFewer` | Show fewer | បង្ហាញតិចជាង |
| `company.trips` | {n} trips | {n} ដំណើរ |
| `company.reviews` | {n} reviews | មតិ {n} |
| `company.close` | Close company details | បិទព័ត៌មានក្រុមហ៊ុន |
| `company.ratedTrip` | Rated this trip. | បានវាយតម្លៃដំណើរនេះ។ |
| `company.pickupPoint` | Pickup point | ចំណុចទទួល |
| `trip.loadFailed` | Couldn't load this trip. It may no longer be available. | មិនអាចទាញយកដំណើរនេះបានទេ។ វាប្រហែលលែងមានហើយ។ |

## 8. Stations (departure and drop-off)

| Key | English | Khmer |
|---|---|---|
| `station.departureTitle` | Departure station | ស្ថានីយចេញដំណើរ |
| `station.dropoffTitle` | Drop-off station | ស្ថានីយចុះ |
| `station.chooseDropoff` | Choose Drop-off Station | ជ្រើសរើសស្ថានីយចុះ |
| `station.confirmDeparture` | Confirm departure point | បញ្ជាក់ចំណុចចេញដំណើរ |
| `station.confirmDropoff` | Confirm drop-off | បញ្ជាក់ចំណុចចុះ |
| `station.inProvince` | {company} in {province} | {company} នៅ {province} |
| `station.noneListed` | No stations listed | គ្មានស្ថានីយក្នុងបញ្ជីទេ |
| `station.noDeparture` | {company} has no departure depot registered in {province} yet. Go back and choose another service. | {company} មិនទាន់មានស្ថានីយចេញដំណើរនៅ {province} នៅឡើយទេ។ សូមត្រឡប់ក្រោយ ហើយជ្រើសរើសសេវាផ្សេង។ |
| `station.noDropoff` | {company} has no drop-off point registered in {province} yet. Go back and choose another departure. | {company} មិនទាន់មានចំណុចចុះនៅ {province} នៅឡើយទេ។ សូមត្រឡប់ក្រោយ ហើយជ្រើសរើសដំណើរផ្សេង។ |
| `station.loadFailedDeparture` | Couldn't load departure stations for this service. | មិនអាចទាញយកស្ថានីយចេញដំណើរសម្រាប់សេវានេះបានទេ។ |
| `station.loadFailedDropoff` | Couldn't load drop-off stations. Check your connection and try again. | មិនអាចទាញយកស្ថានីយចុះបានទេ។ សូមពិនិត្យអ៊ីនធឺណិត រួចព្យាយាមម្តងទៀត។ |
| `station.noneForRoute` | No drop-off stations available for this route. | គ្មានស្ថានីយចុះសម្រាប់ផ្លូវនេះទេ។ |

## 9. Plan a trip

| Key | English | Khmer |
|---|---|---|
| `plan.title` | Plan a trip | គ្រោងដំណើរ |
| `plan.subtitle` | Reserve a seat on a scheduled departure, up to a week ahead. | កក់កៅអីលើដំណើរដែលមានកាលវិភាគ រហូតដល់មួយសប្តាហ៍ជាមុន។ |
| `plan.travelDate` | TRAVEL DATE | កាលបរិច្ឆេទធ្វើដំណើរ |
| `plan.searchDepartures` | Search departures | ស្វែងរកដំណើរ |
| `plan.swap` | Swap origin and destination | ប្តូរទីតាំងចេញ និងគោលដៅ |
| `plan.today` | Today | ថ្ងៃនេះ |
| `plan.tomorrow` | Tomorrow | ថ្ងៃស្អែក |
| `results.sortEarliest` | Earliest | ចេញដំណើរមុនគេ |
| `results.loadFailed` | Couldn't load departures. Check your connection and try again. | មិនអាចទាញយកដំណើរបានទេ។ សូមពិនិត្យអ៊ីនធឺណិត រួចព្យាយាមម្តងទៀត។ |
| `results.date` | DATE | កាលបរិច្ឆេទ |
| `schedule.loadFailed` | Couldn't load this schedule. It may no longer be available. | មិនអាចទាញយកកាលវិភាគនេះបានទេ។ វាប្រហែលលែងមានហើយ។ |

## 10. Confirm booking and payment

| Key | English | Khmer |
|---|---|---|
| `confirm.title` | Confirm Booking | បញ្ជាក់ការកក់ |
| `confirm.pickupPoint` | PICKUP POINT | ចំណុចទទួល |
| `confirm.dropoffStation` | DROP-OFF STATION | ស្ថានីយចុះ |
| `confirm.departureStation` | DEPARTURE STATION | ស្ថានីយចេញដំណើរ |
| `confirm.roadsidePickup` | Roadside pickup | ទទួលតាមផ្លូវ |
| `confirm.stationPickup` | Station pickup | ទទួលនៅស្ថានីយ |
| `fare.title` | FARE BREAKDOWN | បំបែកតម្លៃ |
| `fare.perKm` | {km} km × ${rate}/km | {km} គម × ${rate}/គម |
| `fare.seatMultiplier` | × {n} seats | × {n} កៅអី |
| `fare.perSeatTimes` | ${price} per seat × {n} seats | ${price} ក្នុងមួយកៅអី × {n} កៅអី |
| `payment.bank` | ABA Bank | ABA Bank |
| `payment.subtitle` | Pay with your ABA Account | បង់ប្រាក់ដោយគណនី ABA របស់អ្នក |
| `payment.pay` | Pay ${amount} with ABA | បង់ ${amount} តាម ABA |
| `payment.failed` | Payment failed. Please try again. | ការបង់ប្រាក់មិនជោគជ័យ។ សូមព្យាយាមម្តងទៀត។ |
| `payment.error` | Something went wrong. Please try again. | មានបញ្ហាកើតឡើង។ សូមព្យាយាមម្តងទៀត។ |
| `payment.createFailed` | Could not create booking. | មិនអាចបង្កើតការកក់បានទេ។ |

## 11. Booking confirmed

| Key | English | Khmer |
|---|---|---|
| `confirmed.title` | Booking Confirmed! | ការកក់ជោគជ័យ! |
| `confirmed.subtitle` | Your seat is reserved. Show your ticket to the driver when boarding. | កៅអីរបស់អ្នកត្រូវបានកក់។ សូមបង្ហាញសំបុត្រទៅអ្នកបើកបរពេលឡើងជិះ។ |
| `confirmed.subtitleDated` | Your seat is reserved for {date}. Show your ticket when boarding. | កៅអីរបស់អ្នកត្រូវបានកក់សម្រាប់ថ្ងៃទី {date}។ សូមបង្ហាញសំបុត្រពេលឡើងជិះ។ |
| `confirmed.showId` | Show this ID to the driver when boarding | បង្ហាញលេខនេះទៅអ្នកបើកបរពេលឡើងជិះ |
| `confirmed.track` | Track My Bus | តាមដានឡានរបស់ខ្ញុំ |
| `confirmed.viewAll` | View All Bookings | មើលការកក់ទាំងអស់ |
| `confirmed.searchMore` | Search More Buses | ស្វែងរកឡានបន្ថែម |
| `ticket.showQr` | Show ticket and QR code | បង្ហាញសំបុត្រ និងកូដ QR |

## 12. Tracking the bus

| Key | English | Khmer |
|---|---|---|
| `track.arrivingIn` | Arriving in | មកដល់ក្នុងរយៈពេល |
| `track.min` | min | នាទី |
| `track.yourDriver` | YOUR DRIVER | អ្នកបើកបររបស់អ្នក |
| `track.callDriver` | Call driver | ហៅអ្នកបើកបរ |
| `track.messageDriver` | Message driver | ផ្ញើសារទៅអ្នកបើកបរ |
| `track.tripDetails` | Trip details | ព័ត៌មានដំណើរ |
| `track.toDestination` | to {destination} | ទៅ {destination} |
| `track.distanceLeft` | Distance left | ចម្ងាយនៅសល់ |
| `track.verifying` | Driver is verifying your ticket | អ្នកបើកបរកំពុងផ្ទៀងផ្ទាត់សំបុត្ររបស់អ្នក |
| `track.showToDriver` | Show {ticketId} to the driver. | បង្ហាញ {ticketId} ទៅអ្នកបើកបរ។ |
| `track.approved` | Ticket approved — you're on board | សំបុត្រត្រូវបានយល់ព្រម — អ្នកបានឡើងជិះហើយ |
| `track.starting` | Starting your trip… | កំពុងចាប់ផ្តើមដំណើររបស់អ្នក… |
| `track.cancelBooking` | Cancel Booking | បោះបង់ការកក់ |
| `track.cancelConfirm` | Cancel this booking? | បោះបង់ការកក់នេះ? |
| `track.cancelWarning` | This can't be undone. Your seat will be released. | មិនអាចត្រឡប់វិញបានទេ។ កៅអីរបស់អ្នកនឹងត្រូវបានដោះលែង។ |
| `track.cancelYes` | Yes, cancel booking | បាទ/ចាស បោះបង់ការកក់ |
| `track.keepBooking` | Keep booking | រក្សាការកក់ទុក |
| `track.cancelFailed` | Couldn't cancel this booking. Please try again. | មិនអាចបោះបង់ការកក់នេះបានទេ។ សូមព្យាយាមម្តងទៀត។ |
| `track.loadFailed` | Couldn't load this booking. It may not exist. | មិនអាចទាញយកការកក់នេះបានទេ។ វាប្រហែលមិនមានទេ។ |
| `track.wrongAccount` | This booking belongs to a different account. | ការកក់នេះជារបស់គណនីផ្សេង។ |
| `track.recenter` | Recenter to my location | ត្រឡប់ទៅទីតាំងរបស់ខ្ញុំ |

## 13. On trip and rating

| Key | English | Khmer |
|---|---|---|
| `ontrip.inProgress` | Trip in progress | ដំណើរកំពុងបន្ត |
| `ontrip.onTheWay` | On the way to {destination} | កំពុងធ្វើដំណើរទៅ {destination} |
| `banner.companyOnWay` | {company} is on the way | {company} កំពុងមកដល់ |
| `banner.tapLiveTrip` | tap to view live trip | ចុចដើម្បីមើលដំណើរផ្ទាល់ |
| `banner.kmAwayTapTrack` | {km} km away · tap to track | នៅ {km} គម · ចុចដើម្បីតាមដាន |
| `ontrip.kmLeft` | {km} km left | នៅសល់ {km} គម |
| `ontrip.arrivedAt` | Arrived at {destination} | បានមកដល់ {destination} |
| `ontrip.backToBookings` | Back to bookings | ត្រឡប់ទៅការកក់ |
| `ontrip.myBookings` | My Bookings | ការកក់របស់ខ្ញុំ |
| `ontrip.recenter` | Recenter to the bus | ត្រឡប់ទៅឡាន |
| `ontrip.dropoffStation` | Drop-off station | ស្ថានីយចុះ |
| `ontrip.loadFailed` | Couldn't load your trip. It may no longer exist. | មិនអាចទាញយកដំណើររបស់អ្នកបានទេ។ វាប្រហែលលែងមានហើយ។ |
| `ontrip.wrongAccount` | This trip belongs to a different account. | ដំណើរនេះជារបស់គណនីផ្សេង។ |
| `rate.title` | How was your trip with {company}? | តើដំណើររបស់អ្នកជាមួយ {company} យ៉ាងណាដែរ? |
| `rate.comment` | Add a comment (optional) | បន្ថែមមតិ (ស្រេចចិត្ត) |
| `rate.thanks` | Thanks for the rating | អរគុណសម្រាប់ការវាយតម្លៃ |
| `rate.submit` | Submit rating | ផ្ញើការវាយតម្លៃ |
| `rate.saveFailed` | Couldn't save your review. Please try again. | មិនអាចរក្សាទុកមតិរបស់អ្នកបានទេ។ សូមព្យាយាមម្តងទៀត។ |

## 14. My bookings

| Key | English | Khmer |
|---|---|---|
| `bookings.title` | My bookings | ការកក់របស់ខ្ញុំ |
| `bookings.subtitle` | Your tickets, past and present. | សំបុត្ររបស់អ្នក ទាំងអតីត និងបច្ចុប្បន្ន។ |
| `bookings.current` | Current Bookings | ការកក់បច្ចុប្បន្ន |
| `bookings.history` | History | ប្រវត្តិ |
| `bookings.noneCurrent` | No current bookings yet. | មិនទាន់មានការកក់បច្ចុប្បន្នទេ។ |
| `bookings.nonePast` | No past bookings yet. | មិនទាន់មានប្រវត្តិកក់ទេ។ |
| `bookings.loadFailed` | Couldn't load your bookings. Check your connection and try again. | មិនអាចទាញយកការកក់របស់អ្នកបានទេ។ សូមពិនិត្យអ៊ីនធឺណិត រួចព្យាយាមម្តងទៀត។ |
| `bookings.cancelFailed` | Couldn't cancel this booking. Please try again. | មិនអាចបោះបង់ការកក់នេះបានទេ។ សូមព្យាយាមម្តងទៀត។ |
| `bookings.cancelConfirm` | Cancel this booking? | បោះបង់ការកក់នេះ? |
| `bookings.cancelYes` | Yes, cancel | បាទ/ចាស បោះបង់ |
| `bookings.keep` | Keep | រក្សាទុក |
| `bookings.track` | Track | តាមដាន |
| `bookings.viewTrip` | View trip | មើលដំណើរ |
| `bookings.scheduled` | Scheduled | មានកាលវិភាគ |
| `bookings.completed` | Completed | បានបញ្ចប់ |
| `bookings.cancelled` | Cancelled | បានបោះបង់ |
| `bookings.confirmed` | Confirmed | បានបញ្ជាក់ |
| `extras.tripDetails` | Trip details | ព័ត៌មានដំណើរ |
| `extras.booked` | Booked | បានកក់ |
| `extras.driverAccepted` | Driver accepted | អ្នកបើកបរបានទទួល |
| `extras.arrived` | Arrived | បានមកដល់ |
| `extras.rateTrip` | Rate this trip | វាយតម្លៃដំណើរនេះ |
| `extras.reviewed` | Reviewed | បានវាយតម្លៃ |
| `extras.commentPlaceholder` | Anything worth mentioning? (optional) | មានអ្វីចង់និយាយបន្ថែមទេ? (ស្រេចចិត្ត) |
| `extras.submitReview` | Submit review | ផ្ញើមតិ |
| `activeBooking.title` | You already have a bus on the way | អ្នកមានឡានកំពុងមកទទួលរួចហើយ |
| `activeBooking.view` | View my booking | មើលការកក់របស់ខ្ញុំ |
| `activeBooking.scheduled` | Book a scheduled ticket | កក់សំបុត្រតាមកាលវិភាគ |

## 15. Inbox and chat

| Key | English | Khmer |
|---|---|---|
| `inbox.title` | Inbox | សារ |
| `inbox.empty` | Nothing here yet. | មិនទាន់មានអ្វីនៅទីនេះទេ។ |
| `inbox.noMessages` | No messages yet. | មិនទាន់មានសារទេ។ |
| `inbox.messagesTab` | Messages | សារ |
| `inbox.notificationsTab` | Notifications | ការជូនដំណឹង |
| `inbox.itemCount` | {n} items | {n} ធាតុ |
| `inbox.messagesHint` | Message your driver from the tracking screen and the conversation shows up here. | ផ្ញើសារទៅអ្នកបើកបរពីអេក្រង់តាមដាន នោះការសន្ទនានឹងបង្ហាញនៅទីនេះ។ |
| `inbox.gone` | This conversation is no longer available. | ការសន្ទនានេះលែងមានហើយ។ |
| `inbox.statusApproaching` | Vehicle Approaching | យានយន្តកំពុងខិតជិត |
| `inbox.statusConfirmed` | Booking Confirmed | ការកក់បានបញ្ជាក់ |
| `inbox.statusComplete` | Trip Complete | ដំណើរបានបញ្ចប់ |
| `inbox.statusCancelled` | Booking Cancelled | ការកក់បានបោះបង់ |
| `chat.placeholder` | Type a message… | សរសេរសារ… |
| `chat.send` | Send message | ផ្ញើសារ |
| `chat.sendPhoto` | Send a photo | ផ្ញើរូបភាព |
| `chat.takePhoto` | Take a photo | ថតរូប |
| `chat.recordVoice` | Record a voice message | ថតសារជាសំឡេង |
| `chat.stopRecording` | Stop recording | ឈប់ថត |
| `chat.recording` | Recording… | កំពុងថត… |
| `chat.photo` | Photo | រូបភាព |
| `chat.voiceMessage` | Voice message | សារជាសំឡេង |
| `chat.photoFailed` | Couldn't attach that photo. | មិនអាចភ្ជាប់រូបភាពនោះបានទេ។ |
| `chat.micDenied` | Microphone permission was declined. | ការអនុញ្ញាតមីក្រូហ្វូនត្រូវបានបដិសេធ។ |
| `chat.voiceUnsupported` | Voice messages aren't supported on this device. | ឧបករណ៍នេះមិនគាំទ្រសារជាសំឡេងទេ។ |
| `chat.prompt` | Send your driver a message about your pickup. | ផ្ញើសារទៅអ្នកបើកបរអំពីចំណុចទទួលរបស់អ្នក។ |
| `call.calling` | Calling… | កំពុងហៅ… |
| `call.end` | End call | បញ្ចប់ការហៅ |
| `call.mute` | Mute | បិទសំឡេង |
| `call.unmute` | Unmute | បើកសំឡេង |
| `call.speaker` | Speaker on | បើកឧបករណ៍បំពងសំឡេង |
| `call.ended` | Call ended · {duration} | ការហៅបានបញ្ចប់ · {duration} |
| `call.cancelled` | Call cancelled | ការហៅត្រូវបានបោះបង់ |

## 16. Profile and settings

| Key | English | Khmer |
|---|---|---|
| `profile.title` | Profile | គណនី |
| `profile.edit` | Edit profile | កែសម្រួលគណនី |
| `profile.editSubtitle` | Drivers see your name and call this number when they arrive. | អ្នកបើកបរឃើញឈ្មោះរបស់អ្នក ហើយហៅលេខនេះពេលពួកគេមកដល់។ |
| `profile.saveChanges` | Save changes | រក្សាទុកការផ្លាស់ប្តូរ |
| `profile.cancelEditing` | Cancel editing | បោះបង់ការកែសម្រួល |
| `profile.changePhoto` | Change profile photo | ប្តូររូបភាពគណនី |
| `profile.addName` | Add your name | បញ្ចូលឈ្មោះរបស់អ្នក |
| `profile.addPhone` | Add your phone number | បញ្ចូលលេខទូរស័ព្ទរបស់អ្នក |
| `profile.preferences` | Preferences | ការកំណត់ |
| `profile.notifications` | Notifications | ការជូនដំណឹង |
| `profile.language` | Language | ភាសា |
| `profile.english` | English | English |
| `profile.khmer` | Khmer | ខ្មែរ |
| `profile.support` | Support | ជំនួយ |
| `profile.helpSupport` | Help and Support | ជំនួយ និងការគាំទ្រ |
| `profile.termsPrivacy` | Terms and Privacy | លក្ខខណ្ឌ និងឯកជនភាព |
| `profile.logout` | Log out | ចាកចេញ |
| `profile.nameRequired` | Please enter your name. | សូមបញ្ចូលឈ្មោះរបស់អ្នក។ |
| `profile.phoneInvalid` | Enter a valid phone number. | សូមបញ្ចូលលេខទូរស័ព្ទឲ្យបានត្រឹមត្រូវ។ |
| `profile.phoneTaken` | That number is already used by another account. | លេខនេះត្រូវបានប្រើដោយគណនីផ្សេងរួចហើយ។ |
| `profile.saveFailed` | Couldn't save your changes. Please try again. | មិនអាចរក្សាទុកការផ្លាស់ប្តូរបានទេ។ សូមព្យាយាមម្តងទៀត។ |
| `profile.photoFailed` | Couldn't upload your photo. Please try again. | មិនអាចបញ្ចូលរូបភាពបានទេ។ សូមព្យាយាមម្តងទៀត។ |
| `profile.photoNotSaved` | Photo uploaded but couldn't be saved to your profile. | រូបភាពបានបញ្ចូល ប៉ុន្តែមិនអាចរក្សាទុកក្នុងគណនីបានទេ។ |

## 17. Help and Support

| Key | English | Khmer |
|---|---|---|
| `support.title` | Help and Support | ជំនួយ និងការគាំទ្រ |
| `support.stuck` | Stuck at the roadside? | ជាប់គាំងនៅតាមផ្លូវ? |
| `support.stuckBody` | If your bus is late or you cannot find it, call the support line and we will reach the driver for you. | ប្រសិនបើឡានរបស់អ្នកយឺត ឬអ្នករកវាមិនឃើញ សូមទូរស័ព្ទមកលេខជំនួយ ហើយយើងនឹងទាក់ទងអ្នកបើកបរជូនអ្នក។ |
| `support.hours` | Every day, 6:00–22:00 | រៀងរាល់ថ្ងៃ ម៉ោង ៦:០០–២២:០០ |
| `support.commonQuestions` | COMMON QUESTIONS | សំណួរដែលសួរញឹកញាប់ |
| `support.topicPickup` | Pickup points | ចំណុចទទួល |
| `support.topicPickupBody` | Where you can and cannot wait for a bus, and why. | កន្លែងណាដែលអ្នកអាច និងមិនអាចរង់ចាំឡាន និងហេតុអ្វី។ |
| `support.topicTickets` | Tickets and seats | សំបុត្រ និងកៅអី |
| `support.topicTicketsBody` | Ticket IDs, seat numbers and boarding. | លេខសំបុត្រ លេខកៅអី និងការឡើងជិះ។ |
| `support.topicPayments` | Payments | ការបង់ប្រាក់ |
| `support.topicPaymentsBody` | Fares, receipts and how refunds are returned. | តម្លៃ វិក្កយបត្រ និងរបៀបសងប្រាក់វិញ។ |
| `support.topicDriver` | Your driver | អ្នកបើកបររបស់អ្នក |
| `support.topicDriverBody` | Calling or messaging the driver from the app. | ការហៅ ឬផ្ញើសារទៅអ្នកបើកបរពីក្នុងកម្មវិធី។ |
| `support.disclaimer` | BookLan is a booking platform. Journeys are operated by the bus companies listed in the app, who remain responsible for the vehicle, the driver and the journey itself. | BookLan គឺជាវេទិកាកក់សំបុត្រ។ ដំណើរត្រូវបានប្រតិបត្តិដោយក្រុមហ៊ុនឡានក្រុងដែលមានក្នុងកម្មវិធី ដែលនៅតែទទួលខុសត្រូវលើយានយន្ត អ្នកបើកបរ និងដំណើរខ្លួនឯង។ |

### FAQ

| Key | English | Khmer |
|---|---|---|
| `faq.1.q` | How do I get picked up without going to a station? | តើខ្ញុំអាចឲ្យគេមកទទួលដោយមិនចាំបាច់ទៅស្ថានីយបានយ៉ាងដូចម្តេច? |
| `faq.1.a` | Choose where you are going, then drop a pin on the national road that serves it. Buses already running that route will show you as a waiting passenger, and the one you book stops for you at your pin. You need to be standing at the roadside itself — the driver cannot turn off the highway to collect you. | ជ្រើសរើសកន្លែងដែលអ្នកចង់ទៅ រួចដាក់ម្ជុលនៅលើផ្លូវជាតិដែលទៅកន្លែងនោះ។ ឡានដែលកំពុងធ្វើដំណើរតាមផ្លូវនោះនឹងឃើញអ្នកជាអ្នកដំណើររង់ចាំ ហើយឡានដែលអ្នកកក់នឹងឈប់ទទួលអ្នកនៅម្ជុលរបស់អ្នក។ អ្នកត្រូវឈរនៅមាត់ផ្លូវ — អ្នកបើកបរមិនអាចបត់ចេញពីផ្លូវជាតិមកទទួលអ្នកបានទេ។ |
| `faq.2.q` | Why can't I pin my pickup where I want? | ហេតុអ្វីខ្ញុំមិនអាចដាក់ម្ជុលទទួលនៅកន្លែងដែលខ្ញុំចង់បាន? |
| `faq.2.a` | The pin has to sit on a national road that actually serves your destination — a bus to Siem Reap runs National Road 6 and will never pass someone waiting on National Road 2, and it cannot turn off its route onto a side street to reach you. Anywhere along that road works, including where it starts in Phnom Penh. | ម្ជុលត្រូវតែស្ថិតនៅលើផ្លូវជាតិដែលពិតជាទៅដល់គោលដៅរបស់អ្នក — ឡានទៅសៀមរាបធ្វើដំណើរតាមផ្លូវជាតិលេខ ៦ ហើយមិនដែលឆ្លងកាត់អ្នកដែលរង់ចាំនៅផ្លូវជាតិលេខ ២ ទេ ហើយវាក៏មិនអាចបត់ចេញពីផ្លូវទៅផ្លូវតូចដើម្បីមករកអ្នកដែរ។ កន្លែងណាក៏បានតាមបណ្តោយផ្លូវនោះ រួមទាំងកន្លែងដែលវាចាប់ផ្តើមនៅភ្នំពេញផង។ |
| `faq.3.q` | How early should I be at my pickup point? | តើខ្ញុំគួរទៅដល់ចំណុចទទួលមុនប៉ុន្មាន? |
| `faq.3.a` | Be at the roadside by the time the tracking screen says the bus is five minutes away. Drivers wait briefly, but they are carrying passengers who booked ahead and cannot hold up the whole coach. | សូមទៅដល់មាត់ផ្លូវនៅពេលអេក្រង់តាមដានបង្ហាញថាឡាននៅសល់ប្រាំនាទីទៀត។ អ្នកបើកបររង់ចាំបានតែបន្តិចប៉ុណ្ណោះ ព្រោះពួកគេដឹកអ្នកដំណើរដែលបានកក់ជាមុន ហើយមិនអាចធ្វើឲ្យឡានទាំងមូលយឺតបានទេ។ |
| `faq.4.q` | What happens when the bus reaches me? | តើមានអ្វីកើតឡើងពេលឡានមកដល់ខ្ញុំ? |
| `faq.4.a` | Show your Ticket ID to the driver. They check it against their manifest and approve the pickup in their own app, at which point your screen switches to the on-trip view. Your seat number is on the ticket. | បង្ហាញលេខសំបុត្ររបស់អ្នកទៅអ្នកបើកបរ។ គាត់នឹងពិនិត្យវាជាមួយបញ្ជីរបស់គាត់ ហើយយល់ព្រមទទួលក្នុងកម្មវិធីរបស់គាត់ បន្ទាប់មកអេក្រង់របស់អ្នកនឹងប្តូរទៅជាទិដ្ឋភាពកំពុងធ្វើដំណើរ។ លេខកៅអីរបស់អ្នកមាននៅលើសំបុត្រ។ |
| `faq.5.q` | Can I book more than one seat? | តើខ្ញុំអាចកក់ច្រើនជាងមួយកៅអីបានទេ? |
| `faq.5.a` | Yes. Pick every seat you want on the seat map before paying, and all of them appear on a single ticket. The fare shown is the total for the whole booking. | បាទ/ចាស។ ជ្រើសរើសកៅអីទាំងអស់ដែលអ្នកចង់បាននៅលើផែនទីកៅអីមុនពេលបង់ប្រាក់ ហើយវាទាំងអស់នឹងបង្ហាញលើសំបុត្រតែមួយ។ តម្លៃដែលបង្ហាញគឺជាតម្លៃសរុបសម្រាប់ការកក់ទាំងមូល។ |
| `faq.6.q` | Can I cancel, and do I get my money back? | តើខ្ញុំអាចបោះបង់បានទេ ហើយខ្ញុំទទួលបានប្រាក់វិញទេ? |
| `faq.6.a` | You can cancel from the tracking screen at any point before the driver approves your pickup, and the seats go straight back into the pool. Refunds are returned to the card or wallet you paid with and usually appear within three to five working days. | អ្នកអាចបោះបង់ពីអេក្រង់តាមដាននៅពេលណាក៏បាន មុនពេលអ្នកបើកបរយល់ព្រមទទួលអ្នក ហើយកៅអីនឹងត្រឡប់ទៅជាទំនេរវិញភ្លាម។ ប្រាក់នឹងសងត្រឡប់ទៅកាត ឬកាបូបលុយដែលអ្នកបានបង់ ហើយជាធម្មតាមកដល់ក្នុងរយៈពេលបីទៅប្រាំថ្ងៃធ្វើការ។ |
| `faq.7.q` | Why can I only have one pickup booking at a time? | ហេតុអ្វីខ្ញុំអាចមានការកក់ទទួលតាមផ្លូវតែមួយក្នុងពេលតែមួយ? |
| `faq.7.a` | A roadside pickup is a live arrangement between you and one driver. Until that trip finishes or is cancelled, a second one would send two buses to two places for the same passenger. Advance bookings for future dates are not affected. | ការទទួលតាមផ្លូវគឺជាការរៀបចំផ្ទាល់រវាងអ្នក និងអ្នកបើកបរម្នាក់។ រហូតដល់ដំណើរនោះបញ្ចប់ ឬត្រូវបានបោះបង់ ការកក់ទីពីរនឹងបញ្ជូនឡានពីរទៅកន្លែងពីរសម្រាប់អ្នកដំណើរតែម្នាក់។ ការកក់ជាមុនសម្រាប់ថ្ងៃអនាគតមិនរងផលប៉ះពាល់ទេ។ |
| `faq.8.q` | My payment failed but I was charged. | ការបង់ប្រាក់មិនជោគជ័យ ប៉ុន្តែខ្ញុំត្រូវបានកាត់ប្រាក់។ |
| `faq.8.a` | A failed booking never holds your seats, and any amount taken is released automatically by your bank. If it has not returned within five working days, contact us with the Ticket ID and the date and we will trace it. | ការកក់ដែលមិនជោគជ័យមិនដែលកាន់កៅអីរបស់អ្នកទេ ហើយចំនួនទឹកប្រាក់ណាដែលត្រូវបានកាត់ នឹងត្រូវបានដោះលែងដោយស្វ័យប្រវត្តិដោយធនាគាររបស់អ្នក។ ប្រសិនបើវាមិនត្រឡប់មកវិញក្នុងរយៈពេលប្រាំថ្ងៃធ្វើការ សូមទាក់ទងមកយើងជាមួយលេខសំបុត្រ និងកាលបរិច្ឆេទ ហើយយើងនឹងតាមរកវា។ |

## 18. Terms and Privacy

| Key | English | Khmer |
|---|---|---|
| `legal.title` | Terms and Privacy | លក្ខខណ្ឌ និងឯកជនភាព |
| `legal.tabTerms` | Terms of Service | លក្ខខណ្ឌប្រើប្រាស់ |
| `legal.tabPrivacy` | Privacy | ឯកជនភាព |
| `legal.lastUpdated` | Last updated {date} | ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ {date} |
| `legal.footer` | Questions about either document? Reach us from Help and Support. | មានសំណួរអំពីឯកសារណាមួយ? សូមទាក់ទងមកយើងតាមរយៈជំនួយ និងការគាំទ្រ។ |

### Terms sections

| Key | English | Khmer |
|---|---|---|
| `terms.1.h` | 1. What BookLan is | ១. BookLan គឺជាអ្វី |
| `terms.1.a` | BookLan is a booking platform. It lets you reserve a seat on an intercity bus or van and be collected from the roadside instead of a terminal. | BookLan គឺជាវេទិកាកក់សំបុត្រ។ វាអនុញ្ញាតឲ្យអ្នកកក់កៅអីលើឡានក្រុង ឬឡានវ៉ាន់ធ្វើដំណើរឆ្លងខេត្ត ហើយឲ្យគេមកទទួលអ្នកនៅមាត់ផ្លូវជំនួសឲ្យស្ថានីយ។ |
| `terms.1.b` | We do not own or operate any vehicle. Every journey is run by an independent bus company listed in the app, and that company remains responsible for the vehicle, the driver, and the journey itself. Your travel contract is with them; your contract with us covers the booking. | យើងមិនមានកម្មសិទ្ធិ ឬប្រតិបត្តិយានយន្តណាមួយទេ។ រាល់ដំណើរត្រូវបានប្រតិបត្តិដោយក្រុមហ៊ុនឡានក្រុងឯករាជ្យដែលមានក្នុងកម្មវិធី ហើយក្រុមហ៊ុននោះនៅតែទទួលខុសត្រូវលើយានយន្ត អ្នកបើកបរ និងដំណើរខ្លួនឯង។ កិច្ចសន្យាធ្វើដំណើររបស់អ្នកគឺជាមួយពួកគេ ឯកិច្ចសន្យាជាមួយយើងគ្របដណ្តប់តែលើការកក់ប៉ុណ្ណោះ។ |
| `terms.2.h` | 2. Your account | ២. គណនីរបស់អ្នក |
| `terms.2.a` | You need a phone number to use BookLan, because a driver has to be able to reach you when they arrive. Keep it accurate — a booking made against a number that cannot be reached may be cancelled by the driver. | អ្នកត្រូវការលេខទូរស័ព្ទដើម្បីប្រើ BookLan ព្រោះអ្នកបើកបរត្រូវតែអាចទាក់ទងអ្នកបានពេលពួកគេមកដល់។ សូមរក្សាវាឲ្យត្រឹមត្រូវ — ការកក់ដែលប្រើលេខដែលទាក់ទងមិនបាន អាចត្រូវបានបោះបង់ដោយអ្នកបើកបរ។ |
| `terms.2.b` | You are responsible for what happens under your account. One person, one account: do not book on behalf of someone the driver will not be able to identify from the ticket. | អ្នកទទួលខុសត្រូវលើអ្វីដែលកើតឡើងក្រោមគណនីរបស់អ្នក។ មនុស្សម្នាក់ គណនីមួយ៖ សូមកុំកក់ជំនួសអ្នកដទៃដែលអ្នកបើកបរមិនអាចកំណត់អត្តសញ្ញាណពីសំបុត្របាន។ |
| `terms.3.h` | 3. Bookings and pickup points | ៣. ការកក់ និងចំណុចទទួល |
| `terms.3.a` | A pickup point must sit on a national road that serves your destination — a bus only stops where it is already going, and cannot turn off its route to collect you. You can be picked up anywhere along that road, including where it begins in Phnom Penh. | ចំណុចទទួលត្រូវតែស្ថិតនៅលើផ្លូវជាតិដែលទៅដល់គោលដៅរបស់អ្នក — ឡានឈប់តែនៅកន្លែងដែលវាទៅរួចហើយ ហើយមិនអាចបត់ចេញពីផ្លូវរបស់វាមកទទួលអ្នកបានទេ។ អ្នកអាចត្រូវបានទទួលនៅកន្លែងណាក៏បានតាមបណ្តោយផ្លូវនោះ រួមទាំងកន្លែងដែលវាចាប់ផ្តើមនៅភ្នំពេញផង។ |
| `terms.3.b` | You may hold one active roadside pickup at a time. Advance bookings for future dates are not limited in this way. | អ្នកអាចមានការទទួលតាមផ្លូវសកម្មតែមួយក្នុងពេលតែមួយ។ ការកក់ជាមុនសម្រាប់ថ្ងៃអនាគតមិនត្រូវបានកំណត់បែបនេះទេ។ |
| `terms.3.c` | Be at your pin before the arrival time shown. Drivers wait briefly but are carrying other passengers and cannot hold the coach. A driver who cannot find you at the pin may mark the pickup as missed. | សូមទៅដល់ម្ជុលរបស់អ្នកមុនម៉ោងមកដល់ដែលបានបង្ហាញ។ អ្នកបើកបររង់ចាំបានតែបន្តិច ព្រោះពួកគេដឹកអ្នកដំណើរផ្សេងទៀត ហើយមិនអាចធ្វើឲ្យឡានយឺតបានទេ។ អ្នកបើកបរដែលរកអ្នកមិនឃើញនៅម្ជុល អាចកត់ត្រាថាខកខានការទទួល។ |
| `terms.4.h` | 4. Fares and payment | ៤. តម្លៃ និងការបង់ប្រាក់ |
| `terms.4.a` | The fare shown before you pay is the total for your booking, including every seat you selected. There are no charges added afterwards. | តម្លៃដែលបង្ហាញមុនពេលអ្នកបង់ប្រាក់គឺជាតម្លៃសរុបសម្រាប់ការកក់របស់អ្នក រួមទាំងកៅអីទាំងអស់ដែលអ្នកបានជ្រើសរើស។ គ្មានការគិតថ្លៃបន្ថែមក្រោយមកទេ។ |
| `terms.4.b` | Payment is taken at the time of booking. Seats are only held once payment succeeds — a failed payment never reserves a seat, and any amount taken on a failed attempt is released by your bank. | ការបង់ប្រាក់ត្រូវបានយកនៅពេលកក់។ កៅអីត្រូវបានកាន់តែនៅពេលការបង់ប្រាក់ជោគជ័យប៉ុណ្ណោះ — ការបង់ប្រាក់ដែលបរាជ័យមិនដែលកក់កៅអីទេ ហើយចំនួនទឹកប្រាក់ណាដែលត្រូវបានយកនឹងត្រូវដោះលែងដោយធនាគាររបស់អ្នក។ |
| `terms.5.h` | 5. Cancellations and refunds | ៥. ការបោះបង់ និងការសងប្រាក់ |
| `terms.5.a` | You can cancel from the tracking screen at any time before the driver approves your pickup. Your seats return to the pool immediately. | អ្នកអាចបោះបង់ពីអេក្រង់តាមដាននៅពេលណាក៏បាន មុនពេលអ្នកបើកបរយល់ព្រមទទួលអ្នក។ កៅអីរបស់អ្នកនឹងត្រឡប់ទៅជាទំនេរវិញភ្លាម។ |
| `terms.5.b` | Refunds go back to the card or wallet used, and normally appear within three to five working days. Once the driver has approved your pickup the journey has begun and the fare is no longer refundable. | ប្រាក់នឹងសងត្រឡប់ទៅកាត ឬកាបូបលុយដែលបានប្រើ ហើយជាធម្មតាមកដល់ក្នុងរយៈពេលបីទៅប្រាំថ្ងៃធ្វើការ។ នៅពេលអ្នកបើកបរបានយល់ព្រមទទួលអ្នករួច ដំណើរបានចាប់ផ្តើមហើយ ហើយតម្លៃលែងអាចសងវិញបានទេ។ |
| `terms.5.c` | If an operator cancels a service, you are refunded in full. | ប្រសិនបើក្រុមហ៊ុនបោះបង់សេវាកម្ម អ្នកនឹងទទួលបានប្រាក់សងវិញពេញលេញ។ |
| `terms.6.h` | 6. Conduct | ៦. ការប្រព្រឹត្ត |
| `terms.6.a` | Follow the operator's rules on board. Drivers may refuse to carry anyone who is abusive, intoxicated, or who cannot produce a valid Ticket ID. | សូមគោរពតាមវិន័យរបស់ក្រុមហ៊ុននៅលើឡាន។ អ្នកបើកបរអាចបដិសេធមិនដឹកអ្នកណាដែលមានអាកប្បកិរិយាឈ្លើយ ស្រវឹង ឬមិនអាចបង្ហាញលេខសំបុត្រត្រឹមត្រូវ។ |
| `terms.6.b` | Do not use BookLan to arrange anything unlawful, and do not misuse the in-app call and message features, which exist so you and your driver can coordinate a pickup. | សូមកុំប្រើ BookLan ដើម្បីរៀបចំអ្វីដែលខុសច្បាប់ ហើយកុំប្រើមុខងារហៅ និងផ្ញើសារក្នុងកម្មវិធីខុសគោលបំណង ដែលមានសម្រាប់ឲ្យអ្នក និងអ្នកបើកបរសម្របសម្រួលការទទួល។ |
| `terms.7.h` | 7. Liability | ៧. ការទទួលខុសត្រូវ |
| `terms.7.a` | We are responsible for the booking service: taking your payment, holding your seat, and passing your pickup details to the operator correctly. | យើងទទួលខុសត្រូវលើសេវាកក់៖ ការទទួលប្រាក់របស់អ្នក ការកាន់កៅអីរបស់អ្នក និងការបញ្ជូនព័ត៌មានទទួលរបស់អ្នកទៅក្រុមហ៊ុនឲ្យបានត្រឹមត្រូវ។ |
| `terms.7.b` | We are not responsible for the operation of the journey — delays, road conditions, vehicle condition, or the conduct of a driver are matters for the operator, though we will help you raise them. | យើងមិនទទួលខុសត្រូវលើការប្រតិបត្តិដំណើរទេ — ការយឺតយ៉ាវ ស្ថានភាពផ្លូវ ស្ថានភាពយានយន្ត ឬការប្រព្រឹត្តរបស់អ្នកបើកបរ គឺជាបញ្ហារបស់ក្រុមហ៊ុន ទោះបីជាយើងនឹងជួយអ្នកលើកបញ្ហាទាំងនោះក៏ដោយ។ |
| `terms.7.c` | Nothing here removes any right you have under Cambodian consumer law. | គ្មានអ្វីនៅទីនេះដកហូតសិទ្ធិណាមួយដែលអ្នកមានក្រោមច្បាប់ការពារអ្នកប្រើប្រាស់កម្ពុជាទេ។ |
| `terms.8.h` | 8. Changes | ៨. ការផ្លាស់ប្តូរ |
| `terms.8.a` | If we change these terms we will show you the new version in the app before your next booking. Continuing to book after that means you accept them. | ប្រសិនបើយើងផ្លាស់ប្តូរលក្ខខណ្ឌទាំងនេះ យើងនឹងបង្ហាញកំណែថ្មីក្នុងកម្មវិធីមុនការកក់លើកក្រោយរបស់អ្នក។ ការបន្តកក់បន្ទាប់ពីនោះមានន័យថាអ្នកទទួលយកវា។ |

### Privacy sections

| Key | English | Khmer |
|---|---|---|
| `privacy.summary` | The short version: we collect what a driver needs to find you, share it only with the operator of the trip you booked, and read your location only while you are actually using the map. | សេចក្តីសង្ខេប៖ យើងប្រមូលតែអ្វីដែលអ្នកបើកបរត្រូវការដើម្បីរកអ្នក ចែករំលែកវាតែជាមួយក្រុមហ៊ុនដែលអ្នកបានកក់ ហើយអានទីតាំងរបស់អ្នកតែពេលអ្នកកំពុងប្រើផែនទីប៉ុណ្ណោះ។ |
| `privacy.1.h` | What we collect | អ្វីដែលយើងប្រមូល |
| `privacy.1.a` | Your name, phone number, and profile photo if you add one. Your name and number are shared with the driver of a trip you have booked so they can find and contact you. | ឈ្មោះ លេខទូរស័ព្ទ និងរូបភាពគណនីរបស់អ្នក ប្រសិនបើអ្នកបញ្ចូល។ ឈ្មោះ និងលេខរបស់អ្នកត្រូវបានចែករំលែកជាមួយអ្នកបើកបរនៃដំណើរដែលអ្នកបានកក់ ដើម្បីឲ្យគាត់អាចរក និងទាក់ទងអ្នកបាន។ |
| `privacy.1.b` | Your bookings: routes, seats, ticket IDs, fares, and their status. | ការកក់របស់អ្នក៖ ផ្លូវ កៅអី លេខសំបុត្រ តម្លៃ និងស្ថានភាពរបស់វា។ |
| `privacy.1.c` | Your pickup location — the point you pin, and your device location while you are being tracked to a pickup. | ទីតាំងទទួលរបស់អ្នក — ចំណុចដែលអ្នកដាក់ម្ជុល និងទីតាំងឧបករណ៍របស់អ្នកពេលកំពុងតាមដានការមកទទួល។ |
| `privacy.2.h` | What we do not collect | អ្វីដែលយើងមិនប្រមូល |
| `privacy.2.a` | We do not store your card details. Payments are handled by our payment provider, and the app never sees the full card number. | យើងមិនរក្សាទុកព័ត៌មានកាតរបស់អ្នកទេ។ ការបង់ប្រាក់ត្រូវបានដោះស្រាយដោយអ្នកផ្តល់សេវាបង់ប្រាក់របស់យើង ហើយកម្មវិធីមិនដែលឃើញលេខកាតពេញលេញទេ។ |
| `privacy.2.b` | We do not track your location in the background. Location is read while you are pinning a pickup or watching a bus approach, and not otherwise. | យើងមិនតាមដានទីតាំងរបស់អ្នកនៅផ្ទៃខាងក្រោយទេ។ ទីតាំងត្រូវបានអានតែពេលអ្នកកំពុងដាក់ម្ជុលទទួល ឬកំពុងមើលឡានខិតជិតប៉ុណ្ណោះ។ |
| `privacy.3.h` | Who sees it | អ្នកណាឃើញវា |
| `privacy.3.a` | The operator of a trip you have booked sees your name, phone number, seat numbers, and pickup point — the details needed to collect you. | ក្រុមហ៊ុននៃដំណើរដែលអ្នកបានកក់ឃើញឈ្មោះ លេខទូរស័ព្ទ លេខកៅអី និងចំណុចទទួលរបស់អ្នក — ព័ត៌មានដែលត្រូវការដើម្បីមកទទួលអ្នក។ |
| `privacy.3.b` | Other passengers see nothing about you. We do not sell personal data, and we do not share it for advertising. | អ្នកដំណើរផ្សេងទៀតមិនឃើញអ្វីអំពីអ្នកទេ។ យើងមិនលក់ទិន្នន័យផ្ទាល់ខ្លួន ហើយក៏មិនចែករំលែកវាសម្រាប់ការផ្សាយពាណិជ្ជកម្មដែរ។ |
| `privacy.4.h` | How long we keep it | យើងរក្សាទុករយៈពេលប៉ុន្មាន |
| `privacy.4.a` | Booking records are kept for three years, which covers refunds, disputes, and the operators' own accounting obligations. | កំណត់ត្រាការកក់ត្រូវបានរក្សាទុករយៈពេលបីឆ្នាំ ដែលគ្របដណ្តប់លើការសងប្រាក់ វិវាទ និងកាតព្វកិច្ចគណនេយ្យរបស់ក្រុមហ៊ុន។ |
| `privacy.4.b` | Pickup locations are kept with the booking they belong to and are not used to build a movement history. | ទីតាំងទទួលត្រូវបានរក្សាទុកជាមួយការកក់ដែលវាជាកម្មសិទ្ធិ ហើយមិនត្រូវបានប្រើដើម្បីបង្កើតប្រវត្តិចលនាទេ។ |
| `privacy.5.h` | Your choices | ជម្រើសរបស់អ្នក |
| `privacy.5.a` | You can edit your name, phone number, and photo at any time from the Profile screen. | អ្នកអាចកែឈ្មោះ លេខទូរស័ព្ទ និងរូបភាពរបស់អ្នកនៅពេលណាក៏បានពីអេក្រង់គណនី។ |
| `privacy.5.b` | You can ask us to delete your account and personal data by contacting support. Completed booking records may be retained where an operator or the law requires it, with your details removed. | អ្នកអាចស្នើឲ្យយើងលុបគណនី និងទិន្នន័យផ្ទាល់ខ្លួនរបស់អ្នកដោយទាក់ទងផ្នែកជំនួយ។ កំណត់ត្រាការកក់ដែលបានបញ្ចប់អាចត្រូវបានរក្សាទុក នៅពេលក្រុមហ៊ុន ឬច្បាប់តម្រូវ ដោយព័ត៌មានរបស់អ្នកត្រូវបានដកចេញ។ |

## 19. Province descriptions (search results)

| Key | English | Khmer |
|---|---|---|
| `prov.banteayMeanchey.note` | Poipet and the Thai border | ប៉ោយប៉ែត និងព្រំដែនថៃ |
| `prov.battambang.note` | Colonial streets, rice country | ផ្លូវបុរាណ ដីស្រែ |
| `prov.kampongCham.note` | Mekong riverside town | ទីក្រុងមាត់ទន្លេមេគង្គ |
| `prov.kampongChhnang.note` | Floating villages on the Tonle Sap | ភូមិអណ្តែតលើទន្លេសាប |
| `prov.kampongSpeu.note` | Kirirom pines and palm sugar | ស្រល់គីរីរម្យ និងស្ករត្នោត |
| `prov.kampongThom.note` | Sambor Prei Kuk temples | ប្រាសាទសំបូរព្រៃគុក |
| `prov.kampot.note` | Riverside and pepper farms | មាត់ទន្លេ និងចម្ការម្រេច |
| `prov.kandal.note` | Ringing Phnom Penh, silk island | ព័ទ្ធជុំវិញភ្នំពេញ កោះសូត្រ |
| `prov.kep.note` | Crab market and the coast | ផ្សារក្តាម និងឆ្នេរសមុទ្រ |
| `prov.kohKong.note` | Mangroves and the Cardamoms | ព្រៃកោងកាង និងជួរភ្នំក្រវាញ |
| `prov.kratie.note` | Mekong river dolphins | ផ្សោតទន្លេមេគង្គ |
| `prov.mondulkiri.note` | Highlands, waterfalls, elephants | ខ្ពង់រាប ទឹកធ្លាក់ ដំរី |
| `prov.oddarMeanchey.note` | Northern border, Preah Vihear road | ព្រំដែនខាងជើង ផ្លូវព្រះវិហារ |
| `prov.pailin.note` | Gem country on the Thai border | ដែនត្បូង នៅព្រំដែនថៃ |
| `prov.phnomPenh.note` | The capital | រាជធានី |
| `prov.preahVihear.note` | Cliff-top temple on the escarpment | ប្រាសាទលើកំពូលភ្នំ |
| `prov.preyVeng.note` | Southeast farmland | ដីកសិកម្មភាគអាគ្នេយ៍ |
| `prov.pursat.note` | Gateway to the Cardamom range | ច្រកចូលជួរភ្នំក្រវាញ |
| `prov.ratanakiri.note` | Crater lake and red earth roads | បឹងភ្នំភ្លើង និងផ្លូវដីក្រហម |
| `prov.siemReap.note` | Angkor Wat and the temples | អង្គរវត្ត និងប្រាសាទនានា |
| `prov.sihanoukville.note` | Beaches and the islands | ឆ្នេរសមុទ្រ និងកោះនានា |
| `prov.stungTreng.note` | Mekong rapids near the Lao border | ល្បាក់ទន្លេមេគង្គ ជិតព្រំដែនឡាវ |
| `prov.svayRieng.note` | Southeast, toward the border | ភាគអាគ្នេយ៍ ឆ្ពោះទៅព្រំដែន |
| `prov.takeo.note` | Temple country, south | ដែនប្រាសាទ ភាគខាងត្បូង |
| `prov.tbongKhmum.note` | Rubber plantations east of the Mekong | ចម្ការកៅស៊ូខាងកើតទន្លេមេគង្គ |

## 20. Province names — only if you answer YES to decision #1

The English stays as the database key; this is display only.

| Key | English | Khmer |
|---|---|---|
| `province.BanteayMeanchey` | Banteay Meanchey | បន្ទាយមានជ័យ |
| `province.Battambang` | Battambang | បាត់ដំបង |
| `province.KampongCham` | Kampong Cham | កំពង់ចាម |
| `province.KampongChhnang` | Kampong Chhnang | កំពង់ឆ្នាំង |
| `province.KampongSpeu` | Kampong Speu | កំពង់ស្ពឺ |
| `province.KampongThom` | Kampong Thom | កំពង់ធំ |
| `province.Kampot` | Kampot | កំពត |
| `province.Kandal` | Kandal | កណ្តាល |
| `province.Kep` | Kep | កែប |
| `province.KohKong` | Koh Kong | កោះកុង |
| `province.Kratie` | Kratie | ក្រចេះ |
| `province.Mondulkiri` | Mondulkiri | មណ្ឌលគិរី |
| `province.OddarMeanchey` | Oddar Meanchey | ឧត្តរមានជ័យ |
| `province.Pailin` | Pailin | ប៉ៃលិន |
| `province.PhnomPenh` | Phnom Penh | ភ្នំពេញ |
| `province.PreahVihear` | Preah Vihear | ព្រះវិហារ |
| `province.PreyVeng` | Prey Veng | ព្រៃវែង |
| `province.Pursat` | Pursat | ពោធិ៍សាត់ |
| `province.Ratanakiri` | Ratanakiri | រតនគិរី |
| `province.SiemReap` | Siem Reap | សៀមរាប |
| `province.Sihanoukville` | Sihanoukville | ក្រុងព្រះសីហនុ |
| `province.StungTreng` | Stung Treng | ស្ទឹងត្រែង |
| `province.SvayRieng` | Svay Rieng | ស្វាយរៀង |
| `province.Takeo` | Takeo | តាកែវ |
| `province.TbongKhmum` | Tbong Khmum | ត្បូងឃ្មុំ |

## 21. National roads

| Key | English | Khmer |
|---|---|---|
| `road.NR1` | National Road 1 | ផ្លូវជាតិលេខ ១ |
| `road.NR2` | National Road 2 | ផ្លូវជាតិលេខ ២ |
| `road.NR3` | National Road 3 | ផ្លូវជាតិលេខ ៣ |
| `road.NR4` | National Road 4 | ផ្លូវជាតិលេខ ៤ |
| `road.NR5` | National Road 5 | ផ្លូវជាតិលេខ ៥ |
| `road.NR6` | National Road 6 | ផ្លូវជាតិលេខ ៦ |
| `road.NR7` | National Road 7 | ផ្លូវជាតិលេខ ៧ |

## 22. Demo review text (placeholder reviews)

Only shown for a company with no real reviews yet. Translate or drop — your call.

| Key | English | Khmer |
|---|---|---|
| `demoReview.1` | Very clean bus and the driver was on time. Comfortable ride! | ឡានស្អាតណាស់ ហើយអ្នកបើកបរមកទាន់ម៉ោង។ ធ្វើដំណើរស្រួល! |
| `demoReview.2` | Good AC and WiFi worked most of the way. Recommend. | ម៉ាស៊ីនត្រជាក់ល្អ ហើយ WiFi ដំណើរការស្ទើរតែពេញផ្លូវ។ សូមណែនាំ។ |
| `demoReview.3` | Driver picked me up right where I dropped the pin. Easy. | អ្នកបើកបរមកទទួលខ្ញុំត្រង់កន្លែងដែលខ្ញុំដាក់ម្ជុល។ ងាយស្រួល។ |
| `demoReview.4` | Seats were comfortable, arrived about 15 minutes early. | កៅអីស្រួល មកដល់មុនម៉ោងប្រហែល ១៥ នាទី។ |
| `policy.1` | Free cancellation up to 1 hour before departure (10% fee after) | បោះបង់ដោយឥតគិតថ្លៃរហូតដល់ ១ ម៉ោងមុនចេញដំណើរ (គិតថ្លៃ ១០% ក្រោយពីនោះ) |
| `policy.2` | 1 large luggage + 1 carry-on included per seat | អាចយកឥវ៉ាន់ធំ ១ + ឥវ៉ាន់តូច ១ ក្នុងមួយកៅអី |
| `policy.3` | No smoking on board · Pets not allowed | ហាមជក់បារីលើឡាន · មិនអនុញ្ញាតឲ្យយកសត្វចិញ្ចឹម |

## 23. Errors seen across several screens

| Key | English | Khmer |
|---|---|---|
| `error.generic` | Something went wrong. Please try again. | មានបញ្ហាកើតឡើង។ សូមព្យាយាមម្តងទៀត។ |
| `error.connection` | Check your connection and try again. | សូមពិនិត្យអ៊ីនធឺណិត រួចព្យាយាមម្តងទៀត។ |
| `error.notConfigured` | ABA Bank payments are not configured. | ការបង់ប្រាក់តាម ABA Bank មិនទាន់ត្រូវបានកំណត់ទេ។ |
| `error.declined` | ABA Bank declined the request. | ABA Bank បានបដិសេធសំណើ។ |
| `error.unreachable` | Could not reach ABA Bank. Please try again. | មិនអាចភ្ជាប់ទៅ ABA Bank បានទេ។ សូមព្យាយាមម្តងទៀត។ |
