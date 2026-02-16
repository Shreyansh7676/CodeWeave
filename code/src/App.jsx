import React from 'react'
import Hero from './components/Hero.jsx'
import Editor from './components/Editor.jsx'
import {Routes, Route} from 'react-router'
import toast from 'react-hot-toast'
import { StoreProvider } from './store/store.jsx'
const App = () => {
  return (
    <StoreProvider>
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/:id" element={<Editor />} />
      </Routes>
    </StoreProvider>
  )
}

export default App

