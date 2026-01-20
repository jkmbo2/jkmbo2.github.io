import React, { useState, useRef } from 'react';
import { Sparkles, Zap, ArrowLeft, MessageCircle, BarChart3, Upload, FileText, Image as ImageIcon, X, Thermometer, ShieldCheck, BookOpen, User, Clock, ChevronRight, Heart, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, XAxis, Tooltip, AreaChart, Area } from 'recharts';
import { createWorker } from 'tesseract.js';
import html2canvas from 'html2canvas';

import { AnalysisResult, ChatMessage, HistoryRecord, PersonRecord } from './types';
import { TarotReveal } from './components/TarotReveal';
import { NutritionLabel } from './components/NutritionLabel';

// --- AI 分析引擎 ---
const analyzeChatWithAI = async (messages: ChatMessage[] | string, context?: string): Promise<AnalysisResult> => {
    const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY; 
    const API_URL = "https://api.deepseek.com/chat/completions";

    console.log("Debug: Checking API Key...", API_KEY ? `Present (Length: ${API_KEY.length})` : "Missing");

    if (!API_KEY) {
      throw new Error('Missing VITE_DEEPSEEK_API_KEY in environment variables');
    }

    const formattedContent = typeof messages === 'string' 
      ? messages 
      : messages.map(m => `[${m.sender === 'me' ? '我' : '对方'}]: ${m.text}`).join('\n');

    const systemPrompt = `你是一个情感洞察天才，擅长从字里行间捕捉最细微的情绪波动和权力博弈。
你的任务是深度分析用户提供的聊天文本，并生成一份具有极高审美价值的 JSON 报告。

重要说明：
1. 身份识别：对话中标记为 [我] 的是分析发起者，[对方] 是其交流对象。请以此为基础分析两者的权力博弈、投入程度和心理防线。
2. 背景信息：${context ? `用户提供的背景描述为：“${context}”。请结合此背景进行更精准的分析。` : "用户未提供背景描述，请仅根据聊天内容进行分析。"}
3. 文本纠错：用户提供的文本可能包含 OCR 识别错误，请结合上下文自动纠错。
4. 表情包/情绪识别：文本中可能包含用户手动补全的表情描述（如 [流泪]、[表情: 尴尬]、[Sticker]），请将这些描述作为核心情感依据进行深度解读。即使只有文字描述，也要分析出背后的潜台词。

报告结构要求：
1. title: 极其犀利或诗意的关系定性标题（如：沉默的灰犀牛、赛博时代的单向通信）。
2. score: 综合关系健康指数 (0-100)。
3. dimensions: 必须是对象数组 Array<{ subject: string, value: number }>。包含5个维度：情感投入, 回复时效, 自我防线, 期望管理, 对话主导。
4. keywords: 3-5个能概括这段关系的关键词。
5. mbti: 猜测这段关系中对话双方呈现出的“合体 MBTI”人格（如：INTJ-INFP 纠缠态）。
6. frequencyData: 模拟 6 个时间点 (00:00, 04:00, 08:00, 12:00, 16:00, 20:00) 的互动频次。
7. interactionStyle: 一句话 definition 这种互动风格。
8. summary: 3条深度的、扎心的关系诊断结论。
9. hiddenMessages: 2-3条“潜台词解码”，包含 original (表面话) 和 decoded (真实意图)。
10. prescription: 一句充满智慧且实用的关系建议。
11. category: 情感分类。
12. tarot: 根据关系特质，从 22 张大阿卡纳牌中挑选一张最符合的关系原型牌。包含 id, name, meaning。
13. nutrition: 分析这段对话的“成分”，包含 nonsense (废话 %), sugar (甜度 %), toxicity (毒性 %), sincerity (真心 %)。

语气要求：专业、犀利、带有一点点忧郁或调侃的文学质感。
输出格式必须是严格的纯 JSON。`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `请分析以下聊天记录：\n\n${formattedContent}` }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("API Error Response:", errText);
      throw new Error(`API Error ${response.status}: ${errText.slice(0, 100)}`);
    }
    const data = await response.json();
      const rawResult = JSON.parse(data.choices[0].message.content);
      console.log("Debug: Raw AI Result", rawResult);
      
      // Ensure numeric values for charts
      if (rawResult.dimensions) {
        if (Array.isArray(rawResult.dimensions)) {
          rawResult.dimensions = rawResult.dimensions.map((d: any) => ({
            ...d,
            value: Number(d.value) || 0
          }));
        } else if (typeof rawResult.dimensions === 'object') {
           // Handle object format fallback
           rawResult.dimensions = Object.entries(rawResult.dimensions).map(([key, val]) => ({
             subject: key,
             value: Number(val) || 0
           }));
        }
      }
      if (rawResult.frequencyData) {
        rawResult.frequencyData = rawResult.frequencyData.map((f: any) => ({
          ...f,
          count: Number(f.count) || 0
        }));
      }
      if (rawResult.nutrition) {
        rawResult.nutrition = {
          nonsense: Number(rawResult.nutrition.nonsense) || 0,
          sugar: Number(rawResult.nutrition.sugar) || 0,
          toxicity: Number(rawResult.nutrition.toxicity) || 0,
          sincerity: Number(rawResult.nutrition.sincerity) || 0,
        };
      }

      return rawResult;
  } catch (error) {
    throw error;
  }
};

const App = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'other', text: '' }
  ]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [context, setContext] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'image'>('text');
  const [isScanning, setIsScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [personName, setPersonName] = useState('');
  const [history, setHistory] = useState<HistoryRecord[]>(() => {
    const saved = localStorage.getItem('chat_ct_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [persons, setPersons] = useState<PersonRecord[]>(() => {
    const saved = localStorage.getItem('chat_ct_persons');
    return saved ? JSON.parse(saved) : [];
  });
  const [view, setView] = useState<'home' | 'history' | 'persons'>('home');
  const [tarotRevealed, setTarotRevealed] = useState(false);
  const [scanStep, setScanStep] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [ocrResultText, setOcrResultText] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const generateReceipt = async () => {
    if (!receiptRef.current) return;
    setIsExporting(true);
    try {
      // Small delay to ensure styles are applied
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#FDFCF8',
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.download = `chat-ct-receipt-${result?.title || 'result'}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error('Failed to generate receipt:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const steps = ["Reading between the lines...", "Analyzing emotional subtext...", "Calculating relationship sync...", "Mapping hidden patterns..."];

  const addMessage = () => {
    const lastSender = messages[messages.length - 1]?.sender;
    setMessages(prev => [...prev, { 
      id: Date.now().toString(), 
      sender: lastSender === 'me' ? 'other' : 'me', 
      text: '' 
    }]);
  };

  const updateMessage = (id: string, text: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, text } : m));
  };

  const toggleSender = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, sender: m.sender === 'me' ? 'other' : 'me' } : m));
  };

  const removeMessageItem = (id: string) => {
    if (messages.length > 1) {
      setMessages(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadedImages(prev => [...prev, ...files]);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const deleteHistoryRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('chat_ct_history', JSON.stringify(updated));
  };

  const clearAllHistory = () => {
    if (window.confirm('Clear all scan history? This cannot be undone.')) {
      setHistory([]);
      localStorage.removeItem('chat_ct_history');
    }
  };

  const deletePersonRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = persons.filter(p => p.id !== id);
    setPersons(updated);
    localStorage.setItem('chat_ct_persons', JSON.stringify(updated));
  };

  const doOCR = async (files: File[]): Promise<string> => {
    let fullText = "";
    const worker = await createWorker('chi_sim+eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          setOcrProgress(Math.floor(m.progress * 100));
        }
      }
    });
    for (let i = 0; i < files.length; i++) {
      setOcrProgress(0);
      const { data: { text } } = await worker.recognize(files[i]);
      fullText += text + "\n";
    }
    await worker.terminate();
    return fullText;
  };

  const handleStartScan = async () => {
    setErrorMessage('');
    if (inputMode === 'text' && messages.every(m => !m.text.trim())) return;
    if (inputMode === 'image' && uploadedImages.length === 0) return;

    setIsScanning(true);
    setResult(null);
    
    if (inputMode === 'image' && uploadedImages.length > 0) {
      const ocrText = await doOCR(uploadedImages);
      setOcrResultText(ocrText);
      setIsScanning(false);
      setShowReview(true);
      return; // 停下来让用户校对
    }

    await proceedToAIAnalysis(messages);
  };

  const proceedToAIAnalysis = async (data: ChatMessage[] | string) => {
    setIsScanning(true);
    setShowReview(false);
    setTarotRevealed(false);
    setErrorMessage('');
    
    for (const step of steps) {
      setScanStep(step);
      await new Promise(r => setTimeout(r, 1000));
    }
    
    let aiResult: AnalysisResult;
    try {
      aiResult = await analyzeChatWithAI(data, context);
    } catch (error: any) {
      console.error("AI Analysis Failed:", error);
      setIsScanning(false);
      setShowReview(false);
      const msg = error?.message || 'Unknown error';
      const hasKey = !!import.meta.env.VITE_DEEPSEEK_API_KEY;
      setErrorMessage(`AI 分析失败: ${msg} (Key configured: ${hasKey})`);
      return;
    }
    
    // Save to history
    const newRecord: HistoryRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      personName: personName || 'Anonymous',
      result: aiResult
    };

    const updatedHistory = [newRecord, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('chat_ct_history', JSON.stringify(updatedHistory));

    // Update persons
    const existingPersonIdx = persons.findIndex(p => p.name === newRecord.personName);
    let updatedPersons;
    if (existingPersonIdx > -1) {
      updatedPersons = [...persons];
      updatedPersons[existingPersonIdx] = {
        ...updatedPersons[existingPersonIdx],
        lastAnalysisId: newRecord.id,
        latestScore: aiResult.score,
        analysisCount: updatedPersons[existingPersonIdx].analysisCount + 1
      };
    } else {
      updatedPersons = [{
        id: Date.now().toString(),
        name: newRecord.personName,
        lastAnalysisId: newRecord.id,
        latestScore: aiResult.score,
        analysisCount: 1
      }, ...persons];
    }
    setPersons(updatedPersons);
    localStorage.setItem('chat_ct_persons', JSON.stringify(updatedPersons));

    setResult(aiResult);
    setIsScanning(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-stone-800 font-sans selection:bg-rose-100 overflow-x-hidden transition-soft">
      {/* 装饰背景元素 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-[#D6E6DD] rounded-full blur-[100px] opacity-30" />
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-[#F2D7D5] rounded-full blur-[120px] opacity-30" />
        <div className="absolute top-[40%] right-[10%] w-48 h-48 bg-[#D7DDF2] rounded-full blur-[80px] opacity-20" />
        
        {/* 飘浮关键词 - 仅在桌面端显示 */}
        <div className="hidden lg:block">
          <motion.div 
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] left-[12%] text-stone-200 font-serif italic text-4xl select-none"
          >
            Sincerity
          </motion.div>
          <motion.div 
            animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[30%] left-[8%] text-stone-200 font-serif italic text-3xl select-none"
          >
            Silence
          </motion.div>
          <motion.div 
            animate={{ y: [0, -15, 0], rotate: [0, 3, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-[45%] right-[8%] text-stone-200 font-serif italic text-5xl select-none"
          >
            Echo
          </motion.div>

          {/* 可拖拽的心情贴纸 */}
          <motion.div 
            drag
            dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
            className="absolute top-[15%] right-[15%] cursor-grab active:cursor-grabbing z-20"
          >
            <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/40 rotate-12 flex items-center space-x-2">
              <span className="text-2xl">🦋</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Fragile</span>
            </div>
          </motion.div>

          <motion.div 
            drag
            dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
            className="absolute bottom-[20%] right-[12%] cursor-grab active:cursor-grabbing z-20"
          >
            <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/40 -rotate-6 flex items-center space-x-2">
              <span className="text-2xl">🌊</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Fluctuating</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 flex justify-center items-start min-h-screen">
        {/* 左侧边栏 - 关系看板 (仅桌面端) */}
        {!result && !showReview && !isScanning && (
          <aside className="hidden xl:flex flex-col w-[280px] sticky top-24 ml-[-320px] mr-10 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="soft-card p-8 bg-white/40 backdrop-blur-sm border-none"
            >
              <h3 className="font-serif font-bold text-xl mb-4 text-stone-400">Lab Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] uppercase tracking-widest text-stone-400">Total Scans</span>
                  <span className="text-2xl font-serif italic">{history.length}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] uppercase tracking-widest text-stone-400">People Mapped</span>
                  <span className="text-2xl font-serif italic">{persons.length}</span>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-stone-100">
                <p className="text-xs italic text-stone-400 leading-relaxed">
                  "The most important things are often found in the pauses between words."
                </p>
              </div>
            </motion.div>

            {history.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="soft-card p-6 bg-white/40 backdrop-blur-sm border-none"
              >
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock size={12} className="mr-2" />
                    Recent Scans
                  </div>
                  <button 
                    onClick={clearAllHistory}
                    className="text-[8px] hover:text-rose-300 transition-colors"
                  >
                    Clear All
                  </button>
                </h4>
                <div className="space-y-3">
                  {history.slice(0, 3).map((h) => (
                    <button 
                      key={h.id}
                      onClick={() => { setResult(h.result); setTarotRevealed(true); setView('home'); }}
                      className="w-full text-left p-3 rounded-xl hover:bg-white/60 transition-soft group"
                    >
                      <div className="text-[11px] font-bold text-stone-700 truncate">{h.result.title}</div>
                      <div className="text-[9px] text-stone-400 mt-1">{h.personName} • {h.result.score} pts</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </aside>
        )}

        <main className="w-full max-w-[600px] px-6 py-12 md:py-24">
          {/* Navigation Tabs */}
        {!result && !showReview && !isScanning && (
          <div className="flex justify-center space-x-8 mb-12">
            {[
              { id: 'home', icon: Zap, label: 'Scan' },
              { id: 'persons', icon: User, label: 'People' },
              { id: 'history', icon: Clock, label: 'History' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as any)}
                className={`flex flex-col items-center space-y-2 transition-soft ${view === tab.id ? 'text-stone-800' : 'text-stone-300 hover:text-stone-400'}`}
              >
                <tab.icon size={20} />
                <span className="text-[10px] font-bold tracking-widest uppercase">{tab.label}</span>
                {view === tab.id && <motion.div layoutId="nav-underline" className="w-1 h-1 rounded-full bg-rose-300" />}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {view === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <header className="text-center mb-12">
                <h2 className="text-3xl font-serif font-bold mb-2">Scan History</h2>
                <p className="text-stone-400 text-sm italic">Relive your past relationship insights.</p>
              </header>

              {history.length === 0 ? (
                <div className="text-center py-20 text-stone-300 italic">No scans yet. Start your first CT scan!</div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setResult(item.result);
                        setTarotRevealed(true);
                        setView('home');
                      }}
                      className="w-full soft-card p-6 flex items-center justify-between hover:scale-[1.02] transition-soft group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 font-serif font-bold">
                          {item.result.score}
                        </div>
                        <div className="text-left">
                          <h4 className="font-serif font-bold text-stone-800 group-hover:text-rose-400 transition-colors">{item.result.title}</h4>
                          <p className="text-xs text-stone-400 uppercase tracking-widest mt-1">
                            With {item.personName} • {new Date(item.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={(e) => deleteHistoryRecord(item.id, e)}
                          className="p-2 text-stone-200 hover:text-rose-300 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                        <ChevronRight size={16} className="text-stone-200 group-hover:text-stone-400 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              <button onClick={() => setView('home')} className="w-full py-4 text-stone-400 text-[10px] font-bold uppercase tracking-widest hover:text-stone-600 transition-colors">
                Back to Scan
              </button>
            </motion.div>
          ) : view === 'persons' ? (
            <motion.div
              key="persons"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <header className="text-center mb-12">
                <h2 className="text-3xl font-serif font-bold mb-2">The Directory</h2>
                <p className="text-stone-400 text-sm italic">Your emotional map of the people in your life.</p>
              </header>

              {persons.length === 0 ? (
                <div className="text-center py-20 text-stone-300 italic">No one here yet. Tag someone in your next scan!</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {persons.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        const record = history.find(h => h.id === p.lastAnalysisId);
                        if (record) {
                          setResult(record.result);
                          setTarotRevealed(true);
                          setView('home');
                        }
                      }}
                      className="soft-card p-6 flex items-center justify-between hover:scale-[1.02] transition-soft group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${p.latestScore > 70 ? 'bg-green-50 text-green-500' : p.latestScore > 40 ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'}`}>
                          {p.name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <h4 className="font-serif font-bold text-stone-800">{p.name}</h4>
                          <p className="text-xs text-stone-400 uppercase tracking-widest mt-1">
                            {p.analysisCount} Scans • Latest Score: {p.latestScore}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <button
                          onClick={(e) => deletePersonRecord(p.id, e)}
                          className="p-1 text-stone-200 hover:text-rose-300 transition-colors opacity-0 group-hover:opacity-100 mb-1"
                        >
                          <X size={12} />
                        </button>
                        <div className="text-[10px] font-bold uppercase tracking-tighter text-stone-300">Last Seen</div>
                        <BookOpen size={14} className="text-stone-200 group-hover:text-rose-300 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button onClick={() => setView('home')} className="w-full py-4 text-stone-400 text-[10px] font-bold uppercase tracking-widest hover:text-stone-600 transition-colors">
                Back to Scan
              </button>
            </motion.div>
          ) : showReview ? (
            /* --- OCR 校对页 --- */
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center"
            >
              <header className="text-center mb-12">
                <div className="inline-block px-4 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold tracking-widest uppercase mb-4">
                  Review & Refine
                </div>
                <h2 className="text-3xl font-serif font-bold mb-4">校对识别内容</h2>
                <p className="text-stone-400 text-sm leading-relaxed max-w-sm mx-auto">
                  OCR 难以识别表情包与图片，<br />
                  建议用文字补全情绪（如 <span className="text-rose-300 font-bold">[流泪]</span> 或 <span className="text-rose-300 font-bold">[表情: 尴尬]</span>），<br />
                  这将显著提升 AI 诊断的扎心程度。
                </p>
              </header>

              <div className="w-full soft-card p-2 mb-10">
                <textarea
                  value={ocrResultText}
                  onChange={(e) => setOcrResultText(e.target.value)}
                  className="w-full h-[400px] p-8 bg-transparent outline-none text-stone-700 leading-relaxed text-base resize-none"
                  placeholder="OCR 结果将显示在此..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setShowReview(false)}
                  className="btn-pill bg-white text-stone-400 text-xs tracking-widest uppercase border border-stone-100"
                >
                  Back
                </button>
                <button
                  onClick={() => proceedToAIAnalysis(ocrResultText)}
                  className="btn-pill btn-soft-gradient text-xs tracking-widest uppercase flex items-center space-x-3 shadow-xl shadow-rose-100/50"
                >
                  <span>Analyze Now</span>
                  <Zap size={14} />
                </button>
              </div>
            </motion.div>
          ) : !result ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col items-center"
            >
              {/* Header */}
              <header className="text-center mb-16">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="inline-block px-4 py-1 rounded-full bg-stone-100 text-stone-500 text-[10px] font-bold tracking-widest uppercase mb-6"
                >
                  Relationships . AI . Analysis
                </motion.div>
                <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 tracking-tight">
                  Chat <span className="italic">CT Scan</span>
                </h1>
                <p className="text-stone-500 font-medium leading-relaxed max-w-xs mx-auto">
                  揭开文字下的情感博弈。<br />温暖的视觉，犀利的深度。
                </p>
              </header>
              {errorMessage && (
                <div className="w-full mb-8">
                  <div className="soft-card p-4 bg-rose-50/60 border border-rose-100 text-rose-500 text-xs font-bold tracking-wide">
                    {errorMessage}
                  </div>
                </div>
              )}

              {/* Context & Person Input */}
              <div className="w-full mb-8 space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-3 px-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                    <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400">Target Person (Optional)</span>
                  </div>
                  <div className="soft-card p-4 bg-white/50 border border-stone-100/50">
                    <input
                      type="text"
                      value={personName}
                      onChange={(e) => setPersonName(e.target.value)}
                      placeholder="Who are you talking to? (e.g., 'Mom', 'Alex', 'The CEO')"
                      className="w-full bg-transparent border-none outline-none text-sm text-stone-600 placeholder:text-stone-300 font-serif"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-3 px-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-300" />
                    <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400">Context & Relationship</span>
                  </div>
                  <div className="soft-card p-4 bg-white/50 border border-stone-100/50">
                    <textarea
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="Describe the background or your relationship (e.g., 'We've been dating for 2 years', 'A crush from work')..."
                      className="w-full bg-transparent border-none outline-none text-sm text-stone-600 placeholder:text-stone-300 resize-none h-16 leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Input Mode Switch */}
              <div className="relative flex bg-stone-100/50 p-1 rounded-full mb-10 transition-soft w-64">
                <motion.div
                  className="absolute inset-y-1 bg-white rounded-full shadow-sm"
                  initial={false}
                  animate={{ 
                    x: inputMode === 'text' ? 4 : 124,
                    width: '128px'
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <button
                  onClick={() => setInputMode('text')}
                  className={`relative z-10 w-32 py-2 text-xs font-bold transition-soft ${inputMode === 'text' ? 'text-stone-800' : 'text-stone-400 hover:text-stone-500'}`}
                >
                  Text Mode
                </button>
                <button
                  onClick={() => setInputMode('image')}
                  className={`relative z-10 w-32 py-2 text-xs font-bold transition-soft ${inputMode === 'image' ? 'text-stone-800' : 'text-stone-400 hover:text-stone-500'}`}
                >
                  Screenshots
                </button>
              </div>

              {/* Main Interaction Area */}
              <div className="w-full relative">
                <div className="soft-card min-h-[460px] flex flex-col overflow-hidden relative">
                  {inputMode === 'text' ? (
                    <div className="flex-1 flex flex-col p-6 overflow-y-auto max-h-[500px] space-y-6 bg-stone-50/30">
                      <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: msg.sender === 'me' ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`flex items-start space-x-3 ${msg.sender === 'me' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
                          >
                            <button
                              onClick={() => toggleSender(msg.id)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-soft shadow-sm shrink-0 mt-1
                                ${msg.sender === 'me' ? 'bg-rose-100 text-rose-500' : 'bg-stone-200 text-stone-500'}`}
                            >
                              {msg.sender === 'me' ? 'ME' : 'YOU'}
                            </button>
                            
                            <div className="relative group max-w-[80%]">
                              <textarea
                                value={msg.text}
                                onChange={(e) => updateMessage(msg.id, e.target.value)}
                                placeholder={msg.sender === 'me' ? "Type your reply..." : "What did they say?"}
                                className={`w-full p-4 rounded-2xl text-sm leading-relaxed outline-none transition-soft min-h-[80px] resize-none
                                  ${msg.sender === 'me' 
                                    ? 'bg-white border-2 border-rose-100 text-stone-800 shadow-sm focus:border-rose-200' 
                                    : 'bg-white border border-stone-100 text-stone-700 shadow-sm focus:border-stone-300'}`}
                              />
                              <button
                                onClick={() => removeMessageItem(msg.id)}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-white shadow-md rounded-full flex items-center justify-center text-stone-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-soft"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      <button
                        onClick={addMessage}
                        className="w-full py-4 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 text-xs font-bold uppercase tracking-widest hover:bg-white hover:border-stone-300 transition-soft flex items-center justify-center space-x-2"
                      >
                        <MessageCircle size={14} />
                        <span>Add Message Bubble</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 p-8 flex flex-col relative overflow-y-auto">
                      {imagePreviews.length > 0 ? (
                        <div className="grid grid-cols-2 gap-6">
                          {imagePreviews.map((preview, index) => (
                            <motion.div
                              key={index}
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="relative aspect-[3/4] group rounded-2xl overflow-hidden shadow-sm border border-stone-100"
                            >
                              <img src={preview} alt="Upload" className="w-full h-full object-cover" />
                              <button
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-md text-stone-800 rounded-full opacity-0 group-hover:opacity-100 transition-soft"
                              >
                                <X size={14} />
                              </button>
                            </motion.div>
                          ))}
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-[3/4] border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center hover:bg-stone-50 transition-soft group"
                            disabled={isScanning}
                          >
                            <Upload size={20} className="text-stone-300 group-hover:text-stone-400 mb-2" />
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Add more</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full h-full min-h-[280px] bg-stone-50/50 rounded-[24px] border border-dashed border-stone-200 flex flex-col items-center justify-center hover:bg-stone-50 hover:scale-[1.02] transition-soft group"
                        >
                          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:shadow-md transition-soft">
                            <ImageIcon size={20} className="text-stone-400" />
                          </div>
                          <p className="text-stone-600 font-bold text-sm tracking-wide">Drop your memories here</p>
                          <p className="text-stone-400 text-[10px] mt-2 font-medium">Supports multiple screenshots</p>
                        </button>
                      )}
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className="hidden" />
                    </div>
                  )}

                  {/* Loading Overlay */}
                  <AnimatePresence>
                    {isScanning && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-12 text-center"
                      >
                        <div className="relative mb-12">
                          <div className="w-24 h-24 bg-rose-100 rounded-full animate-breathe blur-2xl absolute inset-0" />
                          <div className="w-24 h-24 bg-orange-50 rounded-full animate-breathe blur-2xl absolute inset-0 delay-700" />
                          <div className="relative z-10 flex items-center justify-center w-24 h-24">
                            <Sparkles size={32} className="text-stone-400" />
                          </div>
                        </div>
                        <h3 className="font-serif italic text-xl text-stone-800 mb-4">{scanStep}</h3>
                        {inputMode === 'image' && ocrProgress < 100 && (
                          <div className="w-full max-w-[120px] h-1 bg-stone-100 rounded-full overflow-hidden mt-4">
                            <motion.div
                              animate={{ width: `${ocrProgress}%` }}
                              className="h-full bg-stone-300"
                            />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-12 flex justify-center">
                  <button
                    onClick={handleStartScan}
                    disabled={isScanning || (inputMode === 'text' ? messages.every(m => !m.text.trim()) : uploadedImages.length === 0)}
                    className="btn-pill btn-soft-gradient text-sm tracking-widest uppercase flex items-center space-x-3 shadow-stone-200/50 shadow-xl"
                  >
                    <span>Start Diagnosis</span>
                    <Zap size={14} />
                  </button>
                </div>
              </div>

              {/* Footer Specs */}
              <div className="mt-20 flex justify-between w-full max-w-sm text-stone-400">
                <div className="flex flex-col items-center space-y-2">
                  <ShieldCheck size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Private</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <Zap size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">AI Power</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <BarChart3 size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Visuals</span>
                </div>
              </div>
            </motion.div>
          ) : (
            /* --- Result Page --- */
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center w-full"
            >
              {!tarotRevealed ? (
                <TarotReveal card={result.tarot} onComplete={() => setTarotRevealed(true)} />
              ) : (
                <>
                  <div className="w-full flex justify-between items-center mb-10">
                    <button
                  onClick={() => { setResult(null); setUploadedImages([]); setImagePreviews([]); setMessages([{ id: '1', sender: 'other', text: '' }]); setTarotRevealed(false); }}
                  className="p-3 rounded-full bg-white shadow-sm text-stone-400 hover:text-stone-800 transition-soft"
                >
                      <ArrowLeft size={18} />
                    </button>
                    <div className="font-serif italic text-stone-500">CT SCAN REPORT</div>
                  </div>

                  {/* Report Card */}
                  <div className="soft-card w-full overflow-hidden mb-12">
                    <div className="p-10">
                      {/* Header */}
                      <div className="text-center mb-12">
                        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] mb-4">Diagnosis Result</div>
                        <h2 className="text-4xl font-serif font-bold mb-6 leading-tight px-4">{result.title}</h2>
                        <div className="flex flex-wrap justify-center gap-2 mb-8">
                          {result.keywords.map((kw, i) => (
                            <span key={i} className="px-3 py-1 rounded-full bg-stone-50 text-stone-400 text-[9px] font-bold tracking-widest uppercase border border-stone-100">#{kw}</span>
                          ))}
                        </div>
                        <div className="inline-block px-4 py-2 rounded-2xl bg-indigo-50/50 text-indigo-400 text-xs font-bold font-serif italic">
                          Joint MBTI: {result.mbti}
                        </div>
                      </div>

                      {/* Nutrition Facts Module */}
                      <div className="mb-16">
                        <NutritionLabel data={result.nutrition} />
                      </div>

                      {/* Charts */}
                  <div className="grid grid-cols-1 gap-12 mb-16">
                    {/* Radar */}
                    <div className="w-full flex flex-col items-center">
                      <div className="text-[10px] font-bold text-stone-300 uppercase tracking-widest mb-6 text-center">Dimension Analysis</div>
                      <div className="h-72 w-full min-h-[280px]">
                        {result.dimensions && result.dimensions.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={result.dimensions}>
                              <PolarGrid stroke="#F1F1F1" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: '#A8B3CF', fontSize: 10, fontWeight: 600 }} />
                              <Radar
                                name="Dimension"
                                dataKey="value"
                                stroke="#A8B3CF"
                                strokeWidth={1}
                                fill="#D7DDF2"
                                fillOpacity={0.6}
                                isAnimationActive={false}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-stone-300 text-xs italic">Data pending...</div>
                        )}
                      </div>
                    </div>

                    {/* Frequency Area Chart */}
                    <div className="w-full">
                      <div className="text-[10px] font-bold text-stone-300 uppercase tracking-widest mb-6 text-center">Interaction Pulse</div>
                      <div className="h-48 w-full min-h-[200px]">
                        {result.frequencyData && result.frequencyData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={result.frequencyData}>
                              <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#F2D7D5" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#F2D7D5" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis 
                                dataKey="time" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#D1D5DB', fontSize: 9}} 
                                dy={10}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  borderRadius: '16px', 
                                  border: 'none', 
                                  boxShadow: '0 10px 30px rgba(0,0,0,0.05)', 
                                  fontSize: '11px',
                                  background: 'rgba(255, 255, 255, 0.9)',
                                  backdropFilter: 'blur(4px)'
                                }} 
                              />
                              <Area 
                                type="monotone" 
                                dataKey="count" 
                                stroke="#F2D7D5" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#colorCount)"
                                isAnimationActive={false}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-stone-300 text-xs italic">Data pending...</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Insights Section */}
                  <div className="space-y-12">
                    {/* Hidden Messages */}
                    <section>
                      <h4 className="font-serif italic text-lg text-stone-800 mb-6 flex items-center">
                        <MessageCircle size={18} className="mr-3 text-rose-200" />
                        Decoding the Subtext
                      </h4>
                      <div className="space-y-4">
                        {result.hiddenMessages.map((msg, i) => (
                          <div key={i} className="p-6 rounded-[24px] bg-stone-50/50 border border-stone-100">
                            <div className="text-[10px] font-bold text-stone-300 uppercase tracking-widest mb-2">Original</div>
                            <p className="text-stone-500 italic text-sm mb-4 leading-relaxed">"{msg.original}"</p>
                            <div className="text-[10px] font-bold text-rose-300 uppercase tracking-widest mb-2">Decoded</div>
                            <p className="text-stone-800 font-bold text-sm leading-relaxed">{msg.decoded}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Summary */}
                    <section>
                      <h4 className="font-serif italic text-lg text-stone-800 mb-6 flex items-center">
                        <BarChart3 size={18} className="mr-3 text-sage-200" />
                        Deep Insights
                      </h4>
                      <div className="space-y-4">
                        {result.summary.map((s, i) => (
                          <div key={i} className="flex items-start group">
                            <div className="w-1.5 h-1.5 rounded-full bg-stone-200 mt-2 mr-4 group-hover:bg-rose-200 transition-soft shrink-0" />
                            <p className="text-stone-600 text-sm leading-relaxed">{s}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Prescription */}
                    <section className="bg-stone-900 rounded-[32px] p-10 text-stone-100 relative overflow-hidden shadow-2xl shadow-stone-200">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10" />
                      <div className="flex items-center space-x-3 text-rose-200/50 text-[10px] font-bold uppercase tracking-[0.3em] mb-6">
                        <Thermometer size={14} />
                        <span>The Prescription</span>
                      </div>
                      <p className="text-xl font-serif italic leading-relaxed text-stone-100">
                        "{result.prescription}"
                      </p>
                    </section>
                  </div>
                </div>
              </div>

              {/* Final Actions */}
              <div className="flex flex-col w-full space-y-4">
                <button 
                  onClick={generateReceipt}
                  disabled={isExporting}
                  className={`btn-pill btn-soft-gradient text-sm tracking-widest uppercase flex items-center justify-center space-x-3 shadow-xl shadow-rose-100/50 ${isExporting ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {isExporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <FileText size={16} />
                      <span>Generate Receipt (生成长图)</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={() => { 
                    setResult(null); 
                    setUploadedImages([]); 
                    setImagePreviews([]); 
                    setMessages([{ id: '1', sender: 'other', text: '' }]); 
                    setTarotRevealed(false); 
                  }}
                  className="btn-pill bg-white text-stone-400 text-sm tracking-widest uppercase border border-stone-100"
                >
                  New Scan
                </button>
              </div>
              
              <footer className="mt-16 text-stone-300 text-[10px] font-bold tracking-widest uppercase mb-12">
                Processed by CIE Emotional Engine 4.0
              </footer>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

        {/* 右侧边栏 - 扫描小贴纸 (仅桌面端) */}
        {!result && !showReview && !isScanning && (
          <aside className="hidden xl:flex flex-col w-[280px] sticky top-24 ml-10 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="soft-card p-8 bg-white/40 backdrop-blur-sm border-none"
            >
              <h3 className="font-serif font-bold text-xl mb-4 text-stone-400 flex items-center">
                <Info size={18} className="mr-2" />
                Scan Tips
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3 text-[11px] text-stone-500 leading-relaxed">
                  <div className="w-1 h-1 rounded-full bg-rose-200 mt-1.5 shrink-0" />
                  <span>Use <span className="text-stone-800 font-bold">[Sticker]</span> to describe unreadable emojis for deeper AI analysis.</span>
                </li>
                <li className="flex items-start space-x-3 text-[11px] text-stone-500 leading-relaxed">
                  <div className="w-1 h-1 rounded-full bg-blue-200 mt-1.5 shrink-0" />
                  <span>Context matters. Add background info to get a more personal "Relationship Tarot".</span>
                </li>
                <li className="flex items-start space-x-3 text-[11px] text-stone-500 leading-relaxed">
                  <div className="w-1 h-1 rounded-full bg-amber-200 mt-1.5 shrink-0" />
                  <span>Screenshots work best when they show a complete exchange of ideas.</span>
                </li>
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="soft-card p-8 bg-rose-50/30 border-none"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Heart size={14} className="text-rose-300 fill-rose-300" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-300">Emotional Lab</span>
              </div>
              <p className="text-[11px] text-stone-400 italic leading-relaxed">
                "We don't just scan text, we map the invisible strings that connect two souls."
              </p>
            </motion.div>
          </aside>
        )}
      </div>

      {/* Hidden Export Template (Receipt Style) */}
      <div className="fixed top-[1000vh] left-0 pointer-events-none">
        <div 
          ref={receiptRef}
          className="w-[380px] bg-white p-10 font-sans text-stone-900 relative shadow-2xl"
          style={{ backgroundColor: '#FDFCF8' }}
        >
          {/* Jagged Edge Top */}
          <div className="absolute top-0 left-0 w-full h-2 flex overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="w-5 h-5 bg-stone-100 rotate-45 -translate-y-3 shrink-0" />
            ))}
          </div>

          <div className="pt-8 text-center border-b border-dashed border-stone-200 pb-8">
            <h1 className="font-serif italic text-3xl mb-2">Chat CT Scan</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold">Relationship Lab Receipt</p>
            <div className="mt-4 text-[9px] text-stone-300 font-mono uppercase tracking-wider">
              No. {Math.random().toString(36).substr(2, 9).toUpperCase()} / {new Date().toLocaleString()}
            </div>
          </div>

          {result && (
            <div className="py-10 space-y-12">
              {/* Result Summary */}
              <div className="text-center">
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Diagnosis</div>
                <h2 className="font-serif italic text-2xl text-stone-800 leading-tight px-4">{result.title}</h2>
                <div className="mt-6 flex justify-center items-baseline space-x-2">
                  <span className="text-5xl font-serif italic text-rose-300">{result.score}</span>
                  <span className="text-xs font-bold text-stone-300 uppercase tracking-widest">Score</span>
                </div>
              </div>

              {/* Tarot Section */}
              <div className="text-center bg-stone-50/50 p-8 rounded-3xl border border-stone-100">
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-6">Relationship Tarot</div>
                <div className="w-32 h-48 mx-auto bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center mb-6 overflow-hidden">
                  <div className="text-4xl">🎴</div>
                </div>
                <h3 className="font-serif italic text-xl mb-2">{result.tarot.name}</h3>
                <p className="text-[11px] text-stone-500 leading-relaxed px-4 italic">"{result.tarot.meaning}"</p>
              </div>

              {/* Nutrition Section */}
              <div className="border-y border-dashed border-stone-200 py-8">
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-6 text-center">Conversation Nutrition</div>
                <div className="space-y-4 px-4">
                  {[
                    { label: 'Sincerity (真心)', val: result.nutrition.sincerity, color: 'bg-rose-200' },
                    { label: 'Sugar (甜度)', val: result.nutrition.sugar, color: 'bg-amber-100' },
                    { label: 'Toxicity (毒性)', val: result.nutrition.toxicity, color: 'bg-stone-800' },
                    { label: 'Nonsense (废话)', val: result.nutrition.nonsense, color: 'bg-stone-100' }
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
                        <span>{item.label}</span>
                        <span>{item.val}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-stone-50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color}`} 
                          style={{ width: `${item.val}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtext Decoder */}
              <div className="px-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-6 text-center">Subtext Decoder</div>
                <div className="space-y-6">
                  {result.hiddenMessages.map((msg, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-start space-x-3">
                        <span className="text-[9px] font-bold text-stone-300 mt-1">{i + 1}.</span>
                        <div>
                          <p className="text-[11px] text-stone-400 italic mb-1">"{msg.original}"</p>
                          <p className="text-xs font-bold text-stone-800">→ {msg.decoded}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prescription */}
              <div className="bg-stone-900 text-stone-100 p-8 rounded-3xl text-center relative overflow-hidden">
                <div className="text-[8px] font-bold uppercase tracking-[0.4em] text-stone-500 mb-4">The Prescription</div>
                <p className="font-serif italic text-lg leading-relaxed">
                  "{result.prescription}"
                </p>
              </div>
            </div>
          )}

          {/* Footer with QR */}
          <div className="mt-10 pt-10 border-t border-dashed border-stone-200 text-center">
            <div className="w-20 h-20 mx-auto bg-white border border-stone-100 p-2 mb-6 shadow-sm">
              <div className="w-full h-full bg-stone-900 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-1">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-white rounded-sm opacity-20" />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Scan to decode yours</p>
            <p className="text-[8px] text-stone-300 italic tracking-tighter">Emotional Lab CIE Engine 4.0 • All Rights Reserved</p>
          </div>

          {/* Jagged Edge Bottom */}
          <div className="absolute bottom-0 left-0 w-full h-2 flex overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="w-5 h-5 bg-stone-100 rotate-45 translate-y-3 shrink-0" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
