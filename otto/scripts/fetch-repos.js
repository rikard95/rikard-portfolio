#!/usr/bin/env node
import 'dotenv/config'
import fs from 'fs/promises'
import path from 'path'

const token = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN
if (!token) {
  console.error('No token found. Set VITE_GITHUB_TOKEN or GITHUB_TOKEN environment variable.')
  process.exit(1)
}

const owner = process.argv[2] || 'rikard95'
const perPage = 100
let page = 1
let all = []

const headers = { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' }

async function fetchPage(p) {
  const url = `https://api.github.com/users/${owner}/repos?per_page=${perPage}&page=${p}&type=public`
  const res = await fetch(url, { headers })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`GitHub API error ${res.status}: ${txt}`)
  }
  return res.json()
}

;(async () => {
  try {
    while (true) {
      const data = await fetchPage(page)
      if (!Array.isArray(data) || data.length === 0) break
      all.push(...data)
      if (data.length < perPage) break
      page += 1
    }

    const out = all.map(r => ({
      name: r.name,
      description: r.description,
      html_url: r.html_url,
      homepage: r.homepage,
      language: r.language,
      owner: r.owner && r.owner.login ? r.owner.login : owner,
      fork: r.fork,
      updated_at: r.updated_at
    }))

    const outPath = path.resolve('public', 'repos.json')
    await fs.mkdir(path.dirname(outPath), { recursive: true })
    await fs.writeFile(outPath, JSON.stringify(out, null, 2), 'utf8')
    console.log('Wrote', out.length, 'repos to', outPath)
  } catch (e) {
    console.error('Failed to fetch repos:', e.message || e)
    process.exit(2)
  }
})()
