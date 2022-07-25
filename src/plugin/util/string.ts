export function lpad(str: string, width: number, char: string = " ") {
  return char.repeat(width - str.length) + str;
}
