import React, { useState, useEffect, useRef } from 'react'
import {
    Users,
    X,
    Menu,
    Copy,
    Sparkles,
    User,
    ChevronLeft,
    Play,
    Pause,
    TimerReset,
    ChevronRight,
    Crown,
    Circle,
    Timer,
    Loader2
} from 'lucide-react';
import TextEditor from './TextEditor';
import { Link, useLocation, useParams, useNavigate } from 'react-router';
import { initSocket } from '../Socket';
import toast from 'react-hot-toast';
import Dropdown from '../blocks/Dropdown';
import axios from 'axios';
import GradientText from '../blocks/GradientText';
import useStore from '../store/store.jsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';


const CollaborativeTextEditor = () => {
    const { code: globalCode } = useStore();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [clients, setClients] = useState([]);
    const location = useLocation();
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const [copied, setCopied] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [aitab,setAitab] = useState(false);
    const [aiExplanation, setAiExplanation] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [timer, setTimer] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => {
                handleError(err);
            })
            socketRef.current.on('connect_failed', (err) => {
                handleError(err);
            })
            const handleError = (err) => {
                console.log(`Socket connection error: ${err.message}`);
                toast.error('Socket connection failed.');
                navigate('/');
            }
            try {
                const res = await axios.get(`${import.meta.env.VITE_APP_BACKEND_URL}/api/room/${id}`);
                const savedCode = res.data.code;
                if (savedCode) {
                    codeRef.current = savedCode; // update ref
                }
            } catch (error) {
                console.error("Failed to fetch saved code", error);
                toast.error("Failed to load saved code");
            }

            socketRef.current.emit('join', {
                id,
                userName: location.state?.userName
            })
            socketRef.current.on('joined', ({ clients, userName, socketId }) => {
                if (userName !== location.state?.userName) {
                    toast.success(`${userName} has joined the room.`);
                }
                setClients(clients);
                socketRef.current.emit('sync-code', {
                    code: codeRef.current,
                    socketId
                });
            });


            //disconnected
            socketRef.current.on('disconnected', ({ socketId, userName }) => {
                toast.success(`${userName} has left the room.`);
                setClients((prev) => {
                    return prev.filter(client => client.socketId !== socketId);
                })
            })
        };
        init();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.off("joined");
                socketRef.current.off("disconnected");
            }
        };
    }, [])

    const handleTimer = (e) => {
        e.preventDefault();
        setTimer(!timer);
    }
    const handleReset = (e) => {
        e.preventDefault();
        clearInterval(intervalRef.current);
        setTimer(false);
        setSeconds(0);
    }
    const handleSave = async () => {
        try {
            console.log('Saving code:', { roomId: id, codeLength: codeRef.current?.length });
            const response = await axios.post(`${import.meta.env.VITE_APP_BACKEND_URL}/api/room/${id}/save`, {
                code: codeRef.current || ''
            });
            console.log('Save response:', response.data);
            toast.success("Code saved successfully");
        }
        catch (err) {
            console.error('Error saving code:', err);
            console.error('Error details:', err.response?.data);
            toast.error("Failed to save code: " + (err.response?.data?.error || err.message));
        }
    }
    // const handleAI = async () => {
    //     setAitab(true);
    //     setAiLoading(true);
    //     set
    // }
    const handleAI = async () => {
        setAitab(true);
        setAiLoading(true);
        setAiExplanation('');

        const code = globalCode || codeRef.current || '';
        if (!code.trim()) {
            setAiExplanation('No code to explain. Write some code first!');
            setAiLoading(false);
            return;
        }

        const prompt = `You are a code explainer. Explain the provided code clearly and concisely. Break down what each part does, mention the purpose, key functions, and any important patterns used. Keep it beginner-friendly but technically accurate. Use plain text formatting.\n\nCode:\n${code}`;

        try {
            const res = await axios.post(`${import.meta.env.VITE_APP_BACKEND_URL}/api/ai`, { prompt });
            const data = res.data;
            if (data.text) {
                setAiExplanation(data.text);
            } else {
                setAiExplanation('No explanation generated.');
            }
        } catch (err) {
            console.error('AI request failed:', err);
            setAiExplanation('Failed to get AI explanation.');
            toast.error('AI request failed');
        } finally {
            setAiLoading(false);
        }
    }
    const formatTime = () => {
        const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const second = String(seconds % 60).padStart(2, '0');
        return `${hours}:${minutes}:${second}`;
    }
    const roomId = id;
    const intervalRef = useRef(null);
    // Ref for the textarea DOM node
    useEffect(() => {
        if (timer) {
            intervalRef.current = setInterval(() => {
                setSeconds((prevSeconds) => prevSeconds + 1)
            }, 1000);
        }
        else if (!timer && seconds !== 0) {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [timer, seconds])

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    if (!location.state) {
        navigate('/');
    }

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(roomId)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            toast.success("Room ID copied to clipboard!")
        } catch (err) {
            console.error('Failed to copy: ', err)
        }
    }

    return (
        <div className="h-screen bg-black text-white flex overflow-hidden">
            {/* Sidebar */}
            <div
                className={`
          ${sidebarCollapsed ? 'w-0 md:w-16' : 'w-full md:w-80'} 
          transition-all duration-300 ease-in-out
          bg-neutral-950/50 backdrop-blur-xl border-r border-gray-700/50
          flex flex-col
          ${sidebarCollapsed ? '' : 'fixed md:relative inset-y-0 left-0 z-50'}
        `}
            >
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
                    {!sidebarCollapsed && (
                        <>
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8  rounded-lg flex items-center justify-center">
                                    <Users className="w-4 h-4" />
                                </div>
                                <h2 className="font-semibold text-lg">Participants</h2>
                            </div>
                            <button
                                onClick={toggleSidebar}
                                className="p-2 hover:bg-violet-950/40 rounded-lg transition-colors"
                            >
                                {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                            </button>
                        </>
                    )}
                </div>

                {/* Users List */}
                {!sidebarCollapsed && (
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        <div className="text-sm text-gray-400 mb-3">
                            {clients.length} active users
                        </div>

                        {clients.map((client) => (
                            <div
                                key={client.socketId}
                                className="flex items-center space-x-3 p-3 rounded-xl  hover:bg-violet-950/30 transition-all duration-200 group"
                            >
                                <div className="relative">
                                    <div className={`w-10 h-10 border font-bold border-violet-800 bg-violet-950/20 hover:bg-violet-950/40 rounded-full flex items-center justify-center text-violet-400 text-sm shadow-lg`}>
                                        {client.userName.charAt(0).toUpperCase()}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <p className="text-sm font-medium truncate text-white">
                                            {client.userName}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Sidebar Footer */}
                {!sidebarCollapsed && (
                    <div className="p-4 border-t border-gray-700/50 space-y-3">
                        <button className="w-full flex items-center justify-center space-x-2 border border-violet-800 bg-violet-950/20 hover:bg-violet-950/40 text-gray-300 hover:text-white px-4 py-3 rounded-xl transition-all duration-200 group" onClick={copyToClipboard}>
                            <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">Copy Room ID</span>
                        </button>
                        <button className="w-full flex items-center justify-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-4 py-3 rounded-xl transition-all duration-200 border border-red-500/20 group">

                            <Link to={"/"}>
                                <span className="font-medium">Leave Room</span>
                            </Link>
                        </button>
                    </div>
                )}

                {/* Collapsed Sidebar Content */}
                {sidebarCollapsed && (
                    <div className="hidden md:flex flex-col items-center py-4 space-y-4">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 hover:bg-violet-950/40 hover:text-violet-400 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col space-y-2">
                            {clients.map((client) => (
                                <div
                                    key={client.socketId}
                                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-violet-950/30 transition-all duration-200 group"
                                >
                                    <div className="relative">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-violet-400 border font-bold border-violet-800 bg-violet-950/20 hover:bg-violet-950/40 text-sm shadow-lg`}>
                                            {client.userName.charAt(0).toUpperCase()}
                                        </div>
                                    </div>


                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <div className="bg-black backdrop-blur-xl border-b border-gray-700/50 p-4 flex items-center justify-between">
                    {/* Left Section */}
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 hover:bg-gray-700 rounded-lg flex md:hidden transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="text-xl md:text-2xl flex flex-col justify-start items-start text-left">
                            <div>
                                <GradientText
                                    colors={["#4320a0", "#3c1d90", "#6731f5", "#4320a0", "#3c1d90"]}
                                    animationSpeed={3}
                                    showBorder={false}
                                    className="custom-class"
                                >
                                    CodeWeave
                                </GradientText>
                            </div>
                            <p className="hidden md:flex text-xs md:text-sm text-gray-400">Room: {roomId}</p>
                        </div>
                    </div>



                    {/* Right Section */}
                    <div className="flex flex-col-reverse md:flex-row items-center justify-center gap-2 md:space-x-4">
                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 border border-violet-800 bg-violet-950/20 hover:bg-violet-950/40 text-gray-300 hover:text-white rounded-md transition-colors duration-200 text-sm font-medium"
                        >
                            Save Code
                        </button>
                        <button className="px-4 py-2 border border-violet-800 bg-violet-950/20 hover:bg-violet-950/40 text-gray-300 hover:text-white rounded-md transition-colors duration-200 text-sm font-medium flex items-center gap-2"
                            onClick={handleAI}>
                            <Sparkles className="w-4 h-4" />
                            Ask AI
                        </button>
                        <div className='hidden md:flex py-2 px-1 gap-2 bg-violet-950/20 items-center border border-violet-900 rounded-md transition-all ease-in'>
                            <div className='flex border-r-2 border-violet-900 items-center justify-center'>
                                <button onClick={handleTimer}>
                                    {timer ? <Pause className='m-1 h-4 w-4 text-violet-600 hover:text-violet-400' /> : <Play className='m-1 h-4 w-4 text-violet-600 hover:text-violet-400' />}
                                </button>
                            </div>
                            <div>
                                {formatTime()}
                            </div>
                            <div className='flex border-l-2 border-violet-900 items-center justify-center'>
                                <button onClick={handleReset}>
                                    <TimerReset className='m-1 h-4 w-4 text-violet-600 hover:text-violet-400' />
                                </button>
                            </div>
                        </div>

                        {/* Mobile user count */}
                        <div className="flex items-center space-x-2 md:hidden">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-400">{clients.length}</span>
                        </div>
                    </div>

                </div>

                {/* Text Editor */}
                <div className='p-3 max-h-[400px] flex-1'>
                    <TextEditor socketRef={socketRef} id={id} initialCode={codeRef.current}
                        onCodeChange={(code) => (codeRef.current = code)} />
                </div>

            </div>

            {/* AI Sidebar */}
            <div
                className={`${
                    aitab ? 'w-full md:w-96' : 'w-0'
                } transition-all duration-300 ease-in-out bg-neutral-950/50 backdrop-blur-xl border-l border-gray-700/50 flex flex-col overflow-hidden ${
                    aitab ? 'fixed md:relative inset-y-0 right-0 z-50' : ''
                }`}
            >
                {aitab && (
                    <>
                        <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Sparkles className="w-4 h-4 text-violet-400" />
                                <h2 className="font-semibold text-lg">AI Explanation</h2>
                            </div>
                            <button
                                onClick={() => setAitab(false)}
                                className="p-2 hover:bg-violet-950/40 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-violet-800 scrollbar-track-transparent">
                            {aiLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                                    <span className="ml-2 text-gray-400">Analyzing code...</span>
                                </div>
                            ) : aiExplanation ? (
                                <div className="ai-markdown prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code({ node, inline, className, children, ...props }) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                return !inline && match ? (
                                                    <SyntaxHighlighter
                                                        style={oneDark}
                                                        language={match[1]}
                                                        PreTag="div"
                                                        customStyle={{
                                                            borderRadius: '0.5rem',
                                                            fontSize: '0.8rem',
                                                            margin: '0.75rem 0',
                                                        }}
                                                        {...props}
                                                    >
                                                        {String(children).replace(/\n$/, '')}
                                                    </SyntaxHighlighter>
                                                ) : (
                                                    <code
                                                        className="bg-violet-950/40 text-violet-300 px-1.5 py-0.5 rounded text-xs font-mono"
                                                        {...props}
                                                    >
                                                        {children}
                                                    </code>
                                                );
                                            },
                                            h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-4 mb-2 border-b border-gray-700/50 pb-2">{children}</h1>,
                                            h2: ({ children }) => <h2 className="text-lg font-bold text-white mt-4 mb-2 border-b border-gray-700/50 pb-1">{children}</h2>,
                                            h3: ({ children }) => <h3 className="text-base font-semibold text-violet-300 mt-3 mb-1">{children}</h3>,
                                            h4: ({ children }) => <h4 className="text-sm font-semibold text-violet-400 mt-2 mb-1">{children}</h4>,
                                            p: ({ children }) => <p className="text-gray-300 text-sm leading-relaxed mb-3">{children}</p>,
                                            ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 mb-3 ml-2">{children}</ul>,
                                            ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 text-sm space-y-1 mb-3 ml-2">{children}</ol>,
                                            li: ({ children }) => <li className="text-gray-300 text-sm leading-relaxed">{children}</li>,
                                            strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                                            em: ({ children }) => <em className="text-gray-400 italic">{children}</em>,
                                            hr: () => <hr className="border-gray-700/50 my-4" />,
                                            blockquote: ({ children }) => (
                                                <blockquote className="border-l-2 border-violet-500 pl-3 my-3 text-gray-400 italic">
                                                    {children}
                                                </blockquote>
                                            ),
                                            table: ({ children }) => (
                                                <div className="overflow-x-auto my-3 rounded-lg border border-gray-700/50">
                                                    <table className="min-w-full text-sm">{children}</table>
                                                </div>
                                            ),
                                            thead: ({ children }) => <thead className="bg-violet-950/30">{children}</thead>,
                                            th: ({ children }) => <th className="px-3 py-2 text-left text-violet-300 font-semibold text-xs border-b border-gray-700/50">{children}</th>,
                                            td: ({ children }) => <td className="px-3 py-2 text-gray-300 text-xs border-b border-gray-700/30">{children}</td>,
                                            a: ({ children, href }) => <a href={href} className="text-violet-400 hover:text-violet-300 underline" target="_blank" rel="noreferrer">{children}</a>,
                                        }}
                                    >
                                        {aiExplanation}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm italic">Click 'Ask AI' to get an explanation of your code...</p>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Overlay for mobile AI sidebar */}
            {aitab && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setAitab(false)}
                />
            )}

            {/* Overlay for mobile sidebar */}
            {!sidebarCollapsed && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={toggleSidebar}
                />
            )}
        </div>
    );
};

export default CollaborativeTextEditor;