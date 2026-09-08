export interface LabeledOption<T extends string = string> {
  value: T;
  label: string;
}

/** Record<key, label>을 ChipGroup이 쓰는 { value, label } 배열로 바꾼다. */
export function toOptions<T extends string>(labels: Record<T, string>): LabeledOption<T>[] {
  return (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label }));
}

/** 위와 같지만 키 순서를 직접 지정해 일부만 노출할 때 쓴다. */
export function pickOptions<T extends string>(labels: Record<T, string>, keys: T[]): LabeledOption<T>[] {
  return keys.map((value) => ({ value, label: labels[value] }));
}
