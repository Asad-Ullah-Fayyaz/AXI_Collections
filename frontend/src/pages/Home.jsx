import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight } from "lucide-react";
import ProductCard from "../components/product/ProductCard";
import HomeReviewsSection from "../components/home/HomeReviewsSection";
import {
  fetchCategories,
  selectCategories,
} from "../store/slices/categoriesSlice";
import {
  fetchFeaturedProducts,
  selectFeaturedProducts,
} from "../store/slices/productsSlice";
import api, { toAbsoluteUrl } from "../services/api";

const EMPTY_CONTENT = {
  announcement: { text: "", enabled: false },
  hero: {
    badge: "",
    heading: "",
    subheading: "",
    backgroundImage: "",
    images: [],
    video: "",
    slideInterval: 4.5,
    overlayOpacity: 0.9,
    primaryBtnText: "",
    primaryBtnLink: "/products",
    secondaryBtnText: "",
    secondaryBtnLink: "/products",
  },
  categoriesSection: { eyebrow: "", heading: "" },
  featuredSection: {
    eyebrow: "",
    heading: "",
    ctaText: "",
    ctaLink: "/products",
  },
  brandStory: {
    eyebrow: "",
    heading: "",
    paragraph1: "",
    paragraph2: "",
    ctaText: "",
    ctaLink: "/products",
    image: "",
  },
};

function mergeContent(apiContent) {
  if (!apiContent) return EMPTY_CONTENT;
  const merged = { ...EMPTY_CONTENT };
  for (const key of Object.keys(EMPTY_CONTENT)) {
    if (apiContent[key]) {
      merged[key] = { ...EMPTY_CONTENT[key], ...apiContent[key] };
    }
  }
  return merged;
}

/* Scroll-reveal hook — callback-ref based with a safety net. */
function useReveal({ threshold = 0.15, rootMargin = "0px 0px -10% 0px" } = {}) {
  const [inView, setInView] = useState(false);
  const [node, setNode] = useState(null);
  const observerRef = useRef(null);
  const timeoutRef = useRef(null);

  const ref = useCallback((el) => setNode(el), []);

  useEffect(() => {
    if (!node) return undefined;

    if (
      typeof window === "undefined" ||
      typeof IntersectionObserver === "undefined"
    ) {
      setInView(true);
      return undefined;
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const rect = node.getBoundingClientRect();
    const viewportH =
      window.innerHeight || document.documentElement.clientHeight || 0;
    const targetVisiblePx = Math.min(rect.height, viewportH) * 0.5;
    const maxSafeThreshold =
      rect.height > 0
        ? Math.max(0.05, targetVisiblePx / rect.height)
        : threshold;
    const safeThreshold = Math.min(threshold, maxSafeThreshold);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            observerRef.current = null;
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
          }
        });
      },
      { threshold: safeThreshold, rootMargin },
    );

    observer.observe(node);
    observerRef.current = observer;

    timeoutRef.current = setTimeout(() => {
      const r = node.getBoundingClientRect();
      const vh =
        window.innerHeight || document.documentElement.clientHeight || 0;
      if (r.top < vh && r.bottom > 0) {
        setInView(true);
      }
    }, 1500);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [node, threshold, rootMargin]);

  return [ref, inView];
}

function useRevealLate() {
  return useReveal({ threshold: 0.25, rootMargin: "0px 0px -10% 0px" });
}

const optimizeVideoUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("/video/upload/")) return url;
  if (/\/video\/upload\/[^/]*,/.test(url)) return url;
  return url.replace(
    "/video/upload/",
    "/video/upload/w_960,q_auto:good,f_auto/",
  );
};
const HERO_SLIDE_MS = 900;

function HeroMediaSlider({ hero }) {
  const slides = useMemo(() => {
    const list = [];
    if (hero?.video) {
      list.push({ type: "video", src: toAbsoluteUrl(hero.video) });
    }
    const imgs =
      hero?.images && hero.images.length
        ? hero.images
        : hero?.backgroundImage
          ? [hero.backgroundImage]
          : [];
    imgs
      .filter(Boolean)
      .forEach((img) => list.push({ type: "image", src: toAbsoluteUrl(img) }));
    return list;
  }, [hero?.video, hero?.images, hero?.backgroundImage]);

  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState(null);
  const timerRef = useRef(null);
  const cleanupRef = useRef(null);
  const videoRef = useRef(null);

  const intervalMs = Math.max(2, hero?.slideInterval ?? 4.5) * 1000;
  const overlayOpacity = hero?.overlayOpacity ?? 0.9;

  useEffect(() => {
    setActive(0);
    setPrev(null);
  }, [slides.length]);

  const goTo = useCallback((nextIndex) => {
    setActive((currentActive) => {
      if (nextIndex === currentActive || nextIndex == null)
        return currentActive;
      setPrev(currentActive);

      if (cleanupRef.current) clearTimeout(cleanupRef.current);
      cleanupRef.current = setTimeout(() => {
        setPrev(null);
        cleanupRef.current = null;
      }, HERO_SLIDE_MS);

      return nextIndex;
    });
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      const v = videoRef.current;
      const currentSlide = slides[active];
      if (currentSlide?.type !== "video") {
        try {
          v.pause();
        } catch (e) {}
      }
    }
  }, [active, slides]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (slides.length < 2) return undefined;
    const current = slides[active];
    if (!current || current.type !== "image") return undefined;

    timerRef.current = setTimeout(() => {
      goTo((active + 1) % slides.length);
    }, intervalMs);

    return () => clearTimeout(timerRef.current);
  }, [active, slides, intervalMs, goTo]);

  useEffect(() => {
    const current = slides[active];
    if (current?.type === "video" && videoRef.current) {
      const v = videoRef.current;
      try {
        v.currentTime = 0;
        v.muted = true;
        v.playsInline = true;
        const p = v.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } catch (e) {}
    }
  }, [active, slides]);

  useEffect(
    () => () => {
      if (cleanupRef.current) clearTimeout(cleanupRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  if (!slides.length) return null;

  const currentSlide = slides[active];
  const prevSlide = prev != null ? slides[prev] : null;

  const renderMedia = (slide, isActive, ref) => {
    if (slide.type === "video") {
      return (
        <video
          ref={isActive ? ref : null}
          className="hero-slide-media hero-slide-video"
          src={optimizeVideoUrl(slide.src)}
          muted
          playsInline
          autoPlay={isActive}
          preload="auto"
          onEnded={
            isActive ? () => goTo((active + 1) % slides.length) : undefined
          }
        />
      );
    }
    return <img className="hero-slide-media" src={slide.src} alt="" />;
  };

  return (
    <div className="hero-slider" aria-hidden="true">
      {prevSlide && (
        <div key={`prev-${prev}`} className="hero-slide hero-slide--exit">
          <div className="hero-slide-zoom">
            {renderMedia(prevSlide, false, null)}
          </div>
        </div>
      )}

      <div key={`active-${active}`} className="hero-slide hero-slide--enter">
        <div
          className={`hero-slide-zoom${currentSlide.type === "image" ? " is-active" : ""}`}
        >
          {renderMedia(currentSlide, true, videoRef)}
        </div>
      </div>

      <div
        className="hero-slide-overlay"
        style={{
          background: `linear-gradient(rgba(250,250,250,${Math.max(
            0,
            overlayOpacity - 0.05,
          )}), rgba(250,250,250,${overlayOpacity}))`,
        }}
      />

      {slides.length > 1 && (
        <div className="hero-slide-dots">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`hero-dot${i === active ? " is-active" : ""}`}
              onClick={() => goTo(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") goTo(i);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const dispatch = useDispatch();
  const categories = useSelector(selectCategories);
  const featuredProducts = useSelector(selectFeaturedProducts);
  const [content, setContent] = useState(EMPTY_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchFeaturedProducts());

    const loadHomeData = async () => {
      try {
        const contentRes = await api.get("/site-content/homepage");
        if (contentRes.success) {
          setContent(mergeContent(contentRes.content));
        } else {
          setContent(EMPTY_CONTENT);
        }
      } catch (err) {
        setContent(EMPTY_CONTENT);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, [dispatch]);

  const hero = content.hero;
  const categoriesSection = content.categoriesSection;
  const featuredSection = content.featuredSection;
  const brandStory = content.brandStory;

  const hasHeroContent = !!(
    hero?.badge ||
    hero?.heading ||
    hero?.subheading ||
    hero?.backgroundImage ||
    (hero?.images && hero.images.length) ||
    hero?.video
  );
  const hasCategoriesContent = !!(
    categoriesSection?.eyebrow ||
    categoriesSection?.heading ||
    categories.length
  );
  const hasFeaturedContent = !!(
    featuredSection?.eyebrow ||
    featuredSection?.heading ||
    featuredSection?.ctaText ||
    featuredProducts.length
  );
  const hasBrandContent = !!(
    brandStory?.eyebrow ||
    brandStory?.heading ||
    brandStory?.paragraph1 ||
    brandStory?.paragraph2 ||
    brandStory?.image
  );
  const brandImage = brandStory?.image ? toAbsoluteUrl(brandStory.image) : "";

  const [categoriesRef, categoriesInView] = useRevealLate();
  const [featuredRef, featuredInView] = useReveal();
  const [brandRef, brandInView] = useReveal();

  return (
    <div className="home">
      <section className="home-hero" id="home-top">
        {hasHeroContent ? (
          <>
            <HeroMediaSlider hero={hero} />

            <div className="container home-hero-inner">
              {hero.badge && (
                <span className="badge badge-gold home-hero-badge">
                  {hero.badge}
                </span>
              )}
              {hero.heading && (
                <h1 className="home-hero-title">{hero.heading}</h1>
              )}
              {hero.subheading && (
                <p className="home-hero-sub">{hero.subheading}</p>
              )}
              {(hero.primaryBtnText || hero.secondaryBtnText) && (
                <div className="home-hero-actions">
                  {hero.primaryBtnText && hero.primaryBtnLink && (
                    <Link to={hero.primaryBtnLink} className="btn btn-primary">
                      {hero.primaryBtnText} <ArrowRight size={16} />
                    </Link>
                  )}
                  {hero.secondaryBtnText && hero.secondaryBtnLink && (
                    <Link
                      to={hero.secondaryBtnLink}
                      className="btn btn-secondary"
                    >
                      {hero.secondaryBtnText}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="home-hero-placeholder" aria-hidden="true" />
        )}
      </section>

      {hasCategoriesContent && (
        <section
          ref={categoriesRef}
          className={`home-section home-section--white reveal-section reveal-categories${
            categoriesInView ? " in-view" : ""
          }`}
        >
          <div className="container">
            {categoriesSection.eyebrow && (
              <div className="home-eyebrow">{categoriesSection.eyebrow}</div>
            )}
            {categoriesSection.heading && (
              <h2 className="home-heading">{categoriesSection.heading}</h2>
            )}

            {categories.length > 0 && (
              <div className="home-categories">
                {categories.map((cat) => (
                  <Link
                    key={cat._id}
                    to={`/products?category=${cat.slug}`}
                    className="category-card"
                  >
                    {cat.image && (
                      <img
                        src={toAbsoluteUrl(cat.image)}
                        alt={cat.name}
                        className="category-card-img"
                      />
                    )}
                    <div className="category-card-overlay">
                      <h3 className="category-card-title">{cat.name}</h3>
                      {cat.description && (
                        <p className="category-card-desc">{cat.description}</p>
                      )}
                      <span className="category-card-cta">
                        View House <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {hasFeaturedContent && (
        <section
          ref={featuredRef}
          className={`home-section home-section--secondary reveal-section${
            featuredInView ? " in-view" : ""
          }`}
        >
          <div className="container">
            <div className="home-featured-header">
              <div>
                {featuredSection.eyebrow && (
                  <div className="home-eyebrow">{featuredSection.eyebrow}</div>
                )}
                {featuredSection.heading && (
                  <h2 className="home-heading">{featuredSection.heading}</h2>
                )}
              </div>
              {featuredSection.ctaText && featuredSection.ctaLink && (
                <Link
                  to={featuredSection.ctaLink}
                  className="btn btn-secondary btn-sm"
                >
                  {featuredSection.ctaText} <ArrowRight size={14} />
                </Link>
              )}
            </div>

            {loading ? (
              <div className="home-spinner-wrap">
                <div className="spinner"></div>
              </div>
            ) : (
              <div className="grid-products">
                {featuredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {hasBrandContent && (
        <section
          ref={brandRef}
          className={`home-brand reveal-section${brandInView ? " in-view" : ""}`}
        >
          <div className="container home-brand-inner">
            <div className="home-brand-text">
              {brandStory.eyebrow && (
                <span className="home-brand-eyebrow">{brandStory.eyebrow}</span>
              )}
              {brandStory.heading && (
                <h2 className="home-brand-heading">{brandStory.heading}</h2>
              )}
              {brandStory.paragraph1 && (
                <p className="home-brand-para">{brandStory.paragraph1}</p>
              )}
              {brandStory.paragraph2 && (
                <p className="home-brand-para">{brandStory.paragraph2}</p>
              )}
              {brandStory.ctaText && brandStory.ctaLink && (
                <Link to={brandStory.ctaLink} className="btn btn-primary">
                  {brandStory.ctaText}
                </Link>
              )}
            </div>

            {brandImage && (
              <div className="home-brand-image-wrap">
                <img
                  src={brandImage}
                  alt="Editorial AXI Product Shot"
                  className="home-brand-image"
                />
              </div>
            )}
          </div>
        </section>
      )}

      <HomeReviewsSection />

      <style>{`
        /* ---------------------------------------------------------------
           Homepage wrapper
           --------------------------------------------------------------- */
        .home {
          --navbar-offset: 110px;
          margin-top: calc(-1 * var(--navbar-offset));
          position: relative;
        }

        /* ---------------------------------------------------------------
           Hero section
           --------------------------------------------------------------- */
        .home-hero {
          position: relative;
          height: 100vh;
          height: 100svh;
          min-height: 560px;
          max-height: 900px;
          background-color: var(--bg-secondary);
          color: var(--text-primary);
          display: flex;
          align-items: center;
          border-bottom: 1px solid var(--border-light);
          overflow: hidden;
          padding-top: var(--navbar-offset);
          box-sizing: border-box;
          scroll-margin-top: 0;
        }

        body:has(.navbar-header.has-announcement) .home-hero {
          padding-top: calc(var(--navbar-offset) + 30px);
        }

        .home-hero-placeholder {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            135deg,
            var(--bg-secondary) 0%,
            var(--bg-tertiary) 100%
          );
        }

        /* ---------------------------------------------------------------
           Hero slider
           --------------------------------------------------------------- */
        .hero-slider {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 0;
          background-color: var(--bg-secondary);
        }

        .hero-slide {
          position: absolute;
          inset: 0;
          will-change: transform;
          backface-visibility: hidden;
          overflow: hidden;
          background-color: var(--bg-secondary);
        }

        .hero-slide--enter {
          animation: heroSlideIn 900ms cubic-bezier(0.22, 1, 0.36, 1) both;
          z-index: 2;
        }

        .hero-slide--exit {
          animation: heroSlideOut 900ms cubic-bezier(0.22, 1, 0.36, 1) both;
          z-index: 1;
        }

        @keyframes heroSlideIn {
          from { transform: translateX(100%); opacity: 0.7; }
          to   { transform: translateX(0);   opacity: 1; }
        }

        @keyframes heroSlideOut {
          from { transform: translateX(0);    opacity: 1; }
          to   { transform: translateX(-100%); opacity: 0.7; }
        }

        .hero-slide-zoom {
          position: absolute;
          inset: 0;
        }

        .hero-slide-zoom.is-active {
          animation: heroKenBurns 6.5s ease-out forwards;
        }

        @keyframes heroKenBurns {
          from { transform: scale(1.07); }
          to   { transform: scale(1); }
        }

        .hero-slide-media {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-position: center center;
          object-fit: fill;
        }

        .hero-slide-video {
          animation: none !important;
          transform: none !important;
        }

        .hero-slide-overlay {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
        }

        .hero-slide-dots {
          position: absolute;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 4;
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .hero-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(17, 17, 17, 0.22);
          transition: background 0.35s ease, transform 0.35s ease;
          cursor: pointer;
          border: none;
          padding: 0;
        }

        .hero-dot.is-active {
          background: var(--text-primary);
          transform: scale(1.4);
        }

        /* ---------------------------------------------------------------
           Hero text
           --------------------------------------------------------------- */
        .home-hero-inner {
          position: relative;
          z-index: 4;
          padding: 4.5rem 1.5rem;
          max-width: 900px;
          width: 100%;
        }

        .home-hero-badge {
          margin-bottom: 1.5rem;
          letter-spacing: 0.2em;
        }

        .home-hero-title {
          font-family: var(--font-serif);
          font-size: clamp(2.2rem, 5vw, 4.2rem);
          font-weight: 400;
          line-height: 1.08;
          letter-spacing: -0.02em;
          margin-bottom: 1.5rem;
          color: var(--text-primary);
        }

        .home-hero-sub {
          font-size: 1.05rem;
          color: var(--text-secondary);
          line-height: 1.75;
          max-width: 580px;
          margin-bottom: 2.5rem;
        }

        .home-hero-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .home-hero-badge,
        .home-hero-title,
        .home-hero-sub,
        .home-hero-actions {
          animation: heroFadeUp 0.85s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .home-hero-badge   { animation-delay: 0.1s; }
        .home-hero-title   { animation-delay: 0.22s; }
        .home-hero-sub     { animation-delay: 0.38s; }
        .home-hero-actions { animation-delay: 0.52s; }

        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ---------------------------------------------------------------
           Section shells
           --------------------------------------------------------------- */
        .home-section {
          padding: 5rem 0;
          border-bottom: 1px solid var(--border-light);
        }

        .home-section--white {
          background-color: #FFFFFF;
        }

        .home-section--secondary {
          background-color: var(--bg-secondary);
        }

        .home-eyebrow {
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
        }

        .home-heading {
          font-family: var(--font-serif);
          font-size: 2.2rem;
          margin-bottom: 2.5rem;
          color: var(--text-primary);
          line-height: 1.18;
        }

        /* ---------------------------------------------------------------
           Scroll-reveal
           --------------------------------------------------------------- */
        .reveal-section {
          opacity: 0;
          transform: translateY(32px);
          transition:
            opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }

        .reveal-section.in-view {
          opacity: 1;
          transform: translateY(0);
        }

        .reveal-section.reveal-categories {
          transition:
            opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.08s,
            transform 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.08s;
        }

        .reveal-section .category-card,
        .reveal-section .product-card {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }

        .reveal-section.in-view .category-card,
        .reveal-section.in-view .product-card {
          opacity: 1;
          transform: translateY(0);
        }

        .reveal-section.in-view .category-card:nth-child(1),
        .reveal-section.in-view .product-card:nth-child(1) { transition-delay: 0.05s; }

        .reveal-section.in-view .category-card:nth-child(2),
        .reveal-section.in-view .product-card:nth-child(2) { transition-delay: 0.12s; }

        .reveal-section.in-view .category-card:nth-child(3),
        .reveal-section.in-view .product-card:nth-child(3) { transition-delay: 0.19s; }

        .reveal-section.in-view .category-card:nth-child(4),
        .reveal-section.in-view .product-card:nth-child(4) { transition-delay: 0.26s; }

        .reveal-section.in-view .category-card:nth-child(5),
        .reveal-section.in-view .product-card:nth-child(5) { transition-delay: 0.33s; }

        .reveal-section.in-view .category-card:nth-child(6),
        .reveal-section.in-view .product-card:nth-child(6) { transition-delay: 0.40s; }

        .reveal-section.in-view .category-card:nth-child(n+7),
        .reveal-section.in-view .product-card:nth-child(n+7) { transition-delay: 0.45s; }

        .reveal-section .home-brand-image-wrap {
          opacity: 0;
          transform: translateX(28px);
          transition: opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.85s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }

        .reveal-section.in-view .home-brand-image-wrap {
          opacity: 1;
          transform: translateX(0);
          transition-delay: 0.18s;
        }

        .reveal-section .home-brand-text {
          opacity: 0;
          transform: translateX(-24px);
          transition: opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.85s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }

        .reveal-section.in-view .home-brand-text {
          opacity: 1;
          transform: translateX(0);
          transition-delay: 0.05s;
        }

        /* ---------------------------------------------------------------
           Categories grid
           --------------------------------------------------------------- */
        .home-categories {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
          gap: 1.5rem;
        }

        .category-card {
          position: relative;
          height: 360px;
          overflow: hidden;
          display: block;
          text-decoration: none;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
        }

        .category-card-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
          transition: transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
          display: block;
        }

        .category-card:hover .category-card-img {
          transform: scale(1.04);
        }

        .category-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.72) 0%,
            rgba(0, 0, 0, 0.08) 55%,
            transparent 100%
          );
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          color: #FFFFFF;
        }

        .category-card-title {
          font-family: var(--font-serif);
          font-size: 1.7rem;
          font-weight: 400;
          line-height: 1.15;
        }

        .category-card-desc {
          font-size: 0.83rem;
          color: rgba(255, 255, 255, 0.82);
          margin-top: 0.35rem;
          line-height: 1.45;
        }

        .category-card-cta {
          font-size: 0.72rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-top: 0.85rem;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          opacity: 0.85;
        }

        /* ---------------------------------------------------------------
           Featured section header
           --------------------------------------------------------------- */
        .home-featured-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .home-featured-header .home-heading {
          margin-bottom: 0;
        }

        .home-spinner-wrap {
          display: flex;
          justify-content: center;
          padding: 4rem;
        }

        /* ---------------------------------------------------------------
           Brand story
           --------------------------------------------------------------- */
        .home-brand {
          background-color: #FFFFFF;
          color: var(--text-primary);
          padding: 6rem 0;
        }

        .home-brand-inner {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 4rem;
          align-items: center;
        }

        .home-brand-text {
          min-width: 0;
        }

        .home-brand-eyebrow {
          font-size: 0.72rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--accent-gold);
          font-weight: 700;
        }

        .home-brand-heading {
          font-family: var(--font-serif);
          font-size: 2.4rem;
          margin: 0.9rem 0 1.4rem 0;
          font-weight: 400;
          line-height: 1.18;
          color: var(--text-primary);
        }

        .home-brand-para {
          color: var(--text-secondary);
          font-size: 0.95rem;
          line-height: 1.8;
          margin-bottom: 1.4rem;
        }

        .home-brand-para:last-of-type {
          margin-bottom: 2rem;
        }

        .home-brand-image-wrap {
          position: relative;
          min-width: 0;
        }

        .home-brand-image {
          width: 100%;
          height: 500px;
          object-fit: cover;
          object-position: center center;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-light);
          display: block;
        }

        /* ---------------------------------------------------------------
           Responsive — 900px (tablet)
           --------------------------------------------------------------- */
        @media (max-width: 900px) {
          .home-brand-inner {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }

          .reveal-section .home-brand-image-wrap {
            transform: translateY(24px);
          }

          .reveal-section.in-view .home-brand-image-wrap {
            transform: translateY(0);
          }

          .reveal-section .home-brand-text {
            transform: translateY(24px);
          }

          .reveal-section.in-view .home-brand-text {
            transform: translateY(0);
          }

          .home-brand-image {
            height: 360px;
          }
        }

        /* ---------------------------------------------------------------
           Responsive — 640px (mobile)
           Only component-level rules. Hero padding is intentionally
           NOT touched here — it's controlled by the base rules above
           so the hero always clears the header regardless of viewport.
           --------------------------------------------------------------- */
        @media (max-width: 640px) {
          .home-section {
            padding: 3rem 0;
          }

          .home-heading {
            font-size: 1.55rem;
            margin-bottom: 1.5rem;
          }

          .home-categories {
            gap: 1rem;
          }

          .category-card {
            height: 260px;
          }

          .category-card-overlay {
            padding: 1.1rem;
          }

          .category-card-title {
            font-size: 1.3rem;
          }

          .category-card-desc {
            font-size: 0.78rem;
          }

          .home-brand {
            padding: 3.5rem 0;
          }

          .home-brand-heading {
            font-size: 1.7rem;
          }

          .home-brand-para {
            font-size: 0.88rem;
          }

          .home-brand-image {
            height: 260px;
          }

          .reveal-section {
            transform: translateY(22px);
          }

          .reveal-section .category-card,
          .reveal-section .product-card {
            transform: translateY(16px);
          }
        }

        /* ---------------------------------------------------------------
           Responsive — 400px (small phones)
           --------------------------------------------------------------- */
        @media (max-width: 400px) {
          .home-hero-title {
            font-size: 1.9rem;
          }

          .category-card {
            height: 220px;
          }

          .category-card-title {
            font-size: 1.15rem;
          }

          .home-brand-image {
            height: 210px;
          }
        }

        /* ---------------------------------------------------------------
           Reduced motion
           --------------------------------------------------------------- */
        @media (prefers-reduced-motion: reduce) {
          .home-hero-badge,
          .home-hero-title,
          .home-hero-sub,
          .home-hero-actions,
          .hero-slide--enter,
          .hero-slide--exit,
          .hero-slide-zoom,
          .reveal-section,
          .reveal-section.reveal-categories,
          .reveal-section .category-card,
          .reveal-section .product-card,
          .reveal-section .home-brand-image-wrap,
          .reveal-section .home-brand-text {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}