// UploadPage.jsx — First screen the user sees, handles PDF upload and parsing

import { useState } from "react"
import axios from "axios"

export default function UploadPage({ onParsed }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleFileChange(e) {
    setFile(e.target.files[0])
    setError(null)
  }

  async function handleUpload() {
    if (!file) {
      setError("Please select a PDF file first.")
      return
    }

    setLoading(true)
    setError(null)

    // Files can't be sent as JSON — FormData is the standard
    // way to send binary data over HTTP. The key "file" must
    // match what Flask looks for in request.files["file"]
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await axios.post(
        "http://localhost:5000/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )
      onParsed(response.data)
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "An error occurred while uploading. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h1 style={styles.title}>📚 Syllabus Parser</h1>
        <p style={styles.subtitle}>
          Upload your course syllabus PDF and we'll automatically sync
          all your assignments and exams to Google Calendar and Tasks
        </p>

        <div style={styles.uploadArea}>
          <p style={styles.uploadIcon}>📄</p>
          <p style={styles.uploadText}>
            {file ? file.name : "No file chosen. Please upload a PDF syllabus."}
          </p>

          <label style={{
            ...styles.chooseButton,
            opacity: loading ? 0.5 : 1,
            pointerEvents: loading ? "none" : "auto"
            // <label> doesn't support disabled natively so we use
            // pointerEvents: none to block clicks while loading
          }}>
            Choose PDF
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={loading}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {error && (
          <div style={styles.error}>⚠️ {error}</div>
        )}

        <button
          onClick={handleUpload}
          disabled={loading || !file}
          style={{
            ...styles.button,
            opacity: loading || !file ? 0.6 : 1,
            cursor: loading || !file ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Parsing syllabus..." : "Parse Syllabus"}
        </button>

        {loading && (
          <p style={styles.loadingText}>
            ⏳ This might take 10-20 seconds while we read your PDF...
          </p>
        )}

      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f0f4f8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "system-ui, sans-serif"
  },
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "48px",
    width: "100%",
    maxWidth: "480px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
    textAlign: "center"
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1a202c",
    marginBottom: "8px"
  },
  subtitle: {
    color: "#718096",
    fontSize: "15px",
    lineHeight: "1.6",
    marginBottom: "32px"
  },
  uploadArea: {
    border: "2px dashed #cbd5e0",
    borderRadius: "12px",
    padding: "32px",
    marginBottom: "24px",
    backgroundColor: "#f7fafc"
  },
  uploadIcon: {
    fontSize: "48px",
    marginBottom: "8px"
  },
  uploadText: {
    color: "#4a5568",
    fontSize: "14px",
    marginBottom: "16px",
    wordBreak: "break-all"
  },
  chooseButton: {
    backgroundColor: "#ebf4ff",
    color: "#3182ce",
    padding: "8px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    display: "inline-block"
  },
  button: {
    backgroundColor: "#3182ce",
    color: "white",
    border: "none",
    padding: "14px 32px",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    width: "100%",
    marginBottom: "16px",
    transition: "opacity 0.2s"
  },
  error: {
    backgroundColor: "#fff5f5",
    color: "#c53030",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "16px",
    textAlign: "left"
  },
  loadingText: {
    color: "#718096",
    fontSize: "13px",
    fontStyle: "italic"
  }
}