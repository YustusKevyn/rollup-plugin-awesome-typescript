export function concat<T>(target: T[], ...sources: (Readonly<T> | Readonly<T[]> | undefined)[]): T[] {
  for (let source of sources) {
    if (source === undefined) continue;
    if (!Array.isArray(source)) target.push(source as T);
    else for (let value of source) if (value !== undefined) target.push(value);
  }
  return target;
}

export function some<T>(iterable: Iterable<T>, fn: (value: T) => boolean) {
  for (let value of iterable) if (fn(value)) return true;
  return false;
}

export function endsWith(str: string, ...suffixes: string[]) {
  for (let suffix of suffixes) {
    let expected = str.length - suffix.length;
    if (expected >= 0 && str.indexOf(suffix, expected) === expected) return true;
  }
  return false;
}

export function intersection<T>(set1: Set<T>, set2: Set<T>, filter?: (value: T) => boolean) {
  let primary = set1.size < set2.size ? set1 : set2,
    secondary = set1.size < set2.size ? set2 : set1;

  let final: Set<T> = new Set();
  for (let value of primary) if (secondary.has(value) && filter?.(value)) final.add(value);
  return final;
}

export function compareArrays(arr1: Readonly<any[]>, arr2: Readonly<any[]>) {
  if (Object.is(arr1, arr2)) return true;
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) if (arr1[i] !== arr2[i]) return false;
  return true;
}

export function compareObjects(obj1: Readonly<object>, obj2: Readonly<object>) {
  if (Object.is(obj1, obj2)) return true;
  if (Object.keys(obj1).length !== Object.keys(obj2).length) return false;

  for (let key in obj1) {
    if (!(key in obj2)) return false;

    let vA = obj1[key as keyof typeof obj1],
      vB = obj2[key as keyof typeof obj2],
      tA = typeof vA,
      tB = typeof vB;

    if (tA !== tB) return false;
    else if (tA === "object") {
      if (!compareObjects(vA, vB)) return false;
    } else if (tA !== "function") {
      if (vA !== vB) return false;
    }
  }
  return true;
}
