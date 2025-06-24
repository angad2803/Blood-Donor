router.get("/", verifyToken, async (req, res) => {
  const donor = req.user; // contains bloodGroup & location

  const all = await BloodRequest.find({
    fulfilled: false,
    location: donor.location,
  });

  const matches = all
    .filter((r) => canDonateTo(donor.bloodGroup, r.bloodGroup))
    .sort((a, b) => {
      const urgencyOrder = {
        Emergency: 3,
        High: 2,
        Medium: 1,
        Low: 0,
      };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });

  res.status(200).json({ matches });
});
