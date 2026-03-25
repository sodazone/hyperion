import { ChevronUpDownIcon } from "@/console/components/icons";
import { NetworkCache } from "@/console/network.cache";
import type { Category } from "@/db";
import { topLevelCategories } from "@/intel/mapping";

export function TagRow(t?: { network?: number; tag?: string }) {
  return (
    <div className="flex items-center gap-2 tag-row">
      <div className="ui-select">
        <select name="tags[][network]" defaultValue={t?.network ?? 768}>
          {NetworkCache.all().map(({ name, id }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <div className="ui-select-btn">
          <ChevronUpDownIcon />
        </div>
      </div>

      <input
        type="text"
        required
        name="tags[][tag]"
        defaultValue={t?.tag ?? ""}
        placeholder="name:lazarus"
        className="ui-input flex-1 px-3 py-2"
      />

      <button
        type="button"
        hx-on:click="this.closest('.tag-row')?.remove()"
        className="text-zinc-600 hover:text-red-400"
      >
        ✕
      </button>
    </div>
  );
}

export function CategoryRow({
  network = 768,
  category,
}: Partial<Category> = {}) {
  return (
    <div className="flex items-center gap-2 category-row">
      <div className="ui-select">
        <select name="categories[][network]" required defaultValue={network}>
          {NetworkCache.all().map(({ name, id }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <div className="ui-select-btn">
          <ChevronUpDownIcon />
        </div>
      </div>

      <div className="ui-select">
        <select required name="categories[][category]" defaultValue={category}>
          {topLevelCategories.map(({ category, label }) => (
            <option key={category} value={category}>
              {label}
            </option>
          ))}
        </select>
        <div className="ui-select-btn">
          <ChevronUpDownIcon />
        </div>
      </div>

      <button
        type="button"
        hx-on:click="this.closest('.category-row')?.remove()"
        className="text-zinc-600 hover:text-red-400"
      >
        ✕
      </button>
    </div>
  );
}
