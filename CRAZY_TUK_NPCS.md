# Crazy Tuk — NPC Persona Bible

## 0. Purpose

This document defines the recurring passenger characters who make **Crazy Tuk** feel like a living Bangkok.

The NPC system is intentionally lightweight:

- no runtime LLM required,
- no deep simulation,
- no complex relationship system.

Each NPC is a reusable authored persona with:
- a strong one-line identity,
- a recognizable attitude,
- preferred location categories,
- short contextual dialogue pools,
- review/comment templates.

For the one-day MVP, only a small subset needs to be implemented.

Target final library:

```text
30 recurring NPC personas
```

Recommended MVP subset:

```text
5–8 NPCs
```

---

# 1. NPC Design Goal

NPCs should make ordinary game states funny.

The same mechanical event:

```text
PLAYER STALLED FOR 12 MINUTES
```

should feel different depending on the passenger.

Examples:

Auntie:
> "I told you to get gas."

Tourist:
> "Is this part of the tour?"

Degen:
> "Bullish on this driver."

Hi-so passenger:
> "Unacceptable."

The NPC personality is primarily a **writing layer over game telemetry**.

---

# 2. NPC Data Schema

Recommended structure:

```text
id
name
displayName
ageOrVibe
avatarKey

oneLineBio
personalityArchetype
toneTags[]

preferredZones[]
preferredLocationCategories[]
rareDestinationTags[]

pickupLines[]
drivingLines[]
shortStallLines[]
mediumStallLines[]
longStallLines[]
extremeStallLines[]

cleanTripReviews[]
mixedTripReviews[]
badTripReviews[]

airportLines[]
eventLines[]
rescueLines[]

ratingBias
```

Not every field is required for MVP.

---

# 3. MVP-Minimum NPC Schema

For Day 1, each NPC only needs:

```text
id
name
avatar
oneLineBio
preferredCategories[]

pickupLines[2]
stallLines[2]
completionLines[2]
```

Do not author 15+ lines per NPC until the state system works.

---

# 4. Personality Archetypes

Suggested reusable archetypes:

```text
AUNTIE
TOURIST
DEGEN
HI_SO
DJ
OFFICE_WORKER
FITNESS
FOODIE
BUILDER
INFLUENCER
MYSTERIOUS
NIGHTLIFE
STUDENT
EXPAT
UNCLE
```

These are writing aids, not game classes.

---

# 5. Dialogue Triggers

NPC comments should be driven by actual game events.

Core triggers:

```text
ON_PICKUP
ON_DESTINATION_REVEAL
ON_DRIVING
ON_SHORT_STALL
ON_MEDIUM_STALL
ON_LONG_STALL
ON_EXTREME_STALL
ON_REFUEL
ON_COMPLETE
ON_AIRPORT
ON_EVENT_DESTINATION
ON_RESCUE
```

For MVP, only use:

```text
ON_PICKUP
ON_STALL
ON_COMPLETE
```

---

# 6. Stall Timing Buckets

Suggested flavor buckets:

```text
SHORT_STALL      < 5 min
MEDIUM_STALL     5–30 min
LONG_STALL       30–180 min
EXTREME_STALL    3h+
ABSURD_STALL     24h+
```

Gameplay penalty may cap earlier.

Dialogue does not need to cap.

---

# 7. Writing Rules

Every NPC should be:

- readable in one glance,
- funny without requiring lore,
- distinct from the others,
- reusable across many pickup/destination combinations.

Avoid:
- long monologues,
- too many crypto jokes,
- every NPC sounding sarcastic,
- dialogue that requires exact real-world knowledge.

A good line is usually:

```text
3–12 words
```

---

# 8. NPC #1 — Auntie Lek

**Archetype:** AUNTIE
**Vibe:** Retired teacher / neighborhood authority
**Avatar direction:** Older Thai woman, practical blouse, tote bag, unimpressed expression.

**One-line bio:**
Retired teacher. Knows every shortcut and tells you when you're wrong.

**Preferred zones:**
Yaowarat, Old Town, Lumpini, Silom.

**Preferred locations:**
market, food, park, clinic, temple-adjacent, transit.

### Pickup
- "You took long enough."
- "Don't take Sukhumvit."

### Driving
- "Turn here."
- "I know a faster way."

### Short stall
- "Why did you not get gas first?"
- "I knew this would happen."

### Long stall
- "I could have walked."
- "Do you want me to drive?"

### Extreme stall
- "I live here now."
- "My plants are probably dead."

### Clean completion
- "Fine. You did well."
- "Not bad."

### Bad completion
- "Next time I take the train."
- "One star. Maybe two."

### Airport
- "Wrong airport and I will know."

---

# 9. NPC #2 — Dave

**Archetype:** TOURIST
**Vibe:** Friendly backpacker disaster
**Avatar direction:** Sunburned tourist, tank top, backpack, confused smile.

**One-line bio:**
First time in Thailand. Already sunburned.

**Preferred zones:**
Khao San, Old Town, Siam, airports.

**Preferred locations:**
hostel, tourism, street food, nightlife.

### Pickup
- "Hey! You're my ride, right?"
- "Sorry, I think I'm on the wrong street."

### Driving
- "This city is insane."
- "Is that normal?"

### Short stall
- "Uh... are we moving?"
- "Traffic?"

### Long stall
- "My flight is getting close."
- "Should I call someone?"

### Extreme stall
- "My flight left yesterday."
- "I've extended my visa."

### Clean completion
- "Legend. Five stars."
- "That was awesome."

### Bad completion
- "I learned a lot about patience."
- "Interesting transportation experience."

### Airport
- "My flight's in forty minutes."

---

# 10. NPC #3 — Ploy

**Archetype:** OFFICE_WORKER / HI_SO
**Vibe:** PR manager with no available time
**Avatar direction:** Stylish office worker, three phones, iced coffee.

**One-line bio:**
PR manager. Has three phones and no patience.

**Preferred zones:**
Siam, Silom, Sathorn, Thonglor.

**Preferred locations:**
office, cafe, clinic, nightlife, event.

### Pickup
- "I'm already late."
- "Please tell me you're close."

### Driving
- "Can we go faster?"
- "I have another call in ten."

### Short stall
- "Seriously?"
- "Why are we stopped?"

### Long stall
- "This is becoming a crisis."
- "I'm booking another driver."

### Extreme stall
- "The event ended."
- "My campaign launched without me."

### Clean completion
- "Fast. Efficient. Thank you."
- "Saved my life."

### Bad completion
- "Absolutely not."
- "I will be discussing this internally."

### Crypto event
- "I need to be at the meetup before photos."

---

# 11. NPC #4 — P'Bank

**Archetype:** DJ / NIGHTLIFE
**Vibe:** DJ, promoter, possibly still awake from yesterday
**Avatar direction:** Black T-shirt, headphones, one missing shoe.

**One-line bio:**
DJ. Somehow missing one shoe.

**Preferred zones:**
Thonglor, Ekkamai, Charoen Krung, Silom.

**Preferred locations:**
club, music, bar, warehouse, event.

### Pickup
- "Bro. Thank god."
- "Do you know Basement 404?"

### Driving
- "Can you turn this up?"
- "We're making good time."

### Short stall
- "No gas? That's crazy."
- "It's fine, it's fine."

### Long stall
- "Soundcheck was twenty minutes ago."
- "I'm going to miss my own set."

### Extreme stall
- "They replaced me."
- "Honestly, afterparty?"

### Clean completion
- "Perfect. Come to the show."
- "Five stars, bro."

### Bad completion
- "Set was gone by the time I arrived."
- "Driver killed the vibe."

---

# 12. NPC #5 — Crypto Bro

**Archetype:** DEGEN
**Vibe:** In Bangkok for "business"
**Avatar direction:** Hoodie despite heat, hardware wallet lanyard, energy drink.

**One-line bio:**
Here for "business." Nobody knows what business.

**Preferred zones:**
Thonglor, Silom, Based Studio, Siam.

**Preferred locations:**
crypto, coworking, nightlife, cafe, event.

### Pickup
- "Let's cook."
- "Need to make this meetup."

### Driving
- "Bullish route."
- "This shortcut has alpha."

### Short stall
- "Liquidity issue?"
- "Temporary drawdown."

### Long stall
- "Driver rugged me."
- "Still holding."

### Extreme stall
- "I have become the bag."
- "This ride has no exit liquidity."

### Clean completion
- "Absolute alpha."
- "Five stars. Conviction."

### Bad completion
- "Would not bridge again."
- "Exit liquidity experience."

### DFlow / hackathon
- "My demo still works locally."

---

# 13. NPC #6 — Mint

**Archetype:** HI_SO / NIGHTLIFE
**Vibe:** Socialite who says she's going home early
**Avatar direction:** Stylish nightlife look, tiny handbag, sunglasses at night.

**One-line bio:**
Always going home early. Never goes home early.

**Preferred zones:**
Thonglor, Siam, Silom.

**Preferred locations:**
bar, omakase, clinic, club, cafe.

### Pickup
- "Don't tell my friends I'm leaving."
- "Can we go before they see me?"

### Driving
- "Actually... one more stop."
- "This is fine."

### Short stall
- "No."
- "You cannot be serious."

### Long stall
- "I should have stayed at the bar."
- "My friends are posting without me."

### Extreme stall
- "It's morning."
- "I have brunch now."

### Clean completion
- "Cute ride."
- "Five stars."

### Bad completion
- "This is why I use Grab."
- "Never again."

---

# 14. NPC #7 — Uncle Somchai

**Archetype:** UNCLE
**Vibe:** Friendly older man who knows everyone
**Avatar direction:** Polo shirt, sandals, newspaper or plastic bag.

**One-line bio:**
Knows a guy everywhere you go.

**Preferred zones:**
Yaowarat, Chatuchak, Ari, Silom.

**Preferred locations:**
market, food, park, transit, neighborhood shops.

### Pickup
- "Ah, there you are."
- "No rush."

### Driving
- "My friend owns that shop."
- "You hungry?"

### Short stall
- "Engine problem?"
- "Happens."

### Long stall
- "I know a mechanic."
- "Should I call my cousin?"

### Extreme stall
- "My cousin is coming."
- "We could have fixed this yesterday."

### Clean completion
- "Good driver."
- "Very good."

### Bad completion
- "You need maintenance."
- "I have a mechanic for you."

---

# 15. NPC #8 — Beam

**Archetype:** BUILDER
**Vibe:** Hackathon participant running on caffeine
**Avatar direction:** Laptop bag, event wristband, tired eyes.

**One-line bio:**
Builder. Has not slept since deployment started.

**Preferred zones:**
Based Studio, Siam, Silom, Thonglor.

**Preferred locations:**
coworking, crypto events, cafe, convenience store.

### Pickup
- "Demo day. Go."
- "Please don't ask if it's finished."

### Driving
- "I can fix one more bug."
- "Hotspot still works."

### Short stall
- "This feels on brand."
- "Okay. I can code here."

### Long stall
- "I've shipped two fixes."
- "Demo started without me."

### Extreme stall
- "Hackathon ended."
- "We won something?"

### Clean completion
- "You saved the demo."
- "Shipping."

### Bad completion
- "At least I fixed the bug."
- "It still worked locally."

---

# 16. NPC #9 — Mali

**Archetype:** FOODIE / AUNTIE
**Vibe:** Food obsessive with strong opinions
**Avatar direction:** Casual local, food bag, determined expression.

**One-line bio:**
Will cross Bangkok for one specific bowl of noodles.

**Preferred zones:**
Yaowarat, Ari, Old Town, Chatuchak.

**Preferred locations:**
food, market, cafe.

### Pickup
- "They're going to sell out."
- "Drive."

### Driving
- "Not that shop. The good one."
- "Worth the trip."

### Stall
- "The noodles are gone."
- "This is devastating."

### Clean completion
- "We made it!"
- "You eat yet?"

### Bad completion
- "Sold out."
- "One star."

---

# 17. NPC #10 — Ken

**Archetype:** FITNESS
**Vibe:** Gym guy / amateur Muay Thai obsessive
**Avatar direction:** Gym bag, hand wraps, athletic wear.

**One-line bio:**
Has been training Muay Thai for six weeks and mentions it constantly.

**Preferred zones:**
Lumpini, Silom, Sukhumvit.

**Preferred locations:**
muay_thai, gym, park, cafe.

### Pickup
- "Training starts in ten."
- "Coach is going to kill me."

### Driving
- "Cardio day anyway."
- "I should've run."

### Stall
- "I literally could have jogged."
- "This is not zone two."

### Clean completion
- "Perfect timing."
- "Let's go."

### Bad completion
- "Burpees because of you."
- "Coach was furious."

---


# 18. NPC #11 — Jiyoon

**Archetype:** TOURIST / INFLUENCER
**Vibe:** Korean beauty tourist on an aggressively optimized Bangkok itinerary
**Avatar direction:** Polished travel look, shopping bags, portable fan, phone always camera-ready.

**One-line bio:**
Came to Bangkok with a 47-stop beauty, cafe, and shopping itinerary.

**Preferred zones:**
Siam, Thonglor, Ari, Ekkamai.

**Preferred locations:**
beauty, clinic, mall, cafe, photo_spot.

### Pickup
- "Hi! Siam first, please."
- "I have a reservation in twelve minutes."

### Driving
- "Wait, this street is cute."
- "Can you stop where the light is good?"

### Stall
- "My appointment is disappearing."
- "I planned this day to the minute."

### Clean completion
- "Perfect. Thank you!"
- "You saved the itinerary."

### Bad completion
- "I missed my color analysis."
- "The schedule is ruined."

---

# 19. NPC #12 — N'June

**Archetype:** STUDENT
**Vibe:** Thai university student carrying too much stuff and exactly 3% battery
**Avatar direction:** University uniform, tote bag, iced drink, phone charger dangling from bag.

**One-line bio:**
Has class, a group project, dinner plans, and 3% battery.

**Preferred zones:**
Siam, Ari, Ratchada, Chatuchak.

**Preferred locations:**
university, cafe, mall, transit, cheap_food.

### Pickup
- "Please hurry, attendance is strict."
- "My group already hates me."

### Driving
- "Can I charge my phone?"
- "I should have left earlier."

### Stall
- "Okay, now I'm actually dead."
- "My battery and my grade are both gone."

### Clean completion
- "Made it! Thank you!"
- "Five stars. Seriously."

### Bad completion
- "They locked the classroom."
- "I am blaming traffic."

---

# 20. NPC #13 — Max

**Archetype:** BUILDER / STARTUP
**Vibe:** Founder who describes every problem as a growth opportunity
**Avatar direction:** Branded cap, laptop sleeve, wireless earbuds, pitch-deck energy.

**One-line bio:**
Founder. Currently pre-revenue, post-confidence.

**Preferred zones:**
Sathorn, Thonglor, Silom, Siam.

**Preferred locations:**
coworking, investor_meeting, cafe, event, hotel.

### Pickup
- "Big meeting. Let's move."
- "This could change everything."

### Driving
- "We're seeing strong momentum."
- "I can pitch from the tuk-tuk."

### Stall
- "Interesting operational bottleneck."
- "Let's call this an unscheduled pivot."

### Clean completion
- "Huge. Absolutely huge."
- "You are now part of the journey."

### Bad completion
- "We lost the room."
- "Still a valuable learning."

---

# 21. NPC #14 — Nong Fah

**Archetype:** FITNESS
**Vibe:** Actual Muay Thai fighter, unlike Ken
**Avatar direction:** Compact athletic build, fight bag, hand wraps, calm expression.

**One-line bio:**
Professional fighter. Speaks less than Ken and trains much more.

**Preferred zones:**
Lumpini, Ratchada, Sukhumvit, Old Town.

**Preferred locations:**
muay_thai, gym, stadium, food, clinic.

### Pickup
- "Gym. Please."
- "Fight tonight."

### Driving
- "Good route."
- "Keep going."

### Stall
- "I can run from here."
- "Tell me now if we're staying."

### Clean completion
- "Good job."
- "Right on time."

### Bad completion
- "Warm-up started without me."
- "Next time I run."

---

# 22. NPC #15 — Art

**Archetype:** UNCLE / NIGHTLIFE
**Vibe:** Food delivery rider enjoying his one evening off
**Avatar direction:** Delivery jacket tied around waist, helmet under arm, relaxed grin.

**One-line bio:**
Delivers food all week. Tonight someone else is driving.

**Preferred zones:**
Phra Khanong, Ekkamai, Thonglor, Ratchada.

**Preferred locations:**
food, bar, neighborhood, market, home.

### Pickup
- "Finally, I'm the passenger."
- "No delivery bag tonight."

### Driving
- "I know this road too well."
- "Left lane is faster after the light."

### Stall
- "Brother, I do this for a living."
- "Want me to take over?"

### Clean completion
- "Smooth. Respect."
- "Good ride."

### Bad completion
- "My customers wait less than this."
- "Painful, brother."

---

# 23. NPC #16 — Mae Noi

**Archetype:** MYSTERIOUS / AUNTIE
**Vibe:** Fortune teller who is annoyingly unsurprised by everything
**Avatar direction:** Colorful blouse, bracelets, small cloth bag, knowing smile.

**One-line bio:**
Fortune teller. Claims she already knew how this ride would go.

**Preferred zones:**
Old Town, Yaowarat, Phra Athit, Chatuchak.

**Preferred locations:**
temple-adjacent, market, riverside, home, mysterious.

### Pickup
- "You came. Good."
- "I was expecting this tuk-tuk."

### Driving
- "Do not worry about the next turn."
- "Interesting. Very interesting."

### Stall
- "Yes. This was in the cards."
- "We may be here a while."

### Clean completion
- "Exactly on time."
- "As expected."

### Bad completion
- "You ignored the warning."
- "Come see me about your luck."

---

# 24. NPC #17 — Ice

**Archetype:** HI_SO / NIGHTLIFE
**Vibe:** Wedding guest dressed beautifully and catastrophically late
**Avatar direction:** Formal Thai wedding attire, gift envelope, anxious expression.

**One-line bio:**
Has attended twelve weddings this year and been late to eleven.

**Preferred zones:**
Sathorn, Siam, Charoen Krung, riverside.

**Preferred locations:**
hotel, wedding, restaurant, mall, salon.

### Pickup
- "The ceremony started already."
- "Please tell me you know the hotel."

### Driving
- "I still need to sign the envelope."
- "Do I look sweaty?"

### Stall
- "They're taking the group photo now."
- "I am going to arrive during dessert."

### Clean completion
- "I can still make the photo."
- "You are a hero."

### Bad completion
- "They are already married."
- "I missed everything except cake."

---

# 25. NPC #18 — Dr. Patel

**Archetype:** TOURIST / OFFICE_WORKER
**Vibe:** Conference speaker who confidently went to the wrong venue
**Avatar direction:** Conference badge, blazer, rolling laptop case, visibly lost.

**One-line bio:**
Keynote speaker. Unfortunately at the wrong convention center.

**Preferred zones:**
Siam, Queen Sirikit, Sathorn, Silom.

**Preferred locations:**
conference, hotel, coworking, transit, airport.

### Pickup
- "I believe I'm at the wrong building."
- "How quickly can we get there?"

### Driving
- "My panel begins very shortly."
- "The organizers sound concerned."

### Stall
- "They have begun without me."
- "Someone is presenting my slides."

### Clean completion
- "Excellent. I owe you one."
- "Just in time."

### Bad completion
- "My keynote became a breakout session."
- "Remarkable series of events."

---

# 26. NPC #19 — Auntie Orn

**Archetype:** AUNTIE / HI_SO
**Vibe:** Luxury-shopping auntie with zero tolerance for inconvenience
**Avatar direction:** Designer sunglasses, immaculate hair, several shopping bags.

**One-line bio:**
Can identify a fake handbag from across Sukhumvit.

**Preferred zones:**
Siam, Chidlom, Thonglor, Sathorn.

**Preferred locations:**
mall, luxury, salon, restaurant, hotel.

### Pickup
- "Careful with the bags."
- "Central Embassy. Quickly."

### Driving
- "Not through that street."
- "The bags stay dry."

### Stall
- "This is unacceptable transportation."
- "My ice cream is melting."

### Clean completion
- "Acceptable. Five stars."
- "You may drive me again."

### Bad completion
- "I knew I should have called my driver."
- "Never with shopping bags again."

---

# 27. NPC #20 — Fern

**Archetype:** FOODIE / MYSTERIOUS
**Vibe:** Plant collector transporting something increasingly unreasonable
**Avatar direction:** Casual clothes, giant monstera cutting, soil on tote bag.

**One-line bio:**
Owns 83 plants and insists there is room for one more.

**Preferred zones:**
Chatuchak, Ari, Phra Khanong, Old Town.

**Preferred locations:**
plant_shop, market, cafe, home, park.

### Pickup
- "Please don't crush the leaf."
- "It's rare. Be careful."

### Driving
- "Less wind, please."
- "That nursery is good too."

### Stall
- "The roots are drying out."
- "This plant cost more than the ride."

### Clean completion
- "Leaf survived. Five stars."
- "Perfect. Thank you."

### Bad completion
- "It lost a leaf."
- "I need a propagation emergency."

---

# 28. NPC #21 — Nurse May

**Archetype:** OFFICE_WORKER
**Vibe:** Night-shift nurse running entirely on iced coffee and discipline
**Avatar direction:** Scrubs under light jacket, tote bag, tired but alert eyes.

**One-line bio:**
Just finished a twelve-hour shift and wants exactly one thing: home.

**Preferred zones:**
Silom, Sathorn, Ratchada, Phra Khanong.

**Preferred locations:**
hospital, convenience_store, food, transit, home.

### Pickup
- "Home, please."
- "Long night."

### Driving
- "Wake me if we arrive."
- "No, I'm not working tomorrow."

### Stall
- "I have been awake for nineteen hours."
- "Please fix whatever this is."

### Clean completion
- "Thank you. Good night."
- "Five stars. Quiet ride."

### Bad completion
- "I could have slept at the hospital."
- "This shift somehow continued."

---

# 29. NPC #22 — Ton

**Archetype:** INFLUENCER / CREATIVE
**Vibe:** Photographer who sees better light everywhere except the destination
**Avatar direction:** Camera sling, black clothes, two lenses, always looking sideways at light.

**One-line bio:**
Photographer. Cannot pass interesting light without stopping.

**Preferred zones:**
Charoen Krung, Yaowarat, Phra Athit, Siam.

**Preferred locations:**
gallery, event, street, cafe, photo_spot.

### Pickup
- "Don't leave, I'm crossing the street."
- "Camera goes in front."

### Driving
- "Slow down here. The light is insane."
- "Wait, can we circle back?"

### Stall
- "Actually, this location is kind of good."
- "Hold on. Don't move the tuk-tuk."

### Clean completion
- "Nice. Got the shot too."
- "Perfect timing."

### Bad completion
- "At least I got photos."
- "Terrible ride. Great light."

---

# 30. NPC #23 — Nara

**Archetype:** DJ / CREATIVE
**Vibe:** Indie musician hauling one suspiciously fragile synth
**Avatar direction:** Thrifted clothes, small keyboard case, headphones, tote full of cables.

**One-line bio:**
Musician. The synth is worth more than everything else she owns.

**Preferred zones:**
Charoen Krung, Ekkamai, Thonglor, Phra Khanong.

**Preferred locations:**
music, rehearsal, gallery, bar, warehouse.

### Pickup
- "Careful with the synth."
- "Soundcheck was supposed to start now."

### Driving
- "Do you have aux?"
- "No bumps, please."

### Stall
- "I could write a song about this."
- "Soundcheck is becoming theoretical."

### Clean completion
- "Made it. Come to the show."
- "Synth survived. Five stars."

### Bad completion
- "They started without keys."
- "This is going on the album."

---

# 31. NPC #24 — Chris

**Archetype:** OFFICE_WORKER / EXPAT
**Vibe:** Tech recruiter who can turn any conversation into a job pitch
**Avatar direction:** Smart casual, laptop backpack, company lanyard, relentlessly friendly smile.

**One-line bio:**
Recruiter. You are somehow already in his candidate pipeline.

**Preferred zones:**
Sathorn, Asok, Thonglor, Siam.

**Preferred locations:**
office, coworking, cafe, event, hotel.

### Pickup
- "Hey! Great to meet you."
- "Quick ride, then a quick call."

### Driving
- "So what stack do you use?"
- "Are you open to opportunities?"

### Stall
- "No worries. Let's use the time."
- "Tell me about your five-year plan."

### Clean completion
- "Amazing experience. Let's stay connected."
- "I'll send you the role."

### Bad completion
- "Interesting culture fit."
- "We'll keep your profile on file."

---

# 32. NPC #25 — Gary

**Archetype:** EXPAT / UNCLE
**Vibe:** Retired expat who has a story about how Bangkok used to be
**Avatar direction:** Linen shirt, sandals, reading glasses, folded newspaper.

**One-line bio:**
Has lived in Bangkok for twenty years and preferred every neighborhood ten years ago.

**Preferred zones:**
Phra Khanong, Silom, Ari, Old Town.

**Preferred locations:**
pub, food, park, neighborhood, transit.

### Pickup
- "This road used to be empty."
- "I remember when this was all houses."

### Driving
- "Bangkok's changed, you know."
- "There used to be a great bar here."

### Stall
- "Traffic wasn't like this in 2007."
- "Well. Maybe it was."

### Clean completion
- "Good man. Cheers."
- "That'll do nicely."

### Bad completion
- "I could tell you about tuk-tuks in '04."
- "Different city back then."

---

# 33. NPC #26 — Nong Niran

**Archetype:** TEMPLE / STUDENT
**Vibe:** Young novice monk who is much more observant than everyone around him
**Avatar direction:** Thai novice Buddhist monk, around 12–14 years old, shaved head, warm medium-tan Thai skin, simple saffron robes, small cloth shoulder bag. Calm, slightly curious expression.

**One-line bio:**
Young novice monk. Quietly watching Bangkok make questionable decisions.

**Preferred zones:**
Old Town, Yaowarat, Phra Athit, riverside.

**Preferred locations:**
temple, market, park, transit, neighborhood, food.

### Pickup
- "We can go now."
- "No need to hurry."

### Driving
- "Bangkok is very loud today."
- "Have you driven long?"

### Short stall
- "We are stopped."
- "It's okay. I can wait."

### Long stall
- "Maybe we are supposed to be here."
- "You seem more worried than me."

### Extreme stall
- "I think this is my temple now."
- "We have been here a very long time."

### Clean completion
- "Thank you, driver."
- "That was a good trip."

### Bad completion
- "We arrived eventually."
- "Perhaps check the fuel next time."

### Airport
- "I've never been inside."

### Event / unusual destination
- "What is happening here?"

---

# 34. NPC #27 — P'Noi

**Archetype:** STREET_VENDOR / FOODIE
**Vibe:** Street vendor temporarily separated from her cart
**Avatar direction:** Middle-aged Thai woman, deeply tanned from working outdoors, short practical layered haircut, apron over a faded T-shirt, towel over one shoulder, small plastic ingredient bag in hand. Broad, sturdy build and huge personality.

**One-line bio:**
Street-food vendor. Leaving her cart unattended was your first mistake.

**Preferred zones:**
Yaowarat, Silom, Old Town, Chatuchak.

**Preferred locations:**
market, food, wholesale, neighborhood shops, transit.

### Pickup
- "Quick. My sister is watching the cart."
- "You know the market?"

### Driving
- "Not this road!"
- "Morning traffic is worse."

### Short stall
- "Ohhh, no gas?"
- "My customers are waiting."

### Long stall
- "My sister is going to kill me."
- "The lunch crowd is starting."

### Extreme stall
- "I don't have a business anymore."
- "Maybe I open a stall here."

### Clean completion
- "Good! We made it."
- "Come eat later."

### Bad completion
- "Lunch is finished."
- "Next time, I drive."

### Market
- "Stop there. I need chilies."

### Food destination
- "That place? Mine is better."

### Rescue
- "Finally! Someone prepared."

---

# 35. NPC #28 — Alex

**Archetype:** FITNESS / EXPAT
**Vibe:** Padel obsessive who has somehow made the sport his entire personality
**Avatar direction:** Athletic polo, racket bag, headband, sports watch.

**One-line bio:**
Has a padel match in forty minutes. Talks like it's Wimbledon.

**Preferred zones:**
Thonglor, Ekkamai, Sathorn, Sukhumvit.

**Preferred locations:**
padel, gym, cafe, club, condo.

### Pickup
- "Court's booked. We cannot be late."
- "My partner is already warming up."

### Driving
- "I need this win."
- "We're playing the finance guys."

### Stall
- "We're losing court time."
- "They charge by the hour!"

### Clean completion
- "Perfect. Match point."
- "Five stars. Vamos."

### Bad completion
- "They gave our court away."
- "Season ruined."

---

# 36. NPC #29 — P'Chai

**Archetype:** UNCLE / MYSTERIOUS
**Vibe:** Temple volunteer carrying practical supplies and infinite patience
**Avatar direction:** Simple shirt, canvas bag, flowers or offering supplies.

**One-line bio:**
Temple volunteer. Has nowhere urgent to be and somehow still arrives first.

**Preferred zones:**
Old Town, Yaowarat, Phra Athit, riverside.

**Preferred locations:**
temple, market, community, food, riverside.

### Pickup
- "Whenever you're ready."
- "These need to get to the temple."

### Driving
- "No need to rush."
- "Careful at the corner."

### Stall
- "We wait."
- "Maybe there is a reason."

### Clean completion
- "Thank you, driver."
- "Good journey."

### Bad completion
- "A difficult trip. Still, thank you."
- "Next time, more fuel."

---

# 37. NPC #30 — Mr. X

**Archetype:** MYSTERIOUS
**Vibe:** Extremely mysterious businessman whose errands never make sense
**Avatar direction:** Crisp dark suit despite heat, sunglasses, small locked briefcase.

**One-line bio:**
Nobody knows his name, job, or why the briefcase occasionally beeps.

**Preferred zones:**
Sathorn, Yaowarat, Ratchada, Charoen Krung.

**Preferred locations:**
hotel, warehouse, riverside, private_event, mysterious.

### Pickup
- "You are the driver. Good."
- "Do not open the back compartment."

### Driving
- "Take the indirect route."
- "We are not being followed."

### Stall
- "This complicates things."
- "How quickly can you obtain fuel?"

### Clean completion
- "You were never here."
- "Adequate."

### Bad completion
- "Forget this ride occurred."
- "I will make other arrangements."

### Rare destination
- "If anyone asks, you drove Dave."

---

# 38. Recommended MVP NPC Set

For the first playable build, use only:

```text
Auntie Lek
Dave
Ploy
P'Bank
Crypto Bro
```

Why these five:

- immediately distinct,
- cover different Bangkok contexts,
- work with airports,
- work with nightlife,
- work with crypto Easter eggs,
- produce clearly different stall jokes.

If there is time, add:

```text
Mint
Beam
Uncle Somchai
```

---

# 39. Full Cast Coverage

The full authored library now contains **30 recurring NPCs**.

Cast coverage includes:

```text
locals / aunties / uncles
tourists / expats
office workers / students
nightlife / music / creative people
food / fitness / shopping personalities
builders / founders / recruiters
crypto degenerates / temple life / street vendors
community / mysterious characters
```

The roster should remain capped at 30 for the MVP content pass. Add more only after real playtesting reveals a missing voice or destination type.

---

# 40. NPC Review System — Future

Completed fares can generate public reviews.

Review inputs:

```text
npcId
stallDuration
tripDistance
destinationCategory
fareCompleted
rescueStatus
```

Example deterministic mapping:

```text
no stall → good pool
short stall → mixed pool
long stall → bad pool
extreme stall → extreme pool
```

Personality then determines wording.

---

# 41. Global Feed Use

NPC dialogue can later populate the shared feed.

Example:

```text
👵 Auntie Lek → saga.sol ⭐
"I could have walked."
Yaowarat → Airport
```

Or live stall commentary:

```text
👨 Dave
"Is this part of the tour?"
Stranded with 0x82...91 for 12m
```

The social feed is generated from NPC/game events.

Players do not need to write posts.

---

# 42. Character Location Preferences

Post-MVP, each NPC can carry weights.

Example:

```text
Auntie Lek:
Yaowarat 3
Old Town 3
Lumpini 2
Thonglor 0.5
```

This makes recurring characters feel geographically coherent while preserving unusual combinations.

Rare weird combinations are desirable.

Example:

```text
Auntie Lek → Basement 404
```

should be uncommon, not impossible.

---

# 43. Destination Comedy Rule

NPC + destination combinations should occasionally create the joke.

Examples:

```text
Crypto Bro
Face Factory → Superteam meetup
"Don't mention the bandages."
```

```text
Dave
Khao San → Airport
"My flight leaves in 38 minutes."
```

```text
Auntie Lek
Yaowarat → Basement 404
"Don't ask questions. Drive."
```

Avoid fully scripting every combination.

Let the system produce accidental stories.

---

# 44. Avatar Art Direction Stub

Each NPC portrait should:

- read clearly at small mobile-map size,
- have strong silhouette/color separation,
- show personality immediately,
- work as a circular or rounded portrait marker.

Recommended deliverables later:

```text
1 portrait per NPC
optional 2nd expression for stall
```

Do not create full-body animation for passengers.

---

# 45. MVP Acceptance Criteria

NPC system is sufficient for MVP when:

- [ ] At least 5 NPC definitions exist.
- [ ] Each has distinct bio/personality.
- [ ] NPC can spawn as fare.
- [ ] NPC has pickup dialogue.
- [ ] NPC has stall dialogue.
- [ ] NPC has completion dialogue.
- [ ] Dialogue is selected from event context.
- [ ] Destination remains mechanically independent of persona.
- [ ] Same NPC can recur without breaking state.

---

# 46. Content Expansion Rule

Before adding an NPC, ask:

> If this character stalls for 20 minutes, will their reaction be recognizably different from the existing cast?

If not, the persona is probably redundant.

---

# 47. Final Character Tone

Crazy Tuk's passengers should feel like:

> **a recurring cast of Bangkok weirdos, locals, tourists, builders, aunties, nightlife people, and crypto degenerates who happen to be trapped inside the consequences of your DFlow swaps.**

They are not the game mechanic.

They are what makes the mechanic memorable.
