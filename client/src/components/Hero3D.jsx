import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { SITE } from "../data/site.js";
import Logo from "./Logo.jsx";

// Scrolling flies the camera forward through framed panels. Edit panels in data/site.js.
const GAP = 650; // distance between panels in px
const XS = [-16, 16, -12, 14, -14, 0];

// Phase 1 (0 -> INTRO): logo, name and tagline shatter and scatter, veil clears, photos stay still.
// Phase 2 (INTRO -> 1): the camera zooms in through the photos.
// INTRO is the share of the hero's scroll used by phase 1. 0.1 is about 2 mouse-wheel scrolls.
const INTRO = 0.1;

// Deterministic "random" number between -1 and 1, so pieces fly the same way on every render.
const rnd = (i, k) => {
  const s = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
};

// 8 triangular shards radiating from a slightly off-centre crack point (47% 53%).
const C = "47% 53%";
const SHARDS = [
  `0 0, 50% 0, ${C}`,
  `50% 0, 100% 0, ${C}`,
  `100% 0, 100% 50%, ${C}`,
  `100% 50%, 100% 100%, ${C}`,
  `100% 100%, 50% 100%, ${C}`,
  `50% 100%, 0 100%, ${C}`,
  `0 100%, 0 50%, ${C}`,
  `0 50%, 0 0, ${C}`,
];

// One flying piece (a letter, a word or a logo shard). It stays put for the first 20% of the
// intro (the "crack" moment), then flies to `to` while spinning, shrinking and fading out.
function Piece({ p, to, style, children }) {
  const k = [0, INTRO * 0.2, INTRO];
  const x = useTransform(p, k, [0, 0, to.x]);
  const y = useTransform(p, k, [0, 0, to.y]);
  const rotate = useTransform(p, k, [0, 0, to.rot]);
  const scale = useTransform(p, k, [1, 1, to.s]);
  const opacity = useTransform(p, [0, INTRO * 0.5, INTRO], [1, 1, 0]);
  return (
    <motion.span
      aria-hidden="true"
      style={{
        display: "inline-block",
        x,
        y,
        rotate,
        scale,
        opacity,
        ...style,
      }}
    >
      {children}
    </motion.span>
  );
}

function Intro({ p }) {
  let n = 0; // running index so every letter/word gets its own direction
  const nameWords = SITE.name.split(" ");
  const tagline = `${SITE.tagline} Scroll to walk through the showroom.`;
  return (
    <>
      {/* Logo breaks into 8 shards that fly outward from the centre and fall */}
      <div
        style={{
          display: "grid",
          justifyItems: "center",
          marginBottom: "-30px",
          filter: "drop-shadow(0 4px 18px rgba(0,0,0,.85))",
        }}
      >
        {SHARDS.map((poly, i) => {
          const a = ((-112.5 + i * 45) * Math.PI) / 180;
          const d = 260 + rnd(i, 4) * 80;
          return (
            <Piece
              key={i}
              p={p}
              style={{ gridArea: "1 / 1", clipPath: `polygon(${poly})` }}
              to={{
                x: Math.cos(a) * d,
                y: Math.sin(a) * d + 140,
                rot: rnd(i, 5) * 120,
                s: 0.5,
              }}
            >
              <Logo size={150} />
            </Piece>
          );
        })}
      </div>

      {/* Name: every letter scatters on its own */}
      <h1 aria-label={SITE.name}>
        {nameWords.map((w, wi) => (
          <span
            key={wi}
            style={{
              display: "inline-block",
              whiteSpace: "nowrap",
              marginRight: wi < nameWords.length - 1 ? "0.3em" : 0,
            }}
          >
            {[...w].map((ch) => {
              const i = n++;
              return (
                <Piece
                  key={i}
                  p={p}
                  to={{
                    x: rnd(i, 1) * 380,
                    y: rnd(i, 2) * 200 + 150,
                    rot: rnd(i, 3) * 140,
                    s: 0.5,
                  }}
                >
                  {ch}
                </Piece>
              );
            })}
          </span>
        ))}
      </h1>

      {/* Tagline: every word scatters (smaller, quicker pieces) */}
      <p aria-label={tagline}>
        {tagline.split(" ").map((w) => {
          const i = n++;
          return (
            <span key={i}>
              <Piece
                p={p}
                to={{
                  x: rnd(i, 1) * 260,
                  y: rnd(i, 2) * 140 + 100,
                  rot: rnd(i, 3) * 60,
                  s: 0.7,
                }}
              >
                {w}
              </Piece>{" "}
            </span>
          );
        })}
      </p>
    </>
  );
}

export default function Hero3D() {
  const ref = useRef(null);
  const calm = useReducedMotion();
  const panels = SITE.hero;
  const { scrollYProgress: p } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Zoom only starts after the intro is over.
  const z = useTransform(
    p,
    [0, INTRO, 1],
    [0, 0, GAP * (panels.length - 1) + 400],
  );

  // Dark blurred veil clears over the intro, so the first photo is fully clear afterwards.
  const veilOpacity = useTransform(p, [0, INTRO], [1, 0]);
  const veilBlur = useTransform(p, [0, INTRO], ["blur(8px)", "blur(0px)"]);

  return (
    <section className={"hero" + (calm ? " calm" : "")} ref={ref}>
      <div className="sticky">
        <motion.div className="stage" style={{ z: calm ? 0 : z }}>
          {panels.map((pn, i) => {
            const x = XS[i % XS.length];
            return (
              <div
                key={pn.title + i}
                className="panel"
                style={{
                  "--x": `${x}vw`,
                  "--z": `${-i * GAP}px`,
                  "--r": `${-x * 0.9}deg`,
                  backgroundImage: pn.image ? `url(${pn.image})` : undefined,
                }}
              >
                <span>{pn.title}</span>
              </div>
            );
          })}
        </motion.div>

        <motion.div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
            pointerEvents: "none",
            opacity: calm ? 0.7 : veilOpacity,
            backdropFilter: calm ? "none" : veilBlur,
            WebkitBackdropFilter: calm ? "none" : veilBlur,
            background:
              "radial-gradient(ellipse at center, rgba(27,8,13,.94) 0%, rgba(27,8,13,.75) 45%, rgba(27,8,13,.4) 100%)",
          }}
        />

        <div
          className="hero-copy"
          style={{
            textShadow: "0 2px 24px rgba(0,0,0,.9), 0 0 3px rgba(0,0,0,.8)",
          }}
        >
          {calm ? (
            <>
              <div style={{ marginBottom: "-30px" }}>
                <Logo size={150} />
              </div>
              <h1>{SITE.name}</h1>
              <p>{SITE.tagline} Scroll to walk through the showroom.</p>
            </>
          ) : (
            <Intro p={p} />
          )}
        </div>
      </div>
    </section>
  );
}
