import { useEffect, useState } from "preact/hooks";
import {
  FocusContext,
  init,
  useFocusable,
} from "@noriginmedia/norigin-spatial-navigation";
import styles from "./App.module.css";

init({ visualDebug: false });

type Category =
  | "planets"
  | "starships"
  | "vehicles"
  | "people"
  | "films"
  | "species";
type RecordValue = string | string[];
type SwapiRecord = Record<string, RecordValue>;

const categories: { id: Category; label: string; icon: string }[] = [
  { id: "planets", label: "Planets", icon: "◉" },
  { id: "starships", label: "Starships", icon: "✦" },
  { id: "vehicles", label: "Vehicles", icon: "▰" },
  { id: "people", label: "People", icon: "✧" },
  { id: "films", label: "Films", icon: "▣" },
  { id: "species", label: "Species", icon: "◇" },
];

const transportFields = [
  ["model", "Model"],
  ["manufacturer", "Manufacturer"],
  ["cost_in_credits", "Cost in credits"],
  ["length", "Length"],
  ["crew", "Crew"],
  ["passengers", "Passengers"],
  ["cargo_capacity", "Cargo capacity"],
];

function FocusButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: string;
  active?: boolean;
  onPress: () => void;
}) {
  const { ref, focused } = useFocusable({ onEnterPress: onPress });
  return (
    <button
      ref={ref}
      class={`${styles.navButton} ${active ? styles.active : ""} ${focused ? styles.focused : ""}`}
      onClick={onPress}
    >
      <span class={styles.navIcon}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function ResultCard({
  item,
  index,
  selected,
  onSelect,
}: {
  item: SwapiRecord;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { ref, focused } = useFocusable({
    focusKey: `RESULT_${index}`,
    onEnterPress: onSelect,
  });
  return (
    <button
      ref={ref}
      class={`${styles.resultCard} ${focused ? styles.focusedCard : ""} ${selected ? styles.selectedCard : ""}`}
      onClick={onSelect}
    >
      <span class={styles.cardTitle}>{String(item.name || item.title)}</span>
      <span class={styles.cardMeta}>
        {item.model
          ? String(item.model)
          : item.climate
            ? String(item.climate)
            : item.director
              ? String(item.director)
              : "Archive record"}
      </span>
    </button>
  );
}

export function App() {
  const [category, setCategory] = useState<Category>("planets");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SwapiRecord[]>([]);
  const [selected, setSelected] = useState<SwapiRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { ref: resultsRef, focusKey: resultsFocusKey } = useFocusable({
    focusKey: "RESULTS",
  });

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const fetchAllPages = async () => {
      const records: SwapiRecord[] = [];
      let nextUrl: string | null =
        `https://swapi.dev/api/${category}/?format=json`;
      while (nextUrl) {
        const response = await fetch(nextUrl, { signal: controller.signal });
        if (!response.ok)
          throw new Error(`The archive returned ${response.status}.`);
        const data = await response.json();
        if (Array.isArray(data.results)) records.push(...data.results);
        nextUrl = data.next;
      }
      return records;
    };
    fetchAllPages()
      .then((records) => {
        setItems(records);
        setSelected(records[0] ?? null);
      })
      .catch((fetchError: Error) => {
        if (fetchError.name !== "AbortError")
          setError(
            "The Holocron could not be reached. Check the connection and try again.",
          );
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [category]);

  const filteredItems = items.filter((item) =>
    String(item.name || item.title)
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const categoryLabel =
    categories.find((item) => item.id === category)?.label ?? category;
  const isTransport = category === "starships" || category === "vehicles";

  return (
    <main class={styles.app}>
      <header class={styles.header}>
        <div class={styles.brand}>
          <span class={styles.brandMark}>✦</span>
          <div>
            <h1>GALAXY ATLAS</h1>
          </div>
        </div>
      </header>

      <div class={styles.body}>
        <aside class={styles.sidebar}>
          <nav class={styles.nav} aria-label="Archive categories">
            {categories.map((item) => (
              <FocusButton
                key={item.id}
                label={item.label}
                icon={item.icon}
                active={category === item.id}
                onPress={() => {
                  setCategory(item.id);
                  setQuery("");
                }}
              />
            ))}
          </nav>
        </aside>

        <section class={styles.content}>
          <div class={styles.contentHeading}>
            <div>
              <p class={styles.eyebrow}>
                Index /{" "}
                {String(
                  categories.findIndex((item) => item.id === category) + 1,
                ).padStart(2, "0")}
              </p>
              <h2>{categoryLabel}</h2>
            </div>
            <span class={styles.recordCount}>
              {filteredItems.length} RECORDS
            </span>
          </div>
          <label class={styles.search}>
            <span>⌕</span>
            <input
              aria-label={`Search ${categoryLabel}`}
              value={query}
              onInput={(event) =>
                setQuery((event.currentTarget as HTMLInputElement).value)
              }
              placeholder={`Search ${categoryLabel.toLowerCase()}...`}
            />
            <kbd>TYPE TO SEARCH</kbd>
          </label>

          {loading && (
            <div class={styles.message}>
              <span class={styles.spinner} />
              <h3>Syncing the archive</h3>
              <p>Connecting to the Jedi Holocron...</p>
            </div>
          )}
          {!loading && error && (
            <div class={`${styles.message} ${styles.error}`}>
              <span class={styles.errorIcon}>!</span>
              <h3>Archive unavailable</h3>
              <p>{error}</p>
              <button
                class={styles.retry}
                onClick={() => setCategory(category)}
              >
                Try again
              </button>
            </div>
          )}
          {!loading && !error && filteredItems.length === 0 && (
            <div class={styles.message}>
              <span class={styles.errorIcon}>⌕</span>
              <h3>No records found</h3>
              <p>Try another search term.</p>
            </div>
          )}
          <FocusContext.Provider value={resultsFocusKey}>
            <div
              ref={resultsRef}
              class={styles.results}
              aria-label={`${categoryLabel} results`}
            >
              {!loading &&
                !error &&
                filteredItems.length > 0 &&
                filteredItems.map((item, index) => (
                  <ResultCard
                    key={String(item.url ?? index)}
                    item={item}
                    index={index}
                    selected={selected === item}
                    onSelect={() => setSelected(item)}
                  />
                ))}
            </div>
          </FocusContext.Provider>
        </section>

        <aside class={styles.detailPanel}>
          <p class={styles.eyebrow}>Selected record</p>
          {selected ? (
            <>
              <div class={styles.detailTop}>
                <span class={styles.detailGlyph}>
                  {String(selected.name || selected.title).slice(0, 1)}
                </span>
                <div>
                  <h2>{String(selected.name || selected.title)}</h2>
                  <p>{categoryLabel.toUpperCase()} / ARCHIVE ENTRY</p>
                </div>
              </div>
              <div class={styles.detailRule} />
              {isTransport ? (
                <div class={styles.specs}>
                  {transportFields.map(([field, label]) => (
                    <div class={styles.spec}>
                      <span>{label}</span>
                      <strong>{String(selected[field] || "—")}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div class={styles.specs}>
                  {Object.entries(selected)
                    .filter(
                      ([key]) =>
                        ![
                          "url",
                          "created",
                          "edited",
                          "films",
                          "people",
                          "species",
                          "starships",
                          "vehicles",
                        ].includes(key),
                    )
                    .slice(0, 7)
                    .map(([field, value]) => (
                      <div class={styles.spec}>
                        <span>{field.replaceAll("_", " ")}</span>
                        <strong>
                          {Array.isArray(value)
                            ? `${value.length} linked records`
                            : String(value || "—")}
                        </strong>
                      </div>
                    ))}
                </div>
              )}
              <div class={styles.detailFooter}>
                DATA SOURCE <strong>SWAPI.DEV</strong>
              </div>
            </>
          ) : (
            <div class={styles.emptyDetail}>
              Select a record
              <br />
              to inspect its data.
            </div>
          )}
        </aside>
      </div>
      <footer class={styles.footer}>
        <span>
          ▲ ▼ MOVE <i /> ◀ ▶ BROWSE <i /> ● SELECT
        </span>
        <span>SWAPI / COMMUNITY DATASET</span>
      </footer>
    </main>
  );
}
