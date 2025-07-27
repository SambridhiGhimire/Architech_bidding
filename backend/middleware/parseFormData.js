const parseNestedFormData = (req, res, next) => {
  if (req.body) {
    // Parse nested form data
    const parsedBody = {};

    Object.keys(req.body).forEach((key) => {
      if (key.includes("[") && key.includes("]")) {
        // Handle nested fields like location[address], budget[min], etc.
        const matches = key.match(/^(\w+)\[(\w+)\]$/);
        if (matches) {
          const [, parent, child] = matches;
          if (!parsedBody[parent]) {
            parsedBody[parent] = {};
          }
          parsedBody[parent][child] = req.body[key];
        }
      } else {
        parsedBody[key] = req.body[key];
      }
    });

    req.body = parsedBody;
  }

  next();
};

module.exports = parseNestedFormData;
