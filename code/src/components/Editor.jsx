import React, { useState, useEffect, useRef } from 'react'
import {
    Users,
    X,
    Menu,
    Copy,
    LogOut,
    User,
    ChevronLeft,
    ChevronRight,
    Crown,
    Circle
} from 'lucide-react';
import TextEditor from './TextEditor';
import { Link, useLocation, useParams, useNavigate } from 'react-router';
import { initSocket } from '../Socket';
import toast from 'react-hot-toast';
import GradientText from '../blocks/GradientText';
const CollaborativeTextEditor = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [clients, setClients] = useState([]);
    const location = useLocation();
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const [copied, setCopied] = useState(false)
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

    // Mock data - you can replace with your own state management
    const users = [
        { id: 1, name: "Alex Chen", avatar: "AC", isOwner: true, isActive: true, color: "bg-purple-500" },
        { id: 2, name: "Sarah Johnson", avatar: "SJ", isOwner: false, isActive: true, color: "bg-blue-500" },
        { id: 3, name: "Mike Rodriguez", avatar: "MR", isOwner: false, isActive: false, color: "bg-green-500" },
        { id: 4, name: "Emily Davis", avatar: "ED", isOwner: false, isActive: true, color: "bg-pink-500" },
        { id: 5, name: "James Wilson", avatar: "JW", isOwner: false, isActive: false, color: "bg-orange-500" }
    ];

    const roomId = id;

    // Ref for the textarea DOM node


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

    // const handleChange = (event) => {
    //     onSelect(event.target.value);
    // };
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
                            {/* <button
                                onClick={toggleSidebar}
                                className="md:hidden p-1 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button> */}
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
                        <div className="w-full flex items-center justify-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-4 py-3 rounded-xl transition-all duration-200 border border-red-500/20 group">

                            <Link to={"/"}>
                                <span className="font-medium">Leave Room</span>
                            </Link>
                        </div>
                    </div>
                )}

                {/* Collapsed Sidebar Content */}
                {sidebarCollapsed && (
                    <div className="hidden md:flex flex-col items-center py-4 space-y-4">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 hover:bg-violet-950/40 rounded-lg transition-colors"
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

                                    {/* <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <p className="text-sm font-medium truncate text-white">
                                            {client.userName}
                                        </p>
                                    </div>
                                </div> */}
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
                    <div className="flex text-left space-x-4">
                        {/* z */}
                        <button
                            onClick={toggleSidebar}
                            className="p-2 hover:bg-gray-700 rounded-lg flex md:hidden transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="text-xl md:text-2xl  flex flex-col justify-start items-start text-left">
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

                    {/* Mobile user count */}
                    <div className="flex items-center space-x-2 sm:hidden">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">{clients.length}</span>
                    </div>

                </div>

                {/* Text Editor */}
                <div className='p-3 max-h-[400px]'>
                    <TextEditor socketRef={socketRef} id={id} onCodeChange={(code) => (codeRef.current = code)} />
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