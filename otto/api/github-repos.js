import 'dotenv/config'

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN
  if (!token) {
    return res.status(400).json({ error: 'Missing GITHUB_TOKEN in environment' })
  }

  const owner = req.query?.owner || 'rikard95'
  const perPage = 100
  let page = 1
  const all = []
  const headers = {
    Authorization: `token ${token}`,
    'User-Agent': 'portfolio-app',
    Accept: 'application/vnd.github.v3+json',
  }

  try {
    while (true) {
      const url = `https://api.github.com/users/${owner}/repos?per_page=${perPage}&page=${page}&type=public`
      const r = await fetch(url, { headers })
      if (!r.ok) {
        const txt = await r.text().catch(() => '')
        return res.status(r.status).json({ error: 'GitHub API error', status: r.status, body: txt })
      }
      const data = await r.json()
      if (!Array.isArray(data) || data.length === 0) break
      all.push(...data)
      if (data.length < perPage) break
      page += 1
    }

    return res.status(200).json(all)
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) })
  }
}
