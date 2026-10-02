import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api";
import { Megaphone } from "lucide-react";

interface Announcement {
  _id: string;
  message: string;
  linkUrl?: string;
}

export function AnnouncementTicker() {
  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: async () => {
      const response = await fetch(apiUrl("/api/announcements/active"), { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load announcements");
      const data: unknown = await response.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  if (announcements.length === 0) return null;
  const text = announcements.map((item) => item.message).join("   ✦   ");

  return (
    <div className="mb-4 overflow-hidden rounded-full border border-primary/35 bg-primary/[0.08]">
      <div className="flex h-8 items-center sm:h-9">
        <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/20 sm:h-9 sm:w-9">
          <Megaphone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div className="announcement-marquee flex w-max items-center whitespace-nowrap">
            {[0, 1].map((copyIndex) => (
              <div key={copyIndex} className="flex shrink-0 items-center">
                {announcements.map((item, index) => (
                  item.linkUrl ? (
                    <a key={`${copyIndex}-${item._id}`} href={item.linkUrl} target="_blank" rel="noreferrer" className="px-6 text-[11px] font-semibold text-white hover:text-accent sm:px-8 sm:text-xs">
                      {item.message}
                      {index < announcements.length - 1 && <span className="px-6 text-accent sm:px-8">✦</span>}
                    </a>
                  ) : (
                    <span key={`${copyIndex}-${item._id}`} className="px-6 text-[11px] font-semibold text-white sm:px-8 sm:text-xs">
                      {item.message}
                      {index < announcements.length - 1 && <span className="px-6 text-accent sm:px-8">✦</span>}
                    </span>
                  )
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}