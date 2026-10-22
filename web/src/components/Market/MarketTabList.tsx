import { type KeyboardEvent, type ReactNode, useRef } from "react";

interface MarketTabListProps<T extends string> {
  tabs: readonly { id: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  idPrefix: string;
  label: string;
  fill?: boolean;
}

export function MarketTabList<T extends string>({
  tabs,
  value,
  onChange,
  idPrefix,
  label,
  fill = false,
}: MarketTabListProps<T>) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number;
    switch (event.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % tabs.length;
        break;
      case "ArrowLeft":
        nextIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    onChange(tabs[nextIndex].id);
    buttons.current[nextIndex]?.focus();
  }

  return (
    <div role="tablist" aria-label={label} className={`event-tabs${fill ? " event-tabs-fill" : ""}`}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={(button) => {
            buttons.current[index] = button;
          }}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${tab.id}`}
          aria-selected={value === tab.id}
          aria-controls={`${idPrefix}-panel-${tab.id}`}
          tabIndex={value === tab.id ? 0 : -1}
          className="event-tab"
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
