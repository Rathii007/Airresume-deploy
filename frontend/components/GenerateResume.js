"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const API_BASE_URL = "http://localhost:8000";

export default function GenerateResume() {
  const [step, setStep] = useState("start");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    education: "",
    experience: "",
    skills: "",
    jobTitle: "",
    yearsExperience: "",
    template: "modern", // Aligned with resume_templates.py
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [atsScore, setAtsScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const templates = {
    "modern": "bg-gray-900 text-white p-6 rounded shadow-lg",
    "classic": "bg-white text-black p-6 border border-gray-300",
    "creative": "bg-blue-100 text-black p-6 rounded shadow-lg",
    "executive": "bg-gray-100 text-black p-6 border border-gray-400",
    "minimalist": "bg-white text-gray-800 p-6 rounded shadow-md",
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResumeFile(file);
    setLoading(true);
    const form = new FormData();
    form.append("resume", file);

    try {
      const res = await fetch(`${API_BASE_URL}/extract-resume/`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("Failed to extract resume data");
      const data = await res.json();
      setFormData((prev) => ({
        ...prev,
        ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? ""])),
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const suggestContent = async () => {
    if (!formData.jobTitle) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/suggest-content/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle: formData.jobTitle, yearsExperience: formData.yearsExperience || "2" }),
      });
      if (!res.ok) throw new Error("Failed to fetch AI suggestions");
      const data = await res.json();
      setFormData((prev) => ({
        ...prev,
        ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? ""])),
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const enhanceSection = async (section) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/enhance-section/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          content: formData[section] || "",
          jobTitle: formData.jobTitle || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to enhance section: " + (await res.text()));
      const data = await res.json();
      setFormData((prev) => ({ ...prev, [section]: data.enhanced ?? "" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const updateAtsScore = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ats-preview/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const data = await res.json();
          setAtsScore(data.ats_score);
        }
      } catch (err) {
        console.error("ATS score fetch failed:", err);
      }
    };
    if (step === "preview") updateAtsScore();
  }, [formData, step]);

  const generateResume = async (format = "pdf") => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/generate-resume/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, format }),
      });
      if (!res.ok) throw new Error("Failed to generate resume: " + (await res.text()));
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `resume.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "start":
        return (
          <div className="text-center">
            <h3 className="text-3xl font-bold text-purple-400 mb-6">How do you want to start?</h3>
            <div className="flex justify-center gap-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep("quick")}
                className="px-8 py-4 bg-blue-500 rounded-md text-white text-lg"
              >
                Quick Resume
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep("custom-1")}
                className="px-8 py-4 bg-purple-500 rounded-md text-white text-lg"
              >
                Custom Resume
              </motion.button>
            </div>
          </div>
        );

      case "quick":
        return (
          <div>
            <h3 className="text-3xl font-bold text-purple-400 mb-6">Quick Resume</h3>
            <input
              type="text"
              placeholder="Job Title (e.g., Software Engineer)"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              className="w-full p-4 bg-gray-700 rounded-md text-gray-300 text-lg mb-4"
            />
            <input
              type="number"
              placeholder="Years of Experience"
              value={formData.yearsExperience}
              onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
              className="w-full p-4 bg-gray-700 rounded-md text-gray-300 text-lg mb-4"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { suggestContent(); setStep("preview"); }}
              className="w-full py-4 bg-purple-500 rounded-md text-white text-lg"
              disabled={loading || !formData.jobTitle}
            >
              {loading ? "Generating..." : "Generate Resume"}
            </motion.button>
          </div>
        );

      case "custom-1":
        return (
          <div>
            <h3 className="text-3xl font-bold text-purple-400 mb-6">Step 1: Personal Info</h3>
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileUpload}
              className="w-full p-4 bg-gray-700 rounded-md text-gray-300 text-lg mb-4"
            />
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-4 bg-gray-700 rounded-md text-gray-300 text-lg mb-4"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-4 bg-gray-700 rounded-md text-gray-300 text-lg mb-4"
            />
            <input
              type="text"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-4 bg-gray-700 rounded-md text-gray-300 text-lg mb-4"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep("custom-2")}
              className="w-full py-4 bg-purple-500 rounded-md text-white text-lg"
            >
              Next
            </motion.button>
          </div>
        );

      case "custom-2":
        return (
          <div>
            <h3 className="text-3xl font-bold text-purple-400 mb-6">Step 2: Experience & Education</h3>
            <input
              type="text"
              placeholder="Job Title (optional for suggestions)"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              className="w-full p-4 bg-gray-700 rounded-md text-gray-300 text-lg mb-4"
            />
            <div className="flex gap-4 mb-4">
              <textarea
                placeholder="Experience"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="w-full p-4 bg-gray-700 rounded-md text-gray-300 text-lg h-32"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => enhanceSection("experience")}
                className="px-6 py-3 bg-blue-500 rounded-md text-white text-lg"
              >
                Enhance
              </motion.button>
            </div>
            <div className="flex gap-4 mb-4">
              <textarea
                placeholder="Education"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                className="w-full p-4 bg-gray-700 rounded-md text-gray-300 text-lg h-32"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => enhanceSection("education")}
                className="px-6 py-3 bg-blue-500 rounded-md text-white text-lg"
              >
                Enhance
              </motion.button>
            </div>
            <div className="flex justify-between">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep("custom-1")}
                className="px-6 py-3 bg-gray-600 rounded-md text-white text-lg"
              >
                Back
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep("custom-3")}
                className="px-6 py-3 bg-purple-500 rounded-md text-white text-lg"
              >
                Next
              </motion.button>
            </div>
          </div>
        );

      case "custom-3":
        return (
          <div>
            <h3 className="text-3xl font-bold text-purple-400 mb-6">Step 3: Skills</h3>
            <div className="flex gap-4 mb-4">
              <textarea
                placeholder="Skills"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                className="w-full p-4 bg-gray-700 rounded-md text-gray-300 text-lg h-32"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => enhanceSection("skills")}
                className="px-6 py-3 bg-blue-500 rounded-md text-white text-lg"
              >
                Enhance
              </motion.button>
            </div>
            <div className="flex justify-between">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep("custom-2")}
                className="px-6 py-3 bg-gray-600 rounded-md text-white text-lg"
              >
                Back
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep("preview")}
                className="px-6 py-3 bg-purple-500 rounded-md text-white text-lg"
              >
                Preview
              </motion.button>
            </div>
          </div>
        );

      case "preview":
        return (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <h3 className="text-3xl font-bold text-purple-400 mb-6">Preview & Export</h3>
              <select
                value={formData.template}
                onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                className="w-full p-4 bg-gray-700 rounded-md text-gray-300 text-lg mb-4"
              >
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="creative">Creative</option>
                <option value="executive">Executive</option>
                <option value="minimalist">Minimalist</option>
              </select>
              <div className={`${templates[formData.template]} text-lg`}>
                <h4 className="font-bold text-xl">{formData.name || "Your Name"}</h4>
                <p>{formData.email} | {formData.phone}</p>
                <h5 className="font-semibold mt-4">Education</h5>
                <p>{formData.education || "Add your education"}</p>
                <h5 className="font-semibold mt-4">Experience</h5>
                <p>{formData.experience || "Add your experience"}</p>
                <h5 className="font-semibold mt-4">Skills</h5>
                <p>{formData.skills || "Add your skills"}</p>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-gray-300 text-lg mb-6">ATS Score: {atsScore !== null ? `${atsScore}%` : "Calculating..."}</p>
              <div className="flex flex-col gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => generateResume("pdf")}
                  className="py-4 bg-purple-500 rounded-md text-white text-lg"
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Download PDF"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => generateResume("docx")}
                  className="py-4 bg-blue-500 rounded-md text-white text-lg"
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Download Word"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigator.clipboard.writeText(`${formData.name}\n${formData.email} | ${formData.phone}\n\nEducation\n${formData.education}\n\nExperience\n${formData.experience}\n\nSkills\n${formData.skills}`)}
                  className="py-4 bg-gray-600 rounded-md text-white text-lg"
                >
                  Copy Text
                </motion.button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="bg-gray-800/50 p-8 rounded-lg shadow-lg shadow-purple-500/20 w-full max-w-6xl mx-auto"
    >
      {renderStep()}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-4 bg-red-500/20 rounded-md text-red-300 text-lg"
        >
          {error}
        </motion.div>
      )}
    </motion.div>
  );
}