// French number formatting utilities
// Converts between French notation (comma) and JavaScript numbers

function frenchToNumber(frenchStr) {
  // Convert French notation "2,5" to JavaScript number 2.5
  if (typeof frenchStr === "number") return frenchStr
  if (!frenchStr) return 0
  return Number.parseFloat(String(frenchStr).replace(",", ".")) || 0
}

function numberToFrench(num) {
  // Convert JavaScript number 2.5 to French notation "2,5"
  if (!num && num !== 0) return "0"
  const numValue = typeof num === "string" ? Number.parseFloat(num) : num
  return numValue.toString().replace(".", ",")
}

function formatPoints(points) {
  // Format points for display with French notation
  return numberToFrench(points)
}

function parsePointsInput(input) {
  // Parse points from input field (handles both comma and period)
  if (!input) return 1
  return frenchToNumber(input)
}

function parsePointsList(pointsStr) {
  // Parse comma-separated list of points "2,5; 3; 1,5" or "2.5, 3, 1.5"
  if (!pointsStr) return []
  return pointsStr
    .split(/[;,]/)
    .map((p) => frenchToNumber(p.trim()))
    .filter((p) => p > 0)
}
