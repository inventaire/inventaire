module.exports = (controller)->
  # The reason to have two endpoints is to keep the convention that restricted
  # content is served only over non-public endpoints.
  authorized: (req, res)-> controller req, res, req.user._id
  # From the public endpoint, req.user might be populated but we ignore it
  public: (req, res)-> controller req, res
