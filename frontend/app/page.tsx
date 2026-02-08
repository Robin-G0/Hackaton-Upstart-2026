"use client";

import Image from "next/image";
import datacenterDark from "../image/dark-datacenter.png";
import datacenterLight from "../image/datacenter.png";
import aronPhoto from "../image/aron-bg.jpg";
import logo from "../image/logo-verdante.png";
import robinPhoto from "../image/robin.png";
import shirinPhoto from "../image/shirin.jpg";
import OrbitingPoints from "./components/OrbitingPoints";

export default function Page() {
  const orbitPoints = [
    {
      title: "Grid Signals",
      detail: "Real-time insights align workloads with cleaner energy.",
      angle: 20,
      radius: 190,
      depth: 0.4,
    },
    {
      title: "Load Shaping",
      detail: "Shift demand to low-carbon windows without downtime.",
      angle: 150,
      radius: 220,
      depth: 0.3,
    },
    {
      title: "Impact Reports",
      detail: "Track emissions reductions across every region.",
      angle: 280,
      radius: 170,
      depth: 0.5,
    },
    {
      title: "Compliance",
      detail: "Export-ready sustainability reporting and audit trails.",
      angle: 70,
      radius: 205,
      depth: 0.35,
    },
    {
      title: "Forecasting",
      detail: "Predict carbon intensity before workloads launch.",
      angle: 210,
      radius: 235,
      depth: 0.25,
    },
    {
      title: "Automation",
      detail: "Policies auto-route jobs to cleaner regions.",
      angle: 330,
      radius: 180,
      depth: 0.45,
    },
  ];

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

      <section
        style={{
          minHeight: "100vh",
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
                src={datacenterDark}
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
      </section>
      <section
        style={{
          width: "100%",
          maxWidth: 1120,
          margin: "0 auto",
          padding: "16px 24px 48px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          textAlign: "center",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "clamp(2rem, 3vw, 2.75rem)" }}>What We Do</h2>
        <p style={{ margin: 0, maxWidth: 600, color: "#4a5a4a", lineHeight: 1.6 }}>
          We sit between your cloud scheduler and energy signals, translating grid intensity into
          actionable decisions.
        </p>
        <div
          style={{
            width: "100%",
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {[
            {
              title: "Measure",
              detail: "Ingest live carbon data and workload telemetry.",
            },
            {
              title: "Optimize",
              detail: "Recommend timing, region shifts, and load shaping.",
            },
            {
              title: "Act",
              detail: "Automate policies and track savings over time.",
            },
          ].map((step) => (
            <div
              key={step.title}
              style={{
                border: "1px solid #d4e2d6",
                borderRadius: 20,
                padding: "20px",
                background: "#ffffff",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                minHeight: 140,
              }}
            >
              <div style={{ fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {step.title}
              </div>
              <p style={{ margin: 0, color: "#4a5a4a", lineHeight: 1.5 }}>{step.detail}</p>
            </div>
          ))}
        </div>
      </section>
      <section
        style={{
          width: "100%",
          maxWidth: 960,
          margin: "24px auto 0",
          padding: "48px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          textAlign: "center",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "clamp(2rem, 3vw, 2.75rem)" }}>About Us</h2>
        <p style={{ margin: 0, maxWidth: 520, color: "#4a5a4a", lineHeight: 1.6 }}>
          Verdante helps teams make cloud decisions that cut carbon emissions without
          sacrificing performance.
        </p>
        <div
          style={{
            width: "100%",
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {[
            {
              name: "Aron Segovia",
              summary: "Short summary of Aron goes here.",
              photo: aronPhoto,
            },
            {
              name: "Robin Glaude",
              summary: "Short summary of Robin goes here.",
              photo: robinPhoto,
            },
            {
              name: "Shrin Zoufan",
              summary: "Short summary of Shrin goes here.",
              photo: shirinPhoto,
            },
          ].map((member) => (
            <div
              key={member.name}
              style={{
                border: "1px solid #d4e2d6",
                borderRadius: 20,
                padding: "20px",
                background: "#ffffff",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <Image
                src={member.photo}
                alt={member.name}
                style={{
                  width: 140,
                  height: 140,
                  objectFit: "cover",
                  borderRadius: "50%",
                  margin: "0 auto",
                }}
              />
              <div style={{ fontSize: 16, fontWeight: 600, textAlign: "center" }}>
                {member.name}
              </div>
              <p style={{ margin: 0, color: "#4a5a4a", lineHeight: 1.5, textAlign: "center" }}>
                {member.summary}
              </p>
            </div>
          ))}
        </div>
        <div style={{ width: "100%", maxWidth: 560, position: "relative" }}>
          <Image
            src={datacenterLight}
            alt="Datacenter"
            style={{ width: "100%", height: "auto" }}
            priority
          />
          <OrbitingPoints points={orbitPoints} radius={190} size={32} />
        </div>
      </section>
      <section
        style={{
          width: "100%",
          maxWidth: 1120,
          margin: "0 auto 48px",
          padding: "24px 24px 72px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
          textAlign: "center",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "clamp(2rem, 3vw, 2.75rem)" }}>Pricing</h2>
        <p style={{ margin: 0, maxWidth: 560, color: "#4a5a4a", lineHeight: 1.6 }}>
          Flexible plans for teams at every stage of carbon-aware optimization.
        </p>
        <div
          style={{
            width: "100%",
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {[
            {
              name: "Starter",
              price: "$0",
              detail: "Lightweight insights for small teams",
            },
            {
              name: "Growth",
              price: "$299",
              detail: "Automation plus forecasting for scaling orgs",
            },
            {
              name: "Enterprise",
              price: "Custom",
              detail: "Full governance, multi-region optimization",
            },
          ].map((plan) => (
            <div
              key={plan.name}
              style={{
                border: "1px solid #d4e2d6",
                borderRadius: 20,
                padding: "24px 20px",
                textAlign: "left",
                background: "#fbfdfb",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                minHeight: 160,
              }}
            >
              <div style={{ fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {plan.name}
              </div>
              <div style={{ fontSize: 28, fontWeight: 600 }}>{plan.price}</div>
              <p style={{ margin: 0, color: "#4a5a4a", lineHeight: 1.5 }}>{plan.detail}</p>
            </div>
          ))}
        </div>
      </section>
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
