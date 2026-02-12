import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Briefcase, Users, CheckCircle, AlertCircle, BarChart3, ChevronRight } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/jobs`);
      setJobs(response.data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const createJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/jobs`, {
        title: jobTitle,
        description: jobDescription
      });
      setJobs([...jobs, response.data]);
      setSelectedJob(response.data);
      setJobTitle('');
      setJobDescription('');
    } catch (error) {
      console.error("Error creating job:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    if (!selectedJob) return;
    setProcessing(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      await axios.post(`${API_BASE_URL}/jobs/${selectedJob.id}/upload-cvs`, formData);
      alert("CVs uploaded successfully! Processing in background. Please wait a moment and refresh rankings.");
      setFiles([]);
    } catch (error) {
      console.error("Error uploading CVs:", error);
    } finally {
      setProcessing(false);
    }
  };

  const fetchRankings = async () => {
    if (!selectedJob) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/jobs/${selectedJob.id}/rankings`);
      setRankings(response.data);
    } catch (error) {
      console.error("Error fetching rankings:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-800">AI Recruit Architect</h1>
          <p className="text-gray-600">Decision Support System for Automated CV Screening</p>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <span className="text-sm font-medium text-gray-500">Recruiter ID: #001 (Demo Mode)</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" /> Post New Job
            </h2>
            <form onSubmit={createJob} className="space-y-4">
              <input
                type="text"
                placeholder="Job Title (e.g. Senior Python Developer)"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
              />
              <textarea
                placeholder="Detailed Job Description..."
                className="w-full p-2 border border-gray-300 rounded h-32 focus:ring-2 focus:ring-blue-500 outline-none"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Job'}
              </button>
            </form>
          </section>

          <section className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4">Existing Jobs</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {jobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`p-3 border rounded-lg cursor-pointer transition flex items-center justify-between ${
                    selectedJob?.id === job.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <span className="font-medium text-gray-700 truncate">{job.title}</span>
                  <ChevronRight className={`w-4 h-4 ${selectedJob?.id === job.id ? 'text-blue-500' : 'text-gray-400'}`} />
                </div>
              ))}
              {jobs.length === 0 && <p className="text-gray-500 text-sm">No jobs created yet.</p>}
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedJob ? (
            <>
              <section className="bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-600">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedJob.title}</h2>
                    <p className="text-gray-500 line-clamp-1">{selectedJob.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={fetchRankings}
                      className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition"
                    >
                      <BarChart3 className="w-4 h-4" /> Refresh Rankings
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 border-dashed text-center">
                  <Upload className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-blue-800">Batch CV Upload</h3>
                  <p className="text-blue-600 text-sm mb-4">Upload 50+ CVs at once (PDF/DOCX)</p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx"
                    onChange={(e) => setFiles(e.target.files)}
                    className="hidden"
                    id="cv-upload"
                  />
                  <label
                    htmlFor="cv-upload"
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition"
                  >
                    Select CV Files
                  </label>
                  {files.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-blue-700">{files.length} files selected</p>
                      <button
                        onClick={handleFileUpload}
                        disabled={processing}
                        className="mt-2 bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition text-sm"
                      >
                        {processing ? 'Processing...' : 'Confirm Upload'}
                      </button>
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" /> Candidate Rankings
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Rank</th>
                        <th className="px-6 py-4 font-semibold">Candidate</th>
                        <th className="px-6 py-4 font-semibold">Similarity</th>
                        <th className="px-6 py-4 font-semibold">Experience</th>
                        <th className="px-6 py-4 font-semibold">Final Score</th>
                        <th className="px-6 py-4 font-semibold">Match</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rankings.map((r, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-bold text-gray-500">#{index + 1}</td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-800">{r.candidate_name}</div>
                            <div className="text-xs text-gray-400">{r.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-700">{(r.semantic_score * 100).toFixed(1)}%</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-700">{r.total_experience} Yrs</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px] mb-1">
                              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${r.final_score * 100}%` }}></div>
                            </div>
                            <span className="text-sm font-bold text-blue-700">{(r.final_score * 100).toFixed(1)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {r.matched_skills.slice(0, 3).map((skill, i) => (
                                <span key={i} className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                                  {skill}
                                </span>
                              ))}
                              {r.matched_skills.length > 3 && (
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                  +{r.matched_skills.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {rankings.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-gray-500 italic">
                            No candidates processed for this job yet. Upload CVs to see rankings.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-xl shadow-md border-2 border-dashed border-gray-200">
              <Briefcase className="w-16 h-16 text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-400">Select a job to view rankings</h2>
              <p className="text-gray-400 max-w-sm mt-2">
                Choose an existing job from the sidebar or create a new one to start matching candidates.
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="max-w-6xl mx-auto mt-12 text-center text-gray-400 text-sm">
        <p>© 2026 AI Recruit Architect - Final Year Computer Science Project</p>
        <p className="mt-1">Built with FastAPI, React, PostgreSQL & Sentence-Transformers</p>
      </footer>
    </div>
  );
}

export default App;
