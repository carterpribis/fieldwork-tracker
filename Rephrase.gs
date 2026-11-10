const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';

/**
 * =REPHRASE(text [,temperature] [,model])
 * Example:  =REPHRASE(A2,0.9,"gpt-4o-mini")
 */
function REPHRASE(text, model) {
  if (typeof text !== 'string' || text.trim() === '') return '';

  const payload = {
    model:        model || 'gpt-3.5-turbo-0125',
    messages: [
      { role: 'system',
        content: 'You are an expert BCBA field-work documentation assistant. Rewrite the user text so descriptions remain accurate but use varied, professional wording (no duplicates, no jargon inflation). Return a single concise sentence. I am not a BCBA yet; for example, instead of writing "The BCBA thoroughly reviewed the ABA curriculum materials in preparation for the upcoming school day.", just write "Thoroughly reviewed the ABA curriculum materials in preparation for the upcoming school day."'},
      { role: 'user', content: text }
    ]
  };

  const options = {
    method:        'post',
    contentType:   'application/json',
    headers:       { Authorization: 'Bearer ' + OPENAI_API_KEY },
    payload:       JSON.stringify(payload),
    muteHttpExceptions: true      // Let us inspect non-200 bodies
  };

  try {
    const res       = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', options);
    const status    = res.getResponseCode();
    const body      = res.getContentText();

    // If not 200, show the raw error JSON so you’ll see it in the cell
    if (status !== 200) return `HTTP ${status}: ${body}`;

    const data  = JSON.parse(body);
    const reply = data.choices && data.choices[0].message && data.choices[0].message.content;
    return reply ? reply.trim() : '<<empty reply>>';

  } catch (e) {
    return 'Exception: ' + e.message;
  }
}
