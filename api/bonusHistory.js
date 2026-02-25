// api/bonusHistory.js
import db from '../db.json' assert { type: 'json' };

export default function handler(req, res) {
  res.status(200).json(db.bonusHistory);
}