"use client";

export function Tabs<T extends string>(props: {
  value: T;
  onChange: (v: T) => void;
  items: Array<{ key: T; label: string }>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {props.items.map((it) => {
        const active = it.key === props.value;
        return (
          <button
            key={it.key}
            onClick={() => props.onChange(it.key)}
            className={[
              "rounded-xl px-3 py-2 text-sm border",
              active
                ? "border-brand-blue bg-brand-blue/20 text-black dark:text-white"
                : "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900",
            ].join(" ")}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
