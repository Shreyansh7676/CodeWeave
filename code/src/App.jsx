import React from 'react'
import Hero from './components/Hero.jsx'
import Editor from './components/Editor.jsx'
import {Routes, Route} from 'react-router'
import toast from 'react-hot-toast'
const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/editor/:id" element={<Editor />} />
      </Routes>
    </div>
  )
}

export default App

