// Crazy Tuk NPC Data
// Playable cast sourced from CRAZY_TUK_NPCS.md.

import { CONFIG, FARE_CONDITION_TYPES } from './config.js';
import { PICKUP_LOCATIONS, DESTINATION_LOCATIONS } from './locations.js?v=20260824world1';

export const NPCs = {
  "auntie-lek": {
    "id": "auntie-lek",
    "name": "Auntie Lek",
    "displayName": "Auntie Lek",
    "avatar": "assets/npc/1.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Older Thai woman, practical blouse, tote bag, unimpressed expression.",
    "bio": "Retired teacher. Knows every shortcut and tells you when you're wrong.",
    "personality": "AUNTIE",
    "ageOrVibe": "Retired teacher / neighborhood authority",
    "preferredZones": [
      "old-city",
      "yaowarat",
      "silom",
      "lumpini"
    ],
    "preferredCategories": [
      "market",
      "food",
      "park",
      "clinic",
      "temple-adjacent",
      "transit"
    ],
    "pickupLines": [
      "You took long enough.",
      "Don't take Sukhumvit."
    ],
    "drivingLines": [
      "Turn here.",
      "I know a faster way."
    ],
    "shortStallLines": [
      "Why did you not get gas first?",
      "I knew this would happen."
    ],
    "mediumStallLines": [],
    "longStallLines": [
      "I could have walked.",
      "Do you want me to drive?"
    ],
    "extremeStallLines": [
      "I live here now.",
      "My plants are probably dead."
    ],
    "stallComments": [
      "Why did you not get gas first?",
      "I knew this would happen.",
      "I could have walked.",
      "Do you want me to drive?",
      "I live here now.",
      "My plants are probably dead."
    ],
    "cleanTripReviews": [
      "Fine. You did well.",
      "Not bad."
    ],
    "badTripReviews": [
      "Next time I take the train.",
      "One star. Maybe two."
    ],
    "completionReviews": [
      "Fine. You did well.",
      "Not bad.",
      "Next time I take the train.",
      "One star. Maybe two."
    ],
    "airportLines": [
      "Wrong airport and I will know."
    ],
    "eventLines": [],
    "rescueLines": []
  },
  "tourist-dave": {
    "id": "tourist-dave",
    "name": "Dave",
    "displayName": "Dave",
    "avatar": "assets/npc/2.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Sunburned tourist, tank top, backpack, confused smile.",
    "bio": "First time in Thailand. Already sunburned.",
    "personality": "TOURIST",
    "ageOrVibe": "Friendly backpacker disaster",
    "preferredZones": [
      "khao-san",
      "old-city",
      "siam",
      "suvarnabhumi"
    ],
    "preferredCategories": [
      "hostel",
      "tourism",
      "street food",
      "nightlife"
    ],
    "pickupLines": [
      "Hey! You're my ride, right?",
      "Sorry, I think I'm on the wrong street."
    ],
    "drivingLines": [
      "This city is insane.",
      "Is that normal?"
    ],
    "shortStallLines": [
      "Uh... are we moving?",
      "Traffic?"
    ],
    "mediumStallLines": [],
    "longStallLines": [
      "My flight is getting close.",
      "Should I call someone?"
    ],
    "extremeStallLines": [
      "My flight left yesterday.",
      "I've extended my visa."
    ],
    "stallComments": [
      "Uh... are we moving?",
      "Traffic?",
      "My flight is getting close.",
      "Should I call someone?",
      "My flight left yesterday.",
      "I've extended my visa."
    ],
    "cleanTripReviews": [
      "Legend. Five stars.",
      "That was awesome."
    ],
    "badTripReviews": [
      "I learned a lot about patience.",
      "Interesting transportation experience."
    ],
    "completionReviews": [
      "Legend. Five stars.",
      "That was awesome.",
      "I learned a lot about patience.",
      "Interesting transportation experience."
    ],
    "airportLines": [
      "My flight's in forty minutes."
    ],
    "eventLines": [],
    "rescueLines": []
  },
  "ploy": {
    "id": "ploy",
    "name": "Ploy",
    "displayName": "Ploy",
    "avatar": "assets/npc/3.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Stylish office worker, three phones, iced coffee.",
    "bio": "PR manager. Has three phones and no patience.",
    "personality": "OFFICE_WORKER / HI_SO",
    "ageOrVibe": "PR manager with no available time",
    "preferredZones": [
      "siam",
      "silom",
      "sathorn",
      "thonglor"
    ],
    "preferredCategories": [
      "office",
      "cafe",
      "clinic",
      "nightlife",
      "event"
    ],
    "pickupLines": [
      "I'm already late.",
      "Please tell me you're close."
    ],
    "drivingLines": [
      "Can we go faster?",
      "I have another call in ten."
    ],
    "shortStallLines": [
      "Seriously?",
      "Why are we stopped?"
    ],
    "mediumStallLines": [],
    "longStallLines": [
      "This is becoming a crisis.",
      "I'm booking another driver."
    ],
    "extremeStallLines": [
      "The event ended.",
      "My campaign launched without me."
    ],
    "stallComments": [
      "Seriously?",
      "Why are we stopped?",
      "This is becoming a crisis.",
      "I'm booking another driver.",
      "The event ended.",
      "My campaign launched without me."
    ],
    "cleanTripReviews": [
      "Fast. Efficient. Thank you.",
      "Saved my life."
    ],
    "badTripReviews": [
      "Absolutely not.",
      "I will be discussing this internally."
    ],
    "completionReviews": [
      "Fast. Efficient. Thank you.",
      "Saved my life.",
      "Absolutely not.",
      "I will be discussing this internally."
    ],
    "airportLines": [],
    "eventLines": [
      "I need to be at the meetup before photos."
    ],
    "rescueLines": []
  },
  "p-bank": {
    "id": "p-bank",
    "name": "P'Bank",
    "displayName": "P'Bank",
    "avatar": "assets/npc/4.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Black T-shirt, headphones, one missing shoe.",
    "bio": "DJ. Somehow missing one shoe.",
    "personality": "DJ / NIGHTLIFE",
    "ageOrVibe": "DJ, promoter, possibly still awake from yesterday",
    "preferredZones": [
      "yaowarat",
      "silom",
      "thonglor"
    ],
    "preferredCategories": [
      "club",
      "music",
      "bar",
      "warehouse",
      "event"
    ],
    "pickupLines": [
      "Bro. Thank god.",
      "Do you know Basement 404?"
    ],
    "drivingLines": [
      "Can you turn this up?",
      "We're making good time."
    ],
    "shortStallLines": [
      "No gas? That's crazy.",
      "It's fine, it's fine."
    ],
    "mediumStallLines": [],
    "longStallLines": [
      "Soundcheck was twenty minutes ago.",
      "I'm going to miss my own set."
    ],
    "extremeStallLines": [
      "They replaced me.",
      "Honestly, afterparty?"
    ],
    "stallComments": [
      "No gas? That's crazy.",
      "It's fine, it's fine.",
      "Soundcheck was twenty minutes ago.",
      "I'm going to miss my own set.",
      "They replaced me.",
      "Honestly, afterparty?"
    ],
    "cleanTripReviews": [
      "Perfect. Come to the show.",
      "Five stars, bro."
    ],
    "badTripReviews": [
      "Set was gone by the time I arrived.",
      "Driver killed the vibe."
    ],
    "completionReviews": [
      "Perfect. Come to the show.",
      "Five stars, bro.",
      "Set was gone by the time I arrived.",
      "Driver killed the vibe."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "crypto-bro": {
    "id": "crypto-bro",
    "name": "Crypto Bro",
    "displayName": "Crypto Bro",
    "avatar": "assets/npc/5.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Hoodie despite heat, hardware wallet lanyard, energy drink.",
    "bio": "Here for \"business.\" Nobody knows what business.",
    "personality": "DEGEN",
    "ageOrVibe": "In Bangkok for \"business\"",
    "preferredZones": [
      "siam",
      "silom",
      "thonglor"
    ],
    "preferredCategories": [
      "crypto",
      "coworking",
      "nightlife",
      "cafe",
      "event"
    ],
    "pickupLines": [
      "Let's cook.",
      "Need to make this meetup."
    ],
    "drivingLines": [
      "Bullish route.",
      "This shortcut has alpha."
    ],
    "shortStallLines": [
      "Liquidity issue?",
      "Temporary drawdown."
    ],
    "mediumStallLines": [],
    "longStallLines": [
      "Driver rugged me.",
      "Still holding."
    ],
    "extremeStallLines": [
      "I have become the bag.",
      "This ride has no exit liquidity."
    ],
    "stallComments": [
      "Liquidity issue?",
      "Temporary drawdown.",
      "Driver rugged me.",
      "Still holding.",
      "I have become the bag.",
      "This ride has no exit liquidity."
    ],
    "cleanTripReviews": [
      "Absolute alpha.",
      "Five stars. Conviction."
    ],
    "badTripReviews": [
      "Would not bridge again.",
      "Exit liquidity experience."
    ],
    "completionReviews": [
      "Absolute alpha.",
      "Five stars. Conviction.",
      "Would not bridge again.",
      "Exit liquidity experience."
    ],
    "airportLines": [],
    "eventLines": [
      "My demo still works locally."
    ],
    "rescueLines": []
  },
  "mint": {
    "id": "mint",
    "name": "Mint",
    "displayName": "Mint",
    "avatar": "assets/npc/6.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Stylish nightlife look, tiny handbag, sunglasses at night.",
    "bio": "Always going home early. Never goes home early.",
    "personality": "HI_SO / NIGHTLIFE",
    "ageOrVibe": "Socialite who says she's going home early",
    "preferredZones": [
      "siam",
      "silom",
      "thonglor"
    ],
    "preferredCategories": [
      "bar",
      "omakase",
      "clinic",
      "club",
      "cafe"
    ],
    "pickupLines": [
      "Don't tell my friends I'm leaving.",
      "Can we go before they see me?"
    ],
    "drivingLines": [
      "Actually... one more stop.",
      "This is fine."
    ],
    "shortStallLines": [
      "No.",
      "You cannot be serious."
    ],
    "mediumStallLines": [],
    "longStallLines": [
      "I should have stayed at the bar.",
      "My friends are posting without me."
    ],
    "extremeStallLines": [
      "It's morning.",
      "I have brunch now."
    ],
    "stallComments": [
      "No.",
      "You cannot be serious.",
      "I should have stayed at the bar.",
      "My friends are posting without me.",
      "It's morning.",
      "I have brunch now."
    ],
    "cleanTripReviews": [
      "Cute ride.",
      "Five stars."
    ],
    "badTripReviews": [
      "This is why I use Grab.",
      "Never again."
    ],
    "completionReviews": [
      "Cute ride.",
      "Five stars.",
      "This is why I use Grab.",
      "Never again."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "uncle-somchai": {
    "id": "uncle-somchai",
    "name": "Uncle Somchai",
    "displayName": "Uncle Somchai",
    "avatar": "assets/npc/7.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Polo shirt, sandals, newspaper or plastic bag.",
    "bio": "Knows a guy everywhere you go.",
    "personality": "UNCLE",
    "ageOrVibe": "Friendly older man who knows everyone",
    "preferredZones": [
      "yaowarat",
      "silom",
      "chatuchak",
      "ari"
    ],
    "preferredCategories": [
      "market",
      "food",
      "park",
      "transit",
      "neighborhood shops"
    ],
    "pickupLines": [
      "Ah, there you are.",
      "No rush."
    ],
    "drivingLines": [
      "My friend owns that shop.",
      "You hungry?"
    ],
    "shortStallLines": [
      "Engine problem?",
      "Happens."
    ],
    "mediumStallLines": [],
    "longStallLines": [
      "I know a mechanic.",
      "Should I call my cousin?"
    ],
    "extremeStallLines": [
      "My cousin is coming.",
      "We could have fixed this yesterday."
    ],
    "stallComments": [
      "Engine problem?",
      "Happens.",
      "I know a mechanic.",
      "Should I call my cousin?",
      "My cousin is coming.",
      "We could have fixed this yesterday."
    ],
    "cleanTripReviews": [
      "Good driver.",
      "Very good."
    ],
    "badTripReviews": [
      "You need maintenance.",
      "I have a mechanic for you."
    ],
    "completionReviews": [
      "Good driver.",
      "Very good.",
      "You need maintenance.",
      "I have a mechanic for you."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "beam": {
    "id": "beam",
    "name": "Beam",
    "displayName": "Beam",
    "avatar": "assets/npc/8.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Laptop bag, event wristband, tired eyes.",
    "bio": "Builder. Has not slept since deployment started.",
    "personality": "BUILDER",
    "ageOrVibe": "Hackathon participant running on caffeine",
    "preferredZones": [
      "siam",
      "silom",
      "thonglor"
    ],
    "preferredCategories": [
      "coworking",
      "crypto events",
      "cafe",
      "convenience store"
    ],
    "pickupLines": [
      "Demo day. Go.",
      "Please don't ask if it's finished."
    ],
    "drivingLines": [
      "I can fix one more bug.",
      "Hotspot still works."
    ],
    "shortStallLines": [
      "This feels on brand.",
      "Okay. I can code here."
    ],
    "mediumStallLines": [],
    "longStallLines": [
      "I've shipped two fixes.",
      "Demo started without me."
    ],
    "extremeStallLines": [
      "Hackathon ended.",
      "We won something?"
    ],
    "stallComments": [
      "This feels on brand.",
      "Okay. I can code here.",
      "I've shipped two fixes.",
      "Demo started without me.",
      "Hackathon ended.",
      "We won something?"
    ],
    "cleanTripReviews": [
      "You saved the demo.",
      "Shipping."
    ],
    "badTripReviews": [
      "At least I fixed the bug.",
      "It still worked locally."
    ],
    "completionReviews": [
      "You saved the demo.",
      "Shipping.",
      "At least I fixed the bug.",
      "It still worked locally."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "mali": {
    "id": "mali",
    "name": "Mali",
    "displayName": "Mali",
    "avatar": "assets/npc/9.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Casual local, food bag, determined expression.",
    "bio": "Will cross Bangkok for one specific bowl of noodles.",
    "personality": "FOODIE / AUNTIE",
    "ageOrVibe": "Food obsessive with strong opinions",
    "preferredZones": [
      "old-city",
      "yaowarat",
      "chatuchak",
      "ari"
    ],
    "preferredCategories": [
      "food",
      "market",
      "cafe"
    ],
    "pickupLines": [
      "They're going to sell out.",
      "Drive."
    ],
    "drivingLines": [
      "Not that shop. The good one.",
      "Worth the trip."
    ],
    "shortStallLines": [],
    "mediumStallLines": [],
    "longStallLines": [],
    "extremeStallLines": [],
    "stallComments": [
      "The noodles are gone.",
      "This is devastating."
    ],
    "cleanTripReviews": [
      "We made it!",
      "You eat yet?"
    ],
    "badTripReviews": [
      "Sold out.",
      "One star."
    ],
    "completionReviews": [
      "We made it!",
      "You eat yet?",
      "Sold out.",
      "One star."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "ken": {
    "id": "ken",
    "name": "Ken",
    "displayName": "Ken",
    "avatar": "assets/npc/10.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Gym bag, hand wraps, athletic wear.",
    "bio": "Has been training Muay Thai for six weeks and mentions it constantly.",
    "personality": "FITNESS",
    "ageOrVibe": "Gym guy / amateur Muay Thai obsessive",
    "preferredZones": [
      "silom",
      "lumpini",
      "asok"
    ],
    "preferredCategories": [
      "muay_thai",
      "gym",
      "park",
      "cafe"
    ],
    "pickupLines": [
      "Training starts in ten.",
      "Coach is going to kill me."
    ],
    "drivingLines": [
      "Cardio day anyway.",
      "I should've run."
    ],
    "shortStallLines": [],
    "mediumStallLines": [],
    "longStallLines": [],
    "extremeStallLines": [],
    "stallComments": [
      "I literally could have jogged.",
      "This is not zone two."
    ],
    "cleanTripReviews": [
      "Perfect timing.",
      "Let's go."
    ],
    "badTripReviews": [
      "Burpees because of you.",
      "Coach was furious."
    ],
    "completionReviews": [
      "Perfect timing.",
      "Let's go.",
      "Burpees because of you.",
      "Coach was furious."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "jiyoon": {
    "id": "jiyoon",
    "name": "Jiyoon",
    "displayName": "Jiyoon",
    "avatar": "assets/npc/11.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Polished travel look, shopping bags, portable fan, phone always camera-ready.",
    "bio": "Came to Bangkok with a 47-stop beauty, cafe, and shopping itinerary.",
    "personality": "TOURIST / INFLUENCER",
    "ageOrVibe": "Korean beauty tourist on an aggressively optimized Bangkok itinerary",
    "preferredZones": [
      "siam",
      "thonglor",
      "ari"
    ],
    "preferredCategories": [
      "beauty",
      "clinic",
      "mall",
      "cafe",
      "photo_spot"
    ],
    "pickupLines": [
      "Hi! Siam first, please.",
      "I have a reservation in twelve minutes."
    ],
    "drivingLines": [
      "Wait, this street is cute.",
      "Can you stop where the light is good?"
    ],
    "shortStallLines": [],
    "mediumStallLines": [],
    "longStallLines": [],
    "extremeStallLines": [],
    "stallComments": [
      "My appointment is disappearing.",
      "I planned this day to the minute."
    ],
    "cleanTripReviews": [
      "Perfect. Thank you!",
      "You saved the itinerary."
    ],
    "badTripReviews": [
      "I missed my color analysis.",
      "The schedule is ruined."
    ],
    "completionReviews": [
      "Perfect. Thank you!",
      "You saved the itinerary.",
      "I missed my color analysis.",
      "The schedule is ruined."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "n-june": {
    "id": "n-june",
    "name": "N'June",
    "displayName": "N'June",
    "avatar": "assets/npc/12.png",
    "avatarFallback": "🛺",
    "avatarDirection": "University uniform, tote bag, iced drink, phone charger dangling from bag.",
    "bio": "Has class, a group project, dinner plans, and 3% battery.",
    "personality": "STUDENT",
    "ageOrVibe": "Thai university student carrying too much stuff and exactly 3% battery",
    "preferredZones": [
      "siam",
      "chatuchak",
      "asok",
      "ari"
    ],
    "preferredCategories": [
      "university",
      "cafe",
      "mall",
      "transit",
      "cheap_food"
    ],
    "pickupLines": [
      "Please hurry, attendance is strict.",
      "My group already hates me."
    ],
    "drivingLines": [
      "Can I charge my phone?",
      "I should have left earlier."
    ],
    "shortStallLines": [],
    "mediumStallLines": [],
    "longStallLines": [],
    "extremeStallLines": [],
    "stallComments": [
      "Okay, now I'm actually dead.",
      "My battery and my grade are both gone."
    ],
    "cleanTripReviews": [
      "Made it! Thank you!",
      "Five stars. Seriously."
    ],
    "badTripReviews": [
      "They locked the classroom.",
      "I am blaming traffic."
    ],
    "completionReviews": [
      "Made it! Thank you!",
      "Five stars. Seriously.",
      "They locked the classroom.",
      "I am blaming traffic."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "max": {
    "id": "max",
    "name": "Max",
    "displayName": "Max",
    "avatar": "assets/npc/13.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Branded cap, laptop sleeve, wireless earbuds, pitch-deck energy.",
    "bio": "Founder. Currently pre-revenue, post-confidence.",
    "personality": "BUILDER / STARTUP",
    "ageOrVibe": "Founder who describes every problem as a growth opportunity",
    "preferredZones": [
      "siam",
      "silom",
      "sathorn",
      "thonglor"
    ],
    "preferredCategories": [
      "coworking",
      "investor_meeting",
      "cafe",
      "event",
      "hotel"
    ],
    "pickupLines": [
      "Big meeting. Let's move.",
      "This could change everything."
    ],
    "drivingLines": [
      "We're seeing strong momentum.",
      "I can pitch from the tuk-tuk."
    ],
    "shortStallLines": [],
    "mediumStallLines": [],
    "longStallLines": [],
    "extremeStallLines": [],
    "stallComments": [
      "Interesting operational bottleneck.",
      "Let's call this an unscheduled pivot."
    ],
    "cleanTripReviews": [
      "Huge. Absolutely huge.",
      "You are now part of the journey."
    ],
    "badTripReviews": [
      "We lost the room.",
      "Still a valuable learning."
    ],
    "completionReviews": [
      "Huge. Absolutely huge.",
      "You are now part of the journey.",
      "We lost the room.",
      "Still a valuable learning."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "nong-fah": {
    "id": "nong-fah",
    "name": "Nong Fah",
    "displayName": "Nong Fah",
    "avatar": "assets/npc/14.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Compact athletic build, fight bag, hand wraps, calm expression.",
    "bio": "Professional fighter. Speaks less than Ken and trains much more.",
    "personality": "FITNESS",
    "ageOrVibe": "Actual Muay Thai fighter, unlike Ken",
    "preferredZones": [
      "old-city",
      "lumpini",
      "asok"
    ],
    "preferredCategories": [
      "muay_thai",
      "gym",
      "stadium",
      "food",
      "clinic"
    ],
    "pickupLines": [
      "Gym. Please.",
      "Fight tonight."
    ],
    "drivingLines": [
      "Good route.",
      "Keep going."
    ],
    "shortStallLines": [],
    "mediumStallLines": [],
    "longStallLines": [],
    "extremeStallLines": [],
    "stallComments": [
      "I can run from here.",
      "Tell me now if we're staying."
    ],
    "cleanTripReviews": [
      "Good job.",
      "Right on time."
    ],
    "badTripReviews": [
      "Warm-up started without me.",
      "Next time I run."
    ],
    "completionReviews": [
      "Good job.",
      "Right on time.",
      "Warm-up started without me.",
      "Next time I run."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "art": {
    "id": "art",
    "name": "Art",
    "displayName": "Art",
    "avatar": "assets/npc/15.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Delivery jacket tied around waist, helmet under arm, relaxed grin.",
    "bio": "Delivers food all week. Tonight someone else is driving.",
    "personality": "UNCLE / NIGHTLIFE",
    "ageOrVibe": "Food delivery rider enjoying his one evening off",
    "preferredZones": [
      "asok",
      "thonglor"
    ],
    "preferredCategories": [
      "food",
      "bar",
      "neighborhood",
      "market",
      "home"
    ],
    "pickupLines": [
      "Finally, I'm the passenger.",
      "No delivery bag tonight."
    ],
    "drivingLines": [
      "I know this road too well.",
      "Left lane is faster after the light."
    ],
    "shortStallLines": [],
    "mediumStallLines": [],
    "longStallLines": [],
    "extremeStallLines": [],
    "stallComments": [
      "Brother, I do this for a living.",
      "Want me to take over?"
    ],
    "cleanTripReviews": [
      "Smooth. Respect.",
      "Good ride."
    ],
    "badTripReviews": [
      "My customers wait less than this.",
      "Painful, brother."
    ],
    "completionReviews": [
      "Smooth. Respect.",
      "Good ride.",
      "My customers wait less than this.",
      "Painful, brother."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "mae-noi": {
    "id": "mae-noi",
    "name": "Mae Noi",
    "displayName": "Mae Noi",
    "avatar": "assets/npc/16.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Colorful blouse, bracelets, small cloth bag, knowing smile.",
    "bio": "Fortune teller. Claims she already knew how this ride would go.",
    "personality": "MYSTERIOUS / AUNTIE",
    "ageOrVibe": "Fortune teller who is annoyingly unsurprised by everything",
    "preferredZones": [
      "old-city",
      "yaowarat",
      "chatuchak"
    ],
    "preferredCategories": [
      "temple-adjacent",
      "market",
      "riverside",
      "home",
      "mysterious"
    ],
    "pickupLines": [
      "You came. Good.",
      "I was expecting this tuk-tuk."
    ],
    "drivingLines": [
      "Do not worry about the next turn.",
      "Interesting. Very interesting."
    ],
    "shortStallLines": [],
    "mediumStallLines": [],
    "longStallLines": [],
    "extremeStallLines": [],
    "stallComments": [
      "Yes. This was in the cards.",
      "We may be here a while."
    ],
    "cleanTripReviews": [
      "Exactly on time.",
      "As expected."
    ],
    "badTripReviews": [
      "You ignored the warning.",
      "Come see me about your luck."
    ],
    "completionReviews": [
      "Exactly on time.",
      "As expected.",
      "You ignored the warning.",
      "Come see me about your luck."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "ice": {
    "id": "ice",
    "name": "Ice",
    "displayName": "Ice",
    "avatar": "assets/npc/17.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Formal Thai wedding attire, gift envelope, anxious expression.",
    "bio": "Has attended twelve weddings this year and been late to eleven.",
    "personality": "HI_SO / NIGHTLIFE",
    "ageOrVibe": "Wedding guest dressed beautifully and catastrophically late",
    "preferredZones": [
      "old-city",
      "yaowarat",
      "siam",
      "sathorn"
    ],
    "preferredCategories": [
      "hotel",
      "wedding",
      "restaurant",
      "mall",
      "salon"
    ],
    "pickupLines": [
      "The ceremony started already.",
      "Please tell me you know the hotel."
    ],
    "drivingLines": [
      "I still need to sign the envelope.",
      "Do I look sweaty?"
    ],
    "shortStallLines": [],
    "mediumStallLines": [],
    "longStallLines": [],
    "extremeStallLines": [],
    "stallComments": [
      "They're taking the group photo now.",
      "I am going to arrive during dessert."
    ],
    "cleanTripReviews": [
      "I can still make the photo.",
      "You are a hero."
    ],
    "badTripReviews": [
      "They are already married.",
      "I missed everything except cake."
    ],
    "completionReviews": [
      "I can still make the photo.",
      "You are a hero.",
      "They are already married.",
      "I missed everything except cake."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "dr-patel": {
    "id": "dr-patel",
    "name": "Dr. Patel",
    "displayName": "Dr. Patel",
    "avatar": "assets/npc/18.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Conference badge, blazer, rolling laptop case, visibly lost.",
    "bio": "Keynote speaker. Unfortunately at the wrong convention center.",
    "personality": "TOURIST / OFFICE_WORKER",
    "ageOrVibe": "Conference speaker who confidently went to the wrong venue",
    "preferredZones": [
      "siam",
      "silom",
      "sathorn"
    ],
    "preferredCategories": [
      "conference",
      "hotel",
      "coworking",
      "transit",
      "airport"
    ],
    "pickupLines": [
      "I believe I'm at the wrong building.",
      "How quickly can we get there?"
    ],
    "drivingLines": [
      "My panel begins very shortly.",
      "The organizers sound concerned."
    ],
    "shortStallLines": [],
    "mediumStallLines": [],
    "longStallLines": [],
    "extremeStallLines": [],
    "stallComments": [
      "They have begun without me.",
      "Someone is presenting my slides."
    ],
    "cleanTripReviews": [
      "Excellent. I owe you one.",
      "Just in time."
    ],
    "badTripReviews": [
      "My keynote became a breakout session.",
      "Remarkable series of events."
    ],
    "completionReviews": [
      "Excellent. I owe you one.",
      "Just in time.",
      "My keynote became a breakout session.",
      "Remarkable series of events."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "auntie-orn": {
    "id": "auntie-orn",
    "name": "Auntie Orn",
    "displayName": "Auntie Orn",
    "avatar": "assets/npc/19.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Designer sunglasses, immaculate hair, several shopping bags.",
    "bio": "Can identify a fake handbag from across Sukhumvit.",
    "personality": "AUNTIE / HI_SO",
    "ageOrVibe": "Luxury-shopping auntie with zero tolerance for inconvenience",
    "preferredZones": [
      "siam",
      "sathorn",
      "thonglor"
    ],
    "preferredCategories": [
      "mall",
      "luxury",
      "salon",
      "restaurant",
      "hotel"
    ],
    "pickupLines": [
      "Careful with the bags.",
      "Central Embassy. Quickly."
    ],
    "drivingLines": [
      "Not through that street.",
      "The bags stay dry."
    ],
    "shortStallLines": [],
    "mediumStallLines": [],
    "longStallLines": [],
    "extremeStallLines": [],
    "stallComments": [
      "This is unacceptable transportation.",
      "My ice cream is melting."
    ],
    "cleanTripReviews": [
      "Acceptable. Five stars.",
      "You may drive me again."
    ],
    "badTripReviews": [
      "I knew I should have called my driver.",
      "Never with shopping bags again."
    ],
    "completionReviews": [
      "Acceptable. Five stars.",
      "You may drive me again.",
      "I knew I should have called my driver.",
      "Never with shopping bags again."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "fern": {
    "id": "fern",
    "name": "Fern",
    "displayName": "Fern",
    "avatar": "assets/npc/20.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Casual clothes, giant monstera cutting, soil on tote bag.",
    "bio": "Owns 83 plants and insists there is room for one more.",
    "personality": "FOODIE / MYSTERIOUS",
    "ageOrVibe": "Plant collector transporting something increasingly unreasonable",
    "preferredZones": [
      "old-city",
      "chatuchak",
      "ari"
    ],
    "preferredCategories": [
      "plant_shop",
      "market",
      "cafe",
      "home",
      "park"
    ],
    "pickupLines": [
      "Please don't crush the leaf.",
      "It's rare. Be careful."
    ],
    "drivingLines": [
      "Less wind, please.",
      "That nursery is good too."
    ],
    "shortStallLines": [],
    "mediumStallLines": [],
    "longStallLines": [],
    "extremeStallLines": [],
    "stallComments": [
      "The roots are drying out.",
      "This plant cost more than the ride."
    ],
    "cleanTripReviews": [
      "Leaf survived. Five stars.",
      "Perfect. Thank you."
    ],
    "badTripReviews": [
      "It lost a leaf.",
      "I need a propagation emergency."
    ],
    "completionReviews": [
      "Leaf survived. Five stars.",
      "Perfect. Thank you.",
      "It lost a leaf.",
      "I need a propagation emergency."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "nurse-may": {
    "id": "nurse-may",
    "name": "Nurse May",
    "displayName": "Nurse May",
    "avatar": "assets/npc/21.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Scrubs under light jacket, tote bag, tired but alert eyes.",
    "bio": "Just finished a twelve-hour shift and wants exactly one thing: home.",
    "personality": "OFFICE_WORKER",
    "ageOrVibe": "Night-shift nurse running entirely on iced coffee and discipline",
    "preferredZones": [
      "silom",
      "sathorn",
      "asok"
    ],
    "preferredCategories": [
      "hospital",
      "convenience_store",
      "food",
      "transit",
      "home"
    ],
    "pickupLines": [
      "Home, please.",
      "Long night."
    ],
    "drivingLines": [
      "Wake me if we arrive.",
      "No, I'm not working tomorrow."
    ],
    "shortStallLines": [],
    "mediumStallLines": [],
    "longStallLines": [],
    "extremeStallLines": [],
    "stallComments": [
      "I have been awake for nineteen hours.",
      "Please fix whatever this is."
    ],
    "cleanTripReviews": [
      "Thank you. Good night.",
      "Five stars. Quiet ride."
    ],
    "badTripReviews": [
      "I could have slept at the hospital.",
      "This shift somehow continued."
    ],
    "completionReviews": [
      "Thank you. Good night.",
      "Five stars. Quiet ride.",
      "I could have slept at the hospital.",
      "This shift somehow continued."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "ton": {
    "id": "ton",
    "name": "Ton",
    "displayName": "Ton",
    "avatar": "assets/npc/22.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Camera sling, black clothes, two lenses, always looking sideways at light.",
    "bio": "Photographer. Cannot pass interesting light without stopping.",
    "personality": "INFLUENCER / CREATIVE",
    "ageOrVibe": "Photographer who sees better light everywhere except the destination",
    "preferredZones": [
      "old-city",
      "yaowarat",
      "siam"
    ],
    "preferredCategories": [
      "gallery",
      "event",
      "street",
      "cafe",
      "photo_spot"
    ],
    "pickupLines": [
      "Don't leave, I'm crossing the street.",
      "Camera goes in front."
    ],
    "drivingLines": [
      "Slow down here. The light is insane.",
      "Wait, can we circle back?"
    ],
    "shortStallLines": [],
    "mediumStallLines": [],
    "longStallLines": [],
    "extremeStallLines": [],
    "stallComments": [
      "Actually, this location is kind of good.",
      "Hold on. Don't move the tuk-tuk."
    ],
    "cleanTripReviews": [
      "Nice. Got the shot too.",
      "Perfect timing."
    ],
    "badTripReviews": [
      "At least I got photos.",
      "Terrible ride. Great light."
    ],
    "completionReviews": [
      "Nice. Got the shot too.",
      "Perfect timing.",
      "At least I got photos.",
      "Terrible ride. Great light."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "nara": {
    "id": "nara",
    "name": "Nara",
    "displayName": "Nara",
    "avatar": "assets/npc/23.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Thrifted clothes, small keyboard case, headphones, tote full of cables.",
    "bio": "Musician. The synth is worth more than everything else she owns.",
    "personality": "DJ / CREATIVE",
    "ageOrVibe": "Indie musician hauling one suspiciously fragile synth",
    "preferredZones": [
      "yaowarat",
      "thonglor"
    ],
    "preferredCategories": [
      "music",
      "rehearsal",
      "gallery",
      "bar",
      "warehouse"
    ],
    "pickupLines": [
      "Careful with the synth.",
      "Soundcheck was supposed to start now."
    ],
    "drivingLines": [
      "Do you have aux?",
      "No bumps, please."
    ],
    "shortStallLines": [],
    "mediumStallLines": [],
    "longStallLines": [],
    "extremeStallLines": [],
    "stallComments": [
      "I could write a song about this.",
      "Soundcheck is becoming theoretical."
    ],
    "cleanTripReviews": [
      "Made it. Come to the show.",
      "Synth survived. Five stars."
    ],
    "badTripReviews": [
      "They started without keys.",
      "This is going on the album."
    ],
    "completionReviews": [
      "Made it. Come to the show.",
      "Synth survived. Five stars.",
      "They started without keys.",
      "This is going on the album."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "chris": {
    "id": "chris",
    "name": "Chris",
    "displayName": "Chris",
    "avatar": "assets/npc/24.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Smart casual, laptop backpack, company lanyard, relentlessly friendly smile.",
    "bio": "Recruiter. You are somehow already in his candidate pipeline.",
    "personality": "OFFICE_WORKER / EXPAT",
    "ageOrVibe": "Tech recruiter who can turn any conversation into a job pitch",
    "preferredZones": [
      "siam",
      "sathorn",
      "asok",
      "thonglor"
    ],
    "preferredCategories": [
      "office",
      "coworking",
      "cafe",
      "event",
      "hotel"
    ],
    "pickupLines": [
      "Hey! Great to meet you.",
      "Quick ride, then a quick call."
    ],
    "drivingLines": [
      "So what stack do you use?",
      "Are you open to opportunities?"
    ],
    "shortStallLines": [],
    "mediumStallLines": [],
    "longStallLines": [],
    "extremeStallLines": [],
    "stallComments": [
      "No worries. Let's use the time.",
      "Tell me about your five-year plan."
    ],
    "cleanTripReviews": [
      "Amazing experience. Let's stay connected.",
      "I'll send you the role."
    ],
    "badTripReviews": [
      "Interesting culture fit.",
      "We'll keep your profile on file."
    ],
    "completionReviews": [
      "Amazing experience. Let's stay connected.",
      "I'll send you the role.",
      "Interesting culture fit.",
      "We'll keep your profile on file."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "gary": {
    "id": "gary",
    "name": "Gary",
    "displayName": "Gary",
    "avatar": "assets/npc/25.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Linen shirt, sandals, reading glasses, folded newspaper.",
    "bio": "Has lived in Bangkok for twenty years and preferred every neighborhood ten years ago.",
    "personality": "EXPAT / UNCLE",
    "ageOrVibe": "Retired expat who has a story about how Bangkok used to be",
    "preferredZones": [
      "old-city",
      "silom",
      "ari"
    ],
    "preferredCategories": [
      "pub",
      "food",
      "park",
      "neighborhood",
      "transit"
    ],
    "pickupLines": [
      "This road used to be empty.",
      "I remember when this was all houses."
    ],
    "drivingLines": [
      "Bangkok's changed, you know.",
      "There used to be a great bar here."
    ],
    "shortStallLines": [],
    "mediumStallLines": [],
    "longStallLines": [],
    "extremeStallLines": [],
    "stallComments": [
      "Traffic wasn't like this in 2007.",
      "Well. Maybe it was."
    ],
    "cleanTripReviews": [
      "Good man. Cheers.",
      "That'll do nicely."
    ],
    "badTripReviews": [
      "I could tell you about tuk-tuks in '04.",
      "Different city back then."
    ],
    "completionReviews": [
      "Good man. Cheers.",
      "That'll do nicely.",
      "I could tell you about tuk-tuks in '04.",
      "Different city back then."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "nong-niran": {
    "id": "nong-niran",
    "name": "Nong Niran",
    "displayName": "Nong Niran",
    "avatar": "assets/npc/26.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Thai novice Buddhist monk, around 12–14 years old, shaved head, warm medium-tan Thai skin, simple saffron robes, small cloth shoulder bag. Calm, slightly curious expression.",
    "bio": "Young novice monk. Quietly watching Bangkok make questionable decisions.",
    "personality": "TEMPLE / STUDENT",
    "ageOrVibe": "Young novice monk who is much more observant than everyone around him",
    "preferredZones": [
      "old-city",
      "yaowarat"
    ],
    "preferredCategories": [
      "temple",
      "market",
      "park",
      "transit",
      "neighborhood",
      "food"
    ],
    "pickupLines": [
      "We can go now.",
      "No need to hurry."
    ],
    "drivingLines": [
      "Bangkok is very loud today.",
      "Have you driven long?"
    ],
    "shortStallLines": [
      "We are stopped.",
      "It's okay. I can wait."
    ],
    "mediumStallLines": [],
    "longStallLines": [
      "Maybe we are supposed to be here.",
      "You seem more worried than me."
    ],
    "extremeStallLines": [
      "I think this is my temple now.",
      "We have been here a very long time."
    ],
    "stallComments": [
      "We are stopped.",
      "It's okay. I can wait.",
      "Maybe we are supposed to be here.",
      "You seem more worried than me.",
      "I think this is my temple now.",
      "We have been here a very long time."
    ],
    "cleanTripReviews": [
      "Thank you, driver.",
      "That was a good trip."
    ],
    "badTripReviews": [
      "We arrived eventually.",
      "Perhaps check the fuel next time."
    ],
    "completionReviews": [
      "Thank you, driver.",
      "That was a good trip.",
      "We arrived eventually.",
      "Perhaps check the fuel next time."
    ],
    "airportLines": [
      "I've never been inside."
    ],
    "eventLines": [
      "What is happening here?"
    ],
    "rescueLines": []
  },
  "p-noi": {
    "id": "p-noi",
    "name": "P'Noi",
    "displayName": "P'Noi",
    "avatar": "assets/npc/27.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Middle-aged Thai woman, deeply tanned from working outdoors, short practical layered haircut, apron over a faded T-shirt, towel over one shoulder, small plastic ingredient bag in hand. Broad, sturdy build and huge personality.",
    "bio": "Street-food vendor. Leaving her cart unattended was your first mistake.",
    "personality": "STREET_VENDOR / FOODIE",
    "ageOrVibe": "Street vendor temporarily separated from her cart",
    "preferredZones": [
      "old-city",
      "yaowarat",
      "silom",
      "chatuchak"
    ],
    "preferredCategories": [
      "market",
      "food",
      "wholesale",
      "neighborhood shops",
      "transit"
    ],
    "pickupLines": [
      "Quick. My sister is watching the cart.",
      "You know the market?"
    ],
    "drivingLines": [
      "Not this road!",
      "Morning traffic is worse."
    ],
    "shortStallLines": [
      "Ohhh, no gas?",
      "My customers are waiting."
    ],
    "mediumStallLines": [],
    "longStallLines": [
      "My sister is going to kill me.",
      "The lunch crowd is starting."
    ],
    "extremeStallLines": [
      "I don't have a business anymore.",
      "Maybe I open a stall here."
    ],
    "stallComments": [
      "Ohhh, no gas?",
      "My customers are waiting.",
      "My sister is going to kill me.",
      "The lunch crowd is starting.",
      "I don't have a business anymore.",
      "Maybe I open a stall here."
    ],
    "cleanTripReviews": [
      "Good! We made it.",
      "Come eat later."
    ],
    "badTripReviews": [
      "Lunch is finished.",
      "Next time, I drive."
    ],
    "completionReviews": [
      "Good! We made it.",
      "Come eat later.",
      "Lunch is finished.",
      "Next time, I drive."
    ],
    "airportLines": [],
    "eventLines": [
      "Stop there. I need chilies.",
      "That place? Mine is better."
    ],
    "rescueLines": [
      "Finally! Someone prepared."
    ]
  },
  "alex": {
    "id": "alex",
    "name": "Alex",
    "displayName": "Alex",
    "avatar": "assets/npc/28.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Athletic polo, racket bag, headband, sports watch.",
    "bio": "Has a padel match in forty minutes. Talks like it's Wimbledon.",
    "personality": "FITNESS / EXPAT",
    "ageOrVibe": "Padel obsessive who has somehow made the sport his entire personality",
    "preferredZones": [
      "sathorn",
      "asok",
      "thonglor"
    ],
    "preferredCategories": [
      "padel",
      "gym",
      "cafe",
      "club",
      "condo"
    ],
    "pickupLines": [
      "Court's booked. We cannot be late.",
      "My partner is already warming up."
    ],
    "drivingLines": [
      "I need this win.",
      "We're playing the finance guys."
    ],
    "shortStallLines": [],
    "mediumStallLines": [],
    "longStallLines": [],
    "extremeStallLines": [],
    "stallComments": [
      "We're losing court time.",
      "They charge by the hour!"
    ],
    "cleanTripReviews": [
      "Perfect. Match point.",
      "Five stars. Vamos."
    ],
    "badTripReviews": [
      "They gave our court away.",
      "Season ruined."
    ],
    "completionReviews": [
      "Perfect. Match point.",
      "Five stars. Vamos.",
      "They gave our court away.",
      "Season ruined."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "p-chai": {
    "id": "p-chai",
    "name": "P'Chai",
    "displayName": "P'Chai",
    "avatar": "assets/npc/29.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Simple shirt, canvas bag, flowers or offering supplies.",
    "bio": "Temple volunteer. Has nowhere urgent to be and somehow still arrives first.",
    "personality": "UNCLE / MYSTERIOUS",
    "ageOrVibe": "Temple volunteer carrying practical supplies and infinite patience",
    "preferredZones": [
      "old-city",
      "yaowarat"
    ],
    "preferredCategories": [
      "temple",
      "market",
      "community",
      "food",
      "riverside"
    ],
    "pickupLines": [
      "Whenever you're ready.",
      "These need to get to the temple."
    ],
    "drivingLines": [
      "No need to rush.",
      "Careful at the corner."
    ],
    "shortStallLines": [],
    "mediumStallLines": [],
    "longStallLines": [],
    "extremeStallLines": [],
    "stallComments": [
      "We wait.",
      "Maybe there is a reason."
    ],
    "cleanTripReviews": [
      "Thank you, driver.",
      "Good journey."
    ],
    "badTripReviews": [
      "A difficult trip. Still, thank you.",
      "Next time, more fuel."
    ],
    "completionReviews": [
      "Thank you, driver.",
      "Good journey.",
      "A difficult trip. Still, thank you.",
      "Next time, more fuel."
    ],
    "airportLines": [],
    "eventLines": [],
    "rescueLines": []
  },
  "mr-x": {
    "id": "mr-x",
    "name": "Mr. X",
    "displayName": "Mr. X",
    "avatar": "assets/npc/30.png",
    "avatarFallback": "🛺",
    "avatarDirection": "Crisp dark suit despite heat, sunglasses, small locked briefcase.",
    "bio": "Nobody knows his name, job, or why the briefcase occasionally beeps.",
    "personality": "MYSTERIOUS",
    "ageOrVibe": "Extremely mysterious businessman whose errands never make sense",
    "preferredZones": [
      "yaowarat",
      "sathorn",
      "asok"
    ],
    "preferredCategories": [
      "hotel",
      "warehouse",
      "riverside",
      "private_event",
      "mysterious"
    ],
    "pickupLines": [
      "You are the driver. Good.",
      "Do not open the back compartment."
    ],
    "drivingLines": [
      "Take the indirect route.",
      "We are not being followed."
    ],
    "shortStallLines": [],
    "mediumStallLines": [],
    "longStallLines": [],
    "extremeStallLines": [],
    "stallComments": [
      "This complicates things.",
      "How quickly can you obtain fuel?"
    ],
    "cleanTripReviews": [
      "You were never here.",
      "Adequate."
    ],
    "badTripReviews": [
      "Forget this ride occurred.",
      "I will make other arrangements."
    ],
    "completionReviews": [
      "You were never here.",
      "Adequate.",
      "Forget this ride occurred.",
      "I will make other arrangements."
    ],
    "airportLines": [],
    "eventLines": [
      "If anyone asks, you drove Dave."
    ],
    "rescueLines": []
  }
};

// Helper functions for NPC data

export function getNPCById(id) {
  return NPCs[id] || null;
}

export function getRandomNPC() {
  const npcIds = Object.keys(NPCs);
  return NPCs[npcIds[Math.floor(Math.random() * npcIds.length)]];
}

export function filterNPCsByZone(zone) {
  return Object.values(NPCs).filter(npc => npc.preferredZones.includes(zone));
}

// Generate a new fare for a given player
export function createFare(playerWallet, npcId) {
  const npc = getNPCById(npcId);
  if (!npc) return null;

  const legacyZoneAliases = {
    'old-city': 'old_town', 'khao-san': 'old_town', yaowarat: 'yaowarat', siam: 'siam',
    silom: 'silom', lumpini: 'silom', sathorn: 'silom', asok: 'asok',
    thonglor: 'thonglor', chatuchak: 'ari', ari: 'ari'
  };
  const preferredZones = new Set((npc.preferredZones || []).map(zone => legacyZoneAliases[zone] || zone));
  const preferredCategories = new Set(npc.preferredCategories || []);
  const chooseWeighted = (pool) => {
    const weighted = pool.flatMap((location) => {
      let weight = 1;
      if (preferredZones.has(location.properties.zoneId)) weight += 3;
      if (location.properties.categories.some(category => preferredCategories.has(category))) weight += 2;
      if (location.properties.rarity === 'rare') weight = 1;
      return Array.from({ length: weight }, () => location);
    });
    return weighted[Math.floor(Math.random() * weighted.length)];
  };

  const pickup = chooseWeighted(PICKUP_LOCATIONS);
  const airportDestinations = DESTINATION_LOCATIONS.filter(location => location.properties.kind === 'airport');
  const normalDestinations = DESTINATION_LOCATIONS.filter(location => location.id !== pickup?.id && location.properties.kind !== 'airport');
  const destination = Math.random() < CONFIG.AIRPORT_DESTINATION_CHANCE
    ? chooseWeighted(airportDestinations)
    : chooseWeighted(normalDestinations);
  if (!pickup || !destination) return null;
  const pickupLocationId = pickup.id;
  const destinationLocationId = destination.id;

  // Random fare condition
  const conditionTypes = Object.values(FARE_CONDITION_TYPES);
  const condition = conditionTypes[Math.floor(Math.random() * conditionTypes.length)];

  // Random point value
  const pointValues = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];
  const pointValue = pointValues[Math.floor(Math.random() * pointValues.length)];
  const minimumUsdValues = [1, 1, 5, 10, 25];
  const minimumUsd = minimumUsdValues[Math.floor(Math.random() * minimumUsdValues.length)];
  const roadTrafficLevel = pointValue >= 70 ? 'RED' : pointValue >= 35 ? 'YELLOW' : 'GREEN';
  const marketTrafficLevel = minimumUsd >= 25 || condition === 'VOLATILE_TO_STABLE' ? 'RED' : minimumUsd >= 10 ? 'YELLOW' : 'GREEN';

  // Random expiration time
  const expiryMin = CONFIG.FARE_EXPIRY_MINUTES;
  const expiryMax = CONFIG.FARE_EXPIRY_MAX_MINUTES;
  const expiryMinutes = Math.floor(Math.random() * (expiryMax - expiryMin + 1)) + expiryMin;
  const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);

  return {
    id: `fare-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    wallet: playerWallet,
    npcId: npcId,
    pickupLocationId,
    destinationLocationId,
    condition: condition,
    minimumUsd: condition === "MIN_USD" ? minimumUsd : 1,
    pointValue: pointValue,
    roadTrafficLevel,
    marketTrafficLevel,
    routeQuality: roadTrafficLevel === 'RED' ? 'DIFFICULT' : roadTrafficLevel === 'YELLOW' ? 'MODERATE' : 'CLEAR',
    expiresAt: expiresAt,
    status: "AVAILABLE"
  };
}
