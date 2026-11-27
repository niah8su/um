import React from "react";
import ReactLoading from "react-loading";
import { Box } from "@mui/material";
import { useIsPhoneDevice } from "../hooks/useIsPhoneDevice";
import { useTheme } from "@mui/material/styles";
import { useSkinRedesign } from "./useSkinRedesign";

export const Loading = ({ small, extraSmall, fading }) => {
  const theme = useTheme();
  const isPhoneDevice = useIsPhoneDevice();
  const skin = useSkinRedesign();

  const extraSmallWidth = 24; // 16
  const extraSmallHeight = 32; // 8

  let height;
  if (extraSmall) {
    height = `${extraSmallWidth}px`;
  } else if (small) {
    if (isPhoneDevice) height = "100px";
    else height = "300px";
  } else height = "100vh";

  if (skin && !extraSmall) {
    return (
      <Box className={fading ? "skin-loader is-leaving" : "skin-loader"} sx={{ height, bgcolor: "transparent" }}>
        <div className="skin-loader-card">
          <i className="skin-loader-spin" aria-hidden="true" />
        </div>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ReactLoading
        type="bars"
        color={theme.palette.primary.main}
        width={extraSmall ? extraSmallWidth : undefined}
        height={extraSmall ? extraSmallHeight : undefined}
      />
    </Box>
  );
};
