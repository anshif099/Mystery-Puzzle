import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, LogOut } from "lucide-react";
import {
  buildLeaderboard,
  formatDuration,
  getUserAttemptStats,
  registerFormUser,
  saveAttempt,
  signInUserWithGoogle,
  subscribeAttempts,
  subscribeCampaign,
  subscribeUsers,
  validatePlayAccess,
} from "../../services/challengeService";
import { clearSession } from "../../services/session";

const buildSolvedTiles = (pieceCount) =>
  Array.from({ length: pieceCount }, (_, index) => index);

const isSolvedArrangement = (tiles, solvedTiles) =>
  tiles.every((value, index) => value === solvedTiles[index]);

const shuffleTiles = (solvedTiles) => {
  if (!Array.isArray(solvedTiles) || solvedTiles.length < 2) {
    return [...(solvedTiles || [])];
  }

  const next = [...solvedTiles];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }

  if (isSolvedArrangement(next, solvedTiles)) {
    [next[0], next[1]] = [next[1], next[0]];
  }

  return next;
};

const PlayPortal = ({
  companyId,
  campaignKey,
  session,
  onUserSession,
  onNavigateHome,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [users, setUsers] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [mode, setMode] = useState("login");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [attemptSaving, setAttemptSaving] = useState(false);
  const [timerLeft, setTimerLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [tiles, setTiles] = useState([]);
  const [selectedTileIndex, setSelectedTileIndex] = useState(null);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      setError("Invalid QR link. Missing companyId.");
      return;
    }

    setLoading(true);
    setError("");

    let unsubCampaign = () => {};
    let unsubUsers = () => {};
    let unsubAttempts = () => {};

    validatePlayAccess({ companyId, campaignKey })
      .then(({ company: companyProfile, campaign: campaignConfig }) => {
        setCompany(companyProfile);
        setCampaign(campaignConfig);
        setTimerLeft(Number(campaignConfig?.timerSeconds) || 180);

        if (session?.role === "user" && session.companyId === companyId && session.userId) {
          setUser({
            userId: session.userId,
            name: session.userName || "Player",
            email: session.userEmail || "",
            phone: session.userPhone || "",
            provider: session.provider || "form",
          });
          setMode("game");
        }

        unsubCampaign = subscribeCampaign(companyId, (nextCampaign) => {
          setCampaign(nextCampaign);
        });
        unsubUsers = subscribeUsers(companyId, (rows) => setUsers(rows));
        unsubAttempts = subscribeAttempts(companyId, (rows) => setAttempts(rows));
      })
      .catch((validationError) => {
        setError(validationError?.message || "Unable to load play link.");
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      unsubCampaign();
      unsubUsers();
      unsubAttempts();
    };
  }, [campaignKey, companyId, session?.companyId, session?.role, session?.userEmail, session?.userId, session?.userName, session?.userPhone, session?.provider]);

  useEffect(() => {
    if (!started || timerLeft <= 0) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setTimerLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [started, timerLeft]);

  useEffect(() => {
    if (started && timerLeft === 0 && user && !attemptSaving) {
      setStarted(false);
      submitAttempt("failed", Number(campaign?.timerSeconds) || 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerLeft, started, user, attemptSaving]);

  const userStats = useMemo(
    () => (user ? getUserAttemptStats(attempts, user.userId) : { count: 0, solved: false }),
    [attempts, user]
  );

  const leaderboard = useMemo(() => buildLeaderboard(users, attempts), [users, attempts]);
  const pieceCount = useMemo(() => {
    const raw = Number(campaign?.difficulty) || 16;
    const grid = Math.max(2, Math.round(Math.sqrt(raw)));
    return grid * grid;
  }, [campaign?.difficulty]);
  const gridSize = useMemo(() => Math.sqrt(pieceCount), [pieceCount]);
  const solvedTiles = useMemo(() => buildSolvedTiles(pieceCount), [pieceCount]);

  const canStart =
    Boolean(campaign?.isActive) &&
    Boolean(user) &&
    userStats.count < Number(campaign?.maxAttempts || 3) &&
    !userStats.solved &&
    Boolean(campaign?.puzzleImage);

  useEffect(() => {
    if (mode !== "game" || !campaign?.puzzleImage) {
      return;
    }

    setTiles(shuffleTiles(solvedTiles));
    setSelectedTileIndex(null);
    setStarted(false);
    setTimerLeft(Number(campaign?.timerSeconds) || 180);
  }, [mode, campaign?.puzzleImage, campaign?.timerSeconds, solvedTiles]);

  const handleGoogleLogin = async () => {
    if (!companyId) {
      return;
    }

    setAuthLoading(true);
    setError("");
    try {
      const profile = await signInUserWithGoogle({ companyId });
      setUser(profile);
      setMode("game");
      onUserSession({
        role: "user",
        userId: profile.userId,
        userName: profile.name,
        userEmail: profile.email,
        userPhone: profile.phone,
        provider: profile.provider,
        companyId,
        companyName: company?.name || "",
      });
    } catch (loginError) {
      setError(loginError?.message || "Google login failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleFormLogin = async (event) => {
    event.preventDefault();
    if (!companyId) {
      return;
    }

    if (!formData.name.trim() || !formData.phone.trim()) {
      setError("Name and phone are required.");
      return;
    }

    setAuthLoading(true);
    setError("");
    try {
      const profile = await registerFormUser({
        companyId,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
      });
      setUser(profile);
      setMode("game");
      if (profile.alreadyExists) {
        setMessage("Existing user found. Continuing with your previous profile.");
      }
      onUserSession({
        role: "user",
        userId: profile.userId,
        userName: profile.name,
        userEmail: profile.email,
        userPhone: profile.phone,
        provider: profile.provider,
        companyId,
        companyName: company?.name || "",
      });
    } catch (loginError) {
      setError(loginError?.message || "User login failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleStartPuzzle = () => {
    if (!campaign || !campaign.puzzleImage) {
      return;
    }
    setMessage("");
    setError("");
    setTiles(shuffleTiles(solvedTiles));
    setSelectedTileIndex(null);
    setTimerLeft(Number(campaign.timerSeconds) || 180);
    setStarted(true);
  };

  const handleTileTap = (tilePositionIndex) => {
    if (!started || attemptSaving || userStats.solved) {
      return;
    }

    if (selectedTileIndex === null) {
      setSelectedTileIndex(tilePositionIndex);
      return;
    }

    if (selectedTileIndex === tilePositionIndex) {
      setSelectedTileIndex(null);
      return;
    }

    setTiles((previousTiles) => {
      const nextTiles = [...previousTiles];
      [nextTiles[selectedTileIndex], nextTiles[tilePositionIndex]] = [
        nextTiles[tilePositionIndex],
        nextTiles[selectedTileIndex],
      ];

      if (isSolvedArrangement(nextTiles, solvedTiles)) {
        const completionTime = Math.max(
          0,
          Number(campaign?.timerSeconds || 180) - Number(timerLeft || 0)
        );
        setStarted(false);
        setMessage("Puzzle solved. Saving result...");
        setTimeout(() => submitAttempt("solved", completionTime), 0);
      }

      return nextTiles;
    });
    setSelectedTileIndex(null);
  };

  const submitAttempt = async (status, forcedTime) => {
    if (!user || !campaign || !companyId) {
      return;
    }

    const maxAttempts = Number(campaign.maxAttempts) || 3;
    if (userStats.count >= maxAttempts) {
      setError("Maximum attempts reached.");
      setStarted(false);
      return;
    }

    setAttemptSaving(true);
    setError("");
    setMessage("");
    try {
      const completionTimeSec =
        typeof forcedTime === "number"
          ? forcedTime
          : Math.max(0, Number(campaign.timerSeconds || 180) - timerLeft);

      await saveAttempt({
        companyId,
        user,
        status,
        completionTimeSec,
      });
      setStarted(false);
      setMessage(status === "solved" ? "Puzzle solved and saved." : "Attempt saved.");
    } catch (attemptError) {
      setError(attemptError?.message || "Could not save attempt.");
    } finally {
      setAttemptSaving(false);
    }
  };

  const handleUserLogout = () => {
    clearSession();
    onUserSession(null);
    setUser(null);
    setMode("login");
    setStarted(false);
    setMessage("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-gray-600 font-semibold">
        <span className="inline-flex items-center gap-2">
          <Loader2 size={18} className="animate-spin" />
          Loading campaign...
        </span>
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-red-200 shadow-sm p-8 text-center">
          <p className="text-red-600 font-black text-2xl">Access Error</p>
          <p className="text-gray-600 font-medium mt-4">{error}</p>
          <button
            type="button"
            onClick={onNavigateHome}
            className="mt-6 bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-wrap gap-4 justify-between items-center">
          <div>
            <p className="text-xs uppercase tracking-widest font-black text-gray-500">
              Mystery Puzzle Challenge
            </p>
            <h1 className="text-3xl font-black text-gray-900 mt-2">{company?.name}</h1>
            <p className="text-gray-500 font-medium mt-1">
              Campaign Status:{" "}
              <span className={campaign?.isActive ? "text-mint font-bold" : "text-accent font-bold"}>
                {campaign?.isActive ? "Active" : "Inactive"}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={16} />
            Home
          </button>
        </div>

        {(error || message) && (
          <div
            className={`rounded-2xl p-4 font-semibold ${
              error
                ? "bg-red-50 border border-red-200 text-red-600"
                : "bg-mint/10 border border-mint/30 text-mint"
            }`}
          >
            {error || message}
          </div>
        )}

        {mode === "login" ? (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-2xl font-black text-gray-900">Login to Play</h2>
              <p className="text-gray-500 mt-2">
                Scan QR, login, and start solving the puzzle.
              </p>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="mt-6 w-full bg-white border border-gray-200 py-3 rounded-2xl font-black hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                {authLoading ? "Please wait..." : "Continue with Google"}
              </button>

              <div className="my-6 text-center text-xs uppercase font-black tracking-widest text-gray-400">
                OR
              </div>

              <form className="space-y-4" onSubmit={handleFormLogin}>
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="w-full bg-gray-50 p-4 rounded-2xl outline-none border border-transparent focus:border-mint"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  className="w-full bg-gray-50 p-4 rounded-2xl outline-none border border-transparent focus:border-mint"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, email: event.target.value }))
                  }
                  className="w-full bg-gray-50 p-4 rounded-2xl outline-none border border-transparent focus:border-mint"
                />
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-mint text-white py-3 rounded-2xl font-black hover:bg-mint/90 transition-colors disabled:opacity-60"
                >
                  {authLoading ? "Logging in..." : "Continue to Puzzle"}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-xl font-black text-gray-900">Campaign Details</h3>
              <div className="mt-5 space-y-3 text-gray-700 font-semibold">
                <p>Difficulty: {campaign?.difficulty || 16} pieces</p>
                <p>Timer: {formatDuration(campaign?.timerSeconds || 180)}</p>
                <p>Max Attempts: {campaign?.maxAttempts || 3}</p>
                <p>
                  Status:{" "}
                  <span className={campaign?.isActive ? "text-mint" : "text-accent"}>
                    {campaign?.isActive ? "Live" : "Not Live"}
                  </span>
                </p>
              </div>
              {campaign?.puzzleImage && (
                <img
                  src={campaign.puzzleImage}
                  alt="Puzzle logo preview"
                  className="mt-5 w-full max-h-72 object-contain rounded-2xl bg-gray-50 border border-gray-100"
                />
              )}
            </div>
          </div>
        ) : (
          <div className="grid xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <div className="flex justify-between gap-3 items-start flex-wrap">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Puzzle Game</h2>
                  <p className="text-gray-500 font-medium mt-2">
                    Welcome, {user?.name}. Solve within time for top rank.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleUserLogout}
                  className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  <LogOut size={16} />
                  Switch User
                </button>
              </div>

              <div className="mt-6 grid sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs font-black uppercase text-gray-500">Timer Left</p>
                  <p className="text-3xl font-black text-gray-900 mt-2">{formatDuration(timerLeft)}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs font-black uppercase text-gray-500">Attempts Used</p>
                  <p className="text-3xl font-black text-gray-900 mt-2">
                    {userStats.count}/{campaign?.maxAttempts || 3}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs font-black uppercase text-gray-500">Result</p>
                  <p className="text-3xl font-black text-gray-900 mt-2">
                    {userStats.solved ? "Solved" : "Pending"}
                  </p>
                </div>
              </div>

              {campaign?.puzzleImage ? (
                <div className="mt-6 rounded-3xl border border-gray-100 bg-gray-50 p-4">
                  <div
                    className="grid gap-1 bg-white rounded-2xl border border-gray-100 p-2 mx-auto w-full max-w-[520px]"
                    style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
                  >
                    {tiles.map((tilePieceIndex, tilePositionIndex) => {
                      const row = Math.floor(tilePieceIndex / gridSize);
                      const col = tilePieceIndex % gridSize;
                      const bgX = gridSize > 1 ? (col / (gridSize - 1)) * 100 : 0;
                      const bgY = gridSize > 1 ? (row / (gridSize - 1)) * 100 : 0;

                      return (
                        <button
                          key={`${tilePieceIndex}-${tilePositionIndex}`}
                          type="button"
                          onClick={() => handleTileTap(tilePositionIndex)}
                          className={`aspect-square rounded-lg border transition-all ${
                            selectedTileIndex === tilePositionIndex
                              ? "border-mint ring-2 ring-mint/50 scale-[0.98]"
                              : "border-white/70"
                          }`}
                          style={{
                            backgroundImage: `url(${campaign.puzzleImage})`,
                            backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                            backgroundPosition: `${bgX}% ${bgY}%`,
                            backgroundRepeat: "no-repeat",
                          }}
                          aria-label={`Puzzle tile ${tilePositionIndex + 1}`}
                        />
                      );
                    })}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-gray-500">
                    Puzzle Difficulty: {campaign?.difficulty || 16} pieces
                  </p>
                  <p className="mt-1 text-xs font-semibold text-gray-400">
                    Tap two pieces to swap their positions.
                  </p>
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-400 font-semibold">
                  Company has not uploaded a puzzle image yet.
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleStartPuzzle}
                  disabled={!canStart || started || attemptSaving}
                  className="bg-sky-blue text-white px-5 py-3 rounded-2xl font-black disabled:opacity-60"
                >
                  {started ? "Puzzle Running..." : "Start Puzzle"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!started || attemptSaving) {
                      return;
                    }
                    setTiles(shuffleTiles(solvedTiles));
                    setSelectedTileIndex(null);
                    setTimerLeft(Number(campaign?.timerSeconds || 180));
                  }}
                  disabled={!canStart || attemptSaving}
                  className="bg-mint text-white px-5 py-3 rounded-2xl font-black disabled:opacity-60"
                >
                  Shuffle Again
                </button>
                <button
                  type="button"
                  onClick={() => submitAttempt("failed")}
                  disabled={!started || attemptSaving}
                  className="bg-accent text-white px-5 py-3 rounded-2xl font-black disabled:opacity-60"
                >
                  Submit Failed Attempt
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-xl font-black text-gray-900">Leaderboard</h3>
              <p className="text-gray-500 text-sm mt-2">Top fastest users in this campaign.</p>

              <div className="mt-4 space-y-3">
                {leaderboard.length === 0 ? (
                  <div className="text-gray-400 font-semibold">No solved attempts yet.</div>
                ) : (
                  leaderboard.slice(0, 10).map((row) => (
                    <div
                      key={row.userId}
                      className="rounded-2xl border border-gray-100 bg-gray-50 p-3"
                    >
                      <div className="flex justify-between items-center">
                        <p className="font-black text-gray-900">
                          #{row.rank} {row.name}
                        </p>
                        <p className="font-black text-sky-blue">{row.completionTime}</p>
                      </div>
                      <p className="text-xs text-gray-500 font-semibold mt-1">
                        Attempts used: {row.attemptsUsed}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayPortal;
