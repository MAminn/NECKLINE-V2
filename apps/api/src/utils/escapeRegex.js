// Escape regex metacharacters so user input can be embedded in a $regex
// query as a literal substring match.
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = escapeRegex;
