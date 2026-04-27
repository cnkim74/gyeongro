"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  type: "all" | "sherpa" | "clinic" | "theme";
  showPriceSort?: boolean;
}

const ALL_OPTIONS = [
  { value: "relevance", label: "관련도순" },
  { value: "rating", label: "평점순" },
  { value: "price_asc", label: "가격 낮은순" },
  { value: "price_desc", label: "가격 높은순" },
  { value: "newest", label: "최신순" },
];

export default function SearchSort({ showPriceSort = true }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const sort = params.get("sort") ?? "relevance";

  const options = showPriceSort
    ? ALL_OPTIONS
    : ALL_OPTIONS.filter(
        (o) => o.value !== "price_asc" && o.value !== "price_desc"
      );

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = new URLSearchParams(params.toString());
    const v = e.target.value;
    if (v && v !== "relevance") next.set("sort", v);
    else next.delete("sort");
    next.delete("page");
    router.push(`/search?${next.toString()}`);
  };

  return (
    <select
      value={sort}
      onChange={onChange}
      className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-slate-400"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
