import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { AgencyEmailButton } from "@/components/AgencyEmailButton";
import { BookingCallButton } from "@/components/BookingCallButton";
import { EngagementModels } from "@/components/EngagementModels";
import { OfferViewTracker } from "@/components/OfferViewTracker";
import { getLocale } from "@/lib/locale";
import { isOfferRetired } from "@/lib/offers";
import { offerBySlug, PUBLIC_OFFERS } from "@/lib/public-offers";
import { routeMetadata } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PUBLIC_OFFERS.map((offer) => ({ slug: offer.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const offer = offerBySlug(slug);
  if (!offer) return { title: "Stredan" };
  return routeMetadata({
    path: `/offers/${slug}`,
    locale,
    title: `${offer.name[locale]} | Stredan`,
    description: offer.description[locale],
  });
}

export default async function OfferLandingPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const offer = offerBySlug(slug);
  if (!offer) notFound();

  try {
    if (await isOfferRetired(slug)) notFound();
  } catch {
    // Public copy stays available when the database is not connected.
  }

  const isSk = locale === "sk";
  const mailSubject = "mailSubject" in offer ? offer.mailSubject : offer.name.en;
  const mailHref = `mailto:david@stredan.sk?subject=${encodeURIComponent(mailSubject)}`;

  return (
    <SiteShell locale={locale}>
      <OfferViewTracker slug={slug} code={offer.code} name={offer.name[locale]} />
      <div className="agency-shell py-24">
        <Link href="/#ponuka" className="agency-text-link">
          ← {isSk ? "Späť na ponuku" : "Back to the offer"}
        </Link>
        <p className="agency-section-label mt-8">
          {isSk ? "Ponuka" : "Offer"} {offer.code}
        </p>
        <h1 className="agency-h2 max-w-none">{offer.name[locale]}</h1>
        <p className="agency-lede">{offer.body[locale]}</p>
        <EngagementModels locale={locale} />

        <div className="agency-cta-row">
          {offer.ctaKind === "email" ? (
            <AgencyEmailButton href={mailHref} location="offer" offer={slug}>
              {offer.cta[locale]}
            </AgencyEmailButton>
          ) : (
            <BookingCallButton
              label={offer.cta[locale]}
              className="agency-btn-primary"
              campaign={`offer-${slug}`}
              eventProps={{ location: "offer", offer: slug }}
            />
          )}
          {offer.ctaKind === "email" ? (
            <BookingCallButton
              label={isSk ? "Radšej úvodný hovor" : "Rather an intro call"}
              campaign={`offer-${slug}`}
              eventProps={{ location: "offer", offer: slug }}
            />
          ) : (
            <AgencyEmailButton
              href="mailto:david@stredan.sk"
              className="agency-btn-secondary"
              location="offer"
              offer={slug}
            >
              david@stredan.sk
            </AgencyEmailButton>
          )}
        </div>
        <p className="agency-cta-note">
          {isSk
            ? "Hovor trvá 45 minút a je na Google Meet. Kalendár je po anglicky. Tlačidlo ho len otvorí."
            : "The call is 45 minutes on Google Meet. The calendar is in English. The button only opens it."}
        </p>

        <dl className="agency-bounds">
          <div>
            <dt>{isSk ? "Pre koho" : "For"}</dt>
            <dd>{offer.forWhom[locale]}</dd>
          </div>
          <div>
            <dt>{isSk ? "Nie je pre" : "Not for"}</dt>
            <dd>{offer.notFor[locale]}</dd>
          </div>
        </dl>
      </div>
    </SiteShell>
  );
}
