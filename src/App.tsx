import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import Nav from "./components/Nav";
import TabBar from "./components/TabBar";
import Footer from "./components/Footer";
import ComingSoon from "./components/ComingSoon";
import HomePage from "./pages/HomePage";
import ListPage from "./pages/ListPage";
import BuilderPage from "./pages/BuilderPage";
import DetailPage from "./pages/DetailPage";
import LoginPage from "./pages/LoginPage";
import CoursesPage from "./pages/CoursesPage";
import LodgingPage from "./pages/LodgingPage";
import MapPage from "./pages/MapPage";
import SearchPage from "./pages/SearchPage";
import SavedPage from "./pages/SavedPage";
import SavedMapPage from "./pages/SavedMapPage";

/**
 * 라우트의 :id / :courseId 는 명세 4번의 course_id, :tripId 는 명세 1·2번의 trip_id 다.
 *
 * [백엔드 연결 이전] 아래 ComingSoon 라우트들은 백엔드 API 명세에 대응 엔드포인트가 없어 보류한 화면이다.
 * 화면 코드는 src/deferred/ 에 그대로 있다 (src/deferred/README.md 참고).
 *
 * /search 와 /saved 도 서버 엔드포인트가 없지만, 화면은 프론트 단독으로 동작한다.
 * 검색은 src/data/places.ts 시드 목록을, 저장함은 localStorage(src/store/saved.ts)를 쓴다.
 */
export default function App() {
  return (
    <AuthProvider>
      <Nav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/list" element={<ListPage />} />
        <Route path="/builder" element={<BuilderPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/trips/:tripId/courses" element={<CoursesPage />} />
        <Route path="/trips/:tripId/courses/:courseId/lodging" element={<LodgingPage />} />
        <Route path="/trip/:id" element={<DetailPage />} />
        <Route path="/trip/:id/map" element={<MapPage />} />

        <Route path="/search" element={<SearchPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/saved/map" element={<SavedMapPage />} />
        <Route
          path="/trip/:id/edit"
          element={
            <ComingSoon
              title="코스 편집은 준비 중이에요"
              desc="일정 순서 변경·삭제 API가 아직 서버에 없어요."
            />
          }
        />
        <Route
          path="/trip/:id/chat"
          element={
            <ComingSoon
              title="챗봇 수정은 준비 중이에요"
              desc="수정 요청은 서버에 저장되지만 재계산이 아직 준비되지 않았어요."
            />
          }
        />
        <Route
          path="/signup"
          element={
            <ComingSoon
              title="이메일 회원가입은 준비 중이에요"
              desc="지금은 구글 로그인만 지원해요."
            />
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
