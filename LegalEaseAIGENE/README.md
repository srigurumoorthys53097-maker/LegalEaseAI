# LegalEase: AI-Powered Legal Document Generator

LegalEase uses Google Gemini to generate professional legal documents, such as employment contracts, NDAs, lease agreements, and freelance contracts, from a few simple inputs. You can preview the document, edit it, and download it as **.TXT**, **.DOCX**, or **.PDF**. The DOCX and PDF files include your branding (logo, fonts, footer) and a table of the key terms.

> Built with **FastAPI** (backend), **Streamlit** (frontend), and the **Google Gemini API** (AI core).

---

## Table of Contents

- [Features](#features)
- [Use Cases](#use-cases)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [How to Use](#how-to-use)
- [Deployment](#deployment)
- [Testing Checklist](#testing-checklist)
- [Roadmap](#roadmap)
- [Disclaimer](#disclaimer)
- [License](#license)

---

## Features

- **AI document generation**: Creates structured legal documents from the document type, parties, terms, and effective date you enter.
- **Editable preview**: Shows the document in a styled, dark-themed HTML card. Click "Edit Document" to change the text inline.
- **Multi-format export**
  - `.txt`: plain text
  - `.docx`: Word document with a logo, Times New Roman font, headings, a terms table, and a footer
  - `.pdf`: branded PDF with a centered logo, bold section headings, bullet-style terms, and a header and footer on every page
- **Automatic terms table**: Terms you separate with semicolons become a formatted table (DOCX) or a bullet list (PDF).
- **Text sanitization**: Removes special characters and typographic quotes so the exported files are formatted cleanly.
- **Secure configuration**: The API key is read from a `.env` file and is never hard-coded.

---

## Use Cases

| Scenario | Input | Output |
| --- | --- | --- |
| **Startup founder** hiring a new employee | Role, compensation, confidentiality terms | Employment contract, downloaded as a branded PDF |
| **Freelancer** protecting client work | Parties, scope of confidentiality, effective date | Structured Non-Disclosure Agreement |
| **Landlord** renting a property | Property address, tenant details, lease terms | Residential lease agreement, downloaded as an editable DOCX |

---

## Architecture

```
┌──────────────────────┐     POST /generate     ┌──────────────────────┐
│   Streamlit (app.py) │ ─────────────────────▶ │  FastAPI (main.py)   │
│  - Input form        │                        │  └─ routes.py        │
│  - HTML preview      │ ◀───────────────────── │     DocumentRequest  │
│  - Edit + download   │    generated text      └──────────┬───────────┘
└──────────┬───────────┘                                   │
           │                                               ▼
           ▼                                  ┌───────────────────────────┐
┌──────────────────────┐                      │ ai_core/gemini_generator  │
│ Formatting modules   │                      │ GeminiDocumentGenerator   │
│ format_docx()        │                      │  └─ generate_content()    │
│ format_pdf()         │                      └──────────┬────────────────┘
│ format_html_preview()│                                 │
└──────────────────────┘                                 ▼
                                                ┌──────────────────┐
                                                │  Google Gemini   │
                                                └──────────────────┘
```

1. **Frontend (Streamlit)** collects the user's input, sends it to the backend, and shows, edits, and exports the result.
2. **Backend (FastAPI)** validates the request with Pydantic and passes it to the AI core.
3. **AI core** builds a structured prompt and calls Gemini through the `google-generativeai` SDK.
4. **Formatting modules** turn the generated text into branded DOCX and PDF files and an HTML preview.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Language | Python 3.10+ |
| Backend | FastAPI, Uvicorn, Pydantic |
| Frontend | Streamlit |
| AI Model | Google Gemini (`google-generativeai`) |
| Document formatting | `python-docx`, `fpdf`, `Pillow` |
| Utilities | `requests`, `python-dotenv` |

---

## Project Structure

```
LegalEase/
├── ai_core/
│   ├── __init__.py
│   └── gemini_generator.py   # GeminiDocumentGenerator: prompt building + Gemini calls
├── assets/
│   └── logo.png              # Logo used in the UI, DOCX, and PDF
├── main.py                   # FastAPI app: root health check + router registration
├── routes.py                 # DocumentRequest model + POST /generate endpoint
├── app.py                    # Streamlit frontend: input, preview, edit, export
├── requirements.txt
├── .env.example              # Template for environment variables
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- Python **3.10 or later** and `pip`
- A **Google Gemini API key** from [Google AI Studio](https://aistudio.google.com/app/apikey)
- Basic familiarity with [FastAPI](https://fastapi.tiangolo.com/), [Streamlit](https://docs.streamlit.io/), and the [Gemini API](https://ai.google.dev/gemini-api/docs)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/LegalEase.git
cd LegalEase
```

### 2. Create and activate a virtual environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

Or install the packages directly:

```bash
pip install fastapi uvicorn streamlit python-docx fpdf Pillow requests google-generativeai python-dotenv
```

---

## Configuration

Create a `.env` file in the project root. You can copy it from `.env.example`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
BACKEND_URL=http://127.0.0.1:8000
```

| Variable | Description | Default |
| --- | --- | --- |
| `GEMINI_API_KEY` | Your Google Gemini API key (**required**) | none |
| `GEMINI_MODEL` | Gemini model used for generation | `gemini-3.8-flash` |
| `BACKEND_URL` | URL the Streamlit frontend uses to reach FastAPI | `http://127.0.0.1:8000` |

> **Model note:** The original design used `gemini-1.5-pro`. Newer Gemini models are faster and more accurate, so change `GEMINI_MODEL` to any model your key can access.

> **Security:** Never commit your `.env` file. Make sure `.env` is listed in `.gitignore`.

---

## Running the App

Open **two terminals** with the virtual environment activated in both.

**Terminal 1: start the FastAPI backend**

```bash
uvicorn main:app --reload
```

The backend runs at `http://127.0.0.1:8000`. Interactive API docs are at `http://127.0.0.1:8000/docs`.

**Terminal 2: start the Streamlit frontend**

```bash
streamlit run app.py
```

The UI opens at `http://localhost:8501`.

---

## API Reference

### `GET /`

Health check that confirms the service is running.

```json
{ "message": "LegalEase API is running" }
```

### `POST /generate`

Generates a legal document from the input you send.

**Request body**

```json
{
  "document_type": "Freelance Work Contract",
  "parties": "Jane Doe (Service Provider), TechNova Inc. (Client)",
  "terms": "Payment to be made within 30 days of invoice; Confidentiality must be maintained at all times; Either party may terminate with 15 days notice",
  "dates": "April 10, 2026"
}
```

**Response**

```json
{
  "document": "FREELANCE WORK CONTRACT\n\nThis Agreement is entered into on April 10, 2026 ..."
}
```

**Example with `curl`**

```bash
curl -X POST http://127.0.0.1:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"document_type":"NDA","parties":"John Doe (Freelancer), ABC Corp (Client)","terms":"Confidentiality for 2 years; No disclosure to third parties","dates":"April 15, 2026"}'
```

---

## How to Use

1. **Document type**: The kind of document you need, such as `Employment Contract`, `NDA`, `Lease Agreement`, `Employment Offer Letter`, or `Freelance Work Contract`.
2. **Parties involved**: The names and roles of everyone involved, such as `Alice Smith (Tenant), XYZ Realty (Landlord)`.
3. **Terms and conditions**: Separate clauses with **semicolons** (`;`) so each one becomes its own bullet or table row:
   ```
   Payment to be made within 30 days of invoice; The provider agrees to deliver work by the agreed deadline; Confidentiality must be maintained at all times; Either party may terminate with 15 days notice
   ```
4. **Effective date**: The date the agreement takes effect, such as `April 10, 2026`.
5. Click **Generate Document** to see the AI-generated preview.
6. Click **Edit Document** to change the text.
7. Download the document as **TXT**, **DOCX**, or **PDF**.

---

## Deployment

- **Backend (FastAPI)**: [Render](https://render.com), [Railway](https://railway.app), [Fly.io](https://fly.io), or any VPS.
  - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Frontend (Streamlit)**: [Streamlit Community Cloud](https://streamlit.io/cloud), Render, or Railway.
  - Set `BACKEND_URL` to the public URL of your deployed backend.
- Set `GEMINI_API_KEY` as an environment variable or secret on the hosting platform. Do not commit it.
- Add a `Procfile` or `Dockerfile` if your platform needs one. Example `Procfile`:
  ```
  web: uvicorn main:app --host 0.0.0.0 --port $PORT
  ```

---

## Testing Checklist

- [ ] Backend health check (`GET /`) returns a success message
- [ ] `POST /generate` returns a document for several document types
- [ ] The HTML preview renders correctly
- [ ] Changes made in edit mode appear in the downloads
- [ ] The DOCX file includes the logo, headings, terms table, and footer
- [ ] The PDF file shows the logo and footer on every page
- [ ] Semicolon-separated terms appear as clean bullets or table rows
- [ ] A missing or invalid API key shows a clear error message

---

## Roadmap

- [ ] Deeper contract analysis and clause highlighting
- [ ] Plain-language summaries of generated documents
- [ ] Multilingual document generation
- [ ] Integration with legal databases
- [ ] User accounts and saved document history
- [ ] Custom branding uploads (logo, fonts, colors)

---

## Disclaimer

LegalEase creates documents with AI **for informational and drafting purposes only**. It does **not** give legal advice. Have a qualified legal professional review any generated document before you use or sign it.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">Made with FastAPI, Streamlit &amp; Google Gemini</p>
