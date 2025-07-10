import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, displayName } = req.body;

  if (!email || !displayName) {
    return res.status(400).json({ message: 'Email and Display Name are required' });
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    const [existingRows] = await connection.execute(
      'SELECT * FROM team_table WHERE Email = ? LIMIT 1',
      [email]
    );

    if (!existingRows.length) {
      await connection.execute(
        `INSERT INTO team_table
            (EntryDateTime, EntryUser, UserName, Password, \`TargetWeight(in_kg)\`, CoachName, CoCoachName, Status, CoachApproved, Email)
        VALUES (NOW(), 'Google Sign-In', ?, 'User@123#', 0, '', '', 'Active', 0, ?)`,
        [displayName, email]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
