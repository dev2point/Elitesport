interface PlaceholderFieldProps {
  field: string;
}

export function PlaceholderField({ field }: PlaceholderFieldProps) {
  return (
    <span className="inline-block rounded-md border border-dashed border-status-warning bg-status-warning/5 px-2 py-1 text-sm font-medium text-line-strong">
      À compléter : {field}
    </span>
  );
}
