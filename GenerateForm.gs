/* ---------- CONFIG --------------------------------------------------- */
const PDF_TEMPLATE_ID  = 'YOUR_BLANK_FORM_FILE_ID';   // BACB form
const OUTPUT_FOLDER_ID = 'YOUR_OUTPUT_FOLDER_ID';   // finished PDFs
const SKIP_SHEETS      = ['Hours total'];                       // never run

const STATIC = {                       // values that never change
  TRAINEE_NAME:       'Trainee Name',
  TRAINEE_BACB_ID:    'BACB0000000',
  FIELDWORK_STATE:    'State',
  FIELDWORK_COUNTRY:  'USA',
  SUPERVISOR_NAME:    'Supervisor Name',
  SUPERVISOR_BACB_ID: '0-00-00000'
};
/* -------------------------------------------------------------------- */

/**
 * Generates one filled BACB MFVF PDF for the **active** sheet
 * using pdf-lib 1.18+ that is embedded in pdf-lib.js.
 */
async function generateMFVF_thisSheet() {
  const sheet = SpreadsheetApp.getActiveSheet();
  if (SKIP_SHEETS.includes(sheet.getName())) {
    SpreadsheetApp.getUi().alert('This tab is not a monthly log.');
    return;
  }

  /* ───── Pull this month’s totals ───── */
  const independent = Number(sheet.getRange('A2').getValue());   // adjust if needed
  const supervised  = Number(sheet.getRange('B2').getValue());
  const total       = independent + supervised;
  const pctSup      = supervised / total;                        // 0 – 1

  /* ───── Derive “month/year” from the tab name ───── */
  const year  = new Date().getFullYear();                        // tweak if file spans years
  const month = Utilities.formatDate(new Date(`${sheet.getName()} 1, ${year}`),
                                     Session.getScriptTimeZone(), 'M');
  const monthYear = `${month}/${year}`;

  /* ───── Decide which box to check ───── */
  const fieldworkChoice = (pctSup >= 0.10)
        ? 'Concentrated Supervised Fieldwork'    // exact text in PDF
        : 'Supervised Fieldwork';

  /* ───── Load the blank PDF template ───── */
  const templateBytes = Uint8Array.from(
        DriveApp.getFileById(PDF_TEMPLATE_ID)
                .getBlob()
                .getBytes()); 

  /* ───── Use pdf-lib to fill the form ───── */
  const { PDFDocument } = PDFLib;                  // global from pdf-lib.js
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form   = pdfDoc.getForm();

  /* Text fields */
  form.getTextField('TRAINEE_NAME')                 .setText(STATIC.TRAINEE_NAME);
  form.getTextField('TRAINEE_BACB_ID')              .setText(STATIC.TRAINEE_BACB_ID);
  form.getTextField('TRAINEE_CERTIFICATE_MONTH/YEAR').setText(monthYear);
  form.getTextField('TRAINEE_FIELDWORK_STATE')      .setText(STATIC.FIELDWORK_STATE);
  form.getTextField('TRAINEE_FIELDWORK_COUNTRY')    .setText(STATIC.FIELDWORK_COUNTRY);
  form.getTextField('RESPONSIBLE_SUPERVISOR_NAME')  .setText(STATIC.SUPERVISOR_NAME);
  form.getTextField('RESPONSIBLE_SUPERVISOR_BACB_ID').setText(STATIC.SUPERVISOR_BACB_ID);

  form.getTextField('INDEPENDENT_HOURS')            .setText(independent.toFixed(2));
  form.getTextField('SUPERVISED_HOURS')             .setText(supervised .toFixed(2));
  form.getTextField('TOTAL_FIELDWORK')              .setText(total      .toFixed(2));
  form.getTextField('PERCENT_HOURS_SUPERVISED')     .setText((pctSup*100).toFixed(1) + '%');

  /* Radio-button group */
  form.getRadioGroup('CHECK_SUPERVISED_FIELDWORK')
      .select(fieldworkChoice);

  /* ───── Flatten the form (remove this line to keep editable) ───── */
  form.flatten();

  /* ───── Save to Drive ───── */
  const filledBytes = await pdfDoc.save();          // Uint8Array
  const outBlob = Utilities.newBlob([...filledBytes],  // spread → Java byte[]
                                  'application/pdf',
                                  `MFVF_${sheet.getName()}.pdf`);
  DriveApp.getFolderById(OUTPUT_FOLDER_ID).createFile(outBlob);

  SpreadsheetApp.getUi()
    .alert(`MFVF for “${sheet.getName()}” saved to Drive!`);
}