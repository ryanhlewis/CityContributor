import React, { useState } from "react";
import { Dataset } from "../types";
import { Download, Trash, Edit } from "lucide-react";

interface Props {
  isCityView: boolean;
  datasets: Dataset[];
  pythonApiBase: string;
  onRefresh: () => void;
}

function DatasetList({ isCityView, datasets, pythonApiBase, onRefresh }: Props) {
  const [showContribPopup, setShowContribPopup] = useState<string | null>(null);

  // ------------------ Contributor Flow ------------------
  const handleDownload = (dataset: Dataset) => {
    // We open the file route:
    // GET http://localhost:8000/api/files/{dataset_id}
    window.open(`${pythonApiBase}/api/files/${dataset.id}`, "_blank");

    // After 'downloading', prompt user to become a contributor
    setShowContribPopup(dataset.id);
  };

  const handleContribute = async (
    datasetId: string,
    name: string,
    email: string,
    hostLink: string
  ) => {
    try {
      const resp = await fetch(`${pythonApiBase}/api/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetId, name, email, hostLink }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text);
      }
      alert("Thank you for hosting the file! You are now a known contributor.");
      setShowContribPopup(null);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Error becoming a contributor. " + err);
    }
  };

  // ------------------ City Admin Flow ------------------
  const handleDelete = async (datasetId: string) => {
    if (!window.confirm("Are you sure you want to delete this dataset?")) return;
    try {
      const resp = await fetch(`${pythonApiBase}/api/dataset/${datasetId}`, {
        method: "DELETE",
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text);
      }
      alert("Dataset deleted.");
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Error deleting dataset. " + err);
    }
  };

  const handleEdit = async (dataset: Dataset) => {
    const newTitle = prompt("New Title?", dataset.title);
    const newDesc = prompt("New Description?", dataset.description);
    if (!newTitle && !newDesc) return;

    try {
      const body: any = { id: dataset.id };
      if (newTitle) body.title = newTitle;
      if (newDesc) body.description = newDesc;

      const resp = await fetch(`${pythonApiBase}/api/dataset`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text);
      }
      alert("Dataset updated.");
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Error updating dataset. " + err);
    }
  };

  return (
    <div className="grid gap-4 mt-4 max-w-5xl mx-auto">
      {datasets.map((dataset) => (
        <div key={dataset.id} className="border border-gray-200 rounded p-4 bg-white shadow">
          <h2 className="text-lg font-bold text-indigo-700">{dataset.title}</h2>
          <p className="text-gray-700 mt-1">{dataset.description}</p>
          <p className="text-xs text-gray-500 mt-1">
            Hash: <span className="font-mono">{dataset.hash}</span>
          </p>
          <div className="mt-2 text-sm text-gray-600">
            Verified Contributor Hosts: {dataset.verifiedContributorHosts}
          </div>

          <div className="mt-4 flex items-center space-x-2">
            {/* Contributor View: Download button */}
            {!isCityView && (
              <button
                onClick={() => handleDownload(dataset)}
                className="inline-flex items-center px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                <Download size={16} className="mr-2" />
                Download
              </button>
            )}

            {/* City Admin: Edit & Delete buttons */}
            {isCityView && (
              <>
                <button
                  onClick={() => handleEdit(dataset)}
                  className="inline-flex items-center px-3 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                >
                  <Edit size={16} className="mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(dataset.id)}
                  className="inline-flex items-center px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  <Trash size={16} className="mr-2" />
                  Delete
                </button>
              </>
            )}
          </div>

          {/* After Download, show "Become Contributor" form */}
          {showContribPopup === dataset.id && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
              <p className="mb-2 text-gray-800 font-medium">
                Would you like to host this file for the city?
              </p>
              <ContributorForm
                datasetId={dataset.id}
                onContribute={handleContribute}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** Sub-component for contributor sign-up after download. */
function ContributorForm({
  datasetId,
  onContribute,
}: {
  datasetId: string;
  onContribute: (datasetId: string, name: string, email: string, hostLink: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [hostLink, setHostLink] = useState("");

  const handleSubmit = () => {
    if (!name || !email || !hostLink) {
      alert("Please fill all fields.");
      return;
    }
    onContribute(datasetId, name, email, hostLink);
  };

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-sm text-gray-700 font-medium">Name</label>
        <input
          className="border px-3 py-1 w-full rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name or org"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-700 font-medium">Email</label>
        <input
          className="border px-3 py-1 w-full rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-700 font-medium">Hosting Link</label>
        <input
          className="border px-3 py-1 w-full rounded"
          value={hostLink}
          onChange={(e) => setHostLink(e.target.value)}
          placeholder="URL where you're re-hosting the file"
        />
      </div>
      <button
        onClick={handleSubmit}
        className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        Contribute
      </button>
    </div>
  );
}

export default DatasetList;
