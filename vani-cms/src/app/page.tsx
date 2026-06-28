"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import {
  LayoutDashboard,
  PhoneCall,
  CalendarCheck,
  Megaphone,
  Bot,
  Hash,
  FolderKanban,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  ChevronRight,
  Shield,
  Activity,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User,
  ExternalLink,
  Plus,
  Filter,
  Download,
  Info,
  CheckCircle,
  AlertTriangle,
  Settings,
  Languages,
  Database
} from "lucide-react";

// Mock Data
const latencyData = [
  { name: "00:00", STT: 180, LLM: 120, TTS: 250, Total: 550 },
  { name: "04:00", STT: 190, LLM: 140, TTS: 260, Total: 590 },
  { name: "08:00", STT: 170, LLM: 110, TTS: 240, Total: 520 },
  { name: "12:00", STT: 210, LLM: 160, TTS: 280, Total: 650 },
  { name: "16:00", STT: 200, LLM: 150, TTS: 270, Total: 620 },
  { name: "20:00", STT: 180, LLM: 130, TTS: 250, Total: 560 },
  { name: "24:00", STT: 175, LLM: 125, TTS: 245, Total: 545 },
];

const campaignPieData = [
  { name: "Success", value: 720, color: "#10B981" },
  { name: "Failure", value: 85, color: "#EF4444" },
  { name: "Pending", value: 145, color: "#F59E0B" },
];

const initialReservations = [
  { id: 1, customer: "Amit Sharma", phone: "+91 98765 43210", time: "19:30", guests: 4, status: "Upcoming" },
  { id: 2, customer: "Priya Patel", phone: "+91 99123 45678", time: "20:00", guests: 2, status: "Completed" },
  { id: 3, customer: "Rahul Verma", phone: "+91 90000 11111", time: "18:45", guests: 6, status: "Upcoming" },
  { id: 4, customer: "Sneha Reddy", phone: "+91 95555 88888", time: "21:15", guests: 2, status: "Cancelled" },
];

const initialRecentCalls = [
  { id: 1, customer: "Rohan Das", duration: "2m 14s", assistant: "Vani Hinglish v2", cost: "$0.45", sentiment: "Positive", transcript: "Customer: Table book karni hai 4 baje. Agent: Ji ho jayegi, 4 baje table reserved hai." },
  { id: 2, customer: "Sunita Rao", duration: "1m 18s", assistant: "Vani English v1", cost: "$0.26", sentiment: "Neutral", transcript: "Customer: Menu me kya kya specials hain aaj? Agent: Sir aaj humare paas special Shahi Paneer hai." },
  { id: 3, customer: "Karan Johar", duration: "0m 45s", assistant: "Vani Hindi Custom", cost: "$0.15", sentiment: "Negative", transcript: "Customer: Hello? Aawaz nahi aa rahi... Agent: Hello sir, main aapki kya madad kar sakta hoon?" },
];

const initialAssistants = [
  { id: 1, name: "Vani Hinglish v2", avatar: "🤖", language: "Hinglish / Hindi", provider: "Sarvam AI + Groq", voice: "Alloy (Warm)", knowledgeBase: "Connaught Place Menu v4", lastUpdated: "Today at 2:00 PM", status: "Active" },
  { id: 2, name: "Vani English v1", avatar: "👧", language: "Indian English", provider: "OpenAI Realtime", voice: "Shimmer (Energetic)", knowledgeBase: "Table Policy v2.1", lastUpdated: "Yesterday", status: "Active" },
  { id: 3, name: "Vani Hindi Custom", avatar: "🧑", language: "Pure Hindi", provider: "Deepgram + Sarvam", voice: "Echo (Professional)", knowledgeBase: "None (Fallback)", lastUpdated: "3 days ago", status: "Draft" },
];

const activityTimeline = [
  { id: 1, type: "Customer Reserved", desc: "Amit Sharma booked a table for 4 guests", time: "5 mins ago", icon: CalendarCheck, color: "text-emerald-500 bg-emerald-50" },
  { id: 2, type: "Call Completed", desc: "Adversarial simulation with Angry Customer scored 84/100", time: "12 mins ago", icon: PhoneCall, color: "text-indigo-500 bg-indigo-50" },
  { id: 3, type: "Knowledge Updated", desc: "Uploaded 'Weekend Specials Menu v5' to Vani Hinglish v2", time: "1 hour ago", icon: Database, color: "text-purple-500 bg-purple-50" },
  { id: 4, type: "Campaign Finished", desc: "Feedback Survey campaign dialed 120 customers", time: "3 hours ago", icon: Megaphone, color: "text-amber-500 bg-amber-50" },
];

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`min-h-screen font-sans antialiased flex bg-[#F8FAFC] text-[#6B7280]`}>
      
      {/* LEFT SIDEBAR */}
      <aside className="w-[280px] border-r border-[#E5E7EB] bg-white flex flex-col justify-between py-6 px-5 shrink-0">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200">
              V
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-[#111827]">Vani</span>
              <span className="font-medium text-xl tracking-tight text-[#4F46E5] ml-1">CMS</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase px-3 block mb-3">Menu</span>
          <nav className="space-y-1.5">
            {[
              { name: "Dashboard", icon: LayoutDashboard },
              { name: "Live Calls", icon: PhoneCall },
              { name: "Reservations", icon: CalendarCheck },
              { name: "Campaigns", icon: Megaphone },
              { name: "AI Assistants", icon: Bot },
              { name: "Phone Numbers", icon: Hash },
              { name: "Knowledge Base", icon: Database },
              { name: "Analytics", icon: Activity },
              { name: "Billing", icon: DollarSign },
              { name: "Settings", icon: Settings },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.name
                    ? "bg-[#4F46E5] text-white shadow-sm shadow-indigo-100"
                    : "text-[#6B7280] hover:bg-gray-50 hover:text-[#111827]"
                }`}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* User Profile */}
        <div className="border-t border-[#E5E7EB] pt-4 mt-6 flex items-center gap-3 px-1">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
            KA
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#111827] truncate">Krishna Agrawal</p>
            <p className="text-xs text-gray-400 truncate">VaniAI Demo Workspace</p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* TOP NAVBAR */}
        <header className="h-16 border-b border-[#E5E7EB] bg-white flex items-center justify-between px-8 sticky top-0 z-40">
          {/* Search bar */}
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search anything... ⌘K"
              className="w-full bg-gray-50 border border-[#E5E7EB] rounded-full py-1.5 pl-9 pr-4 text-xs font-medium text-[#111827] focus:outline-none focus:border-[#4F46E5] focus:bg-white transition-all"
            />
          </div>

          {/* Actions & Status */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-semibold text-emerald-700 animate-pulse">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
              Live Console Connected
            </div>

            <button className="relative h-9 w-9 rounded-full bg-gray-50 flex items-center justify-center border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] transition-all">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#EF4444] rounded-full"></span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="h-9 w-9 rounded-full bg-gray-50 flex items-center justify-center border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] transition-all"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <div className="h-8 w-px bg-[#E5E7EB]"></div>

            <div className="flex items-center gap-1.5 cursor-pointer">
              <span className="text-xs font-bold text-[#111827]">Vani AI (General)</span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </div>
          </div>
        </header>

        {/* MAIN CONTENT WORKSPACE */}
        <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          
          {/* Welcome & Overview Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#111827] flex items-center gap-2">
                Hello Krishna 👋
              </h1>
              <p className="text-sm text-[#6B7280] mt-1">Today's Overview & Real-Time Performance Analytics</p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 border border-[#E5E7EB] bg-white text-[#111827] rounded-xl hover:bg-gray-50 transition-all">
                <Plus className="h-3.5 w-3.5" /> Create Assistant
              </button>
              <button className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 border border-[#E5E7EB] bg-white text-[#111827] rounded-xl hover:bg-gray-50 transition-all">
                <Megaphone className="h-3.5 w-3.5" /> Start Campaign
              </button>
              <button className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-gradient-to-tr from-indigo-500 to-violet-600 text-white rounded-xl hover:opacity-95 shadow-md shadow-indigo-150 transition-all">
                <PhoneCall className="h-3.5 w-3.5" /> Make Test Call
              </button>
            </div>
          </div>

          {/* FIRST ROW: 4 Premium KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Active Calls", value: "3", trend: "+12%", up: true, trendLabel: "vs hour ago", color: "text-[#4F46E5] bg-indigo-50", icon: PhoneCall },
              { label: "Today's Reservations", value: "54", trend: "+8%", up: true, trendLabel: "vs yesterday", color: "text-emerald-600 bg-emerald-50", icon: CalendarCheck },
              { label: "Average Latency", value: "545ms", trend: "-18%", up: false, trendLabel: "faster RTT", color: "text-purple-600 bg-purple-50", icon: Clock },
              { label: "Monthly Revenue", value: "$4,820", trend: "+24%", up: true, trendLabel: "this month", color: "text-amber-600 bg-amber-50", icon: DollarSign },
            ].map((kpi) => (
              <motion.div
                key={kpi.label}
                whileHover={{ y: -4 }}
                className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">{kpi.label}</span>
                    <h3 className="text-3xl font-extrabold text-[#111827] mt-1">{kpi.value}</h3>
                  </div>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${kpi.color}`}>
                    <kpi.icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold">
                  <span className={kpi.up ? "text-[#10B981]" : "text-[#EF4444]"}>
                    {kpi.trend}
                  </span>
                  <span className="text-gray-400 font-medium">{kpi.trendLabel}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* SECOND ROW: System Performance & Live Reservations Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* System Performance Area Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                    <Activity className="h-4.5 w-4.5 text-[#4F46E5]" /> System Performance Metrics
                  </h2>
                  <p className="text-xs text-[#6B7280] mt-0.5">Real-time latency breakdown across pipeline stages</p>
                </div>
                <select className="border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs font-bold text-[#111827] focus:outline-none bg-white">
                  <option>Last 24 Hours</option>
                  <option>Last 7 Days</option>
                </select>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={latencyData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.01}/>
                      </linearGradient>
                      <linearGradient id="colorTTS" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px", fontSize: "11px" }} />
                    <Area type="monotone" dataKey="Total" name="Total RTT (ms)" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                    <Area type="monotone" dataKey="TTS" name="TTS Voice (ms)" stroke="#7C3AED" strokeWidth={1.5} fillOpacity={1} fill="url(#colorTTS)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live Reservations Table */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                      <CalendarCheck className="h-4.5 w-4.5 text-emerald-500" /> Live Reservations
                    </h2>
                    <p className="text-xs text-[#6B7280] mt-0.5">Tables reserved by AI Receptionist today</p>
                  </div>
                  <button className="text-xs font-bold text-[#4F46E5] hover:underline">View All</button>
                </div>

                <div className="space-y-4">
                  {initialReservations.map((res) => (
                    <div key={res.id} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-xs font-bold text-[#111827]">
                          {res.customer.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#111827]">{res.customer}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{res.time} • {res.guests} Guests</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        res.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : res.status === "Cancelled"
                          ? "bg-rose-50 text-rose-700 border border-rose-100"
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                        {res.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 border border-[#E5E7EB] bg-[#F8FAFC] text-[#111827] rounded-xl hover:bg-gray-100 transition-all mt-4">
                <Plus className="h-3.5 w-3.5" /> Book Table Manually
              </button>
            </div>
          </div>

          {/* THIRD ROW: Recent Calls Table */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                  <PhoneCall className="h-4.5 w-4.5 text-[#4F46E5]" /> Recent Conversational Logs
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">Detailed history of inbound and outbound customer calls</p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 border border-[#E5E7EB] rounded-xl hover:bg-gray-50 transition-all">
                  <Filter className="h-3.5 w-3.5" /> Filter
                </button>
                <button className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 border border-[#E5E7EB] rounded-xl hover:bg-gray-50 transition-all">
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="pb-3 text-left">Customer</th>
                    <th className="pb-3 text-center">Duration</th>
                    <th className="pb-3 text-left">Assigned Agent</th>
                    <th className="pb-3 text-center">Telecom Cost</th>
                    <th className="pb-3 text-center">Sentiment</th>
                    <th className="pb-3 text-center">Recording</th>
                    <th className="pb-3 text-right">Conversation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-medium text-[#6B7280]">
                  {initialRecentCalls.map((call) => (
                    <tr key={call.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5">
                        <span className="font-bold text-[#111827]">{call.customer}</span>
                      </td>
                      <td className="py-3.5 text-center font-mono text-gray-400">{call.duration}</td>
                      <td className="py-3.5">{call.assistant}</td>
                      <td className="py-3.5 text-center font-mono text-[#111827]">{call.cost}</td>
                      <td className="py-3.5 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          call.sentiment === "Positive"
                            ? "bg-emerald-50 text-emerald-700"
                            : call.sentiment === "Negative"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-gray-50 text-gray-600"
                        }`}>
                          {call.sentiment}
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        <button className="h-7 w-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto hover:bg-indigo-100 text-[#4F46E5] transition-all">
                          <Play className="h-3 w-3" />
                        </button>
                      </td>
                      <td className="py-3.5 text-right">
                        <button className="flex items-center gap-1 text-[11px] font-bold text-[#4F46E5] hover:underline ml-auto">
                          Transcript <ExternalLink className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FOURTH ROW: AI Assistants */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                  <Bot className="h-5 w-5 text-[#4F46E5]" /> AI Assistants
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">Configure your custom voice persona scripts</p>
              </div>
              <button className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-gradient-to-tr from-indigo-500 to-violet-600 text-white rounded-xl hover:opacity-95 shadow-sm transition-all">
                <Plus className="h-3.5 w-3.5" /> Add Assistant
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {initialAssistants.map((assistant) => (
                <div key={assistant.id} className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl shadow-inner">
                          {assistant.avatar}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#111827]">{assistant.name}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                            assistant.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                          }`}>
                            {assistant.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2.5 text-xs font-medium text-gray-400">
                      <div className="flex justify-between">
                        <span>Language</span>
                        <span className="text-[#111827] font-semibold">{assistant.language}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Voice Style</span>
                        <span className="text-[#111827] font-semibold">{assistant.voice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Knowledge</span>
                        <span className="text-[#111827] font-semibold truncate max-w-[150px]">{assistant.knowledgeBase}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button className="flex-1 text-xs font-bold py-2 border border-[#E5E7EB] bg-[#F8FAFC] text-[#111827] rounded-xl hover:bg-gray-100 transition-all">
                      Configure
                    </button>
                    <button className="flex-1 text-xs font-bold py-2 bg-indigo-50 border border-indigo-100 text-[#4F46E5] rounded-xl hover:bg-indigo-100 transition-all">
                      Call Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FIFTH & SIXTH ROW: Campaign & Latency Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Campaign Overview Pie Chart */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
              <div>
                <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                  <Megaphone className="h-4.5 w-4.5 text-indigo-500" /> Campaign Overview
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">Successful call delivery ratio metrics</p>
              </div>

              <div className="h-56 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={campaignPieData} innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                      {campaignPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center">
                  <span className="text-2xl font-black text-[#111827]">950</span>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Calls</p>
                </div>
              </div>

              <div className="flex justify-around text-xs font-semibold mt-2">
                {campaignPieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-gray-400">{item.name}</span>
                    <span className="text-[#111827] font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Latency Stage Breakdown */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                  <Clock className="h-4.5 w-4.5 text-[#4F46E5]" /> Telemetry Latency Breakdown
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">Delay progression across speech, brain logic, and audio output</p>
              </div>

              <div className="space-y-4 my-6">
                {[
                  { name: "Speech-to-Text (STT)", ms: "180ms", pct: 30, color: "bg-[#4F46E5]" },
                  { name: "LLM Inference (Brain)", ms: "125ms", pct: 20, color: "bg-[#7C3AED]" },
                  { name: "Text-to-Speech (TTS)", ms: "240ms", pct: 40, color: "bg-emerald-500" },
                  { name: "Network Transit", ms: "60ms", pct: 10, color: "bg-amber-500" },
                ].map((stage) => (
                  <div key={stage.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#111827]">{stage.name}</span>
                      <span className="text-gray-400 font-bold">{stage.ms}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-[#E5E7EB]/50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stage.pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${stage.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center gap-2.5 text-xs text-[#4F46E5] font-semibold">
                <Info className="h-4.5 w-4.5 shrink-0" />
                <span>Overall RTT response time meets optimal human-like speed standards (P95 latency &lt; 600ms).</span>
              </div>
            </div>
          </div>

          {/* SEVENTH ROW: Activity Feed */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
            <h2 className="text-base font-bold text-[#111827] flex items-center gap-2 mb-6">
              <Activity className="h-4.5 w-4.5 text-[#4F46E5]" /> Live Workspace Activity Feed
            </h2>
            <div className="relative border-l-2 border-[#E5E7EB] ml-4 space-y-6 py-2">
              {activityTimeline.map((item) => (
                <div key={item.id} className="relative pl-8">
                  {/* Timeline Circle */}
                  <span className={`absolute -left-[17px] top-0 h-8 w-8 rounded-full border border-white flex items-center justify-center ${item.color} shadow-sm`}>
                    <item.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="text-xs font-extrabold text-[#111827]">{item.type}</span>
                    <span className="text-[10px] text-gray-400 font-bold ml-2">{item.time}</span>
                    <p className="text-xs text-[#6B7280] mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>

    </div>
  );
}
