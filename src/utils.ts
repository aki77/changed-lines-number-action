export function sumOf<T>(
  array: readonly T[],
  selector: (el: T) => number
): number {
  let sum = 0

  for (const i of array) {
    sum += selector(i)
  }

  return sum
}
