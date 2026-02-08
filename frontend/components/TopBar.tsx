"use client";

import { useRef } from "react";
import { AppState } from "@/lib/types";
import { downloadJson, readJsonFile } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { UIModeSwitch } from "@/components/UIModeSwitch";
import type { UIMode } from "@/lib/uiMode";
import Image from "next/image";

export function TopBar(props: {
  state: AppState;
  setState: (s: AppState) => void;
  titleRight?: string;
  onCreateProject: () => void;
  onUiModeChange?: (m: UIMode) => void;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="no-print sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button onClick={() => router.push("/")} className="cursor-pointer hover:opacity-80 transition-opacity">
                <Image src="/image/logo-verdante.png" alt="Verdante Logo" width={50} height={50} className="rounded-xl" />
              </button>
              <UIModeSwitch onChange={props.onUiModeChange} />
            </div>

            <div className="min-w-0">
              <div className="truncate text-sm text-zinc-600">
                {props.state.workspace.name}
              </div>
              <div className="truncate text-base font-semibold text-black">
                {props.titleRight || ""}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          

          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const imported = (await readJsonFile(f)) as AppState;
              if (!imported || imported.version !== 1) {
                alert("Invalid import file (expected version 1).");
                return;
              }
              props.setState(imported);
              if (fileRef.current) fileRef.current.value = "";
              router.push("/dashboard");
            }}
          />
        

          <button
            onClick={props.onCreateProject}
            className="rounded-xl bg-gradient-to-r from-emerald-700 to-green-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}
