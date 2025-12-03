function normalizeName(name = "") {
  return String(name)
    .toLowerCase()
    .normalize("NFKD") // decompose accents
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9\s]/g, " ") // punctuation to space
    .replace(/\s+/g, " ") // collapse spaces
    .trim();
}

module.exports = { normalizeName };
