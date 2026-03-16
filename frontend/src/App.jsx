// App.jsx — Root component that manages which page is shown
// and holds the shared state passed down to child components

import { useState } from "react"
import UploadPage from "./components/UploadPage"
import ReviewPage from "./components/ReviewPage"
import SuccessPage from "./components/SuccessPage"

export default function App() {
  const [page, setPage] = useState("upload")
  const [parsedData, setParsedData] = useState(null)
  const [syncResult, setSyncResult] = useState(null)

  // "Lifting state up" — App owns the data, child components
  // receive it as props and call these callbacks to update it.
  // This keeps all shared state in one place.

  return (
    <div>
      {page === "upload" && (
        <UploadPage
          onParsed={(data) => {
            setParsedData(data)
            setPage("review")
          }}
        />
      )}

      {page === "review" && (
        <ReviewPage
          parsedData={parsedData}
          onSynced={(result) => {
            setSyncResult(result)
            setPage("success")
          }}
          onBack={() => setPage("upload")}
        />
      )}

      {page === "success" && (
        <SuccessPage
          syncResult={syncResult}
          onReset={() => {
            setParsedData(null)
            setSyncResult(null)
            setPage("upload")
          }}
        />
      )}
    </div>
  )
}