"use client";

import Image from "next/image";
import datacenter from "../image/dark-datacenter.png";
import logo from "../image/logo-verdante.png";

export default function Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "32px 24px 48px",
        backgroundColor: "#ffffff",
      }}
    >
      <header
        style={{
          width: "100%",
          maxWidth: 1120,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Image
            src={logo}
            alt="Verdante logo"
            width={72}
            height={72}
            priority
          />
          <div
            style={{
              fontSize: 18,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#3b5b46",
              fontWeight: 600,
            }}
          >
            Verdante
          </div>
        </div>
        <button
          type="button"
          style={{
            border: "1px solid #1f3326",
            background: "transparent",
            color: "#1f3326",
            padding: "10px 18px",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Login
        </button>
      </header>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1120,
            display: "flex",
            alignItems: "center",
            gap: 48,
            flexWrap: "wrap",
          }}
        >
          <section style={{ flex: "1 1 320px", minWidth: 280 }}>
            <h1
              style={{
                fontSize: "clamp(2.5rem, 4vw, 3.6rem)",
                lineHeight: 1.1,
                margin: 0,
                color: "#0c0f0a",
              }}
            >
              Carbon-Aware Cloud Computing
            </h1>
            <p
              style={{
                marginTop: 20,
                fontSize: "1.1rem",
                lineHeight: 1.6,
                color: "#4a5a4a",
                maxWidth: 420,
              }}
            >
              Optimize infrastructure decisions with real-time grid signals, workload shaping, and
              sustainability analytics.
            </p>
          </section>
          <section
            style={{
              flex: "1 1 360px",
              minWidth: 280,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 520,
                position: "relative",
              }}
            >
              <Image
                src={datacenter}
                alt="Datacenter"
                style={{
                  width: "100%",
                  height: "auto",
                }}
                priority
              />
            </div>
          </section>
        </div>
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "50%",
          bottom: 24,
          width: 18,
          height: 18,
          borderRight: "2px solid #1f3326",
          borderBottom: "2px solid #1f3326",
          transform: "translateX(-50%) rotate(45deg)",
          animation: "floatArrow 2.8s ease-in-out infinite",
          opacity: 0.65,
          pointerEvents: "none",
        }}
      />
      <style jsx global>{`
        @keyframes floatArrow {
          0% {
            transform: translateX(-50%) translateY(0) rotate(45deg);
          }
          50% {
            transform: translateX(-50%) translateY(10px) rotate(45deg);
          }
          100% {
            transform: translateX(-50%) translateY(0) rotate(45deg);
          }
        }
      `}</style>
    </main>
  );
}
