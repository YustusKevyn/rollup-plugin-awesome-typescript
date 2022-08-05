export function compare(a: any, b: any) {
  if (!a || !b) return false;
  if (Object.is(a, b)) return true;
  if (Object.keys(a).length !== Object.keys(b).length) return false;

  for (let key in a) {
    let vA = a[key],
      vB = b[key],
      tA = typeof vA,
      tB = typeof vB;

    if (tA !== tB) return false;
    else if (tA === "object") {
      if (!compare(vA, vB)) return false;
    } else if (tA !== "function") {
      if (vA !== vB) return false;
    }
  }
  return true;
}
