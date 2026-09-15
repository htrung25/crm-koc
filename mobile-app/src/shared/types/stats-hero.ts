export type StatsHeroMetric = {
  value: string;
  label: string;
};

export type StatsHeroProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  metrics: StatsHeroMetric[];
};
