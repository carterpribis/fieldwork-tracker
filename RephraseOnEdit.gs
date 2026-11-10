/* ---------- SETTINGS ---------- */
const API_KEY = 'YOUR_OPENAI_API_KEY';
const SOURCE_COL = 8;   // A = 1
const TARGET_COL = 14;   // B = 2
const MODEL      = 'o4-mini-2025-04-16';
const TEMP       = 0.8;
/* --------------------------------*/

/**
 * Installable onEdit trigger:
 *  • Fires only when the user edits column A
 *  • Sends text to OpenAI once
 *  • Writes reply into column B as a VALUE (no formula)
 *  • Does nothing on subsequent reloads
 */
function rephraseOnEdit(e) {
  if (!e || !e.range) return;                     // safety when run manually

  const range = e.range;

  // Only watch column H (8)
  if (range.getColumn() !== SOURCE_COL) return;

  // Get the NEW text the user just entered
  const text = (e.value || '').trim();
  Logger.log(text);
  if (text === '') return;                       // ignore blank edits

  // Avoid double-processing
  const targetCell = range.offset(0, TARGET_COL - SOURCE_COL);
  if (String(targetCell.getValue()).trim() !== '') return;

  const reply = callOpenAI(text);
  targetCell.setValue(reply);                    // save as static value
}

/* One tiny helper that actually talks to OpenAI */
function callOpenAI(promptText) {
  const payload = {
    model: MODEL,
    messages: [
      { role: 'system',
        content: 'You are an expert BCBA documentation assistant. Rewrite the user text in ONE concise, varied, professional sentence. All responses should be in the past-tense. The responses should be highly professional, as they are being submitted to the BACB for review. All responses should be general and past tense, not first person, for example  should be "conducted assessments", not "I conducted assessments" or "the BCBA conducted assessments.'},
      { role: 'user', content: promptText }
    ]
  };

  const res = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + API_KEY },
    payload: JSON.stringify(payload),
    //muteHttpExceptions: true
  });

  Logger.log('HTTP ' + res.getResponseCode());
Logger.log(res.getContentText().slice(0,500)); // first 500 chars

  const data  = JSON.parse(res.getContentText());
  const reply = data.choices?.[0]?.message?.content?.trim() || '<empty>';
  return reply;
}