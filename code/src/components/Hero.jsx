import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Code2,
  Users,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Plus,
  Copy,
  Check
} from 'lucide-react'
import { v4 as uuid } from 'uuid'
import toast from 'react-hot-toast'
import SpotlightCard from '../blocks/SpotlightCard'
import GradientText from '../blocks/GradientText'

const Hero = () => {
  const navigate = useNavigate()
  const [roomKey, setRoomKey] = useState('')
  const [userName, setUserName] = useState('')
  const [generatedRoomId, setGeneratedRoomId] = useState('')
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const generateRoomId = (e) => {
    e.preventDefault();
    const id = uuid();
    toast.success('Room ID generated successfully!');
    setGeneratedRoomId(id)
    setRoomKey(id)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedRoomId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const handleJoinRoom = () => {
    if (!roomKey || !userName) {
      alert('Please fill in both room key and your name')
      return
    }
    setIsLoading(true)
    // Simulate loading and navigate to editor
    setTimeout(() => {
      setIsLoading(false)
      // Navigate to the editor with the room key
      navigate(`/editor/${roomKey}?name=${encodeURIComponent(userName)}`, {
        state: {
          userName
        }
      })
    }, 1500)
  }

  return (
    <>
      <div className="fixed inset-0 -z-10 h-full w-full [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]"></div>
      {/* Hero Section */}
      <div className='relative px-6 py-24'>
        <div className="container mx-auto px-4 md:py-6">
          <div className="text-center mb-12">
            <h1 className="text-2xl md:text-3xl lg:text-6xl font-bold mb-6">
              {/* <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Code Together
              </span> */}


              <span className="text-white">Code Together In Real Time</span>
              <div className='flex items-center justify-center space-x-2 mt-4 gap-2'>
                <span className='text-white'>with</span>
              <GradientText
                colors={["#4320a0", "#3c1d90", "#6731f5", "#4320a0", "#3c1d90"]}
                animationSpeed={3}
                showBorder={false}
                className="custom-class"
              >
                CodeWeave
              </GradientText>
              </div>
            </h1>
            <p className="text-sm md:text-md text-gray-300 max-w-3xl mx-auto mb-12">
              Experience seamless collaborative coding with real-time synchronization,
              syntax highlighting, and powerful features designed for modern development teams.
            </p>
          </div>

          {/* Main Action Panel */}
          <div className="max-w-2xl mx-auto">
            <SpotlightCard className="custom-spotlight-card bg-black/15" spotlightColor="rgba(67, 32, 160, 0.2)">
              <div >
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-white">
                  Start Collaborating Now
                </h2>

                <div className="space-y-6">
                  {/* Room Key Input with Generate Button */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Room Key</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={roomKey}
                        onChange={(e) => setRoomKey(e.target.value)}
                        placeholder="Enter room key (e.g., ABC12345)"
                        className="flex-1 bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-950 focus:border-transparent transition-all"
                      />
                      {/* <button
                      onClick={generateRoomId}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-3 rounded-lg font-medium transition-all flex items-center space-x-2 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Generate</span>
                    </button> */}
                      <button className='relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-50' onClick={generateRoomId}>

                        <span className='absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]' />
                        <span className='inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-gray-950 px-8 py-1 text-sm font-medium text-gray-50 backdrop-blur-3xl'>
                          Generate
                        </span>
                      </button>
                    </div>

                    {/* Generated Room ID Display */}
                    {generatedRoomId && (
                      <div className="bg-transparent border border-gray-600/50 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-300">Generated ID:</span>
                          <span className="font-mono font-bold text-green-400">{generatedRoomId}</span>
                        </div>
                        <button
                          onClick={copyToClipboard}
                          className="text-gray-400 hover:text-white transition-colors p-1"
                        >
                          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* User Name Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Your Name</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your display name"
                      className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-950 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Join Room Button */}
                  <button
                    onClick={handleJoinRoom}
                    disabled={isLoading || !roomKey || !userName}
                    className="w-full bg-violet-950/20 border-2 border-violet-950 hover:bg-violet-950/40 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all flex items-center justify-center space-x-2 text-lg"
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Join Room</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </SpotlightCard>
          </div>

          {/* Features Section */}
          <div id="features" className="mt-20 md:mt-32">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
              Why Choose CodeCollab?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  icon: <Users className="w-8 h-8" />,
                  title: "Real-time Collaboration",
                  description: "Work together with your team in real-time with live cursors and instant synchronization."
                },
                {
                  icon: <Zap className="w-8 h-8" />,
                  title: "Lightning Fast",
                  description: "Experience blazing-fast performance with optimized real-time updates and minimal latency."
                },
                {
                  icon: <Shield className="w-8 h-8" />,
                  title: "Secure & Private",
                  description: "Your code is encrypted and secure. Private rooms ensure only invited collaborators can join."
                },
                {
                  icon: <Code2 className="w-8 h-8" />,
                  title: "Syntax Highlighting",
                  description: "Support for multiple programming languages with beautiful syntax highlighting and themes."
                },
                {
                  icon: <Globe className="w-8 h-8" />,
                  title: "Cross-Platform",
                  description: "Works seamlessly across all devices - desktop, tablet, and mobile. Code anywhere, anytime."
                },
                {
                  icon: <ArrowRight className="w-8 h-8" />,
                  title: "Easy to Use",
                  description: "Simple and intuitive interface. Just share a room code and start collaborating instantly."
                }
              ].map((feature, index) => (
                <div key={index} className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 hover:bg-gray-800/50 transition-all group">
                  <div className="text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 md:mt-32 text-center">
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                Ready to Transform Your Coding Experience?
              </h2>
              <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of developers who are already collaborating more effectively with CodeCollab.
              </p>
              <button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-4 px-8 rounded-lg transition-all text-lg">
                Get Started Free
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-12 border-t border-gray-800">
          <div className="text-center text-gray-400">
            <p>&copy; 2025 CodeCollab. Built for developers, by developers.</p>
          </div>
        </footer>
      </div>

    </>
  )
}

export default Hero
