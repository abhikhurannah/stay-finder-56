import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Star, Share, Heart, Award, MapPin, Check } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { getListing } from "@/data/listings";
import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rooms/$id")({
  loader: ({ params }) => {
    const listing = getListing(params.id);
    if (!listing) throw notFound();
    return listing;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.title} · Stayhub` : "Stay · Stayhub" },
      {
        name: "description",
        content: loaderData
          ? `${loaderData.title} in ${loaderData.location}, ${loaderData.country}. $${loaderData.price} per night.`
          : "Book your next stay.",
      },
      { property: "og:title", content: loaderData?.title ?? "Stay · Stayhub" },
      {
        property: "og:description",
        content: loaderData
          ? `Stay in ${loaderData.location}, ${loaderData.country} from $${loaderData.price} a night.`
          : "Book your next stay.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoomPage,
});

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function RoomPage() {
  const listing = Route.useLoaderData();
  const { saved, toggle } = useWishlist();
  const [checkIn, setCheckIn] = useState(todayPlus(7));
  const [checkOut, setCheckOut] = useState(todayPlus(12));
  const [guests, setGuests] = useState(2);

  const nights = useMemo(() => {
    const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(0, Math.round(ms / 86_400_000));
  }, [checkIn, checkOut]);

  const subtotal = nights * listing.price;
  const cleaning = nights > 0 ? 65 : 0;
  const serviceFee = Math.round(subtotal * 0.14);
  const total = subtotal + cleaning + serviceFee;
  const isSaved = saved.includes(listing.id);

  const reserve = () => {
    if (nights <= 0) {
      toast.error("Check-out must be after check-in.");
      return;
    }
    if (guests > listing.guests) {
      toast.error(`This place hosts up to ${listing.guests} guests.`);
      return;
    }
    toast.success("Reservation confirmed", {
      description: `${nights} night${nights > 1 ? "s" : ""} in ${listing.location} · $${total} total`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1120px] px-6 py-6">
        <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          ← All stays
        </Link>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{listing.title}</h1>
          <div className="flex items-center gap-3 text-sm font-medium">
            <button className="flex items-center gap-1.5 rounded-md px-2 py-1 underline-offset-4 hover:underline">
              <Share className="h-4 w-4" /> Share
            </button>
            <button
              onClick={() => toggle(listing.id)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 underline-offset-4 hover:underline"
            >
              <Heart className={cn("h-4 w-4", isSaved && "fill-primary text-primary")} />
              {isSaved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-foreground text-foreground" />
          <span className="font-medium text-foreground">{listing.rating}</span>
          <span>· {listing.reviews} reviews ·</span>
          <MapPin className="h-3.5 w-3.5" />
          <span>
            {listing.location}, {listing.country}
          </span>
        </p>

        <img
          src={listing.image}
          alt={listing.title}
          width={1200}
          height={912}
          className="mt-5 aspect-[16/9] w-full rounded-3xl object-cover"
        />

        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
          <div>
            <h2 className="text-xl font-semibold">
              Entire home hosted by {listing.host}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {listing.guests} guests · {listing.bedrooms} bedrooms · {listing.beds} beds ·{" "}
              {listing.baths} baths
            </p>

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border p-4">
              <Award className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{listing.host} is a Superhost</p>
                <p className="text-sm text-muted-foreground">
                  {listing.hostYears} years of hosting · 100% response rate
                </p>
              </div>
            </div>

            <p className="mt-6 leading-relaxed text-foreground/90">{listing.description}</p>

            <h3 className="mt-8 text-lg font-semibold">What this place offers</h3>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {listing.amenities.map((a) => (
                <li key={a} className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-primary" /> {a}
                </li>
              ))}
            </ul>
          </div>

          <aside className="h-fit lg:sticky lg:top-28">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
              <p className="text-xl">
                <span className="font-semibold">${listing.price}</span>{" "}
                <span className="text-base text-muted-foreground">night</span>
              </p>

              <div className="mt-4 overflow-hidden rounded-xl border border-border">
                <div className="grid grid-cols-2">
                  <label className="border-r border-border p-3">
                    <span className="block text-[10px] font-bold uppercase tracking-wide">
                      Check-in
                    </span>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </label>
                  <label className="p-3">
                    <span className="block text-[10px] font-bold uppercase tracking-wide">
                      Checkout
                    </span>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </label>
                </div>
                <label className="block border-t border-border p-3">
                  <span className="block text-[10px] font-bold uppercase tracking-wide">
                    Guests
                  </span>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full bg-transparent text-sm outline-none"
                  >
                    {Array.from({ length: listing.guests }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} guest{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                onClick={reserve}
                className="mt-4 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Reserve
              </button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                You won't be charged yet
              </p>

              {nights > 0 && (
                <div className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
                  <div className="flex justify-between">
                    <span className="underline">
                      ${listing.price} × {nights} nights
                    </span>
                    <span>${subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="underline">Cleaning fee</span>
                    <span>${cleaning}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="underline">Service fee</span>
                    <span>${serviceFee}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-3 font-semibold">
                    <span>Total</span>
                    <span>${total}</span>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
