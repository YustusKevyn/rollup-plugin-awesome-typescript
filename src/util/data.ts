export function concat<T>(target: T[], ...args: (Readonly<T> | Readonly<T[]> | undefined)[]): T[] {
  for (let arg of args) {
    if (!Array.isArray(arg)) target.push(arg as T);
    else for (let value of arg) if (value !== undefined) target.push(value);
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

export function intersection<T>(a: Set<T>, b: Set<T>) {
  let primary = a.size < b.size ? a : b,
    secondary = a.size < b.size ? b : a;

  let final: Set<T> = new Set();
  for (let value of primary) if (secondary.has(value)) final.add(value);
  return final;
}

export function compareArrays(a: Readonly<any[]>, b: Readonly<any[]>) {
  if (Object.is(a, b)) return true;
  if (a.length !== b.length) return false;
  return a.every(value => b.includes(value));
}

export function compareObjects(a: Readonly<object>, b: Readonly<object>) {
  if (Object.is(a, b)) return true;
  if (Object.keys(a).length !== Object.keys(b).length) return false;

  for (let key in a) {
    if (!(key in b)) return false;

    let vA = a[key as keyof typeof a],
      vB = b[key as keyof typeof b],
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
