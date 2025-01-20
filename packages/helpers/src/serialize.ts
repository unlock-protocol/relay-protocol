export const toObject = (obj: object) =>
  JSON.parse(
    JSON.stringify(
      obj,
      (_key, value) =>
        typeof value === 'bigint' ? `${value.toString()}n` : value // return everything else unchanged
    )
  )
