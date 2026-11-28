import React, { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Alert, Box, IconButton, Stack } from "@mui/material";
import {
  getAnnouncement,
  getPrevAnnouncement,
  getNextAnnouncement,
  isFirstAnnouncement,
  isLastAnnouncement,
} from "../../services/announcementService";
import { Loading } from "../Loading";
import { minimumLoadingTime } from "../../Constants";
import { useIsPhoneDevice } from "../../hooks/useIsPhoneDevice";
import { useSkinRedesign } from "../useSkinRedesign";
import { urlifyText } from "../../utilsFolder";

export const Announcement = ({
  showAnnouncementTemporarily,
  setShowAnnouncementTemporarily,
}) => {
  const skin = useSkinRedesign();
  const [seenAnnouncement, setSeenAnnouncement] = useState(false);
  const [announcement, setAnnouncement] = useState(null);
  const [showPrevButton, setShowPrevButton] = useState(false);
  const [showNextButton, setShowNextButton] = useState(true); // BUG: if there's only 1 announcement, NEXT_BUTTON should be disabled
  const [loadingFirstTime, setLoadingFirstTime] = useState(true);
  const [loading, setLoading] = useState(true);
  const isPhoneDevice = useIsPhoneDevice();
  const [announceSlot, setAnnounceSlot] = useState(null);
  useLayoutEffect(() => {
    let frames = 0;
    let raf = 0;
    const sync = () => {
      const el = document.getElementById("skin-lobby-announce");
      setAnnounceSlot(el);
      if (!el && frames < 30) {
        frames += 1;
        raf = requestAnimationFrame(sync);
      }
    };
    sync();
    window.addEventListener("skin-announce-slot", sync);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("skin-announce-slot", sync);
    };
  }, [announcement, seenAnnouncement]);

  useEffect(() => {
    (async () => {
      const firstAnnouncement = await getAnnouncement();
      const lastSeenAnnouncementDate = localStorage.getItem(
        "lastSeenAnnouncementDate"
      );

      setSeenAnnouncement(lastSeenAnnouncementDate == firstAnnouncement?.date);
      setAnnouncement(firstAnnouncement);
      setLoading(false);
      setLoadingFirstTime(false);
    })();
  }, []);

  if (loadingFirstTime) {
    return "";
  }
  if (seenAnnouncement && !showAnnouncementTemporarily) {
    return "";
  }
  if (!announcement) {
    return "";
  }

  const stopLoading = () =>
    setTimeout(() => setLoading(false), minimumLoadingTime);
  const closeAnnouncements = () => {
    localStorage.setItem("lastSeenAnnouncementDate", announcement?.date);
    setSeenAnnouncement(true);
    setShowAnnouncementTemporarily(false);
  };
  const showPrevAnnouncement = async () => {
    setLoading(true);
    const newAnnouncement = await getPrevAnnouncement(announcement?.date);
    const newShowPrevButton = await isFirstAnnouncement(newAnnouncement);

    setShowNextButton(true);
    setShowPrevButton(newShowPrevButton);
    setAnnouncement(newAnnouncement);
    stopLoading();
  };
  const showNextAnnouncement = async () => {
    setLoading(true);
    const newAnnouncement = await getNextAnnouncement(announcement?.date);
    const newShowNextButton = await isLastAnnouncement(newAnnouncement);

    setShowPrevButton(true);
    setShowNextButton(newShowNextButton);
    setAnnouncement(newAnnouncement);
    stopLoading();
  };
  const CloseButton = (
    <IconButton
      aria-label="Close announcement"
      color="info"
      sx={{ p: 0.5 }}
      onClick={closeAnnouncements}
    >
      <i className="far fa-times-circle" />
    </IconButton>
  );

  // const ScrollButtonsWidth = 35;
  const iconHeight = 15; // default: 20px
  const PrevButton = (
    <IconButton
      aria-label="Previous announcement"
      disabled={loading || !showPrevButton}
      color="info"
      sx={{ width: `${iconHeight + 8}px`, p: 0.5 }}
      onClick={showPrevAnnouncement}
    >
      <i
        className="fas fa-angle-up"
        style={{ fontSize: `${iconHeight}px` }}
      ></i>
    </IconButton>
  );
  const NextButton = (
    <IconButton
      aria-label="Next announcement"
      disabled={loading || !showNextButton}
      color="info"
      sx={{ width: `${iconHeight + 8}px`, p: 0.5 }}
      onClick={showNextAnnouncement}
    >
      <i
        className="fas fa-angle-down"
        style={{ fontSize: `${iconHeight}px` }}
      ></i>
    </IconButton>
  );
  const ScrollButtons = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        mr: 0.5,
        mt: 0.5,
        ml: -4,
        // ml: `-${ScrollButtonsWidth}px`,
      }}
    >
      {PrevButton}
      {NextButton}
    </Box>
  );

  const content = loading ? (
    <div
      style={{
        maxHeight: "20px" /* MAGIC NUMBER WARNING... CSS demands sacrifices */,
      }}
    >
      <Loading extraSmall />
    </div>
  ) : (
    urlifyText(announcement?.content)
  );

  const announcementUi = (
    <Stack direction="row" spacing={1} className="skin-announce-row">
      {skin ? null : ScrollButtons}
      <Alert
        className="skin-announce"
        severity="info"
        variant="outlined"
        sx={{
          width: "100%",
          backgroundColor: "background.paper",
        }}
        action={CloseButton}
        icon={skin ? (
          <span className="skin-announce-lead">
            <span className="skin-announce-nav">{PrevButton}{NextButton}</span>
            <i className="fas fa-bullhorn" />
          </span>
        ) : (
          <i className="fas fa-bullhorn" />
        )}
      >
        <Box
          sx={{
            width: "100%",
            wordBreak: "break-word",
            cursor: "default",
          }}
        >
          {content}
        </Box>
      </Alert>
    </Stack>
  );
  if (announceSlot) return createPortal(announcementUi, announceSlot);
  return announcementUi;
};
