import { SearchHistory } from "@/components/search/search-history";
import { DEFAULT_TWEAKS } from "@/lib/tweaks";

// POPULAR_TAGS хардкод удалён (SO3).
// TODO: загружать из /api/v1/tags/popular/ когда бэк реализует эндпоинт (задача G1).
const POPULAR_TAGS: string[] = [];

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
