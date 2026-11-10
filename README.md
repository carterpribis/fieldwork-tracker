# Fieldwork tracker

Google Apps Script for a Google Sheet that tracks supervised fieldwork hours toward behavior analyst (BCBA) certification. It does two chores that the sheet's formulas can't:

- **Rewrites shorthand activity notes** into one professional, past-tense sentence, using an OpenAI model.
- **Fills in the monthly verification form**, a PDF, from the month's totals and saves it to Google Drive.

The write-up is at [prib.is/fieldwork.html](https://prib.is/fieldwork.html).

## What's here

| File | What it does |
|---|---|
| `Rephrase.gs` | First version of the rewriter: a custom function, `=REPHRASE(A2)`, that sends the cell's text to the model and returns the rewritten sentence |
| `RephraseOnEdit.gs` | The version in use: an installable on-edit trigger. When a note is typed in the source column, it calls the model once and writes the result into the target column as a plain value, so it is not recalculated or charged for again |
| `GenerateForm.gs` | Reads the active month tab's independent and supervised hours, works out the supervised percentage, chooses the fieldwork type, fills the form's fields with pdf-lib, flattens it and saves the PDF to a Drive folder |
| `Polyfills.gs` | `setTimeout` and `clearTimeout` stand-ins that pdf-lib needs, since Apps Script has no event loop |

## Why there are two rewriters

A custom function runs again whenever the sheet recalculates, which means repeated calls to the model and wording that can change under you. The on-edit version runs once per note and stores the answer as text.

## Setting it up

1. Open your sheet's **Extensions → Apps Script** and add the four files.
2. Add [pdf-lib](https://pdf-lib.js.org/) (version 1.17 or later, the single-file build) as another script file. It is a third-party library and is not included here.
3. In `RephraseOnEdit.gs`, set your OpenAI API key, the source and target column numbers, and the model.
4. In `GenerateForm.gs`, set the Drive file ID of the blank verification form, the Drive folder ID for finished PDFs, and the trainee and supervisor details in `STATIC`.
5. Add an installable **On edit** trigger for `rephraseOnEdit`.
6. To make a month's form, open that month's tab and run `generateMFVF_thisSheet`.

The script expects one tab per month, named for the month, with independent hours in `A2` and supervised hours in `B2`. A tab named `Hours total` is skipped.

## Notes

- Every key, file ID, name and certification number in this repository is a placeholder, and it contains no client information.
- The API key sits in the code as a constant. Anyone with edit access to the sheet can read it. Moving it to Script Properties would be the first improvement.
- The form filler takes the year from today's date, so a form for last December made in January needs the year adjusted.

## Who wrote what

AI models wrote most of the code. I designed the sheet and what the scripts should do, and tested and debugged them.
