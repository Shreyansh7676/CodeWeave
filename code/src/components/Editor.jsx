import React, { useState, useEffect, useRef } from 'react'
import {
    Users,
    X,
    Menu,
    Copy,
    LogOut,
    User,
    ChevronLeft,
    Play,
    Pause,
    TimerReset,
    ChevronRight,
    Crown,
    Circle,
    Timer
} from 'lucide-react';
import TextEditor from './TextEditor';
import { Link, useLocation, useParams, useNavigate } from 'react-router';
import { initSocket } from '../Socket';
import toast from 'react-hot-toast';
import Dropdown from '../blocks/Dropdown';
import axios from 'axios';
import GradientText from '../blocks/GradientText';


const CollaborativeTextEditor = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [clients, setClients] = useState([]);
    const location = useLocation();
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const [copied, setCopied] = useState(false);
    const [seconds, setSeconds] = useState(0);
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
                            <p className="text-xs md:text-sm text-gray-400">Room: {roomId}</p>
                        </div>
                    </div>



                    {/* Right Section */}
                    <div className="flex items-center space-x-4">
                        {/* Save Button */}
                        <button 
                            onClick={handleSave}
                            className="px-4 py-2 border border-violet-800 bg-violet-950/20 hover:bg-violet-950/40 text-gray-300 hover:text-white rounded-md transition-colors duration-200 text-sm font-medium"
                        >
                            Save Code
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
                <div className='p-3 max-h-[400px]'>
                    <TextEditor socketRef={socketRef} id={id} initialCode={codeRef.current}
                        onCodeChange={(code) => (codeRef.current = code)} />
                </div>

            </div>

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