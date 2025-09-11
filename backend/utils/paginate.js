// Cursor-based pagination helper
const paginate = (docs, limit) => {
  const hasMore = docs.length > limit;
  if (hasMore) docs.pop(); // remove the extra one
  return {
    docs,
    hasMore,
    lastId: docs.length ? docs[docs.length - 1]._id : null,
  };
};

module.exports = paginate;