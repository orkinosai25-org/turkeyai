import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Destinations from './pages/Destinations';
import Chat from './pages/Chat';
import TripPlanner from './pages/TripPlanner';
import Services from './pages/Services';
import ResortDeepDive from './pages/ResortDeepDive';
import Register from './pages/Register';
import Login from './pages/Login';
import SearchPage from './pages/SearchPage';
import KnowledgeManager from './pages/KnowledgeManager';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/destinations" element={<Destinations />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/trip-planner" element={<TripPlanner />} />
          <Route path="/services" element={<Services />} />
          <Route path="/resorts/:id/deep-dive" element={<ResortDeepDive />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/knowledge" element={<KnowledgeManager />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
