import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import {
  Paper,
  Typography,
  Box,
  Stack,
  Button,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import { UserContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import { getPageNavFilterArg, PageNav } from "components/Nav";
import { NameWithAvatar } from "pages/User/UserWidgets";
import LobbySidebarPanel from "pages/Play/LobbyBrowser/LobbySidebarPanel";
import { useSkinRedesign } from "components/useSkinRedesign";

function VoterAvatars({ optionIndex, poll }) {
  if (!poll.voterInfo || !poll.voterInfo[optionIndex]) {
    return null;
  }

  const voters = poll.voterInfo[optionIndex];
  return (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{ mt: 1, flexWrap: "wrap", gap: 0.5 }}
    >
      {voters.map((voter, index) => (
        <Tooltip key={index} title={voter.name || "Unknown User"} arrow>
          <Box
            sx={{
              "& .user-name": { display: "none" },
              "& .name-with-avatar": { width: "auto" },
            }}
          >
            <NameWithAvatar
              id={voter.userId}
              name=" "
              avatar={true}
              small={true}
              noLink={true}
            />
          </Box>
        </Tooltip>
      ))}
    </Stack>
  );
}

function Polls({
  allPolls,
  isThreadPoll,
  pollPage,
  onPollPageNav,
  isAllLobbies,
  handleVote,
}) {
  const skin = useSkinRedesign();
  const polls = Array.isArray(allPolls) ? allPolls : [];
  if (polls.length === 0) {
    return isThreadPoll ? null : (
      <Typography variant="body2" color="text.secondary">
        No polls for this lobby.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {!isThreadPoll && (
        <Box className="skin-poll-pager">
          <PageNav page={pollPage} onNav={onPollPageNav} />
        </Box>
      )}
      {polls.map((poll) => {
        const isActive = !poll.completed;
        const completedDate =
          poll.completed && poll.completedAt
            ? new Date(poll.completedAt).toLocaleDateString()
            : null;
        const expiresDate =
          poll.expiresAt && !poll.completed
            ? new Date(poll.expiresAt).toLocaleDateString()
            : null;

        const counts = poll.voteCounts || [];
        const lead = counts.reduce((best, n) => (n > best ? n : best), 0);
        return (
          <Box
            key={poll.id}
            className={skin ? "skin-poll" : undefined}
            sx={skin ? { p: 0, border: 0 } : { p: 2, border: 1, borderColor: "divider", borderRadius: 1 }}
          >
            {isAllLobbies && poll.lobby && !skin && (
              <Typography
                variant="caption"
                color="primary"
                sx={{ fontWeight: 700, mb: 1, display: "block" }}
              >
                {poll.lobby}
              </Typography>
            )}
            {skin ? (
              <div className="poll-q">
                <span className="poll-quote" aria-hidden="true">“</span>
                {poll.question}
                <span className="poll-quote" aria-hidden="true">”</span>
              </div>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {poll.question}
              </Typography>
            )}

            <Stack spacing={1}>
              {(Array.isArray(poll.options) ? poll.options : []).map((option, index) => {
                const voteCount = counts[index] || 0;
                const totalVotes = counts.reduce((a, b) => a + b, 0);
                const percentage =
                  totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                const isUserVote = poll.userVote === index;
                const leading = voteCount > 0 && voteCount === lead;
                if (skin) {
                  return (
                    <Box key={index}>
                      <button
                        type="button"
                        className="poll-opt"
                        onClick={() => !poll.completed && handleVote(index, poll.id)}
                        disabled={poll.completed}
                      >
                        {option}
                      </button>
                      <div className={`poll-bar ${leading ? "yes" : "no"}`}>
                        <i style={{ width: `${percentage}%` }} />
                      </div>
                    </Box>
                  );
                }

                return (
                  <Box key={index}>
                    <Button
                      variant={isUserVote ? "contained" : "outlined"}
                      fullWidth
                      onClick={() =>
                        !poll.completed && handleVote(index, poll.id)
                      }
                      disabled={poll.completed}
                      sx={{
                        justifyContent: "flex-start",
                        textAlign: "left",
                        mb: 1,
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ width: "100%" }}
                      >
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                          {option}
                        </Typography>
                        <Typography variant="caption">
                          {voteCount} ({percentage.toFixed(1)}%)
                        </Typography>
                      </Stack>
                    </Button>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{ mt: 0.5 }}
                    />
                    <VoterAvatars optionIndex={index} poll={poll} />
                  </Box>
                );
              })}
            </Stack>

            <Typography
              className={skin ? "poll-done" : "poll-completes"}
              variant="caption"
              color="text.secondary"
              sx={{ mt: skin ? 0 : 2, display: "block" }}
            >
              {isActive && expiresDate && `Completes on ${expiresDate}`}
              {isActive && !expiresDate && "Active indefinitely"}
              {!isActive && `Completed on ${completedDate}`}
            </Typography>
          </Box>
        );
      })}
      {!isThreadPoll && (
        <Box className="skin-poll-pager">
          <PageNav page={pollPage} onNav={onPollPageNav} />
        </Box>
      )}
    </Stack>
  );
}

export function Poll({ lobby, threadId, locked }) {
  const [currentPoll, setCurrentPoll] = useState(null);
  const [activePolls, setActivePolls] = useState([]);
  const [polls, setPolls] = useState([]);
  const [allPolls, setAllPolls] = useState([]);
  const [pollPage, setPollPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  const isThreadPoll = !!threadId;
  const isLobbyPoll = !!lobby;
  const isAllLobbies = lobby === "All";

  useEffect(() => {
    if (user.loggedIn) {
      if (isThreadPoll && threadId) {
        fetchThreadPoll();
      } else if (isLobbyPoll && lobby) {
        fetchPolls();
      }
    }
  }, [lobby, threadId, pollPage, user.loggedIn, locked]);

  // Reset pagination when lobby changes
  useEffect(() => {
    if (isLobbyPoll) {
      setPollPage(1);
    }
  }, [lobby]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchThreadPoll = async () => {
    if (!user.loggedIn) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/api/poll/thread/${threadId}`);
      if (isMountedRef.current) {
        if (response.data.poll) {
          setAllPolls([response.data.poll]);
        } else {
          setAllPolls([]);
        }
      }
    } catch (error) {
      if (isMountedRef.current) {
        errorAlert();
      }
    }
    if (isMountedRef.current) {
      setLoading(false);
    }
  };

  const fetchPolls = async () => {
    // Don't fetch if user is not logged in
    if (!user.loggedIn) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `/api/poll/list/${lobby}?page=${pollPage}`
      );
      if (!isMountedRef.current) return;

      const { currentPoll, activePolls } = response.data;
      const history = Array.isArray(response.data.polls) ? response.data.polls : [];

      setCurrentPoll(currentPoll);
      setActivePolls(activePolls || []);
      setPolls(history);

      // Combine active polls with history for display
      let combined = [];

      if (pollPage === 1) {
        if (isAllLobbies && activePolls && activePolls.length > 0) {
          // For "All" lobby, show all active polls first
          const filteredPolls = history.filter(
            (p) => !activePolls.some((ap) => ap.id === p.id)
          );
          combined = [...activePolls, ...filteredPolls];
        } else if (currentPoll) {
          // For specific lobby, show current poll first
          const filteredPolls = history.filter((p) => p.id !== currentPoll.id);
          combined = [currentPoll, ...filteredPolls];
        } else {
          combined = history;
        }
      } else {
        // Pages beyond 1 only show history
        combined = history;
      }

      setAllPolls(Array.isArray(combined) ? combined : []);
    } catch (error) {
      if (isMountedRef.current) {
        errorAlert();
      }
    }
    if (isMountedRef.current) {
      setLoading(false);
    }
  };

  const onPollPageNav = (page) => {
    // Don't paginate if user is not logged in
    if (!user.loggedIn) {
      return;
    }

    var filterArg = getPageNavFilterArg(page, pollPage, polls, "created");

    if (filterArg == null) return;

    setLoading(true);
    axios
      .get(`/api/poll/list/${lobby}?${filterArg}`)
      .then((res) => {
        const { currentPoll, activePolls } = res.data;
        const history = Array.isArray(res.data.polls) ? res.data.polls : [];

        if (history.length || (activePolls && activePolls.length)) {
          setCurrentPoll(currentPoll);
          setActivePolls(activePolls || []);
          setPolls(history);
          setPollPage(page);

          // Combine for display
          let combined = [];

          if (page === 1) {
            if (isAllLobbies && activePolls && activePolls.length > 0) {
              const filteredPolls = history.filter(
                (p) => !activePolls.some((ap) => ap.id === p.id)
              );
              combined = [...activePolls, ...filteredPolls];
            } else if (currentPoll) {
              const filteredPolls = history.filter(
                (p) => p.id !== currentPoll.id
              );
              combined = [currentPoll, ...filteredPolls];
            } else {
              combined = history;
            }
          } else {
            combined = history;
          }

          setAllPolls(Array.isArray(combined) ? combined : []);
        }
        setLoading(false);
      })
      .catch((error) => {
        errorAlert();
        setLoading(false);
      });
  };

  const handleVote = async (optionIndex, pollId) => {
    try {
      await axios.post("/api/poll/vote", {
        pollId: pollId,
        optionIndex,
      });

      // Refresh the poll data - use appropriate fetch function
      if (isMountedRef.current) {
        if (isThreadPoll) {
          fetchThreadPoll();
        } else {
          fetchPolls();
        }
      }
    } catch (error) {
      if (isMountedRef.current) {
        errorAlert();
      }
    }
  };

  // Don't show polls to non-logged-in users
  if (!user.loggedIn) {
    return null;
  }

  // Don't show empty thread polls
  if (isThreadPoll && (!Array.isArray(allPolls) || allPolls.length === 0)) {
    return null;
  }

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography color="primary" gutterBottom>
          Poll
        </Typography>
        <LinearProgress />
      </Paper>
    );
  }

  return (
    <LobbySidebarPanel title="Poll">
      <Polls
        allPolls={allPolls}
        isThreadPoll={isThreadPoll}
        pollPage={pollPage}
        onPollPageNav={onPollPageNav}
        isAllLobbies={isAllLobbies}
        handleVote={handleVote}
      />
    </LobbySidebarPanel>
  );
}

// Export an alias for thread polls
export function ThreadPoll({ threadId, locked }) {
  return <Poll threadId={threadId} locked={locked} />;
}
