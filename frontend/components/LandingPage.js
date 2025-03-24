"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-scroll";
import { FaRocket, FaFire, FaMagic } from "react-icons/fa";

export default function LandingPage({ setActiveTab }) {
  const [quizAnswers, setQuizAnswers] = useState({
    keywords: "",
    length: "",
    structure: "",
  });
  const [quizResult, setQuizResult] = useState(null);

  const handleQuizSubmit = () => {
    console.log("Quiz submitted with answers:", quizAnswers); // Debug log
    const score = Object.values(quizAnswers).reduce((acc, answer) => {
      if (answer === "yes") return acc + 33;
      return acc;
    }, 0);
    setQuizResult(
      score >= 66
        ? "🚀 Your resume is in great shape! Ready to match it with your dream job?"
        : score >= 33
        ? "🌟 Your resume has potential! Let’s polish it with AirResume."
        : "☄️ Your resume needs some work. Start with our tools to make it shine!"
    );
  };

  const featureVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  return (
    <div className="text-white">
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-6 relative">
        <motion.h1
          className="text-6xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          Welcome to AirResume
        </motion.h1>
        <motion.p
          className="text-2xl md:text-3xl text-gray-300 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Transform Your Career with AI-Powered Resume Magic
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <Link
            to="features"
            smooth={true}
            duration={500}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition cursor-pointer"
          >
            Explore Now
          </Link>
        </motion.div>
      </section>

      <section id="features" className="py-20 px-6">
        <h2 className="text-4xl font-bold text-center text-purple-400 mb-12">Why Choose AirResume?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <motion.div
            variants={featureVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-gray-800 p-6 rounded-lg shadow-lg shadow-purple-500/20 text-center"
          >
            <FaRocket className="text-5xl text-purple-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">Match Your Resume</h3>
            <p className="text-gray-400">
              Upload your resume and a job description to see how well they align. Get actionable insights to improve your match score.
            </p>
            <button
              onClick={() => {
                console.log("Navigating to match tab");
                setActiveTab("match");
              }}
              className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition"
            >
              Try Matching
            </button>
          </motion.div>
          <motion.div
            variants={featureVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-gray-800 p-6 rounded-lg shadow-lg shadow-purple-500/20 text-center"
          >
            <FaMagic className="text-5xl text-blue-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">Generate a Resume</h3>
            <p className="text-gray-400">
              Create a professional resume from scratch with AI-powered templates tailored to your industry.
            </p>
            <button
              onClick={() => {
                console.log("Navigating to generate tab");
                setActiveTab("generate");
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
            >
              Generate Now
            </button>
          </motion.div>
          <motion.div
            variants={featureVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-gray-800 p-6 rounded-lg shadow-lg shadow-purple-500/20 text-center"
          >
            <FaFire className="text-5xl text-red-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">Roast Your Resume</h3>
            <p className="text-gray-400">
              Get a humorous yet insightful critique of your resume to identify areas for improvement.
            </p>
            <button
              onClick={() => {
                console.log("Navigating to roast tab");
                setActiveTab("roast");
              }}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              Get Roasted
            </button>
          </motion.div>
        </div>
      </section>

      <section id="quiz" className="py-20 px-6 bg-gray-900">
        <h2 className="text-4xl font-bold text-center text-purple-400 mb-12">Resume Readiness Quiz</h2>
        <div className="max-w-2xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg shadow-purple-500/20">
          <p className="text-gray-300 mb-6 text-center">
            Answer a few quick questions to see how ready your resume is for the job market!
          </p>
          <div className="space-y-6">
            <div>
              <p className="text-gray-300 mb-2">Does your resume include keywords specific to your target job?</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setQuizAnswers({ ...quizAnswers, keywords: "yes" })}
                  className={`px-4 py-2 rounded-md ${
                    quizAnswers.keywords === "yes" ? "bg-green-500" : "bg-gray-700"
                  } text-white`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setQuizAnswers({ ...quizAnswers, keywords: "no" })}
                  className={`px-4 py-2 rounded-md ${
                    quizAnswers.keywords === "no" ? "bg-red-500" : "bg-gray-700"
                  } text-white`}
                >
                  No
                </button>
              </div>
            </div>
            <div>
              <p className="text-gray-300 mb-2">Is your resume 1-2 pages long?</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setQuizAnswers({ ...quizAnswers, length: "yes" })}
                  className={`px-4 py-2 rounded-md ${
                    quizAnswers.length === "yes" ? "bg-green-500" : "bg-gray-700"
                  } text-white`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setQuizAnswers({ ...quizAnswers, length: "no" })}
                  className={`px-4 py-2 rounded-md ${
                    quizAnswers.length === "no" ? "bg-red-500" : "bg-gray-700"
                  } text-white`}
                >
                  No
                </button>
              </div>
            </div>
            <div>
              <p className="text-gray-300 mb-2">Does your resume have a clear structure (e.g., sections for Experience, Education)?</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setQuizAnswers({ ...quizAnswers, structure: "yes" })}
                  className={`px-4 py-2 rounded-md ${
                    quizAnswers.structure === "yes" ? "bg-green-500" : "bg-gray-700"
                  } text-white`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setQuizAnswers({ ...quizAnswers, structure: "no" })}
                  className={`px-4 py-2 rounded-md ${
                    quizAnswers.structure === "no" ? "bg-red-500" : "bg-gray-700"
                  } text-white`}
                >
                  No
                </button>
              </div>
            </div>
            <motion.button
              onClick={handleQuizSubmit}
              className="w-full py-3 bg-purple-500 rounded-md text-white font-semibold flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(147, 51, 234, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              Get Your Result
            </motion.button>
          </div>
          {quizResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-gray-700 rounded-md text-center text-gray-300"
            >
              {quizResult}
            </motion.div>
          )}
        </div>
      </section>

      <footer className="py-6 text-center text-gray-400">
        <p>© 2025 AirResume. All rights reserved.</p>
        <p>
          Powered by <span className="text-purple-400">xAI’s Grok</span>
        </p>
      </footer>
    </div>
  );
}