function getLimit(limit, defaultLimit = 20, maxLimit = 100) {
  let parsed = parseInt(limit, 10);

  if (isNaN(parsed) || parsed <= 0) {
    return defaultLimit; 
  }

  if (parsed > maxLimit) {
    return maxLimit;
  }

  return parsed;
}

module.exports = getLimit;
