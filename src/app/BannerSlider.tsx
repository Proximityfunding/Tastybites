"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

type Slide = {
  image: string;
  eyebrow: string;
  headline: string;
  subtext: string;
  ctaLabel: string;
};

const SLIDES: Slide[] = [
  {
    image: "/uploads/banners/banner-burgers.jpg",
    eyebrow: "Fan Favorite",
    headline: "Bold Flavors, Big Bites",
    subtext: "Juicy, stacked burgers made fresh the moment you order.",
    ctaLabel: "Order Now",
  },
  {
    image: "/uploads/banners/banner-drinks.jpg",
    eyebrow: "Beat the Heat",
    headline: "Cool Down, Refresh Up",
    subtext: "Fresh calamansi juice and milk tea, made daily.",
    ctaLabel: "See Drinks",
  },
  {
    image: "/uploads/banners/banner-feast.jpg",
    eyebrow: "Barkada Favorite",
    headline: "Perfect For Sharing",
    subtext: "Snacks and platters the whole crew will love.",
    ctaLabel: "Order Now",
  },
  {
    image: "/uploads/banners/banner-desserts.jpg",
    eyebrow: "Sweet Tooth?",
    headline: "Sweet Cravings, Covered",
    subtext: "Halo-halo and cool treats to end your meal right.",
    ctaLabel: "See Menu",
  },
];

export default function BannerSlider() {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), []);
  const prev = () => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="relative h-[420px] w-full overflow-hidden sm:h-[480px]">
      {SLIDES.map((slide, i) => (
        <div
          key={slide.image}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === index ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.headline}
            fill
            priority={i === 0}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-center px-14 sm:px-16">
            <span className="mb-2 w-fit rounded-full bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              {slide.eyebrow}
            </span>
            <h2 className="max-w-md text-3xl font-extrabold text-white drop-shadow-sm sm:text-5xl">
              {slide.headline}
            </h2>
            <p className="mt-3 max-w-sm text-base text-white/90 sm:text-lg">{slide.subtext}</p>
            <Link
              href="/shop"
              className="mt-6 w-fit rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-orange-700 sm:text-base"
            >
              {slide.ctaLabel} →
            </Link>
          </div>
        </div>
      ))}

      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/30"
      >
        ‹
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/30"
      >
        ›
      </button>

      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.image}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-orange-500" : "w-2 bg-white/60"}`}
          />
        ))}
      </div>
    </div>
  );
}
