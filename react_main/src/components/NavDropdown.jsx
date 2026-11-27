import React, { useContext, useEffect, useState } from "react";
import { useLocation, NavLink } from "react-router-dom";
import {
  Menu,
  MenuItem,
  Box,
  Divider,
  IconButton,
  Typography,
  Button,
} from "@mui/material";
import { useIsPhoneDevice } from "../hooks/useIsPhoneDevice";
import { InGameContext } from "Contexts";
import { useSkinRedesign } from "./useSkinRedesign";

export default function NavDropdown({
  label,
  items,
  customTrigger,
  onMenuItemClick: customOnMenuItemClick,
  groups,
  isMobileMenu = false,
  triggerAriaLabel,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const location = useLocation();
  const inGame = useContext(InGameContext);
  const isMobile = useIsPhoneDevice();
  const skin = useSkinRedesign();
  const open = Boolean(anchorEl);
  const menuId = `nav-menu-${label || triggerAriaLabel || "custom"}`;

  const allItems = groups
    ? groups.reduce((acc, group, groupIndex) => {
        if (groupIndex > 0) {
          acc.push({ divider: true });
        }
        return acc.concat(group.items);
      }, [])
    : items;

  const isActive = allItems.some((item) => {
    if (item.hide || item.divider) return false;
    return (
      location.pathname === item.path ||
      location.pathname.startsWith(item.path)
    );
  });

  const handleClick = (event) => {
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Close when the route changes (e.g. browser back/forward), so an open menu
  // never lingers over the next page, and when a game takes the screen (the
  // shell keeps its location, so that is not a route change it can see).
  useEffect(() => {
    setAnchorEl(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, inGame]);

  const handleMenuItemClick = (item) => {
    handleClose();

    if (item.onClick) {
      item.onClick();
      return;
    }

    if (customOnMenuItemClick) {
      customOnMenuItemClick(item.path);
      return;
    }
  };

  const menuTriggerProps = {
    "aria-haspopup": "true",
    "aria-expanded": open,
    "aria-controls": open ? menuId : undefined,
    onClick: handleClick,
  };

  const skinIcon = skin && !customTrigger && !isMobileMenu ? (
    <svg className="skin-nav-ico" viewBox="0 0 24 24" aria-hidden="true">
      {label === "Play" && <path d="M8 5.5v13l11-6.5z" />}
      {label === "Community" && (
        <path d="M8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm8 1a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 16 12zM3 19c.4-2.6 2.6-4 5-4s4.6 1.4 5 4M14 15.1c.6-.1 1.3-.1 2 0 2 .2 3.6 1.4 4 3.4" />
      )}
      {label === "Fame" && <path fill="currentColor" stroke="none" d="M12 3.5l2.2 4.6 5 .7-3.6 3.5.9 5.1L12 15.8 7.5 17.4l.9-5.1L4.8 8.8l5-.7z" />}
      {label === "Learn" && <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5z" />}
      {label === "Policy" && <path d="M12 3l7 3v6c0 4.2-2.8 7.2-7 8.5C7.8 19.2 5 16.2 5 12V6z" />}
      {label === "Activity" && <path d="M4 16l4-5 3 3 5-7 4 5" />}
    </svg>
  ) : null;

  const triggerContent = customTrigger ? (
    <IconButton
      {...menuTriggerProps}
      aria-label={triggerAriaLabel || "User menu"}
      sx={{ p: 0 }}
    >
      {customTrigger}
    </IconButton>
  ) : isMobileMenu ? (
    <IconButton {...menuTriggerProps} aria-label="Menu" size="large">
      <i className="fas fa-bars" />
    </IconButton>
  ) : (
    <Button
      className={skin ? `skin-nav-btn${isActive ? " is-active" : ""}` : undefined}
      variant="text"
      {...menuTriggerProps}
      sx={{
        px: 1,
        cursor: "pointer",
        textTransform: "uppercase",
        color: "inherit",
        backgroundColor:
          !isMobileMenu && isActive && !skin
            ? "rgba(var(--mui-palette-primary-mainChannel) / var(--mui-palette-action-selectedOpacity));"
            : undefined,
      }}
      endIcon={<i className="fas fa-caret-down" aria-hidden="true" />}
    >
      {skinIcon}
      <Typography className={skin ? "skin-nav-label" : undefined} variant="h3">{label}</Typography>
    </Button>
  );

  return (
    <>
      {triggerContent}
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        disableScrollLock={true}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: isMobile ? "left" : "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: isMobile ? "left" : "center",
        }}
        slotProps={{
          paper: {
            sx: {
              minWidth: isMobile ? "200px" : "180px",
              maxWidth: "90vw",
            },
          },
        }}
      >
        {allItems.map((item, index) => {
          if (item.hide) return null;

          if (item.divider) {
            return <Divider key={`divider-${index}`} />;
          }

          const menuItem = (
            <MenuItem
              key={item.path || item.text || index}
              onClick={() => handleMenuItemClick(item)}
              selected={location.pathname === item.path}
            >
              {item.icon && (
                <Box component="span" sx={{ mr: 1, display: "inline-flex" }}>
                  {item.icon}
                </Box>
              )}
              {item.text}
            </MenuItem>
          );

          if (item.path) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={{
                  color: "inherit",
                }}
              >
                {menuItem}
              </NavLink>
            );
          } else {
            return menuItem;
          }
        })}
      </Menu>
    </>
  );
}
