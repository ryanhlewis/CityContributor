import React, { useState } from "react";
import { Users, Check } from "lucide-react";

function ContributorSignup({ onSignup }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) return alert("Please provide name and email.");

    onSignup({ name, email, isPublic });
    setName("");
    setEmail("");
    setIsPublic(true);
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 p-4 border border-gray-200 rounded shadow bg-white">
      <h2 className="text-xl font-bold text-purple-700 mb-4 flex items-center">
        <Users className="mr-2" />
        Contributor Signup
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Name</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Full Name"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your Email"
            required
          />
        </div>
        <div className="flex items-center space-x-4">
          <label className="inline-flex items-center space-x-2">
            <input
              type="radio"
              name="publicOrPrivate"
              checked={isPublic === true}
              onChange={() => setIsPublic(true)}
            />
            <span>Public / Open-Source Contributor</span>
          </label>
          <label className="inline-flex items-center space-x-2">
            <input
              type="radio"
              name="publicOrPrivate"
              checked={isPublic === false}
              onChange={() => setIsPublic(false)}
            />
            <span>Private Contributor</span>
          </label>
        </div>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700"
        >
          <Check size={16} className="mr-2" />
          Sign Up
        </button>
      </form>
    </div>
  );
}

export default ContributorSignup;
