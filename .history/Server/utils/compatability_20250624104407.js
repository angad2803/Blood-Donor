// utils/compatibility.js
export function canDonateTo(donorGroup, recipientGroup) {
  const map = {
    O: ["A", "B", "AB", "O"],
    A: ["A", "AB"],
    B: ["B", "AB"],
    AB: ["AB"],
  };

  const baseDonor = donorGroup.replace("+", "").replace("-", "");
  const baseRecipient = recipientGroup.replace("+", "").replace("-", "");

  return map[baseDonor]?.includes(baseRecipient);
}
