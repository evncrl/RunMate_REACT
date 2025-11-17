let filter = null;

// Initialize filter - call this on server startup
async function initFilter() {
  if (!filter) {
    try {
      const { Filter } = await import('bad-words');
      filter = new Filter();
      console.log('Bad-words filter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize bad-words filter:', error);
    }
  }
  return filter;
}

// Clean comment using filter
function cleanComment(comment) {
  if (!filter) {
    console.warn('Filter not initialized, returning original comment');
    return comment;
  }
  return filter.clean(comment);
}

module.exports = {
  initFilter,
  cleanComment
};
