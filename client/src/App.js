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
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
