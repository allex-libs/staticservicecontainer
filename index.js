function createLib (execlib) {
  return require('./creator')(execlib);
}

module.exports = createLib;
