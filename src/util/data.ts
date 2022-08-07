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
