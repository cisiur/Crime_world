export interface StrategicMapPlaceholderProps {
  readonly label?: string;
}

export function StrategicMapPlaceholder({
  label = "Strategic map placeholder",
}: StrategicMapPlaceholderProps) {
  return <section aria-label={label} className="strategic-map-placeholder" />;
}
