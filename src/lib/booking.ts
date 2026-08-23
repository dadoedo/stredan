export const BOOKING_SCHEDULE_URL =
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ0Nb2wBWBGQKHHl0qNlvpRLXd8dvd1VRCD3mXznkrAYvCGPxx3Z7vyGNQ62S4DysiDrGgjE5_W-?gv=true";

export function bookingPopupUrl(campaign?: string) {
  if (!campaign) return BOOKING_SCHEDULE_URL;

  const params = new URLSearchParams({
    utm_source: "stredan",
    utm_medium: "cta",
    utm_campaign: campaign,
  });

  return `${BOOKING_SCHEDULE_URL}&${params.toString()}`;
}
