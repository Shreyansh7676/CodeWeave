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
import {Link, useLocation, useParams, useNavigate} from 'react-router';
import { initSocket } from '../Socket';
import toast from 'react-hot-toast';
const CollaborativeTextEditor = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [clients, setClients] = useState([]);
    const location = useLocation();
    const socketRef = useRef(null);
    const codeRef=useRef(null);
    const [copied, setCopied] = useState(false)
    const navigate = useNavigate();
    const { id } = useParams();
    
    useEffect(()=>{
        const init=async()=>{
            socketRef.current=await initSocket();
            socketRef.current.on('connect_error',(err)=>{
                handleError(err);
            })
            socketRef.current.on('connect_failed',(err)=>{
                handleError(err);
            })
            const handleError=(err)=>{
                console.log(`Socket connection error: ${err.message}`);
                toast.error('Socket connection failed.');
                navigate('/');
            }
            socketRef.current.emit('join',{
                id,
                userName: location.state?.userName 
            })
            socketRef.current.on('joined',({clients,userName,socketId})=>{
                if(userName!==location.state?.userName){
                    toast.success(`${userName} has joined the room.`);
                }
                setClients(clients);
                socketRef.current.emit('sync-code', {
                    code: codeRef.current,
                    socketId
                });
            });
            

            //disconnected
            socketRef.current.on('disconnected',({socketId,userName})=>{
                toast.success(`${userName} has left the room.`);
                setClients((prev)=>{
                    return prev.filter(client=>client.socketId!==socketId);
                })
            })
        };
        init();

        return ()=>{
            if(socketRef.current){
                socketRef.current.disconnect();
                socketRef.current.off("joined"); 
                socketRef.current.off("disconnected"); 
            }
        };
    },[])

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

    if(!location.state){
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
        <div className="h-screen bg-gray-900 text-white flex overflow-hidden">
            {/* Sidebar */}
            <div
                className={`
          ${sidebarCollapsed ? 'w-0 md:w-16' : 'w-full md:w-80'} 
          transition-all duration-300 ease-in-out
          bg-gray-800/50 backdrop-blur-xl border-r border-gray-700/50
          flex flex-col
          ${sidebarCollapsed ? '' : 'fixed md:relative inset-y-0 left-0 z-50'}
        `}
            >
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
                    {!sidebarCollapsed && (
                        <>
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                                    <Users className="w-4 h-4" />
                                </div>
                                <h2 className="font-semibold text-lg">Collaborators</h2>
                            </div>
                            <button
                                onClick={toggleSidebar}
                                className="md:hidden p-1 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <button
                                onClick={toggleSidebar}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
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
                            {users.filter(u => u.isActive).length} active users
                        </div>

                        {clients.map((client) => (
                            <div
                                key={client.socketId}
                                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-700/30 transition-all duration-200 group"
                            >
                                <div className="relative">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-lg`}>
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
                        <button className="w-full flex items-center justify-center space-x-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-3 rounded-xl transition-all duration-200 group"onClick={copyToClipboard}>
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
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col space-y-2">
                            {users.slice(0, 4).map((user) => (
                                <div key={user.id} className="relative group">
                                    <div className={`w-8 h-8 ${user.color} rounded-full flex items-center justify-center text-white font-medium text-xs`}>
                                        {user.avatar}
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-gray-800 ${user.isActive ? 'bg-green-400' : 'bg-gray-500'}`}></div>

                                    {/* Tooltip */}
                                    <div className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-gray-700 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        {user.name}
                                    </div>
                                </div>
                            ))}
                            {users.length > 4 && (
                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white font-medium text-xs">
                                    +{users.length - 4}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <div className="bg-gray-800/30 backdrop-blur-xl border-b border-gray-700/50 p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {/* z */}

                        <div className="hidden sm:block">
                            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                Collaborative Editor
                            </h1>
                            <p className="text-sm text-gray-400">Room: {roomId}</p>
                        </div>
                    </div>

                    {/* Mobile user count */}
                    <div className="flex items-center space-x-2 sm:hidden">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">{users.filter(u => u.isActive).length}</span>
                    </div>

                </div>

                {/* Text Editor */}
                <div className='p-3 max-h-[400px]'>
                    <TextEditor socketRef={socketRef} id={id} onCodeChange={(code)=>(codeRef.current=code)}/>
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