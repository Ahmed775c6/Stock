export interface Metric {
  title: string;
  value: string;

  icon: string;
  color: string;
}

export type MetricsResponse = Metric[];