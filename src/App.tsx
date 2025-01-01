import React, { useEffect, useState } from "react";
import { Dataset } from "./types";
import DatasetList from "./components/DatasetList.tsx";
import UploadPortal from "./components/UploadPortal.tsx";
import { Building2 as Buildings, User } from "lucide-react";

function App() {
  const [isCityView, setIsCityView] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);

  // Point this to your Python FastAPI server
  const PYTHON_API_BASE = "http://localhost:8005";

  // Fetch dataset list on mount
  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      const resp = await fetch(`${PYTHON_API_BASE}/api/datasets`);
      if (!resp.ok) {
        throw new Error(await resp.text());
      }
      const data = await resp.json();
      setDatasets(data);
    } catch (err) {
      console.error("Error loading datasets:", err);
      alert("Could not load datasets.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">
          City Contributor Data Archive
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsCityView(false)}
            className={`flex items-center px-3 py-2 rounded ${
              !isCityView ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            <User size={16} className="mr-2" />
            Contributor View
          </button>
          <button
            onClick={() => setIsCityView(true)}
            className={`flex items-center px-3 py-2 rounded ${
              isCityView ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            <Buildings size={16} className="mr-2" />
            City Admin View
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 flex-grow">
        {isCityView && (
          <UploadPortal
            pythonApiBase={PYTHON_API_BASE}
            onUploadSuccess={loadDatasets}
          />
        )}

        <DatasetList
          isCityView={isCityView}
          datasets={datasets}
          pythonApiBase={PYTHON_API_BASE}
          onRefresh={loadDatasets}
        />
      </main>

      {/* Footer */}
      <footer className="p-4 bg-white border-t text-center text-sm text-gray-500">
        {isCityView
          ? "Logged in as City Admin"
          : "You are a Contributor (or anonymous)"}
      </footer>
    </div>
  );
}

export default App;
