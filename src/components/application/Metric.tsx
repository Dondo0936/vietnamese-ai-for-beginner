export interface MetricData {
  value: string;
  sourceRef: number;
}

type MetricProps = MetricData;

// Declarative marker — returns null. Parent extracts props via React.Children.
export default function Metric(props: MetricProps): null {
  void props;
  return null;
}
