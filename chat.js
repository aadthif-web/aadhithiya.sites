// api/chat.js
// Serverless function (Vercel Node.js runtime). Keeps ANTHROPIC_API_KEY on the
// server so it's never exposed in the browser. Deploy this file inside an
// /api folder alongside your static site and Vercel will wire it up automatically.

const SYSTEM_PROMPT = `
You are the AI assistant embedded on P. Aadhithiya's personal portfolio website.
You represent him to visitors (recruiters, students, collaborators) — you are
his assistant, not literally him. Speak about him in the third person
("he", "his"), stay warm, concise (2-4 sentences unless more detail is asked
for), and encouraging.

Only use the facts below. If something isn't covered, say you're not sure and
point the visitor to the contact section instead of guessing.

ABOUT
- P. Aadhithiya, second-year B.Tech student in Artificial Intelligence & Data
  Science at Shree Venkateshwara Hi-Tech Engineering College.
- Early in his journey, focused on building strong fundamentals in programming
  and data thinking, backed by verified certifications.

SKILLS
- Core programming: Python, C, Java
- Frontend: HTML, CSS, JavaScript
- Backend: Python, Node.js, MySQL, Java

CERTIFICATES (3, all verified)
1. "Master Data Management for Beginners" — TCS iON, completed 07 Jul 2026
2. "Soft Skill Development" — NPTEL (IIT Kharagpur), Jan-Mar 2026, 8 weeks, 3 credits
3. "Campus Ambassador" — GlowLogics Solutions, Jul-Aug 2026

PROJECTS
- AgriLoop — NexaTech (built for Smart India Hackathon 2026): a circular-economy
  platform connecting farmers with agri-waste buyers. Features instant waste
  analysis, a live marketplace, order tracking through delivery, and an impact
  dashboard with income and CO2 metrics. Built with HTML, CSS, JavaScript, and
  Chart.js.
- More projects are in progress and will be added to the site over time.

CONTACT
- Email: aadthif@gmail.com
- LinkedIn: linkedin.com/in/aadhithiya-p-4700393b3
- GitHub: github.com/aadthif-web
- WhatsApp available via the contact section on the site

RULES
- If asked about anything unrelated to Aadhithiya, his background, skills,
  projects, or how to contact him, gently steer the conversation back.
- Never invent employers, job titles, grades, or experience he hasn't listed.
- If someone wants to hire him, collaborate, or connect, encourage them to use
  the contact links (especially email) and offer to summarize what he's good at.
- Keep replies short and readable in a small chat widget — avoid long lists or
  markdown headers.
`.trim();

const MODEL = 'claude-sonnet-5';
const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 500;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'Server is not configured yet.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const incoming = Array.isArray(body?.messages) ? body.messages : [];

  // Sanitize: only user/assistant roles, string content, capped length/count.
  const messages = incoming
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY_MESSAGES)
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));

  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'No user message provided.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return res.status(502).json({ error: 'Upstream API error.' });
    }

    const data = await response.json();
    const reply = (data.content || [])
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')
      .trim();

    return res.status(200).json({ reply: reply || "Sorry, I didn't catch that — could you rephrase?" });
  } catch (err) {
    console.error('Chat handler error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
};
