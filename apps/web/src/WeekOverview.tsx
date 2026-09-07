import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { Lang } from "./i18n";

export type WeekDay = { date: string; mealCount: number; kcal: number; netCarbs: number; protein: number; fat: number; fiber: number };
export type WeekOverviewData = { weekStart: string; weekEnd: string; days: WeekDay[]; summary: { mealCount: number; loggedDays: number } };

type WeekLabels = { previousWeek: string; nextWeek: string; heading: string; loggedDaysSuffix: string; mealsLabel: string };

export function WeekOverviewCard({
  week, lang, selectedDate, today, isCurrentWeek, onSelectDate, onPrevWeek, onNextWeek, labels
}: {
  week: WeekOverviewData | null;
  lang: Lang;
  selectedDate: string;
  today: string;
  isCurrentWeek: boolean;
  onSelectDate: (date: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  labels: WeekLabels;
}) {
  return (
    <div className="card week-card">
      <div className="week-nav">
        <button type="button" className="btn secondary icon-button" aria-label={labels.previousWeek} onClick={onPrevWeek}><ChevronLeft size={18}/></button>
        <h2 className="section-heading week-heading"><CalendarDays size={20}/>{labels.heading}</h2>
        <button type="button" className="btn secondary icon-button" aria-label={labels.nextWeek} disabled={isCurrentWeek} onClick={onNextWeek}><ChevronRight size={18}/></button>
      </div>
      {week && (
        <>
          <p className="week-summary text-xs text-muted">{week.summary.loggedDays} / 7 {labels.loggedDaysSuffix} · {week.summary.mealCount} {labels.mealsLabel}</p>
          <div className="week-strip" role="list">
            {week.days.map((day) => {
              const isFuture = day.date > today;
              const isSelected = day.date === selectedDate;
              return (
                <button
                  type="button"
                  role="listitem"
                  key={day.date}
                  className={`week-day ${isSelected ? "is-selected" : ""} ${isFuture ? "is-future" : ""}`}
                  disabled={isFuture}
                  aria-current={isSelected ? "date" : undefined}
                  aria-label={formatWeekDayFull(day.date, lang)}
                  onClick={() => onSelectDate(day.date)}
                >
                  <span className="week-day-label">{formatWeekDayShort(day.date, lang)}</span>
                  <span className="week-day-kcal">{Math.round(day.kcal)} kcal</span>
                  <span className="week-day-netcarbs">{Math.round(day.netCarbs)} g</span>
                  <span className="week-day-meals">{day.mealCount} {labels.mealsLabel}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function localeFor(lang: Lang) {
  return lang === "hu" ? "hu-HU" : lang === "de" ? "de-DE" : "en-GB";
}

function parseLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatWeekDayShort(dateStr: string, lang: Lang) {
  return new Intl.DateTimeFormat(localeFor(lang), { weekday: "short", day: "numeric" }).format(parseLocalDate(dateStr));
}

function formatWeekDayFull(dateStr: string, lang: Lang) {
  return new Intl.DateTimeFormat(localeFor(lang), { weekday: "long", month: "long", day: "numeric" }).format(parseLocalDate(dateStr));
}
