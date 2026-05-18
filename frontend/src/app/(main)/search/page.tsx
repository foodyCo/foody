import { SearchHistory } from "@/components/search/search-history";
import { DEFAULT_TWEAKS } from "@/lib/tweaks";
import { POPULAR_TAGS } from "@/lib/mock-data";

export default function SearchPage() {
  return (
    <main className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 flex flex-col pt-12.5">
        <div className="hide-scroll flex-1 overflow-y-auto pb-25">
          <SearchHistory brand={DEFAULT_TWEAKS.brand} popularTags={POPULAR_TAGS} />
        </div>
      </div>
    </main>
  );
}
