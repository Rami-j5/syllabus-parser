// ReviewPage.jsx — Review and edit parsed items before syncing to Google

import { useState } from "react"
import axios from "axios"

export default function ReviewPage({ parsedData, onSynced, onBack }) {
  const [items, setItems] = useState(parsedData.items)
  const [courseName, setCourseName] = useState(parsedData.course_name)
  const [editingIndex, setEditingIndex] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleEdit(index) {
    setEditingIndex(index)
    // Spread into a new object so edits don't mutate the original item
    setEditForm({ ...items[index] })
  }

  function handleEditChange(field, value) {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  function handleSaveEdit(index) {
    setItems(prev => {
      const updated = [...prev]
      updated[index] = editForm
      return updated
    })
    setEditingIndex(null)
    setEditForm({})
  }

  function handleDelete(index) {
    // _ is convention for "I don't need this parameter"
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function handleAddItem() {
    const newItem = {
      title: "New Item",
      date: "",
      type: "",
      weight: "",
      description: ""
    }
    setItems(prev => [...prev, newItem])
    setEditingIndex(items.length)
    setEditForm(newItem)
  }

  async function handleSync() {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.post("http://localhost:5000/sync", {
        course_name: courseName,
        items: items
      })
      onSynced(response.data.synced)
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Sync failed. Is your Flask server running?"
      )
    } finally {
      setLoading(false)
    }
  }

  function getTypeBadgeStyle(type) {
    const colors = {
      exam:       { bg: "#fff5f5", text: "#c53030" },
      quiz:       { bg: "#fffbeb", text: "#b7791f" },
      assignment: { bg: "#f0fff4", text: "#276749" },
      project:    { bg: "#ebf8ff", text: "#2b6cb0" },
      other:      { bg: "#faf5ff", text: "#6b46c1" },
    }
    return colors[type] || colors.other
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <div style={styles.header}>
          <button onClick={onBack} style={styles.backButton}>
            ← Back
          </button>
          <div>
            <h1 style={styles.title}>Review Items</h1>
            <p style={styles.subtitle}>
              Edit or delete anything before syncing to Google
            </p>
          </div>
        </div>

        <div style={styles.courseNameRow}>
          <label style={styles.label}>Course Name:</label>
          <input
            value={courseName}
            onChange={e => setCourseName(e.target.value)}
            style={styles.courseNameInput}
          />
        </div>

        <p style={styles.countText}>
          {items.length} item{items.length !== 1 ? "s" : ""} found
        </p>

        <div style={styles.itemsList}>
          {items.map((item, index) => (
            // key tells React which item is which when re-rendering
            <div key={index} style={styles.itemCard}>

              {editingIndex === index ? (
                <div style={styles.editForm}>
                  <div style={styles.editRow}>
                    <label style={styles.editLabel}>Title</label>
                    <input
                      value={editForm.title || ""}
                      onChange={e => handleEditChange("title", e.target.value)}
                      style={styles.editInput}
                    />
                  </div>

                  <div style={styles.editRow}>
                    <label style={styles.editLabel}>Date (YYYY-MM-DD)</label>
                    <input
                      value={editForm.date || ""}
                      onChange={e => handleEditChange("date", e.target.value)}
                      style={styles.editInput}
                      placeholder="2026-10-15 or leave blank"
                    />
                  </div>

                  <div style={styles.editRow}>
                    <label style={styles.editLabel}>Type</label>
                    <input
                      value={editForm.type || ""}
                      onChange={e => handleEditChange("type", e.target.value)}
                      style={styles.editInput}
                      placeholder="e.g. exam, quiz, assignment..."
                    />
                  </div>

                  <div style={styles.editRow}>
                    <label style={styles.editLabel}>Weight</label>
                    <input
                      value={editForm.weight || ""}
                      onChange={e => handleEditChange("weight", e.target.value)}
                      style={styles.editInput}
                      placeholder="e.g. 20%"
                    />
                  </div>

                  <div style={styles.editRow}>
                    <label style={styles.editLabel}>Description</label>
                    <input
                      value={editForm.description || ""}
                      onChange={e => handleEditChange("description", e.target.value)}
                      style={styles.editInput}
                      placeholder="Optional details"
                    />
                  </div>

                  <div style={styles.editActions}>
                    <button onClick={() => handleSaveEdit(index)} style={styles.saveButton}>
                      Save
                    </button>
                    <button onClick={() => setEditingIndex(null)} style={styles.cancelButton}>
                      Cancel
                    </button>
                  </div>
                </div>

              ) : (

                <div style={styles.itemView}>
                  <div style={styles.itemLeft}>
                    <span style={{
                      ...styles.typeBadge,
                      backgroundColor: getTypeBadgeStyle(item.type).bg,
                      color: getTypeBadgeStyle(item.type).text,
                    }}>
                      {item.type || "other"}
                    </span>

                    <div>
                      <p style={styles.itemTitle}>
                        {item.title}
                        {item.weight && (
                          <span style={styles.weightTag}> {item.weight}</span>
                        )}
                      </p>
                      <p style={styles.itemDate}>
                        {item.date || "No date"}
                      </p>
                      {item.description && (
                        <p style={styles.itemDescription}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={styles.itemActions}>
                    <button onClick={() => handleEdit(index)} style={styles.editButton}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(index)} style={styles.deleteButton}>
                      Delete
                    </button>
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>

        <button onClick={handleAddItem} style={styles.addButton}>
          + Add Item Manually
        </button>

        {error && (
          <div style={styles.error}>⚠️ {error}</div>
        )}

        <button
          onClick={handleSync}
          disabled={loading || items.length === 0}
          style={{
            ...styles.syncButton,
            cursor: loading || items.length === 0 ? "not-allowed" : "pointer",
            opacity: loading || items.length === 0 ? 0.6 : 1
          }}
        >
          {loading ? "Syncing to Google..." : `Sync ${items.length} items to Google →`}
        </button>

        {loading && (
          <p style={styles.loadingText}>
            ⏳ A Google login tab will open in your browser. Log in, then close
            that tab and come back — syncing will complete automatically!
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
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "32px 16px",
    fontFamily: "system-ui, sans-serif"
  },
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "36px",
    width: "100%",
    maxWidth: "700px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.1)"
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "24px"
  },
  backButton: {
    background: "none",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "14px",
    color: "#4a5568",
    whiteSpace: "nowrap"
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1a202c",
    margin: 0
  },
  subtitle: {
    color: "#718096",
    fontSize: "14px",
    margin: "4px 0 0 0"
  },
  courseNameRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    padding: "12px 16px",
    backgroundColor: "#f7fafc",
    borderRadius: "10px"
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#4a5568",
    whiteSpace: "nowrap"
  },
  courseNameInput: {
    flex: 1,
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    padding: "6px 10px",
    fontSize: "14px",
    color: "#2d3748"
  },
  countText: {
    fontSize: "13px",
    color: "#718096",
    marginBottom: "16px"
  },
  itemsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "16px"
  },
  itemCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    overflow: "hidden"
  },
  itemView: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "14px 16px",
    gap: "12px"
  },
  itemLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    flex: 1
  },
  typeBadge: {
    fontSize: "11px",
    fontWeight: "600",
    padding: "3px 8px",
    borderRadius: "20px",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    marginTop: "2px"
  },
  itemTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#2d3748",
    margin: "0 0 2px 0"
  },
  weightTag: {
    fontSize: "13px",
    fontWeight: "400",
    color: "#718096"
  },
  itemDate: {
    fontSize: "13px",
    color: "#718096",
    margin: "0 0 2px 0"
  },
  itemDescription: {
    fontSize: "12px",
    color: "#a0aec0",
    margin: 0
  },
  itemActions: {
    display: "flex",
    gap: "8px",
    flexShrink: 0
  },
  editButton: {
    backgroundColor: "#ebf8ff",
    color: "#3182ce",
    border: "none",
    borderRadius: "6px",
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600"
  },
  deleteButton: {
    backgroundColor: "#fff5f5",
    color: "#c53030",
    border: "none",
    borderRadius: "6px",
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600"
  },
  editForm: {
    padding: "16px",
    backgroundColor: "#f7fafc",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  editRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  editLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#4a5568",
    width: "140px",
    flexShrink: 0
  },
  editInput: {
    flex: 1,
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    padding: "7px 10px",
    fontSize: "14px",
    backgroundColor: "white"
  },
  editActions: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end"
  },
  saveButton: {
    backgroundColor: "#3182ce",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "8px 20px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600"
  },
  cancelButton: {
    backgroundColor: "#e2e8f0",
    color: "#4a5568",
    border: "none",
    borderRadius: "6px",
    padding: "8px 20px",
    cursor: "pointer",
    fontSize: "14px"
  },
  addButton: {
    backgroundColor: "white",
    color: "#3182ce",
    border: "1px dashed #3182ce",
    borderRadius: "8px",
    padding: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    width: "100%",
    marginBottom: "16px"
  },
  syncButton: {
    backgroundColor: "#38a169",
    color: "white",
    border: "none",
    padding: "14px 32px",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    width: "100%",
    marginTop: "8px",
    transition: "opacity 0.2s"
  },
  error: {
    backgroundColor: "#fff5f5",
    color: "#c53030",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "12px"
  },
  loadingText: {
    color: "#718096",
    fontSize: "13px",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: "8px"
  }
}