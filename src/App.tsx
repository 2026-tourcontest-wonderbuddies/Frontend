import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import Nav from "./components/Nav";
import TabBar from "./components/TabBar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import ListPage from "./pages/ListPage";
import BuilderPage from "./pages/BuilderPage";
import DetailPage from "./pages/DetailPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import CandidatesPage from "./pages/CandidatesPage";
import LodgingPage from "./pages/LodgingPage";
import MapPage from "./pages/MapPage";
import EditPage from "./pages/EditPage";
import ChatPage from "./pages/ChatPage";
import SavedPage from "./pages/SavedPage";
import SavedMapPage from "./pages/SavedMapPage";
import SearchPage from "./pages/SearchPage";

export default function App() {
  return (
    <AuthProvider>
      <Nav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/list" element={<ListPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/builder" element={<BuilderPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/trips/candidates/:requestId" element={<CandidatesPage />} />
        <Route path="/trips/candidates/:requestId/lodging/:candidateId" element={<LodgingPage />} />
        <Route path="/trip/:id" element={<DetailPage />} />
        <Route path="/trip/:id/map" element={<MapPage />} />
        <Route path="/trip/:id/edit" element={<EditPage />} />
        <Route path="/trip/:id/chat" element={<ChatPage />} />
        <Route
          path="/saved"
          element={
            <ProtectedRoute>
              <SavedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved/map"
          element={
            <ProtectedRoute>
              <SavedMapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <div className="state-panel">
              <span className="serif">페이지를 찾을 수 없어요</span>
            </div>
          }
        />
      </Routes>
      <Footer />
      <TabBar />
    </AuthProvider>
  );
}
