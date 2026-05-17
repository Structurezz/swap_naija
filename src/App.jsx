import { Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/layout/ScrollToTop';
import { useEffect } from 'react';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Onboarding from './pages/Onboarding';
import ForgotPassword from './pages/ForgotPassword';
import ChangePassword from './pages/ChangePassword';
import Home from './pages/Home';
import Search from './pages/Search';
import CreateListing from './pages/CreateListing';
import ListingDetail from './pages/ListingDetail';
import SwapProposalPage from './pages/SwapProposal';
import MySwaps from './pages/MySwaps';
import Chat from './pages/Chat';
import ChatThread from './pages/ChatThread';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Wallet from './pages/Wallet';
import FreshDrops from './pages/FreshDrops';
import SuggestedForYou from './pages/SuggestedForYou';
import FeaturedListings from './pages/FeaturedListings';
import VerifyAccount from './pages/VerifyAccount';
import InviteEarn from './pages/InviteEarn';
import BoostListing from './pages/BoostListing';
import EditListing from './pages/EditListing';
import DisputeRoom from './pages/DisputeRoom';
import { useAuthStore } from './store/auth.store';
import SplashScreen from './components/ui/SplashScreen';

function App() {
  const { init, initialized } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <>
      <SplashScreen ready={initialized} />

      {initialized && (
        <Routes>
          <Route path="*" element={<ScrollToTop />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route element={<ProtectedRoute />}>
            {/* Full-screen route — no AppShell wrapper */}
            <Route path="/dispute/:swapId" element={<DisputeRoom />} />
            <Route element={<AppShell />}>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
              <Route path="/listing/:id/swap" element={<SwapProposalPage />} />
              <Route path="/create" element={<CreateListing />} />
              <Route path="/swaps" element={<MySwaps />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat/:conversationId" element={<ChatThread />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/profile/edit" element={<EditProfile />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/fresh-drops" element={<FreshDrops />} />
              <Route path="/suggested" element={<SuggestedForYou />} />
              <Route path="/featured" element={<FeaturedListings />} />
              <Route path="/verify-account" element={<VerifyAccount />} />
              <Route path="/invite" element={<InviteEarn />} />
              <Route path="/boost/:id" element={<BoostListing />} />
              <Route path="/listing/:id/edit" element={<EditListing />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </>
  );
}

export default App;
