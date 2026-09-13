import { useEffect, useState } from "react";
import { api } from "./api";
import type { Lang } from "./i18n";

// Owner-beta staging checkpoint (2026-09-13): safe, non-secret build
// identification (see GET /build-info in server.ts) so the owner can confirm
// which environment/branch/commit he is actually looking at — the whole
// point of this checkpoint being "make the branch under development
// observable". Never fetched with auth, never exposes anything beyond
// environment name + branch + short commit SHA + this process's boot time.
type BuildInfoData = { environment: string; serviceName: string | null; branch: string | null; commit: string | null; bootedAt: string };

export function BuildInfo({ lang }: { lang: Lang }) {
  const [info, setInfo] = useState<BuildInfoData | null>(null);
  useEffect(() => {
    api<BuildInfoData>("/build-info", {}).then(setInfo).catch(() => {});
  }, []);
  if (!info) return null;
  const isStaging = info.environment !== "production";
  const label = lang === "hu" ? "Build" : lang === "de" ? "Build" : "Build";
  return (
    <div className={`build-info ${isStaging ? "is-staging" : ""}`}>
      {isStaging && <span className="build-info-badge">{lang === "hu" ? "BÉTA / STAGING" : lang === "de" ? "BETA / STAGING" : "BETA / STAGING"}</span>}
      <span className="build-info-detail">
        {label} · {info.branch ?? "?"} · {info.commit ?? "?"}
      </span>
    </div>
  );
}
