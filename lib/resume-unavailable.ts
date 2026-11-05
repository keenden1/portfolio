export function resumeUnavailableResponse() {
  return new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <meta name="theme-color" content="#f7f7fc">
  <title>Resume temporarily unavailable | Jimmy Bautista</title>
  <link rel="icon" href="/logo.svg">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; min-height: 100svh; background: #f7f7fc; color: #172033; font-family: Arial, sans-serif; }
    .page { min-height: 100vh; min-height: 100svh; display: flex; flex-direction: column; padding: 28px clamp(20px, 5vw, 72px); background: radial-gradient(ellipse at 50% 40%, #ede7ff 0, transparent 65%); }
    .brand { display: inline-flex; gap: 12px; align-items: center; width: fit-content; color: inherit; text-decoration: none; font-size: 14px; font-weight: 700; }
    .mark { display: grid; place-items: center; width: 40px; height: 40px; background: #172033; color: white; border-radius: 12px; font-size: 22px; letter-spacing: -2px; padding-right: 3px; }
    main { flex: 1; display: grid; place-items: center; padding: 56px 0; }
    .card { width: min(100%, 590px); padding: clamp(28px, 6vw, 56px); text-align: center; background: #ffffffed; border: 1px solid #e5e3ed; border-radius: 28px; box-shadow: 0 24px 80px #30205c0c; }
    .icon { display: grid; place-items: center; width: 76px; height: 76px; margin: 0 auto 26px; background: #f0eaff; color: #7c3aed; border-radius: 23px; }
    .eyebrow { color: #7954b8; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
    h1 { margin: 13px 0 18px; font-size: clamp(29px, 5vw, 39px); line-height: 1.15; letter-spacing: -1.4px; }
    .description { margin: 0 auto; max-width: 400px; color: #667085; font-size: 15px; line-height: 1.75; }
    .actions { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; margin-top: 30px; }
    .button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; padding: 13px 21px; border-radius: 12px; border: 1px solid #dedbe8; text-decoration: none; color: #344054; font-size: 14px; font-weight: 600; }
    .primary { background: #7c3aed; color: white; border-color: #7c3aed; }
    .button:hover { background: #f3f0fa; }
    .primary:hover { background: #6d28d9; }
    a:focus-visible { outline: 3px solid #a78bfa; outline-offset: 4px; }
    .contact { border-top: 1px solid #eeedf3; padding-top: 24px; margin: 28px 0 0; color: #667085; font-size: 13px; line-height: 1.7; }
    .contact a { color: #6d28d9; font-weight: 600; text-underline-offset: 3px; }
    footer { color: #8590a3; font-size: 12px; text-align: center; padding-bottom: 8px; }
    @media (max-width: 420px) { .actions { flex-direction: column; } .card { border-radius: 22px; } }
    @media (prefers-color-scheme: dark) { body { background: #111118; color: #f4f3fa; } .page { background: radial-gradient(ellipse at 50% 40%, #291c42 0, transparent 65%); } .card { background: #1b1924ed; border-color: #363140; } .description, .contact { color: #b0aabd; } .eyebrow, .contact a { color: #c4a7ff; } .button:not(.primary) { color: #ede9f5; border-color: #484050; } .button:not(.primary):hover { background: #30273e; } .contact { border-color: #363140; } }
  </style>
</head>
<body>
  <div class="page">
    <a class="brand" href="/" aria-label="Jimmy Bautista portfolio home"><span class="mark" aria-hidden="true">jb.</span>Jimmy Bautista</a>
    <main><section class="card" aria-labelledby="resume-title">
      <div class="icon" aria-hidden="true"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg></div>
      <div class="eyebrow">A small interruption</div>
      <h1 id="resume-title">My resume is taking<br>a quick break.</h1>
      <p class="description">The PDF couldn’t load right now. Please try again in a moment, or explore my projects while you’re here.</p>
      <div class="actions"><a class="button primary" href="/resume"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1"/></svg>Try again</a><a class="button" href="/#projects">Explore my work <span aria-hidden="true">↗</span></a></div>
      <p class="contact">Need a copy of my resume?<br><a href="/#contact">Get in touch</a> and I’ll be happy to help.</p>
    </section></main>
    <footer>Thanks for stopping by my portfolio.</footer>
  </div>
</body>
</html>`, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "60", "X-Content-Type-Options": "nosniff" } });
}
