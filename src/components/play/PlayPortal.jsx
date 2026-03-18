import React, { useEffect, useMemo, useRef, useState } from "react";
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
import {
  subscribeSpinWheel,
  validateWheelAccess,
} from "../../services/spinWheelService";
import { clearSession } from "../../services/session";
import SpinWheel from "../common/SpinWheel";

const BLANK_TILE = -1;
const DIFFICULTY_LAYOUTS = {
  8: { rows: 2, cols: 4 },
  12: { rows: 3, cols: 4 },
  16: { rows: 4, cols: 4 },
  24: { rows: 4, cols: 6 },
};
const DEFAULT_DIFFICULTY = 16;
const SWIPE_THRESHOLD_PX = 24;

const buildSolvedTiles = (pieceCount) =>
  Array.from({ length: pieceCount }, (_, index) => index);

const isSolvedArrangement = (tiles, solvedTiles) =>
  tiles.every((value, index) => value === solvedTiles[index]);

const resolveDifficultyValue = (difficultyValue) => {
  const raw = Number(difficultyValue);
  if (Object.prototype.hasOwnProperty.call(DIFFICULTY_LAYOUTS, raw)) {
    return raw;
  }
  if (raw === 15) {
    return 16;
  }
  if (raw === 25 || raw === 35 || raw === 36 || raw === 5 || raw === 6) {
    return 24;
  }
  return DEFAULT_DIFFICULTY;
};

const resolvePuzzleLayout = (difficultyValue) =>
  DIFFICULTY_LAYOUTS[resolveDifficultyValue(difficultyValue)] || DIFFICULTY_LAYOUTS[DEFAULT_DIFFICULTY];

const getNeighborIndexes = (index, rows, cols) => {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const neighbors = [];

  if (row > 0) neighbors.push(index - cols);
  if (row < rows - 1) neighbors.push(index + cols);
  if (col > 0) neighbors.push(index - 1);
  if (col < cols - 1) neighbors.push(index + 1);

  return neighbors;
};

const isAdjacent = (first, second, cols) => {
  const firstRow = Math.floor(first / cols);
  const firstCol = first % cols;
  const secondRow = Math.floor(second / cols);
  const secondCol = second % cols;
  return Math.abs(firstRow - secondRow) + Math.abs(firstCol - secondCol) === 1;
};

const getSwipeDirection = (deltaX, deltaY) => {
  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < SWIPE_THRESHOLD_PX) {
    return null;
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX > 0 ? "right" : "left";
  }

  return deltaY > 0 ? "down" : "up";
};

const canMoveBySwipeDirection = (tileIndex, blankIndex, direction, cols) => {
  const tileRow = Math.floor(tileIndex / cols);
  const tileCol = tileIndex % cols;
  const blankRow = Math.floor(blankIndex / cols);
  const blankCol = blankIndex % cols;

  switch (direction) {
    case "up":
      return blankRow === tileRow - 1 && blankCol === tileCol;
    case "down":
      return blankRow === tileRow + 1 && blankCol === tileCol;
    case "left":
      return blankCol === tileCol - 1 && blankRow === tileRow;
    case "right":
      return blankCol === tileCol + 1 && blankRow === tileRow;
    default:
      return false;
  }
};

const shuffleSlidingTiles = (solvedTiles, rows, cols) => {
  if (!Array.isArray(solvedTiles) || solvedTiles.length < 2) {
    return [...(solvedTiles || [])];
  }

  let next = [...solvedTiles];
  let blankIndex = next.indexOf(BLANK_TILE);
  let previousBlankIndex = -1;

  for (let move = 0; move < 200; move += 1) {
    const neighbors = getNeighborIndexes(blankIndex, rows, cols).filter(
      (index) => index !== previousBlankIndex
    );
    const candidates = neighbors.length ? neighbors : getNeighborIndexes(blankIndex, rows, cols);
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    [next[blankIndex], next[selected]] = [next[selected], next[blankIndex]];
    previousBlankIndex = blankIndex;
    blankIndex = selected;
  }

  if (isSolvedArrangement(next, solvedTiles)) {
    const neighbors = getNeighborIndexes(blankIndex, rows, cols);
    const selected = neighbors[0];
    [next[blankIndex], next[selected]] = [next[selected], next[blankIndex]];
  }

  return next;
};

const PlayPortal = ({
  companyId,
  campaignId,
  campaignKey,
  type = "puzzle",
  session,
  onUserSession,
  onNavigateHome,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [activeCampaignId, setActiveCampaignId] = useState("");
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
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const touchStartRef = useRef(null);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      setError("Invalid QR link. Missing companyId.");
      return;
    }

    setLoading(true);
    setError("");
    setActiveCampaignId("");

    let unsubCampaign = () => {};
    let unsubUsers = () => {};
    let unsubAttempts = () => {};

    const validator = type === "wheel" ? validateWheelAccess : validatePlayAccess;
    const subscriber = type === "wheel" ? subscribeSpinWheel : subscribeCampaign;

    validator({ 
      companyId, 
      campaignId, 
      campaignKey, 
      wheelId: campaignId, 
      wheelKey: campaignKey 
    })
      .then(({ company: companyProfile, campaign: campaignConfig }) => {
        const resolvedId = campaignConfig?.campaignId || campaignConfig?.wheelId || campaignId || "";
        setCompany(companyProfile);
        setCampaign(campaignConfig);
        setActiveCampaignId(resolvedId);
        setTimerLeft(Number(campaignConfig?.timerSeconds) || (type === "wheel" ? 60 : 180));

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

        unsubCampaign = subscriber(companyId, resolvedId, (next) => {
          setCampaign(next);
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
  }, [campaignId, campaignKey, companyId, session?.companyId, session?.role, session?.userEmail, session?.userId, session?.userName, session?.userPhone, session?.provider]);

  useEffect(() => {
    if (!started || timerLeft <= 0 || type === "wheel") {
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
    () =>
      user
        ? getUserAttemptStats(attempts, user.userId, activeCampaignId)
        : { count: 0, solved: false },
    [activeCampaignId, attempts, user]
  );

  const leaderboard = useMemo(
    () => buildLeaderboard(users, attempts, activeCampaignId),
    [activeCampaignId, attempts, users]
  );
  const difficultyValue = useMemo(
    () => resolveDifficultyValue(campaign?.difficulty),
    [campaign?.difficulty]
  );
  const puzzleLayout = useMemo(
    () => resolvePuzzleLayout(campaign?.difficulty),
    [campaign?.difficulty]
  );
  const rows = puzzleLayout.rows;
  const cols = puzzleLayout.cols;
  const pieceCount = useMemo(() => rows * cols - 1, [rows, cols]);
  const solvedTiles = useMemo(() => [...buildSolvedTiles(pieceCount), BLANK_TILE], [pieceCount]);

  const canStart =
    Boolean(campaign?.isActive) &&
    Boolean(user) &&
    userStats.count < Number(campaign?.maxAttempts || 3) &&
    !userStats.solved &&
    (type === "wheel" || Boolean(campaign?.puzzleImage));

  useEffect(() => {
    if (mode !== "game" || !campaign?.puzzleImage) {
      return;
    }

    const nextTiles = shuffleSlidingTiles(solvedTiles, rows, cols);
    setTiles(nextTiles);
    setStarted(false);
    setTimerLeft(Number(campaign?.timerSeconds) || 180);
  }, [mode, campaign?.puzzleImage, campaign?.timerSeconds, solvedTiles, rows, cols]);

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
        campaignId: activeCampaignId || campaign?.campaignId || campaignId || "",
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
        campaignId: activeCampaignId || campaign?.campaignId || campaignId || "",
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
    const nextTiles = shuffleSlidingTiles(solvedTiles, rows, cols);
    setTiles(nextTiles);
    setTimerLeft(Number(campaign.timerSeconds) || 180);
    setStarted(true);
  };

  const handleTileMove = (tilePositionIndex, swipeDirection = null) => {
    if (!started || attemptSaving || userStats.solved) {
      return;
    }

    setTiles((previousTiles) => {
      const blankIndex = previousTiles.indexOf(BLANK_TILE);
      const canMove = swipeDirection
        ? canMoveBySwipeDirection(tilePositionIndex, blankIndex, swipeDirection, cols)
        : isAdjacent(tilePositionIndex, blankIndex, cols);

      if (blankIndex < 0 || !canMove) {
        return previousTiles;
      }

      const nextTiles = [...previousTiles];
      [nextTiles[blankIndex], nextTiles[tilePositionIndex]] = [
        nextTiles[tilePositionIndex],
        nextTiles[blankIndex],
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
  };

  const handleTileTap = (tilePositionIndex) => {
    handleTileMove(tilePositionIndex);
  };

  const handleTileTouchStart = (tilePositionIndex, event) => {
    const touch = event.touches?.[0];
    if (!touch) {
      return;
    }

    touchStartRef.current = {
      tilePositionIndex,
      x: touch.clientX,
      y: touch.clientY,
    };
  };

  const handleTileTouchEnd = (tilePositionIndex, event) => {
    const startTouch = touchStartRef.current;
    touchStartRef.current = null;

    const endTouch = event.changedTouches?.[0];
    if (!startTouch || !endTouch || startTouch.tilePositionIndex !== tilePositionIndex) {
      return;
    }

    const swipeDirection = getSwipeDirection(
      endTouch.clientX - startTouch.x,
      endTouch.clientY - startTouch.y
    );

    if (!swipeDirection) {
      return;
    }

    handleTileMove(tilePositionIndex, swipeDirection);
  };

  const handleTileTouchCancel = () => {
    touchStartRef.current = null;
  };

  const handleSpin = async () => {
    if (!campaign || !campaign.items || campaign.items.length === 0 || isSpinning || userStats.count >= (Number(campaign.maxAttempts) || 1)) {
      return;
    }

    const items = campaign.items;
    const segmentAngle = 360 / items.length;
    
    // Weighted Selection
    let totalWeight = items.reduce((sum, item) => sum + (Number(item.chance) || 0), 0);
    let randomIndex = 0;
    
    if (totalWeight > 0) {
      const random = Math.random() * totalWeight;
      let accumulated = 0;
      for (let i = 0; i < items.length; i++) {
        accumulated += Number(items[i].chance) || 0;
        if (random <= accumulated) {
          randomIndex = i;
          break;
        }
      }
    } else {
      randomIndex = Math.floor(Math.random() * items.length);
    }
    
    // Calculate unique target rotation for proportional segments
    const targetTotalWeight = items.reduce((s, i) => s + (Number(i.chance) || 0), 0) || 100;
    let targetStartAngle = 0;
    for (let i = 0; i < randomIndex; i++) {
      targetStartAngle += ((Number(items[i].chance) || 0) / targetTotalWeight) * 360;
    }
    const targetAngleSize = ((Number(items[randomIndex].chance) || 0) / targetTotalWeight) * 360;
    const targetCenter = targetStartAngle + targetAngleSize / 2;
    
    // Rotation with random offset within the segment center area
    // The arrow points at the top (270° in standard coordinates)
    // We need to rotate the wheel so the target segment's midpoint appears at 270°
    const extraSpins = 8 + Math.floor(Math.random() * 5);
    const segmentOffset = (Math.random() * 0.4 + 0.3) * targetAngleSize;
    const targetPointAngle = targetStartAngle + segmentOffset;
    const angleToRotate = (270 - targetPointAngle + 360) % 360; // Rotate so segment reaches the top (270°)
    const targetRotation = rotation + (360 * extraSpins) + angleToRotate;
    
    setIsSpinning(true);
    setRotation(targetRotation);
    setWinner(null);

    // Wait for animation (4 seconds)
    setTimeout(() => {
      setIsSpinning(false);
      const wonItem = items[randomIndex];
      setWinner(wonItem);
      // For spin wheel, use 4 seconds as a baseline completion time (the spin duration)
      const spinCompletionTime = 4;
      submitAttempt("solved", spinCompletionTime, wonItem.name);
    }, 4100);
  };

  const submitAttempt = async (status, forcedTime, prizeName = "") => {
    if (!user || !campaign || !companyId) {
      return;
    }

    const maxAttempts = Number(campaign.maxAttempts) || (type === "wheel" ? 1 : 3);
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
        campaignId: campaign?.campaignId || activeCampaignId || campaignId || "",
        user,
        status,
        completionTimeSec,
        prize: prizeName, // Adding prize to metadata
      });
      setStarted(false);
      if (type === "puzzle") {
        setMessage(status === "solved" ? "Puzzle solved and saved." : "Attempt saved.");
      }
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
                Scan QR code and login with Google to start.
              </p>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="mt-8 w-full bg-white border-2 border-gray-200 py-4 rounded-2xl font-black hover:bg-gray-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {authLoading ? "Signing in..." : "Continue with Google"}
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-xl font-black text-gray-900">Campaign Details</h3>
              <div className="mt-5 space-y-3 text-gray-700 font-semibold">
                <p>
                  Difficulty: {difficultyValue} blocks ({pieceCount} movable + 1 blank)
                </p>
                <p>Timer: {formatDuration(campaign?.timerSeconds || 180)}</p>
                <p>Max Attempts: {campaign?.maxAttempts || 3}</p>
                <p>
                  Status:{" "}
                  <span className={campaign?.isActive ? "text-mint" : "text-accent"}>
                    {campaign?.isActive ? "Live" : "Not Live"}
                  </span>
                </p>
              </div>
              {type === "puzzle" && campaign?.puzzleImage && (
                <img
                  src={campaign.puzzleImage}
                  alt="Puzzle logo preview"
                  className="mt-5 w-full max-h-72 object-contain rounded-2xl bg-gray-50 border border-gray-100"
                />
              )}
              {type === "wheel" && (
                <div className="mt-5 bg-gray-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-gray-100 italic font-medium text-gray-400">
                  <div className="text-4xl mb-3">🎡</div>
                  Spin Wheel Experience Coming Soon
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <div className="flex justify-between gap-3 items-start flex-wrap">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">
                    {type === "wheel" ? "Spin Wheel" : "Puzzle Game"}
                  </h2>
                  <p className="text-gray-500 font-medium mt-2">
                    Welcome, {user?.name}. {type === "wheel" ? "Try your luck!" : "Solve within time for top rank."}
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
                {type === "puzzle" && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-xs font-black uppercase text-gray-500">Timer Left</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">{formatDuration(timerLeft)}</p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs font-black uppercase text-gray-500">Attempts Used</p>
                  <p className="text-3xl font-black text-gray-900 mt-2">
                    {userStats.count}/{campaign?.maxAttempts || (type === "wheel" ? 1 : 3)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs font-black uppercase text-gray-500">Result</p>
                  <p className="text-3xl font-black text-gray-900 mt-2">
                    {userStats.solved ? "Great!" : "Ready"}
                  </p>
                </div>
              </div>

              {type === "puzzle" ? (
                campaign?.puzzleImage ? (
                  <div className="mt-6 rounded-3xl border border-gray-100 bg-gray-50 p-4">
                    <div
                      className="grid gap-1 bg-white rounded-2xl border border-gray-100 p-2 mx-auto w-full max-w-[520px]"
                      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                    >
                      {tiles.map((tilePieceIndex, tilePositionIndex) => {
                        const isBlank = tilePieceIndex === BLANK_TILE;
                        const row = Math.floor(tilePieceIndex / cols);
                        const col = tilePieceIndex % cols;
                        const bgX = cols > 1 ? (col / (cols - 1)) * 100 : 0;
                        const bgY = rows > 1 ? (row / (rows - 1)) * 100 : 0;

                        return (
                          <button
                            key={`${tilePieceIndex}-${tilePositionIndex}`}
                            type="button"
                            onClick={() => handleTileTap(tilePositionIndex)}
                            onTouchStart={(event) => handleTileTouchStart(tilePositionIndex, event)}
                            onTouchEnd={(event) => handleTileTouchEnd(tilePositionIndex, event)}
                            onTouchCancel={handleTileTouchCancel}
                            className={`aspect-square rounded-lg border transition-all ${
                              isBlank ? "bg-white border-gray-200" : "border-white/70"
                            }`}
                            style={{
                              backgroundImage: isBlank ? "none" : `url(${campaign.puzzleImage})`,
                              backgroundSize: isBlank
                                ? undefined
                                : `${cols * 100}% ${rows * 100}%`,
                              backgroundPosition: isBlank ? undefined : `${bgX}% ${bgY}%`,
                              backgroundRepeat: isBlank ? undefined : "no-repeat",
                              touchAction: isBlank ? "auto" : "none",
                            }}
                            disabled={isBlank}
                            aria-label={`Puzzle tile ${tilePositionIndex + 1}`}
                          />
                        );
                      })}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-gray-500">
                      Puzzle Difficulty: {difficultyValue} blocks ({pieceCount} movable + 1 blank)
                    </p>
                    <p className="mt-1 text-xs font-semibold text-gray-400">
                      Tap or swipe a tile toward the blank area to move it.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-400 font-semibold">
                    Company has not uploaded a puzzle image yet.
                  </div>
                )
              ) : (
                <div className="mt-6 flex flex-col items-center">
                  <div className="relative w-full max-w-[400px] aspect-square">
                    {/* Wheel Outer Border */}
                    <div className="absolute inset-0 rounded-full border-[12px] border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)] z-10">
                      {[...Array(24)].map((_, i) => (
                        <div key={i} className="absolute w-2 h-2 bg-white rounded-full translate-x-1/2" style={{ left: 'calc(50% - 4px)', top: '-2px', transformOrigin: '4px calc(200px + 2px)', transform: `rotate(${i * 15}deg)` }}></div>
                      ))}
                    </div>

                    {/* Pointer */}
                    <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-30 w-10 h-10">
                      <div className="w-full h-full bg-white rounded-xl shadow-lg border-4 border-yellow-500 flex items-center justify-center rotate-45">
                        <div className="w-4 h-4 bg-accent rounded-full"></div>
                      </div>
                    </div>

                    {/* The Wheel */}
                    <div 
                      className="w-full h-full rounded-full overflow-hidden relative transition-transform duration-[4000ms] cubic-bezier-wheel"
                      style={{ transform: `rotate(${rotation}deg)` }}
                    >
                      <SpinWheel items={campaign.items || []} rotation={rotation} />
                    </div>

                    {/* Central Spin Button */}
                    <button
                      onClick={handleSpin}
                      disabled={isSpinning || userStats.count >= (Number(campaign.maxAttempts) || 1)}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-white shadow-2xl z-20 flex items-center justify-center group active:scale-95 transition-transform"
                    >
                      <div className="w-20 h-20 rounded-full border-4 border-gray-100 flex flex-col items-center justify-center p-2 group-hover:border-mint transition-colors">
                        <span className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Spin</span>
                        {isSpinning && <Loader2 size={12} className="animate-spin mt-1 text-mint" />}
                      </div>
                    </button>
                  </div>

                  {/* Winner Popup */}
                  {winner && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                       <div className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-500">
                          <div className="w-32 h-32 mx-auto mb-6 relative">
                             <div className="absolute inset-0 bg-mint/20 rounded-full animate-ping"></div>
                             <div className="relative w-full h-full rounded-full border-4 border-mint overflow-hidden bg-gray-50 flex items-center justify-center">
                               {winner.image ? (
                                 <img src={winner.image} alt={winner.name} className="w-full h-full object-cover" />
                               ) : (
                                 <span className="text-4xl text-mint">🎁</span>
                               )}
                             </div>
                          </div>
                          <h3 className="text-3xl font-black text-gray-900 uppercase">You Won!</h3>
                          <p className="mt-2 text-xl font-bold text-mint">{winner.name}</p>
                          <button 
                            onClick={() => setWinner(null)}
                            className="mt-8 w-full bg-gray-900 text-white py-4 rounded-2xl font-black hover:bg-gray-800 transition-colors"
                          >
                            Awesome!
                          </button>
                       </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {type === "puzzle" ? (
                  <>
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
                        const nextTiles = shuffleSlidingTiles(solvedTiles, rows, cols);
                        setTiles(nextTiles);
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
                  </>
                ) : (
                  <button
                    onClick={handleSpin}
                    disabled={isSpinning || userStats.count >= (Number(campaign?.maxAttempts) || 1)}
                    className="bg-mint text-white px-8 py-4 rounded-2xl font-black disabled:opacity-60 shadow-lg shadow-mint/20 flex items-center gap-2"
                  >
                    {isSpinning ? "Wheeeeee!" : "Click to Spin"}
                  </button>
                )}
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
