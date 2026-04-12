import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Briefcase, Users, CheckCircle, AlertCircle, BarChart3, ChevronRight, ShieldCheck, ShieldAlert } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [rankingLimit, setRankingLimit] = useState(10);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [semanticWeight, setSemanticWeight] = useState(0.8);
  const [blindMode, setBlindMode] = useState(false);
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
        description: jobDescription,
        semantic_weight: semanticWeight
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
      const response = await axios.get(`${API_BASE_URL}/jobs/${selectedJob.id}/rankings?blind_mode=${blindMode}&limit=${rankingLimit}`);
      setRankings(response.data);
    } catch (error) {
      console.error("Error fetching rankings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedJob) {
      fetchRankings();
    }
  }, [blindMode, rankingLimit, selectedJob]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-slate-900">
      <header className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-900 tracking-tight">AI Recruit Architect</h1>
          <p className="text-slate-500 font-medium">Decision Support System for Automated CV Screening</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider">System Online</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
              <Briefcase className="w-5 h-5 text-indigo-600" /> Post New Job
            </h2>
            <form onSubmit={createJob} className="space-y-4">
              <input
                type="text"
                placeholder="Job Title"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
              />
              <textarea
                placeholder="Job Description..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg h-32 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                required
              />
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 flex justify-between uppercase tracking-tighter">
                  <span>Skills / Experience Weight</span>
                  <span className="text-indigo-600">{Math.round(semanticWeight * 100)}% / {Math.round((1 - semanticWeight) * 100)}%</span>
                </label>
                <input
                  type="range" min="0" max="1" step="0.1"
                  value={semanticWeight}
                  onChange={(e) => setSemanticWeight(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Create Job Opening'}
              </button>
            </form>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4 text-slate-800">Active Jobs</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {jobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`p-3.5 border-2 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                    selectedJob?.id === job.id
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-transparent bg-slate-50 hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span className={`font-semibold truncate ${selectedJob?.id === job.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                    {job.title}
                  </span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedJob?.id === job.id ? 'text-indigo-500 rotate-90' : 'text-slate-400'}`} />
                </div>
              ))}
              {jobs.length === 0 && <p className="text-slate-400 text-sm italic">No positions listed.</p>}
            </div>
          </section>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {selectedJob ? (
            <>
              <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                  <div className="max-w-2xl">
                    <h2 className="text-3xl font-black text-slate-900 mb-2">{selectedJob.title}</h2>
                    <p className="text-slate-500 line-clamp-2 leading-relaxed">{selectedJob.description}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Privacy Controls</span>
                      <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-full border border-slate-200">
                        <span className={`text-[10px] font-black uppercase px-2 ${blindMode ? 'text-indigo-600' : 'text-slate-400'}`}>Blind Mode</span>
                        <button
                          onClick={() => setBlindMode(!blindMode)}
                          className={`w-12 h-6 rounded-full relative transition-all shadow-inner ${blindMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${blindMode ? 'left-7' : 'left-1'}`}></div>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Retrieval</span>
                      <select
                        value={rankingLimit}
                        onChange={(e) => setRankingLimit(parseInt(e.target.value))}
                        className="bg-white border-2 border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 outline-none hover:border-indigo-300 transition-all cursor-pointer shadow-sm"
                      >
                        <option value={5}>Top 5</option>
                        <option value={10}>Top 10</option>
                        <option value={20}>Top 20</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50/50 p-8 rounded-2xl border-2 border-indigo-100 border-dashed text-center group hover:bg-indigo-50 transition-all">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-indigo-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-indigo-950 mb-1">Batch CV Processing</h3>
                  <p className="text-indigo-600/70 text-sm mb-6 font-medium">Drop PDF/DOCX files here to begin AI-powered screening</p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx"
                    onChange={(e) => setFiles(e.target.files)}
                    className="hidden"
                    id="cv-upload"
                  />
                  <div className="flex flex-col items-center gap-4">
                    <label
                      htmlFor="cv-upload"
                      className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold cursor-pointer hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                      <Users className="w-5 h-5" /> Select Candidates
                    </label>

                    {files.length > 0 && (
                      <div className="animate-in fade-in slide-in-from-top-4">
                        <p className="text-sm font-bold text-indigo-900 mb-3 bg-white px-4 py-1.5 rounded-full border border-indigo-100 shadow-sm">
                          {files.length} Applications Ready
                        </p>
                        <button
                          onClick={handleFileUpload}
                          disabled={processing}
                          className="bg-emerald-600 text-white px-10 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                        >
                          {processing ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : <CheckCircle className="w-4 h-4" />}
                          {processing ? 'Analyzing...' : 'Execute Analysis'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                    <BarChart3 className="w-6 h-6 text-indigo-600" /> Scoring Dashboard
                  </h2>
                  <button
                    onClick={fetchRankings}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-widest flex items-center gap-1"
                  >
                    Refresh Data <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                      <tr>
                        <th className="px-8 py-4">Rank</th>
                        <th className="px-8 py-4">Candidate Profile</th>
                        <th className="px-8 py-4">Semantic Match</th>
                        <th className="px-8 py-4">Experience (W)</th>
                        <th className="px-8 py-4">Final Score</th>
                        <th className="px-8 py-4">Inference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rankings.map((r, index) => (
                        <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-8 py-6">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500 font-black text-sm">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{r.candidate_name}</span>
                                {r.risk_flag && (
                                  <div className="group relative">
                                    <ShieldAlert className="w-4 h-4 text-rose-500 cursor-help" />
                                    <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-900 text-white text-[10px] rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 leading-relaxed">
                                      <p className="font-black text-rose-400 mb-1 uppercase tracking-tighter">AI Anomaly Detected</p>
                                      {r.risk_flag}
                                      <div className="mt-2 pt-2 border-t border-slate-700">
                                        Similarity Variance: <span className="text-rose-400 font-bold">{(r.similarity_variance * 100).toFixed(1)}%</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {!r.risk_flag && r.similarity_variance > 0 && (
                                  <ShieldCheck className="w-4 h-4 text-emerald-500 opacity-30" />
                                )}
                              </div>
                              <span className="text-xs font-medium text-slate-400">{r.email}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                                <div className="text-sm font-black text-slate-700">{(r.semantic_score * 100).toFixed(1)}%</div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700">{r.total_experience} Yrs</span>
                                <span className="text-[10px] text-slate-400 font-medium">Weighted Recency</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col gap-1.5">
                              <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${r.final_score > 0.7 ? 'bg-indigo-600' : 'bg-slate-400'}`}
                                    style={{ width: `${r.final_score * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-black text-indigo-900">{(r.final_score * 100).toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col gap-2">
                              <div className="flex flex-wrap gap-1">
                                {r.matched_skills.map((skill, i) => (
                                  <span key={i} className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                              {r.missing_skills.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {r.missing_skills.slice(0, 3).map((skill, i) => (
                                    <span key={i} className="text-[9px] font-bold text-rose-400 italic">
                                      • {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {rankings.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-8 py-16 text-center">
                            <div className="flex flex-col items-center gap-3 opacity-30">
                              <Users className="w-12 h-12" />
                              <p className="text-sm font-bold uppercase tracking-widest">No applicant data found</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : (
            <div className="h-[600px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl shadow-sm border-2 border-dashed border-slate-200">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Briefcase className="w-10 h-10 text-slate-300" />
              </div>
              <h2 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">Selection Required</h2>
              <p className="text-slate-400 max-w-sm mt-2 font-medium">
                Choose a job profile from the sidebar to initialize the ranking engine and view candidate analytics.
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="max-w-7xl mx-auto mt-12 mb-8 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-widest">
        <p>© 2026 AI Recruit Architect - Academic Defense Edition</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <span>FastAPI</span>
          <span>Sentence-BERT</span>
          <span>PostgreSQL</span>
          <span>React 18</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
