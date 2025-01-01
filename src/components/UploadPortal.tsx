import React, { useState } from "react";
import { Upload } from "lucide-react";

interface Props {
  pythonApiBase: string;
  onUploadSuccess: () => void;
}

function UploadPortal({ pythonApiBase, onUploadSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("file", file);

      const resp = await fetch(`${pythonApiBase}/api/uploadDataset`, {
        method: "POST",
        body: formData,
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text);
      }
      alert("Dataset uploaded successfully.");
      setTitle("");
      setDescription("");
      setFile(null);
      onUploadSuccess(); // Refresh dataset list
    } catch (err) {
      console.error(err);
      alert("Error uploading dataset.");
    }
  };

  return (
    <div className="border border-blue-200 rounded p-4 mb-4 bg-white shadow max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-blue-700 mb-4">City Upload Portal</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium text-gray-700 mb-1">Dataset Title</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded focus:outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="w-full border px-3 py-2 rounded focus:outline-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium text-gray-700 mb-1">Upload File</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="border w-full file:mr-4 file:py-2 file:px-4 file:rounded
                       file:border-0 file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
            required
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Upload size={16} className="mr-2" />
          Upload
        </button>
      </form>
    </div>
  );
}

export default UploadPortal;
