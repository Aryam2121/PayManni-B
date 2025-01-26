const validateQueryParams = (req, res, next) => {
    const { type, status, limit, page } = req.query;
  
    // Validate `type` (Credit/Debit)
    if (type && !["Credit", "Debit"].includes(type)) {
      return res.status(400).json({ message: "Invalid type. Must be 'Credit' or 'Debit'." });
    }
  
    // Validate `status` (Pending/Completed/Failed)
    if (status && !["Pending", "Completed", "Failed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'Pending', 'Completed', or 'Failed'." });
    }
  
    // Validate `limit` (positive integer)
    if (limit && (!Number.isInteger(Number(limit)) || Number(limit) <= 0)) {
      return res.status(400).json({ message: "Limit must be a positive integer." });
    }
  
    // Validate `page` (positive integer)
    if (page && (!Number.isInteger(Number(page)) || Number(page) <= 0)) {
      return res.status(400).json({ message: "Page must be a positive integer." });
    }
  
    next();
  };
  
  module.exports = { validateQueryParams };
  