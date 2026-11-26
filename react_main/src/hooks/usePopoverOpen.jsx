import { useContext, useEffect, useRef, useState } from "react";
import { useAppLocation, useViewActive } from "./useViewActivity";
import { activateOnEnterOrSpace } from "../utils/keyboard";
import { InGameContext } from "Contexts";

export const usePopoverOpen = () => {
  const location = useAppLocation();
  const active = useViewActive();
  const inGame = useContext(InGameContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openByHover, setOpenByHover] = useState(false);
  const [openByClick, setOpenByClick] = useState(false);
  const closeTimer = useRef(null);
  const popoverOpen = active && Boolean(anchorEl);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleHoverClose = () => {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => {
      setAnchorEl(null);
      setOpenByClick(false);
      setOpenByHover(false);
    }, 280);
  };

  const handleMouseEnter = (e) => {
    clearCloseTimer();
    if (!openByClick) {
      setOpenByHover(true);
      openPopover(e);
    }
  };
  const handleMouseLeave = () => {
    if (openByHover) {
      if (document.documentElement.classList.contains("skin-redesign")) {
        scheduleHoverClose();
        return;
      }
      closePopover();
    }
  };
  const holdPopover = () => {
    clearCloseTimer();
  };
  const releasePopover = () => {
    if (openByClick) return;
    if (document.documentElement.classList.contains("skin-redesign")) {
      scheduleHoverClose();
    }
  };
  const handleClick = (e) => {
    clearCloseTimer();
    setOpenByClick(true);
    setOpenByHover(false);
    openPopover(e);
  };
  const openPopover = (e) => {
    if (!active) return;
    setAnchorEl(e.currentTarget);
  };
  const closePopover = () => {
    clearCloseTimer();
    setAnchorEl(null);
    setOpenByClick(false);
    setOpenByHover(false);
  };

  // Close on any navigation. A popover anchored to an element on the previous
  // page otherwise lingered after the route changed, pointing at a node that is
  // no longer on screen. Also close when a game takes the screen: the shell
  // stays mounted and keeps the last site location, so that transition is not a
  // navigation it can see, and the popover would float over the game.
  useEffect(() => {
    setAnchorEl(null);
    setOpenByClick(false);
    setOpenByHover(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, location.pathname, location.search, location.hash, inGame, active]);

  useEffect(() => () => clearCloseTimer(), []);

  const handleKeyDown = (e) => {
    activateOnEnterOrSpace(e, handleClick);
  };

  const interactiveProps = {
    role: "button",
    tabIndex: 0,
    onClick: handleClick,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onKeyDown: handleKeyDown,
    "aria-haspopup": "true",
    "aria-expanded": popoverOpen,
  };

  return {
    popoverOpen,
    openByClick,
    anchorEl,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    handleKeyDown,
    closePopover,
    holdPopover,
    releasePopover,
    interactiveProps,
  };
};
