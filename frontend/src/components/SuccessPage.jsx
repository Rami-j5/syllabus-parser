// SuccessPage.jsx — Confirmation screen shown after successful Google sync

export default function SuccessPage({ syncResult, onReset }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <div style={styles.iconWrapper}>
          <span style={styles.icon}>🎉</span>
        </div>
        <h1 style={styles.title}>All synced!</h1>
        <p style={styles.subtitle}>
          Your syllabus has been added to Google Calendar and Tasks
        </p>

        {syncResult?.course_name && (
          <div style={styles.courseTag}>
            📚 {syncResult.course_name}
          </div>
        )}

        <div style={styles.statsRow}>
          <div style={styles.statBox}>
            <p style={styles.statNumber}>{syncResult?.calendar_events_created ?? 0}</p>
            <p style={styles.statLabel}>Calendar Events</p>
          </div>
          <div style={styles.statBox}>
            <p style={styles.statNumber}>{syncResult?.tasks_created ?? 0}</p>
            <p style={styles.statLabel}>Tasks Created</p>
          </div>
          <div style={styles.statBox}>
            <p style={styles.statNumber}>{syncResult?.total_items ?? 0}</p>
            <p style={styles.statLabel}>Total Items</p>
          </div>
        </div>

        {/* Only shown if some items were skipped due to missing dates */}
        {syncResult?.skipped_items?.length > 0 && (
          <div style={styles.skippedBox}>
            <p style={styles.skippedTitle}>
              ⚠️ {syncResult.skipped_items.length} item(s) skipped from Calendar
            </p>
            <p style={styles.skippedSubtitle}>
              No valid date found — these were still added as Tasks without a due date.
            </p>
            <ul style={styles.skippedList}>
              {syncResult.skipped_items.map((item, index) => (
                <li key={index} style={styles.skippedItem}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={styles.linksRow}>
          <a href="https://calendar.google.com" target="_blank" rel="noreferrer" style={styles.link}>
            Open Google Calendar →
          </a>
          <a href="https://tasks.google.com" target="_blank" rel="noreferrer" style={styles.link}>
            Open Google Tasks →
          </a>
        </div>

        <button onClick={onReset} style={styles.resetButton}>
          Parse Another Syllabus
        </button>

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
    padding: "32px 16px",
    fontFamily: "system-ui, sans-serif"
  },
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "48px 36px",
    width: "100%",
    maxWidth: "480px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
    textAlign: "center"
  },
  iconWrapper: {
    marginBottom: "16px"
  },
  icon: {
    fontSize: "64px"
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1a202c",
    margin: "0 0 8px 0"
  },
  subtitle: {
    color: "#718096",
    fontSize: "15px",
    marginBottom: "24px"
  },
  courseTag: {
    backgroundColor: "#ebf8ff",
    color: "#2b6cb0",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "600",
    display: "inline-block",
    marginBottom: "24px"
  },
  statsRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px"
  },
  statBox: {
    flex: 1,
    backgroundColor: "#f7fafc",
    borderRadius: "12px",
    padding: "16px 8px"
  },
  statNumber: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#2d3748",
    margin: "0 0 4px 0"
  },
  statLabel: {
    fontSize: "12px",
    color: "#718096",
    margin: 0
  },
  skippedBox: {
    backgroundColor: "#fffbeb",
    border: "1px solid #f6e05e",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "24px",
    textAlign: "left"
  },
  skippedTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#b7791f",
    margin: "0 0 4px 0"
  },
  skippedSubtitle: {
    fontSize: "13px",
    color: "#92400e",
    margin: "0 0 8px 0",
    lineHeight: "1.5"
  },
  skippedList: {
    margin: 0,
    paddingLeft: "20px"
  },
  skippedItem: {
    fontSize: "13px",
    color: "#92400e",
    marginBottom: "2px"
  },
  linksRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
    justifyContent: "center"
  },
  link: {
    color: "#3182ce",
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none"
  },
  resetButton: {
    backgroundColor: "#3182ce",
    color: "white",
    border: "none",
    padding: "14px 32px",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%"
  }
}