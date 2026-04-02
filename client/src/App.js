import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import AdBanner from './components/AdBanner';
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
import HotelDetails from './pages/HotelDetails';
import AdManager from './pages/AdManager';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <AdBanner zone="header_banner" label={true} style={{ padding: '0 2rem' }} />
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
          <Route path="/hotels/:code" element={<HotelDetails />} />
          <Route path="/admin/ads" element={<AdManager />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
