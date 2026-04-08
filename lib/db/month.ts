export function getMonthStart(input: string): string {

  const match = /^(\d{4})-(\d{2})$/.exec(input.trim())

  if (!match) {
    throw new Error(
      "Invalid month format. Expected YYYY-MM"
    )
  }

  const [, year, month] = match

  const monthNumber = Number(month)

  if (monthNumber < 1 || monthNumber > 12) {
    throw new Error(
      "Invalid month value. Expected 01–12"
    )
  }

  return `${year}-${month}-01`

}