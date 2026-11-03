/*
 * ─────────────────────────────────────────────────────────────
 *  EDIT ONLY THIS FILE to personalise the invitation.
 *  Names, date, venue, texts and map link all live here.
 *  (The values below are sample placeholders.)
 * ─────────────────────────────────────────────────────────────
 */
window.WEDDING_CONFIG = {
  // The couple
  bride: "Lina",
  groom: "Omar",

  // Date & time — ISO format WITH the UTC offset of the venue's city.
  // Example: 12 June 2027, 7:00 PM in Damascus (UTC+3)
  dateISO: "2027-06-12T19:00:00+03:00",
  timezone: "Asia/Damascus",     // IANA time zone of the venue (used to display the date/time)
  durationHours: 5,              // length of the event (for the calendar file)

  // Venue
  venue: "The Rose Garden Hall",
  address: "Al-Malki Street, Damascus, Syria",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Damascus+Syria",

  // Texts
  mystery: "Some stories do not begin by chance… they are written by destiny, to last forever.",
  kicker: "With all our love and joy,",
  lead: "we invite you to be witnesses to the beginning of a lifelong story",
  subtitle: "are getting married",
  welcome: "Your presence is the most precious gift we could ask for. Come as you are, bring your smile, and let us celebrate together.",
  detailsNote: "Dinner & dancing to follow",
  countdownTitle: "The countdown to forever",
  celebration: "Today is the day! Our story begins tonight — thank you for being part of it.",
  closing: "Your presence completes our joy, and with your arrival this night becomes more beautiful.",
  calendarNote: "Wedding celebration. We can't wait to see you!",

  // Sound
  autoplayMusic: true,           // starts when the guest taps “Discover the Story” (they can mute anytime)
  musicFile: ""                  // optional: path to your own mp3 (e.g. "assets/music.mp3"). Empty = soft built-in music.
};
